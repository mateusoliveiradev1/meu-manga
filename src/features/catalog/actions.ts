"use server";

import { count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, pages, series } from "@/db/schema";
import { requireAdmin } from "@/features/auth/session";
import { dispatchChapterNotifications } from "@/features/catalog/publish";
import { chapterInputSchema, pagesInputSchema, seriesInputSchema } from "@/lib/validation";
import { brasiliaDateTimeToIso, slugify } from "@/lib/utils";

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
  const slug = slugify(parsed.data.slug?.trim() || title);
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
  const slug = slugify(parsed.data.slug?.trim() || title);
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
  // Compatibilidade com abas antigas: datetime-local sem fuso sempre representa Brasília.
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? brasiliaDateTimeToIso(raw) : raw;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getPublicationBlockers(chapterId: number): Promise<string[]> {
  const chapterPages = await db
    .select({ position: pages.position, src: pages.src })
    .from(pages)
    .where(eq(pages.chapterId, chapterId));
  if (!chapterPages.length) return ["adicione pelo menos uma página"];

  const blockers: string[] = [];
  const normalizedSources = chapterPages.map((page) => page.src.trim());
  if (normalizedSources.some((src) => !src)) blockers.push("remova páginas sem imagem");
  if (new Set(normalizedSources).size !== normalizedSources.length) blockers.push("remova imagens repetidas");
  const positions = [...chapterPages].map((page) => page.position).sort((a, b) => a - b);
  const missingPosition = positions.findIndex((position, index) => position !== index + 1);
  if (missingPosition >= 0) blockers.push(`corrija a sequência a partir da página ${missingPosition + 1}`);
  return blockers;
}

export async function createChapterAction(seriesId: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = chapterInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { number, title, cover, published } = parsed.data;
  const publishAt = parsePublishAt(parsed.data.publishAt);
  const scheduled = !!publishAt;
  if (parsed.data.publishAt && !publishAt) return { ok: false, error: "Data de publicação inválida." };
  if (scheduled || published) {
    return { ok: false, error: "Crie o capítulo, adicione as páginas e depois escolha entre agendar ou publicar agora." };
  }
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
  if (!scheduled && published) {
    await dispatchChapterNotifications([{ id: row.id, seriesId, number, title }]);
  }
  return { ok: true, id: row.id };
}

export async function updateChapterAction(id: number, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = chapterInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { number, title, cover, published } = parsed.data;
  const publishAt = parsePublishAt(parsed.data.publishAt);
  const scheduled = !!publishAt;
  if (parsed.data.publishAt && !publishAt) return { ok: false, error: "Data de publicação inválida." };
  if (publishAt && publishAt.getTime() <= Date.now()) {
    return { ok: false, error: "Escolha um horário futuro ou use “Publicar agora”." };
  }
  const cur = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  if (!cur[0]) return { ok: false, error: "Capítulo não encontrado." };
  if (scheduled || published) {
    const blockers = await getPublicationBlockers(id);
    if (blockers.length) return { ok: false, error: `Antes de publicar, ${blockers.join("; ")}.` };
  }
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
      notified: scheduled || !published ? false : undefined,
    })
    .where(eq(chapters.id, id));
  if (!scheduled && published && !wasPublished) {
    await db
      .update(series)
      .set({
        updatedAt: new Date(),
        status: sql`case when ${series.status} = 'planned' then 'ongoing' else ${series.status} end`,
      })
      .where(eq(series.id, cur[0].seriesId));
  }
  if (!scheduled && published && !wasPublished && cur[0]) {
    await dispatchChapterNotifications([{ id, seriesId: cur[0].seriesId, number, title }]);
  }
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

export async function duplicateChapterAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const [source] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  if (!source) return { ok: false, error: "Capítulo não encontrado." };

  const siblings = await db.select({ number: chapters.number }).from(chapters).where(eq(chapters.seriesId, source.seriesId));
  const nextNumber = Math.max(0, ...siblings.map((chapter) => chapter.number)) + 1;
  const sourcePages = await db.select().from(pages).where(eq(pages.chapterId, source.id)).orderBy(pages.position);

  const duplicatedId = await db.transaction(async (tx) => {
    const [copy] = await tx
      .insert(chapters)
      .values({
        seriesId: source.seriesId,
        number: nextNumber,
        title: source.title ? `${source.title} (cópia)` : "Cópia",
        cover: source.cover,
        published: false,
        publishedAt: null,
        publishAt: null,
        notified: false,
      })
      .returning({ id: chapters.id });
    if (sourcePages.length > 0) {
      await tx.insert(pages).values(sourcePages.map((page) => ({ chapterId: copy.id, position: page.position, src: page.src })));
    }
    return copy.id;
  });
  return { ok: true, id: duplicatedId };
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

export async function bulkPublishChaptersAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(input)) return { ok: false, error: "Selecione capítulos para publicar." };
  const ids = [...new Set(input.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50);
  if (!ids.length) return { ok: false, error: "Selecione pelo menos um capítulo." };

  const selected = await db
    .select({
      id: chapters.id,
      seriesId: chapters.seriesId,
      number: chapters.number,
      title: chapters.title,
      published: chapters.published,
      pageCount: count(pages.id),
    })
    .from(chapters)
    .leftJoin(pages, eq(pages.chapterId, chapters.id))
    .where(inArray(chapters.id, ids))
    .groupBy(chapters.id);
  if (selected.length !== ids.length) return { ok: false, error: "Um dos capítulos selecionados não existe mais." };
  const empty = selected.filter((chapter) => chapter.pageCount === 0);
  if (empty.length) {
    return { ok: false, error: `Adicione páginas antes de publicar: ${empty.map((chapter) => `cap. ${chapter.number}`).join(", ")}.` };
  }

  const unpublished = selected.filter((chapter) => !chapter.published);
  if (!unpublished.length) return { ok: false, error: "Os capítulos selecionados já estão publicados." };
  await db.transaction(async (tx) => {
    await tx
      .update(chapters)
      .set({ published: true, publishedAt: new Date(), publishAt: null })
      .where(inArray(chapters.id, unpublished.map((chapter) => chapter.id)));
    await tx
      .update(series)
      .set({
        updatedAt: new Date(),
        status: sql`case when ${series.status} = 'planned' then 'ongoing' else ${series.status} end`,
      })
      .where(inArray(series.id, [...new Set(unpublished.map((chapter) => chapter.seriesId))]));
  });
  await dispatchChapterNotifications(unpublished.map(({ id, seriesId, number, title }) => ({ id, seriesId, number, title })));
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
