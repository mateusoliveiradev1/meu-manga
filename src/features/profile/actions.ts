"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Use pelo menos 2 caracteres.").max(40, "Use no máximo 40 caracteres."),
  image: z.union([z.literal(""), z.string().url("Informe uma URL válida para o avatar.").max(500)]),
  bio: z.string().trim().max(240, "Sua apresentação pode ter até 240 caracteres."),
  favoriteGenre: z.string().trim().max(40),
  favoritesPublic: z.boolean(),
  commentsPublic: z.boolean(),
});

export async function updateProfileAction(input: z.input<typeof profileSchema>) {
  const current = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Revise os dados do perfil." };
  await db.update(user).set({ ...parsed.data, image: parsed.data.image || null, updatedAt: new Date() }).where(eq(user.id, current.id));
  revalidatePath("/perfil");
  revalidatePath(`/leitores/${current.id}`);
  return { ok: true as const };
}

export async function setNotifyNewChapters(enabled: boolean): Promise<{ ok: boolean }> {
  const current = await requireUser();
  await db.update(user).set({ notifyNewChapters: enabled }).where(eq(user.id, current.id));
  return { ok: true };
}
