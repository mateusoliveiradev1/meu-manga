import "server-only";

import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, series, userFavorites } from "@/db/schema";
import { sendPushToUsers } from "@/features/push/send";

type NotificationInput = {
  userId: string;
  actorId?: string | null;
  type: "reply" | "like" | "follow" | "chapter" | "pinned";
  title: string;
  message?: string;
  href: string;
};

export async function createNotification(input: NotificationInput) {
  if (input.actorId && input.actorId === input.userId) return;
  await db.insert(notifications).values({
    userId: input.userId,
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title.slice(0, 140),
    message: (input.message ?? "").slice(0, 280),
    href: input.href.slice(0, 500),
  });
  await sendPushToUsers([input.userId], { title: input.title, body: input.message ?? "Abra a estante para ver.", href: input.href, tag: `manga-${input.type}` }, input.type === "chapter" ? "chapter" : "social").catch((error) => console.error("[push] notificação social", error));
}

export async function notifyFavoritersOfChapters(
  rows: { id: number; seriesId: number; number: number; title: string }[]
) {
  if (!rows.length) return;
  const seriesIds = [...new Set(rows.map((row) => row.seriesId))];
  const [favorites, works] = await Promise.all([
    db.select().from(userFavorites).where(inArray(userFavorites.seriesId, seriesIds)),
    db.select({ id: series.id, title: series.title }).from(series).where(inArray(series.id, seriesIds)),
  ]);
  const titleById = new Map(works.map((work) => [work.id, work.title]));
  const values = rows.flatMap((chapter) =>
    favorites
      .filter((favorite) => favorite.seriesId === chapter.seriesId)
      .map((favorite) => ({
        userId: favorite.userId,
        actorId: null,
        type: "chapter",
        title: `Novo capítulo de ${titleById.get(chapter.seriesId) ?? "uma obra da sua estante"}`,
        message: `Capítulo ${chapter.number}${chapter.title ? ` — ${chapter.title}` : ""} já está disponível.`,
        href: `/ler/${chapter.id}`,
      }))
  );
  if (values.length) {
    await db.insert(notifications).values(values);
    await Promise.allSettled(rows.map((chapter) => {
      const recipients = favorites.filter((favorite) => favorite.seriesId === chapter.seriesId).map((favorite) => favorite.userId);
      return sendPushToUsers(recipients, {
        title: `Novo capítulo de ${titleById.get(chapter.seriesId) ?? "uma obra da sua estante"}`,
        body: `Capítulo ${chapter.number}${chapter.title ? ` — ${chapter.title}` : ""} já está disponível.`,
        href: `/ler/${chapter.id}`,
        tag: `chapter-${chapter.id}`,
      }, "chapter");
    }));
  }
}
