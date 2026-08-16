import { and, count, desc, eq, gt, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, comments, pages, readingStats, series, seriesRatings, user, userFavorites, userProgress } from "@/db/schema";
import { publishDueChapters } from "@/features/catalog/publish";
import { genresIn, hasGenre } from "@/lib/genres";

export type SeriesWithStats = typeof series.$inferSelect & {
  chapterCount: number;
  views: number;
  lastUpdate: Date | null;
  favorite: boolean;
  rating: number | null;
};

export type SeriesFilters = { q?: string; genreName?: string; sort?: "recent" | "reads" | "rated" };

export async function getSeriesList(userId?: string, filters: SeriesFilters = {}): Promise<SeriesWithStats[]> {
  await publishDueChapters();
  const { q, genreName, sort = "recent" } = filters;
  const where = and(
    q
      ? or(
          ilike(series.title, `%${q}%`),
          ilike(series.synopsis, `%${q}%`),
          ilike(series.tags, `%${q}%`)
        )
      : undefined
  );
  const rows = await db
    .select({
      s: series,
      chapterCount: sql<number>`count(distinct ${chapters.id}) filter (where ${chapters.published})`,
      views: sql<number>`coalesce(sum(${chapters.views}), 0)`,
      lastUpdate: sql<Date | null>`max(${chapters.publishedAt})`,
      favorite: userId
        ? sql<boolean>`exists(select 1 from ${userFavorites} f where f.series_id = ${series.id} and f.user_id = ${userId})`
        : sql<boolean>`false`,
    })
    .from(series)
    .leftJoin(chapters, and(eq(chapters.seriesId, series.id), eq(chapters.published, true)))
    .where(where)
    .groupBy(series.id)
    .orderBy(desc(series.updatedAt));

  const ratings = await db
    .select({ seriesId: seriesRatings.seriesId, avg: sql<number>`avg(${seriesRatings.value})` })
    .from(seriesRatings)
    .groupBy(seriesRatings.seriesId);
  const ratingMap = new Map(ratings.map((r) => [r.seriesId, Number(r.avg)]));

  let list = rows.map((r) => ({
    ...r.s,
    chapterCount: Number(r.chapterCount),
    views: Number(r.views),
    lastUpdate: r.lastUpdate,
    favorite: Boolean(r.favorite),
    rating: ratingMap.get(r.s.id) ?? null,
  }));
  if (genreName) list = list.filter((r) => hasGenre(r.tags, genreName));
  if (sort === "reads") list.sort((a, b) => b.views - a.views);
  else if (sort === "rated") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return list;
}

export async function getSeriesBySlug(slug: string, userId?: string) {
  const rows = await db
    .select({
      s: series,
      chapterCount: sql<number>`count(distinct ${chapters.id}) filter (where ${chapters.published})`,
      views: sql<number>`coalesce(sum(${chapters.views}), 0)`,
      favorite: userId
        ? sql<boolean>`exists(select 1 from ${userFavorites} f where f.series_id = ${series.id} and f.user_id = ${userId})`
        : sql<boolean>`false`,
    })
    .from(series)
    .leftJoin(chapters, and(eq(chapters.seriesId, series.id), eq(chapters.published, true)))
    .where(eq(series.slug, slug))
    .groupBy(series.id)
    .limit(1);

  const r = rows[0];
  if (!r) return undefined;
  return { ...r.s, chapterCount: Number(r.chapterCount), views: Number(r.views), favorite: Boolean(r.favorite) };
}

export async function getSeriesById(id: number) {
  const row = await db.select().from(series).where(eq(series.id, id)).limit(1);
  return row[0];
}

export async function getChaptersBySeries(seriesId: number, onlyPublished = false) {
  await publishDueChapters();
  const where = onlyPublished
    ? and(eq(chapters.seriesId, seriesId), eq(chapters.published, true))
    : eq(chapters.seriesId, seriesId);
  const rows = await db.select().from(chapters).where(where).orderBy(chapters.number);
  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db
        .select({ chapterId: comments.chapterId, n: sql<number>`count(*)::int` })
        .from(comments)
        .where(inArray(comments.chapterId, ids))
        .groupBy(comments.chapterId)
    : [];
  const map = new Map(counts.map((c) => [c.chapterId, Number(c.n)]));
  return rows.map((r) => ({ ...r, commentCount: map.get(r.id) ?? 0 }));
}

