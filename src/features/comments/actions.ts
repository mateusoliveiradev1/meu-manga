"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { chapters, comments, series } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/features/auth/session";
import { checkRateLimits, getClientIp } from "@/lib/rate-limit";
import { commentInputSchema, commentTargetSchema } from "@/lib/validation";

type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

// spam protection: per-account and per-IP sliding windows
const COMMENT_LIMITS = {
  perUserMinute: { limit: 5, windowSeconds: 60 },
  perUserHour: { limit: 30, windowSeconds: 3600 },
  perIpHour: { limit: 60, windowSeconds: 3600 },
} as const;

async function commentTargetSlug(target: { chapterId?: number; seriesId?: number }): Promise<string | null> {
  if (target.seriesId != null) {
    const row = await db.select({ slug: series.slug }).from(series).where(eq(series.id, target.seriesId)).limit(1);
    return row[0] ? `/obra/${row[0].slug}` : null;
  }
  return target.chapterId != null ? `/ler/${target.chapterId}` : null;
}

/** Adds a comment on a chapter (chapterId) or on the manga itself (seriesId). */
export async function addCommentAction(target: unknown, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsedTarget = commentTargetSchema.safeParse(target);
  if (!parsedTarget.success) return { ok: false, error: "Destino do comentário inválido." };
  const parsed = commentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const t = parsedTarget.data;
  if (t.chapterId != null) {
    const chapter = await db.select().from(chapters).where(eq(chapters.id, t.chapterId)).limit(1);
    if (!chapter[0] || !chapter[0].published) return { ok: false, error: "Capítulo não encontrado." };
  } else if (t.seriesId != null) {
    const s = await db.select().from(series).where(eq(series.id, t.seriesId)).limit(1);
    if (!s[0]) return { ok: false, error: "Obra não encontrada." };
  }

  const ip = await getClientIp();
  const limited = await checkRateLimits([
    { key: `comment:user:${user.id}:1m`, ...COMMENT_LIMITS.perUserMinute },
    { key: `comment:user:${user.id}:1h`, ...COMMENT_LIMITS.perUserHour },
    { key: `comment:ip:${ip}:1h`, ...COMMENT_LIMITS.perIpHour },
  ]);
  if (!limited.ok) {
    return {
      ok: false,
      error: `Você está comentando rápido demais. Tente de novo em ${limited.retryAfterSeconds} ${
        limited.retryAfterSeconds === 1 ? "segundo" : "segundos"
      }.`,
    };
  }

  const [row] = await db
    .insert(comments)
    .values({ chapterId: t.chapterId ?? null, seriesId: t.seriesId ?? null, userId: user.id, content: parsed.data.content })
    .returning({ id: comments.id });

  const path = await commentTargetSlug(t);
  if (path) revalidatePath(path);
  return { ok: true, id: row.id };
}

export async function deleteCommentAction(commentId: number): Promise<ActionResult> {
  const user = await requireUser();
  const row = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  const comment = row[0];
  if (!comment) return { ok: false, error: "Comentário não encontrado." };
  if (comment.userId !== user.id && user.role !== "admin") {
    return { ok: false, error: "Você só pode apagar os próprios comentários." };
  }
  await db.delete(comments).where(eq(comments.id, commentId));
  const path = await commentTargetSlug({ chapterId: comment.chapterId ?? undefined, seriesId: comment.seriesId ?? undefined });
  if (path) revalidatePath(path);
  return { ok: true };
}

export async function canDeleteComment(commentUserId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.id === commentUserId || user.role === "admin";
}
