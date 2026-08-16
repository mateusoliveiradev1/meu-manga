"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { userFavorites } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

type ActionResult = { ok: true; favorite: boolean } | { ok: false; error: string };

export async function toggleFavoriteAction(seriesId: number): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await db
    .select()
    .from(userFavorites)
    .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.seriesId, seriesId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(userFavorites)
      .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.seriesId, seriesId)));
    return { ok: true, favorite: false };
  }

  await db.insert(userFavorites).values({ userId: user.id, seriesId });
  revalidatePath("/");
  return { ok: true, favorite: true };
}
