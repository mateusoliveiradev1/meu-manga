import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { pageViews } from "@/db/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Lightweight analytics: counts one view per (path, day). The client dedups
 * (one view per path per browser session via sessionStorage) and rate-limits
 * itself; this endpoint just upserts the counter.
 */
export async function POST(req: NextRequest) {
  let path = "";
  try {
    const body = await req.json();
    path = typeof body?.path === "string" ? body.path.slice(0, 200) : "";
  } catch {
    /* malformed body */
  }
  if (!path || !path.startsWith("/") || path.includes("..")) {
    return NextResponse.json({ error: "path inválido." }, { status: 400 });
  }
  const ip = await getClientIp();
  const limited = await checkRateLimit({ key: `pageview:ip:${ip}:1h`, limit: 180, windowSeconds: 3600 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas visualizações." }, { status: 429 });
  }

  const day = new Date();
  day.setHours(0, 0, 0, 0);
  await db
    .insert(pageViews)
    .values({ day, path, views: 1 })
    .onConflictDoUpdate({
      target: [pageViews.day, pageViews.path],
      set: { views: sql`${pageViews.views} + 1` },
    });

  return NextResponse.json({ ok: true });
}
