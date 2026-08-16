import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  chapters,
  collectionItems,
  libraryEntries,
  pages,
  readingBookmarks,
  readingHistory,
  series,
  seriesRatings,
  userCollections,
  userFavorites,
  userProgress,
} from "@/db/schema";
import { getSeriesList, type SeriesWithStats } from "@/features/catalog/queries";
import type { LibraryStatus } from "@/features/library/types";
import { genresIn } from "@/lib/genres";

export async function getSeriesLibraryState(userId: string, seriesId: number) {
  const [entry, collections] = await Promise.all([
    db.select({ status: libraryEntries.status }).from(libraryEntries).where(and(eq(libraryEntries.userId, userId), eq(libraryEntries.seriesId, seriesId))).limit(1),
    db
      .select({ id: userCollections.id, name: userCollections.name, included: sql<boolean>`exists(select 1 from ${collectionItems} ci where ci.collection_id = ${userCollections.id} and ci.series_id = ${seriesId})` })
      .from(userCollections)
      .where(eq(userCollections.userId, userId))
      .orderBy(userCollections.createdAt),
  ]);
  return { status: (entry[0]?.status as LibraryStatus | undefined) ?? null, collections: collections.map((item) => ({ ...item, included: Boolean(item.included) })) };
}

export async function getLibraryEntries(userId: string, status?: LibraryStatus) {
  const rows = await db
    .select({
      entry: libraryEntries,
      work: series,
      chapterCount: sql<number>`(select count(*)::int from ${chapters} c where c.series_id = ${series.id} and c.published = true)`,
      unreadCount: sql<number>`(
        select count(*)::int from ${chapters} c
        where c.series_id = ${series.id} and c.published = true
          and not exists (
            select 1 from ${userProgress} p where p.user_id = ${userId} and p.chapter_id = c.id
              and p.page >= greatest((select count(*) from ${pages} pg where pg.chapter_id = c.id) - 1, 0)
          )
      )`,
      lastPublishedAt: sql<Date | null>`(select max(c.published_at) from ${chapters} c where c.series_id = ${series.id} and c.published = true)`,
    })
    .from(libraryEntries)
    .innerJoin(series, eq(series.id, libraryEntries.seriesId))
    .where(and(eq(libraryEntries.userId, userId), status ? eq(libraryEntries.status, status) : undefined))
    .orderBy(desc(libraryEntries.updatedAt));
  return rows.map((row) => ({ ...row, chapterCount: Number(row.chapterCount), unreadCount: Number(row.unreadCount) }));
}

export async function getUserCollections(userId: string) {
  const collections = await db
    .select({ collection: userCollections, itemCount: count(collectionItems.seriesId) })
    .from(userCollections)
    .leftJoin(collectionItems, eq(collectionItems.collectionId, userCollections.id))
    .where(eq(userCollections.userId, userId))
    .groupBy(userCollections.id)
    .orderBy(userCollections.createdAt);
  const ids = collections.map((item) => item.collection.id);
  const items = ids.length
    ? await db
        .select({ collectionId: collectionItems.collectionId, work: series })
        .from(collectionItems)
        .innerJoin(series, eq(series.id, collectionItems.seriesId))
        .where(inArray(collectionItems.collectionId, ids))
        .orderBy(collectionItems.createdAt)
    : [];
  return collections.map((item) => ({ ...item.collection, itemCount: Number(item.itemCount), items: items.filter((row) => row.collectionId === item.collection.id).map((row) => row.work) }));
}

export async function getReadingHistory(userId: string, limit = 40) {
  return db
    .select({
      chapterId: readingHistory.chapterId,
      visits: readingHistory.visits,
      firstReadAt: readingHistory.firstReadAt,
      lastReadAt: readingHistory.lastReadAt,
      completedAt: readingHistory.completedAt,
      chapterNumber: chapters.number,
      chapterTitle: chapters.title,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesCover: series.cover,
    })
    .from(readingHistory)
    .innerJoin(chapters, eq(chapters.id, readingHistory.chapterId))
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.lastReadAt))
    .limit(limit);
}

export async function getUserBookmarks(userId: string, limit = 60) {
  return db
    .select({
      id: readingBookmarks.id,
      chapterId: readingBookmarks.chapterId,
      page: readingBookmarks.page,
      note: readingBookmarks.note,
      updatedAt: readingBookmarks.updatedAt,
      chapterNumber: chapters.number,
      chapterTitle: chapters.title,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesCover: series.cover,
    })
    .from(readingBookmarks)
    .innerJoin(chapters, eq(chapters.id, readingBookmarks.chapterId))
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(readingBookmarks.userId, userId))
    .orderBy(desc(readingBookmarks.updatedAt))
    .limit(limit);
}

export async function getRecommendations(userId: string, limit = 12): Promise<(SeriesWithStats & { reason: string; score: number })[]> {
  const [works, favorites, library, ratings, progress] = await Promise.all([
    getSeriesList(userId),
    db.select({ seriesId: userFavorites.seriesId }).from(userFavorites).where(eq(userFavorites.userId, userId)),
    db.select({ seriesId: libraryEntries.seriesId, status: libraryEntries.status }).from(libraryEntries).where(eq(libraryEntries.userId, userId)),
    db.select({ seriesId: seriesRatings.seriesId, value: seriesRatings.value }).from(seriesRatings).where(eq(seriesRatings.userId, userId)),
    db
      .select({ seriesId: chapters.seriesId })
      .from(userProgress)
      .innerJoin(chapters, eq(chapters.id, userProgress.chapterId))
      .where(eq(userProgress.userId, userId)),
  ]);

  const seen = new Set([...favorites.map((item) => item.seriesId), ...library.map((item) => item.seriesId), ...progress.map((item) => item.seriesId)]);
  const affinity = new Map<string, number>();
  const positiveIds = new Set([
    ...favorites.map((item) => item.seriesId),
    ...library.filter((item) => item.status !== "paused").map((item) => item.seriesId),
    ...ratings.filter((item) => item.value >= 4).map((item) => item.seriesId),
  ]);
  for (const work of works) {
    if (!positiveIds.has(work.id)) continue;
    const weight = ratings.find((item) => item.seriesId === work.id)?.value ?? 3;
    for (const genre of genresIn(work.tags)) affinity.set(genre, (affinity.get(genre) ?? 0) + weight);
  }

  return works
    .filter((work) => work.chapterCount > 0 && !seen.has(work.id))
    .map((work) => {
      const matches = genresIn(work.tags).map((genre) => ({ genre, weight: affinity.get(genre) ?? 0 })).filter((item) => item.weight > 0).sort((a, b) => b.weight - a.weight);
      const affinityScore = matches.reduce((sum, item) => sum + item.weight, 0);
      const score = affinityScore * 20 + (work.rating ?? 0) * 4 + Math.log10(work.views + 1) * 3 + (work.lastUpdate ? 2 : 0);
      const reason = matches[0] ? `Combina com seu interesse em ${matches[0].genre}` : work.rating ? "Bem avaliada por outros leitores" : "Uma história pronta para começar";
      return { ...work, score, reason };
    })
    .sort((a, b) => b.score - a.score || b.views - a.views)
    .slice(0, limit);
}
