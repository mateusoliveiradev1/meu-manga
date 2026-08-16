import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

/**
 * Best-effort client IP for rate limiting. Reads the standard reverse-proxy
 * headers in order; `x-forwarded-for` carries the original client as the
 * first entry. Falls back to a shared bucket key when no header is present.
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = h.get("x-real-ip");
    if (real) return real;
    const cf = h.get("cf-connecting-ip");
    if (cf) return cf;
  } catch {
    /* headers() unavailable outside a request — fall through */
  }
  return "unknown";
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Sliding-window check-and-increment keyed by `key` (e.g. `comment:user:42`).
 * DB-backed: survives restarts and works across instances. The window slides
 * on the FIRST request of a new window; expired rows are overwritten in
 * place, so the table stays bounded by the number of distinct keys.
 */
export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = opts;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();

  const rows = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  const row = rows[0];

  if (!row) {
    await db.insert(rateLimits).values({ key, windowStart: now, count: 1 });
    return { ok: true };
  }

  // window expired → slide it and reset the counter
  if (row.windowStart <= now - windowMs) {
    await db
      .update(rateLimits)
      .set({ windowStart: now, count: 1, updatedAt: new Date() })
      .where(eq(rateLimits.key, key));
    return { ok: true };
  }

  if (row.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((row.windowStart + windowMs - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  await db.update(rateLimits).set({ count: row.count + 1 }).where(eq(rateLimits.key, key));
  return { ok: true };
}

/** Runs several checks in order and fails on the first one that trips. */
export async function checkRateLimits(
  checks: { key: string; limit: number; windowSeconds: number }[]
): Promise<RateLimitResult> {
  for (const check of checks) {
    const res = await checkRateLimit(check);
    if (!res.ok) return res;
  }
  return { ok: true };
}
