import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, pages, series } from "@/db/schema";
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
  const now = new Date();
  const candidates = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(and(eq(chapters.published, false), isNotNull(chapters.publishAt), lte(chapters.publishAt, now)));
  if (!candidates.length) return 0;

  const candidateIds = candidates.map((chapter) => chapter.id);
  const pageRows = await db
    .select({ chapterId: pages.chapterId, position: pages.position, src: pages.src })
    .from(pages)
    .where(inArray(pages.chapterId, candidateIds));
  const grouped = new Map<number, { position: number; src: string }[]>();
  for (const page of pageRows) {
    const current = grouped.get(page.chapterId) ?? [];
    current.push({ position: page.position, src: page.src.trim() });
    grouped.set(page.chapterId, current);
  }

  const validIds = candidateIds.filter((id) => {
    const chapterPages = grouped.get(id) ?? [];
    if (!chapterPages.length || chapterPages.some((page) => !page.src)) return false;
    if (new Set(chapterPages.map((page) => page.src)).size !== chapterPages.length) return false;
    const positions = chapterPages.map((page) => page.position).sort((a, b) => a - b);
    return positions.every((position, index) => position === index + 1);
  });
  const blockedIds = candidateIds.filter((id) => !validIds.includes(id));
  if (blockedIds.length) console.warn("[publish] capítulos vencidos bloqueados pelo controle de qualidade", blockedIds);
  if (!validIds.length) return 0;

  const due = await db.transaction(async (tx) => {
    const published = await tx
      .update(chapters)
      .set({
        published: true,
        publishedAt: sql`coalesce(${chapters.publishedAt}, ${chapters.publishAt})`,
        publishAt: null,
      })
      .where(and(eq(chapters.published, false), isNotNull(chapters.publishAt), lte(chapters.publishAt, now), inArray(chapters.id, validIds)))
      .returning({ id: chapters.id, seriesId: chapters.seriesId, number: chapters.number, title: chapters.title });
    if (published.length) {
      await tx
        .update(series)
        .set({
          updatedAt: now,
          status: sql`case when ${series.status} = 'planned' then 'ongoing' else ${series.status} end`,
        })
        .where(inArray(series.id, [...new Set(published.map((chapter) => chapter.seriesId))]));
    }
    return published;
  });

  if (due.length === 0) return 0;
  await dispatchChapterNotifications(due);
  return due.length;
}