export async function getChapter(id: number) {
  await publishDueChapters();
  const row = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  return row[0];
}

export async function getChapterWithSeriesAndPages(id: number) {
  const row = await getChapterWithSeries(id);
  if (!row) return undefined;
  const pages = await getPagesByChapter(id);
  return { ...row, pages };
}

export async function getChapterWithSeries(id: number) {
  await publishDueChapters();
  const rows = await db
    .select({
      c: chapters,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesCover: series.cover,
      seriesId: series.id,
    })
    .from(chapters)
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(chapters.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return undefined;
  return { ...r.c, series_slug: r.seriesSlug, series_title: r.seriesTitle, series_cover: r.seriesCover, series_id: r.seriesId };
}

export async function getPrevNextChapter(seriesId: number, number: number, onlyPublished = true) {
  const pub = onlyPublished ? eq(chapters.published, true) : undefined;
  const [prev, next] = await Promise.all([
    db
      .select()
      .from(chapters)
      .where(and(eq(chapters.seriesId, seriesId), lt(chapters.number, number), pub))
      .orderBy(desc(chapters.number))
      .limit(1),
    db
      .select()
      .from(chapters)
      .where(and(eq(chapters.seriesId, seriesId), gt(chapters.number, number), pub))
      .orderBy(chapters.number)
      .limit(1),
  ]);
  return { prev: prev[0], next: next[0] };
}

export async function getPagesByChapter(chapterId: number) {
  return db.select().from(pages).where(eq(pages.chapterId, chapterId)).orderBy(pages.position);
}

export async function getStats() {
  const [s, ch, pg, co] = await Promise.all([
    db.select({ c: count() }).from(series),
    db.select({ c: count() }).from(chapters),
    db.select({ c: count() }).from(pages),
    db.select({ c: count() }).from(comments),
  ]);
  const views = await db.select({ v: sql<number>`coalesce(sum(${chapters.views}), 0)` }).from(chapters);
  return {
    series: s[0]?.c ?? 0,
    chapters: ch[0]?.c ?? 0,
    pages: pg[0]?.c ?? 0,
    comments: co[0]?.c ?? 0,
    views: Number(views[0]?.v ?? 0),
  };
}

export async function getLatestPublishedAt(): Promise<Date | null> {
  const row = await db
    .select({ m: sql<Date | null>`max(${chapters.publishedAt})` })
    .from(chapters)
    .where(eq(chapters.published, true));
  return row[0]?.m ?? null;
}

/** Capítulos publicados mais recentes (para o strip da home), com dados da obra. */
export async function getLatestChapters(limit = 8) {
  const rows = await getAllChapters();
  return rows.slice(0, limit);
}

/** Todos os capítulos publicados, do mais recente ao mais antigo, com dados da obra. */
export async function getAllChapters() {
  await publishDueChapters();
  return db
    .select({
      id: chapters.id,
      number: chapters.number,
      title: chapters.title,
      cover: chapters.cover,
      publishedAt: chapters.publishedAt,
      views: chapters.views,
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesCover: series.cover,
    })
    .from(chapters)
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(chapters.published, true))
    .orderBy(desc(chapters.publishedAt));
}

/* ---- user sync: progress & favorites ---- */

export async function getFavoritedSeriesIds(userId: string): Promise<number[]> {
  const rows = await db.select({ seriesId: userFavorites.seriesId }).from(userFavorites).where(eq(userFavorites.userId, userId));
  return rows.map((r) => r.seriesId);
}

export async function getLastProgress(userId: string): Promise<{ chapterId: number; page: number } | null> {
  const row = await db
    .select({ chapterId: userProgress.chapterId, page: userProgress.page })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.updatedAt))
    .limit(1);
  return row[0] ?? null;
}

