"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";

export async function setNotifyNewChapters(enabled: boolean): Promise<{ ok: boolean }> {
  const current = await getCurrentUser();
  if (!current) return { ok: false };
  await db.update(user).set({ notifyNewChapters: enabled }).where(eq(user.id, current.id));
  return { ok: true };
}
