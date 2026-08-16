import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters } from "@/db/schema";
import { notifyNewChapter } from "@/features/notify/email";

/**
 * Publica capítulos agendados cuja hora chegou (sem cron: roda a cada
 * request público e é um no-op quando não há nada devido). Depois de
 * publicar, notifica os leitores que favoritaram a série — uma vez só.
 */
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
  try {
    await notifyNewChapter(due);
  } catch (err) {
    console.error("[publish] falha ao notificar capítulos", err);
  } finally {
    await db
      .update(chapters)
      .set({ notified: true })
      .where(
        inArray(
          chapters.id,
          due.map((d) => d.id)
        )
      );
  }
  return due.length;
}
