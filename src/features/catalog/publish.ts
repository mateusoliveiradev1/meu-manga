import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters } from "@/db/schema";
import { notifyNewChapter } from "@/features/notify/email";
import { notifyFavoritersOfChapters } from "@/features/notifications/create";

type PublishedChapter = { id: number; seriesId: number; number: number; title: string };

export async function dispatchChapterNotifications(rows: PublishedChapter[]) {
  if (!rows.length) return;
  const results = await Promise.allSettled([notifyFavoritersOfChapters(rows), notifyNewChapter(rows)]);
  for (const result of results) {
    if (result.status === "rejected") console.error("[publish] falha ao notificar capítulos", result.reason);
  }
  await db
    .update(chapters)
    .set({ notified: true })
    .where(inArray(chapters.id, rows.map((row) => row.id)));
}

/** Publica capítulos agendados e avisa a estante por notificações internas e, quando configurado, email. */
export async function publishDueChapters(): Promise<number> {
  const due = await db
    .update(chapters)
    .set({
      published: true,
      publishedAt: sql`coalesce(${chapters.publishedAt}, ${chapters.publishAt})`,
    })
    .where(and(eq(chapters.published, false), isNotNull(chapters.publishAt), lte(chapters.publishAt, new Date())))
    .returning({ id: chapters.id, seriesId: chapters.seriesId, number: chapters.number, title: chapters.title });

  if (due.length === 0) return 0;
  await dispatchChapterNotifications(due);
  return due.length;
}
