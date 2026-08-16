import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

/** Best-effort client IP behind Vercel or another trusted reverse proxy. */
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
    // headers() can be unavailable outside a request.
  }
  return "unknown";
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window check-and-increment backed by one atomic Postgres UPSERT.
 * The single statement is race-safe across concurrent serverless instances.
 */
export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = opts;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const cutoff = now - windowMs;

  const [row] = await db
    .insert(rateLimits)
    .values({ key, lastRequest: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        lastRequest: sql`case when ${rateLimits.lastRequest} <= ${cutoff} then ${now} else ${rateLimits.lastRequest} end`,
        count: sql`case when ${rateLimits.lastRequest} <= ${cutoff} then 1 else ${rateLimits.count} + 1 end`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: rateLimits.count, lastRequest: rateLimits.lastRequest });

  if (row.count <= limit) return { ok: true };
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((row.lastRequest + windowMs - now) / 1000)),
  };
}

export async function checkRateLimits(
  checks: { key: string; limit: number; windowSeconds: number }[]
): Promise<RateLimitResult> {
  for (const check of checks) {
    const result = await checkRateLimit(check);
    if (!result.ok) return result;
  }
  return { ok: true };
}
