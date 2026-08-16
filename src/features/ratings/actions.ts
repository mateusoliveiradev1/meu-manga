"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { series, seriesRatings } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { ratingInputSchema } from "@/lib/validation";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Sets (or updates) the logged-in user's star rating for a series. */
export async function setRatingAction(seriesId: number, value: number): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = ratingInputSchema.safeParse({ seriesId, value });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Nota inválida." };

  const s = await db.select({ slug: series.slug }).from(series).where(eq(series.id, parsed.data.seriesId)).limit(1);
  if (!s[0]) return { ok: false, error: "Obra não encontrada." };

  await db
    .insert(seriesRatings)
    .values({ userId: user.id, seriesId: parsed.data.seriesId, value: parsed.data.value, createdAt: new Date() })
    .onConflictDoUpdate({
      target: [seriesRatings.userId, seriesRatings.seriesId],
      set: { value: parsed.data.value, createdAt: new Date() },
    });

  revalidatePath(`/obra/${s[0].slug}`);
  return { ok: true };
}
