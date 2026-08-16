"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { collectionItems, libraryEntries, userCollections } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import type { LibraryStatus } from "@/features/library/types";

const VALID_STATUS = new Set<LibraryStatus>(["want", "reading", "paused", "completed"]);

export async function setLibraryStatusAction(seriesId: number, status: LibraryStatus | null) {
  const user = await requireUser();
  if (!Number.isInteger(seriesId) || seriesId <= 0 || (status && !VALID_STATUS.has(status))) return { ok: false, error: "Estado inválido." } as const;
  if (!status) {
    await db.delete(libraryEntries).where(and(eq(libraryEntries.userId, user.id), eq(libraryEntries.seriesId, seriesId)));
  } else {
    await db
      .insert(libraryEntries)
      .values({ userId: user.id, seriesId, status, updatedAt: new Date() })
      .onConflictDoUpdate({ target: [libraryEntries.userId, libraryEntries.seriesId], set: { status, updatedAt: new Date() } });
  }
  revalidatePath("/biblioteca");
  revalidatePath("/para-voce");
  return { ok: true, status } as const;
}

export async function createCollectionAction(name: string, description = "") {
  const user = await requireUser();
  const cleanName = name.trim().slice(0, 48);
  if (cleanName.length < 2) return { ok: false, error: "Dê um nome com pelo menos 2 caracteres." } as const;
  const [collection] = await db.insert(userCollections).values({ userId: user.id, name: cleanName, description: description.trim().slice(0, 160) }).returning();
  revalidatePath("/biblioteca");
  return { ok: true, collection } as const;
}

export async function deleteCollectionAction(collectionId: number) {
  const user = await requireUser();
  await db.delete(userCollections).where(and(eq(userCollections.id, collectionId), eq(userCollections.userId, user.id)));
  revalidatePath("/biblioteca");
  return { ok: true } as const;
}

export async function toggleCollectionItemAction(collectionId: number, seriesId: number) {
  const user = await requireUser();
  const [collection] = await db.select({ id: userCollections.id }).from(userCollections).where(and(eq(userCollections.id, collectionId), eq(userCollections.userId, user.id))).limit(1);
  if (!collection) return { ok: false, error: "Lista não encontrada." } as const;
  const [existing] = await db.select().from(collectionItems).where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.seriesId, seriesId))).limit(1);
  if (existing) await db.delete(collectionItems).where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.seriesId, seriesId)));
  else await db.insert(collectionItems).values({ collectionId, seriesId });
  revalidatePath("/biblioteca");
  return { ok: true, included: !existing } as const;
}
