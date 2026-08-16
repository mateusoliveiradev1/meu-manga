"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { clubPosts, pollOptions, pollVotes, postReactions, series } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/features/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const TYPES = new Set(["discussion", "theory", "poll"]);
const REACTIONS = new Set(["insight", "agree", "curious"]);

export async function createClubPostAction(input: { seriesId: number; chapterId?: number | null; type: string; title: string; content: string; spoiler?: boolean; options?: string[] }) {
  const user = await requireUser();
  const ip = await getClientIp();
  const limited = await checkRateLimit({ key: `club:${user.id}:${ip}:10m`, limit: 8, windowSeconds: 600 });
  if (!limited.ok) return { ok: false, error: `Aguarde ${limited.retryAfterSeconds}s antes de publicar novamente.` } as const;
  const title = input.title.trim().slice(0, 120);
  const content = input.content.trim().slice(0, 1600);
  if (!Number.isInteger(input.seriesId) || input.seriesId <= 0 || !TYPES.has(input.type) || title.length < 4) return { ok: false, error: "Revise o tipo e o título da publicação." } as const;
  if (input.type !== "poll" && content.length < 2) return { ok: false, error: "Conte um pouco mais antes de publicar." } as const;
  const choices = (input.options ?? []).map((option) => option.trim().slice(0, 100)).filter(Boolean).slice(0, 5);
  if (input.type === "poll" && choices.length < 2) return { ok: false, error: "Uma enquete precisa de pelo menos duas opções." } as const;
  const [work] = await db.select({ slug: series.slug }).from(series).where(eq(series.id, input.seriesId)).limit(1);
  if (!work) return { ok: false, error: "Obra não encontrada." } as const;
  const post = await db.transaction(async (tx) => {
    const [created] = await tx.insert(clubPosts).values({ seriesId: input.seriesId, chapterId: input.chapterId || null, userId: user.id, type: input.type, title, content, spoiler: Boolean(input.spoiler) }).returning();
    if (choices.length) await tx.insert(pollOptions).values(choices.map((label, position) => ({ postId: created.id, label, position })));
    return created;
  });
  revalidatePath(`/clube/${work.slug}`);
  revalidatePath("/comunidade");
  return { ok: true, id: post.id } as const;
}

export async function togglePostReactionAction(postId: number, reaction: string) {
  const user = await requireUser();
  if (!REACTIONS.has(reaction)) return { ok: false, error: "Reação inválida." } as const;
  const [existing] = await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, user.id))).limit(1);
  if (existing?.reaction === reaction) await db.delete(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, user.id)));
  else await db.insert(postReactions).values({ postId, userId: user.id, reaction }).onConflictDoUpdate({ target: [postReactions.postId, postReactions.userId], set: { reaction } });
  revalidatePath("/comunidade");
  revalidatePath("/clube/[slug]", "page");
  return { ok: true, active: existing?.reaction !== reaction } as const;
}

export async function votePollAction(postId: number, optionId: number) {
  const user = await requireUser();
  const [option] = await db.select().from(pollOptions).where(and(eq(pollOptions.id, optionId), eq(pollOptions.postId, postId))).limit(1);
  if (!option) return { ok: false, error: "Opção inválida." } as const;
  await db.insert(pollVotes).values({ postId, optionId, userId: user.id }).onConflictDoUpdate({ target: [pollVotes.postId, pollVotes.userId], set: { optionId } });
  revalidatePath("/clube/[slug]", "page");
  return { ok: true } as const;
}

export async function deleteClubPostAction(postId: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." } as const;
  const [post] = await db.select().from(clubPosts).where(eq(clubPosts.id, postId)).limit(1);
  if (!post || (post.userId !== user.id && user.role !== "admin")) return { ok: false, error: "Você não pode apagar esta publicação." } as const;
  await db.delete(clubPosts).where(eq(clubPosts.id, postId));
  revalidatePath("/comunidade");
  revalidatePath("/clube/[slug]", "page");
  return { ok: true } as const;
}
