"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, pages, series } from "@/db/schema";
import { requireAdmin } from "@/features/auth/session";
import { chapterInputSchema, pagesInputSchema, seriesInputSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

function uniqueSlugError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505") {
    return "Já existe uma obra com esse endereço. Mude o slug.";
  }
  throw err;
}

export async function createSeriesAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = seriesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { title, synopsis, cover, status, tags } = parsed.data;
  const slug = parsed.data.slug?.trim() || slugify(title);
  if (!slug) return { ok: false, error: "Título inválido — não foi possível gerar o endereço." };
  try {
    const [row] = await db
      .insert(series)
      .values({ title, slug, synopsis, cover, status, tags })
      .returning({ id: series.id });
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: uniqueSlugError(err) };
  }
}

export async function updateSeriesAction(id: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = seriesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { title, synopsis, cover, status, tags } = parsed.data;
  const slug = parsed.data.slug?.trim() || slugify(title);
  if (!slug) return { ok: false, error: "Título inválido — não foi possível gerar o endereço." };
  try {
    await db
      .update(series)
      .set({ title, slug, synopsis, cover, status, tags, updatedAt: new Date() })
      .where(eq(series.id, id));
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: uniqueSlugError(err) };
  }
}

export async function deleteSeriesAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(series).where(eq(series.id, id));
  return { ok: true };
}

function parsePublishAt(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createChapterAction(seriesId: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = chapterInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { number, title, cover, published } = parsed.data;
  const publishAt = parsePublishAt(parsed.data.publishAt);
  const scheduled = !!publishAt;
  const [row] = await db
    .insert(chapters)
    .values({
      seriesId,
      number,
      title,
      cover,
      published: !scheduled && published,
      publishedAt: !scheduled && published ? new Date() : null,
      publishAt,
    })
    .returning({ id: chapters.id });
  await db
    .update(series)
    .set({ updatedAt: new Date() })
    .where(eq(series.id, seriesId));
  return { ok: true, id: row.id };
}

export async function updateChapterAction(id: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = chapterInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { number, title, cover, published } = parsed.data;
  const publishAt = parsePublishAt(parsed.data.publishAt);
  const scheduled = !!publishAt;
  const cur = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  const wasPublished = cur[0]?.published ?? false;
  await db
    .update(chapters)
    .set({
      number,
      title,
      cover,
      published: scheduled ? false : published,
      publishedAt: scheduled ? null : published && !wasPublished ? new Date() : published ? undefined : null,
      publishAt: scheduled ? publishAt : published ? null : publishAt,
    })
    .where(eq(chapters.id, id));
  return { ok: true, id };
}

export async function deleteChapterAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const cur = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  await db.delete(chapters).where(eq(chapters.id, id));
  if (cur[0]) {
    await db.update(series).set({ updatedAt: new Date() }).where(eq(series.id, cur[0].seriesId));
  }
  return { ok: true };
}

export async function setPagesAction(chapterId: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pagesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const srcs = parsed.data.srcs;
  await db.transaction(async (tx) => {
    await tx.delete(pages).where(eq(pages.chapterId, chapterId));
    if (srcs.length > 0) {
      await tx.insert(pages).values(srcs.map((src, i) => ({ chapterId, position: i + 1, src })));
    }
  });
  return { ok: true };
}

export async function incrementViewsAction(chapterId: number): Promise<ActionResult> {
  const cur = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  if (!cur[0] || !cur[0].published) return { ok: false, error: "Capítulo não encontrado." };
  await db
    .update(chapters)
    .set({ views: cur[0].views + 1 })
    .where(eq(chapters.id, chapterId));
  return { ok: true };
}
