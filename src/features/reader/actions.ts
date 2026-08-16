"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { libraryEntries, readingBookmarks, readingHistory, user as userTable, userProgress } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { bookmarkInputSchema, progressInputSchema, readerPreferencesSchema } from "@/lib/validation";

export async function saveProgressAction(input: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = progressInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { chapterId, page, completed } = parsed.data;
  await db
    .insert(userProgress)
    .values({ userId: user.id, chapterId, page, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.chapterId],
      set: { page, updatedAt: new Date() },
    });
  await db
    .insert(readingHistory)
    .values({ userId: user.id, chapterId, visits: 1, firstReadAt: new Date(), lastReadAt: new Date(), completedAt: completed ? new Date() : null })
    .onConflictDoUpdate({
      target: [readingHistory.userId, readingHistory.chapterId],
      set: { lastReadAt: new Date(), completedAt: completed ? new Date() : undefined },
    });
  return { ok: true };
}

export async function recordReadingVisitAction(chapterId: number, seriesId: number): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!Number.isInteger(chapterId) || chapterId <= 0 || !Number.isInteger(seriesId) || seriesId <= 0) return { ok: false };
  await db.transaction(async (tx) => {
    await tx
      .insert(readingHistory)
      .values({ userId: user.id, chapterId, visits: 1, firstReadAt: new Date(), lastReadAt: new Date() })
      .onConflictDoUpdate({ target: [readingHistory.userId, readingHistory.chapterId], set: { visits: sql`${readingHistory.visits} + 1`, lastReadAt: new Date() } });
    await tx
      .insert(libraryEntries)
      .values({ userId: user.id, seriesId, status: "reading", updatedAt: new Date() })
      .onConflictDoNothing({ target: [libraryEntries.userId, libraryEntries.seriesId] });
  });
  return { ok: true };
}

export async function saveBookmarkAction(input: unknown) {
  const user = await requireUser();
  const parsed = bookmarkInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Marcador inválido." } as const;
  const { chapterId, page, note } = parsed.data;
  const [bookmark] = await db
    .insert(readingBookmarks)
    .values({ userId: user.id, chapterId, page, note, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [readingBookmarks.userId, readingBookmarks.chapterId, readingBookmarks.page], set: { note, updatedAt: new Date() } })
    .returning();
  return { ok: true, bookmark } as const;
}

export async function deleteBookmarkAction(id: number) {
  const user = await requireUser();
  await db.delete(readingBookmarks).where(and(eq(readingBookmarks.id, id), eq(readingBookmarks.userId, user.id)));
  return { ok: true } as const;
}

export async function saveReaderPreferencesAction(input: unknown) {
  const user = await requireUser();
  const parsed = readerPreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false } as const;
  await db.update(userTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(userTable.id, user.id));
  return { ok: true } as const;
}
