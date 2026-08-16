import { gte } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsEvents, chapters, series } from "@/db/schema";

type EventRow = typeof analyticsEvents.$inferSelect;

const uniqueSessions = (events: EventRow[]) => new Set(events.map((event) => event.sessionId)).size;

export async function getProductAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [events, chapterRows, seriesRows] = await Promise.all([
    db.select().from(analyticsEvents).where(gte(analyticsEvents.createdAt, since)),
    db.select().from(chapters),
    db.select().from(series),
  ]);
  const chapterMap = new Map(chapterRows.map((chapter) => [chapter.id, chapter]));
  const seriesMap = new Map(seriesRows.map((item) => [item.id, item]));
  const byEvent = (event: string) => events.filter((row) => row.event === event);

  const funnel = [
    { key: "work_view", label: "Abriram uma obra", value: uniqueSessions(byEvent("work_view")) },
    { key: "chapter_start", label: "Começaram a ler", value: uniqueSessions(byEvent("chapter_start")) },
    { key: "chapter_complete", label: "Concluíram", value: uniqueSessions(byEvent("chapter_complete")) },
    { key: "favorite", label: "Favoritaram", value: uniqueSessions(byEvent("favorite")) },
  ].map((step, index, all) => ({
    ...step,
    rate: index === 0 ? 100 : all[index - 1].value ? Math.round((step.value / all[index - 1].value) * 100) : 0,
  }));

  const chapterMetrics = chapterRows
    .filter((chapter) => chapter.published)
    .map((chapter) => {
      const related = events.filter((event) => event.chapterId === chapter.id);
      const starts = uniqueSessions(related.filter((event) => event.event === "chapter_start"));
      const completes = uniqueSessions(related.filter((event) => event.event === "chapter_complete"));
      const exits = related.filter((event) => event.event === "chapter_exit" && event.page);
      return {
        chapterId: chapter.id,
        seriesTitle: seriesMap.get(chapter.seriesId)?.title ?? "Obra removida",
        number: chapter.number,
        starts,
        completes,
        completionRate: starts ? Math.round((completes / starts) * 100) : 0,
        averageExitPage: exits.length ? Math.round(exits.reduce((sum, event) => sum + (event.page ?? 0), 0) / exits.length) : null,
      };
    })
    .filter((item) => item.starts > 0)
    .sort((a, b) => a.completionRate - b.completionRate);

  const workMetrics = seriesRows
    .map((item) => {
      const related = events.filter((event) => event.seriesId === item.id);
      const views = uniqueSessions(related.filter((event) => event.event === "work_view"));
      const favorites = uniqueSessions(related.filter((event) => event.event === "favorite"));
      const chaptersBySession = new Map<string, Set<number>>();
      for (const event of related.filter((event) => event.event === "chapter_start" && event.chapterId)) {
        const set = chaptersBySession.get(event.sessionId) ?? new Set<number>();
        set.add(event.chapterId!);
        chaptersBySession.set(event.sessionId, set);
      }
      const returningReaders = [...chaptersBySession.values()].filter((set) => set.size >= 2).length;
      return {
        seriesId: item.id,
        title: item.title,
        views,
        favorites,
        favoriteConversion: views ? Math.round((favorites / views) * 100) : 0,
        returningReaders,
      };
    })
    .filter((item) => item.views > 0)
    .sort((a, b) => b.views - a.views);

  const releases = chapterRows
    .filter((chapter) => chapter.published && chapter.publishedAt)
    .map((chapter) => {
      const related = events.filter((event) => event.chapterId === chapter.id);
      return {
        chapterId: chapter.id,
        seriesTitle: seriesMap.get(chapter.seriesId)?.title ?? "Obra removida",
        number: chapter.number,
        publishedAt: chapter.publishedAt!,
        starts: uniqueSessions(related.filter((event) => event.event === "chapter_start")),
        completes: uniqueSessions(related.filter((event) => event.event === "chapter_complete")),
        views: chapterMap.get(chapter.id)?.views ?? 0,
      };
    })
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 12);

  return { since, funnel, chapterMetrics, workMetrics, releases, eventCount: events.length };
}