export async function getProgressForSeries(userId: string, seriesId: number) {
  const rows = await db
    .select({ chapterId: userProgress.chapterId, page: userProgress.page, updatedAt: userProgress.updatedAt })
    .from(userProgress)
    .innerJoin(chapters, eq(chapters.id, userProgress.chapterId))
    .where(and(eq(userProgress.userId, userId), eq(chapters.seriesId, seriesId)))
    .orderBy(desc(userProgress.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSeriesByIds(ids: number[]): Promise<typeof series.$inferSelect[]> {
  if (ids.length === 0) return [];
  return db.select().from(series).where(inArray(series.id, ids));
}

/* ---- profile ---- */

export async function getPublicProfile(userId: string) {
  const [u] = await db
    .select({ id: user.id, name: user.name, role: user.role, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!u) return undefined;
  const [favs, cmts] = await Promise.all([
    db.select({ c: count() }).from(userFavorites).where(eq(userFavorites.userId, userId)),
    db.select({ c: count() }).from(comments).where(eq(comments.userId, userId)),
  ]);
  return { ...u, favoriteCount: favs[0]?.c ?? 0, commentCount: cmts[0]?.c ?? 0 };
}

export async function getUserFavorites(userId: string) {
  return db
    .select({ s: series })
    .from(userFavorites)
    .innerJoin(series, eq(series.id, userFavorites.seriesId))
    .where(eq(userFavorites.userId, userId))
    .orderBy(desc(userFavorites.createdAt));
}

export type ProgressWithChapter = {
  chapterId: number;
  page: number;
  totalPages: number;
  updatedAt: Date;
  chapterTitle: string;
  chapterNumber: number;
  seriesId: number;
  seriesSlug: string;
  seriesTitle: string;
  seriesCover: string;
};

export async function getUserProgress(userId: string, limit = 12): Promise<ProgressWithChapter[]> {
  const rows = await db
    .select({
      chapterId: userProgress.chapterId,
      page: userProgress.page,
      updatedAt: userProgress.updatedAt,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesCover: series.cover,
    })
    .from(userProgress)
    .innerJoin(chapters, eq(chapters.id, userProgress.chapterId))
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.updatedAt))
    .limit(limit);
  const ids = rows.map((r) => r.chapterId);
  const counts = ids.length
    ? await db
        .select({ chapterId: pages.chapterId, n: sql<number>`count(*)::int` })
        .from(pages)
        .where(inArray(pages.chapterId, ids))
        .groupBy(pages.chapterId)
    : [];
  const pageMap = new Map(counts.map((c) => [c.chapterId, Number(c.n)]));
  return rows.map((r) => ({ ...r, totalPages: pageMap.get(r.chapterId) ?? 0 }));
}

export async function getChapterProgress(chapterId: number, userId: string): Promise<{ page: number } | null> {
  const rows = await db
    .select({ page: userProgress.page })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.chapterId, chapterId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Obras do mesmo gênero (excluindo a própria), ordenadas por afinidade. */
export async function getRelatedSeries(seriesId: number, tags: string, limit = 4): Promise<SeriesWithStats[]> {
  const genres = genresIn(tags);
  if (genres.length === 0) return [];
  const all = await getSeriesList();
  const scored = all
    .filter((s) => s.id !== seriesId)
    .map((s) => ({ s, shared: genres.filter((g) => hasGenre(s.tags, g)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.s.views - a.s.views);
  return scored.slice(0, limit).map((x) => x.s);
}

/** Leituras por dia (últimos N dias, com zeros preenchidos) para o painel. */
export async function getDailyViews(days = 14): Promise<{ day: string; views: number }[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const rows = await db
    .select({ day: readingStats.day, views: sql<number>`coalesce(sum(${readingStats.views}), 0)::int` })
    .from(readingStats)
    .where(gte(readingStats.day, start))
    .groupBy(readingStats.day)
    .orderBy(readingStats.day);
  const map = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.views)]));
  const out: { day: string; views: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, views: map.get(key) ?? 0 });
  }
  return out;
}

export async function getSeriesRating(seriesId: number, userId?: string) {
  const rows = await db
    .select({ userId: seriesRatings.userId, value: seriesRatings.value })
    .from(seriesRatings)
    .where(eq(seriesRatings.seriesId, seriesId));
  const avg = rows.length ? rows.reduce((acc, r) => acc + r.value, 0) / rows.length : 0;
  const mine = userId ? rows.find((r) => r.userId === userId)?.value ?? null : null;
  return { avg: Number(avg.toFixed(1)), count: rows.length, mine };
}
