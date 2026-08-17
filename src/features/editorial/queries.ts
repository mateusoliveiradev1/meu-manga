import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, pages, series } from "@/db/schema";

export type EditorialChapter = {
  id: number;
  seriesId: number;
  seriesTitle: string;
  seriesSlug: string;
  seriesStatus: string;
  number: number;
  title: string;
  published: boolean;
  publishedAt: Date | null;
  publishAt: Date | null;
  pageCount: number;
  duplicatePages: number[];
  blockers: string[];
  warnings: string[];
};

export async function getEditorialCalendar(): Promise<EditorialChapter[]> {
  const rows = await db
    .select({
      id: chapters.id,
      seriesId: chapters.seriesId,
      seriesTitle: series.title,
      seriesSlug: series.slug,
      seriesStatus: series.status,
      number: chapters.number,
      title: chapters.title,
      published: chapters.published,
      publishedAt: chapters.publishedAt,
      publishAt: chapters.publishAt,
      pageCount: count(pages.id),
    })
    .from(chapters)
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .leftJoin(pages, eq(pages.chapterId, chapters.id))
    .groupBy(chapters.id, series.id)
    .orderBy(asc(chapters.publishAt), asc(chapters.createdAt));

  const pageRows = await db
    .select({ chapterId: pages.chapterId, position: pages.position, src: pages.src })
    .from(pages)
    .orderBy(asc(pages.chapterId), asc(pages.position));
  const grouped = new Map<number, { position: number; src: string }[]>();
  for (const page of pageRows) {
    const current = grouped.get(page.chapterId) ?? [];
    current.push({ position: page.position, src: page.src.trim() });
    grouped.set(page.chapterId, current);
  }

  return rows.map((chapter) => {
    const chapterPages = grouped.get(chapter.id) ?? [];
    const seen = new Map<string, number>();
    const duplicatePages: number[] = [];
    for (const page of chapterPages) {
      if (!page.src) continue;
      if (seen.has(page.src)) duplicatePages.push(page.position);
      else seen.set(page.src, page.position);
    }
    const positions = new Set(chapterPages.map((page) => page.position));
    const missingPosition = chapterPages.findIndex((_, index) => !positions.has(index + 1));
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (chapter.pageCount === 0) blockers.push("Nenhuma página adicionada");
    if (duplicatePages.length) blockers.push(`Páginas repetidas: ${duplicatePages.join(", ")}`);
    if (missingPosition >= 0) blockers.push(`Falta a página ${missingPosition + 1} na sequência`);
    if (!chapter.title.trim()) warnings.push("Capítulo sem subtítulo");

    return { ...chapter, duplicatePages, blockers, warnings };
  });
}
