"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userProgress } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { progressInputSchema } from "@/lib/validation";

export async function saveProgressAction(input: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = progressInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { chapterId, page } = parsed.data;
  await db
    .insert(userProgress)
    .values({ userId: user.id, chapterId, page, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.chapterId],
      set: { page, updatedAt: new Date() },
    });
  return { ok: true };
}
