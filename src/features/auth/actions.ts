"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { getCurrentUser } from "./session";

/**
 * Promotes the signed-in user to admin when their email matches ADMIN_EMAIL.
 * ADMIN_EMAIL may be a comma-separated list (multiple studio authors).
 */
export async function grantAdminIfNeeded(): Promise<{ ok: boolean }> {
  const current = await getCurrentUser();
  if (!current) return { ok: false };
  const admins = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (admins.length === 0 || !admins.includes(current.email.toLowerCase())) return { ok: false };
  await db.update(user).set({ role: "admin" }).where(eq(user.id, current.id));
  return { ok: true };
}

export async function getRole(): Promise<string | null> {
  const current = await getCurrentUser();
  return current?.role ?? null;
}
