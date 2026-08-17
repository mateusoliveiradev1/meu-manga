"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { pushSubscriptions, user as userTable, userFavorites } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function subscribePushAction(input: SubscriptionInput) {
  const user = await requireUser();
  if (!input?.endpoint?.startsWith("https://") || !input.keys?.p256dh || !input.keys?.auth) return { ok: false, error: "Inscrição push inválida." } as const;
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint: input.endpoint.slice(0, 2000), p256dh: input.keys.p256dh.slice(0, 500), auth: input.keys.auth.slice(0, 500), updatedAt: new Date() })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: input.keys.p256dh.slice(0, 500), auth: input.keys.auth.slice(0, 500), updatedAt: new Date() } });
  return { ok: true } as const;
}

export async function unsubscribePushAction(endpoint: string) {
  const user = await requireUser();
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)));
  return { ok: true } as const;
}

export async function updatePushPreferencesAction(input: { chapters: boolean; social: boolean }) {
  const user = await requireUser();
  await db.update(userTable).set({ notifyNewChapters: Boolean(input.chapters), notifySocial: Boolean(input.social), updatedAt: new Date() }).where(eq(userTable.id, user.id));
  return { ok: true } as const;
}

export async function enableChapterReminderAction(seriesId: number) {
  const user = await requireUser();
  if (!Number.isInteger(seriesId) || seriesId <= 0) return { ok: false, error: "Obra inválida." } as const;
  await db.transaction(async (tx) => {
    await tx.insert(userFavorites).values({ userId: user.id, seriesId }).onConflictDoNothing();
    await tx.update(userTable).set({ notifyNewChapters: true, updatedAt: new Date() }).where(eq(userTable.id, user.id));
  });
  revalidatePath("/");
  return { ok: true } as const;
}
