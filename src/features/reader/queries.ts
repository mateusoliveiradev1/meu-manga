import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { readingBookmarks, user } from "@/db/schema";

export async function getReaderPreferences(userId: string) {
  const [row] = await db.select({ readingMode: user.readingMode, preloadPages: user.preloadPages }).from(user).where(eq(user.id, userId)).limit(1);
  return { readingMode: row?.readingMode === "page" || row?.readingMode === "dupla" ? row.readingMode : "scroll", preloadPages: row?.preloadPages ?? true } as const;
}

export async function getChapterBookmarks(userId: string, chapterId: number) {
  return db.select().from(readingBookmarks).where(and(eq(readingBookmarks.userId, userId), eq(readingBookmarks.chapterId, chapterId))).orderBy(readingBookmarks.page);
}
