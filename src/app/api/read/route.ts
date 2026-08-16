import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, readingStats } from "@/db/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Registers a reading of a chapter: atomically increments its view counter.
 * The client dedups (one view per chapter per browser session via
 * sessionStorage); the server only counts published chapters.
 */
export async function POST(req: NextRequest) {
  let chapterId: number | null = null;
  try {
    const body = await req.json();
    chapterId = Number(body?.chapterId);
  } catch {
    /* malformed body */
  }
  if (!chapterId || !Number.isFinite(chapterId)) {
    return NextResponse.json({ error: "chapterId inválido." }, { status: 400 });
  }
  const ip = await getClientIp();
  const limited = await checkRateLimit({ key: `read:ip:${ip}:1h`, limit: 240, windowSeconds: 3600 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas leituras registradas." }, { status: 429 });
  }

  const [row] = await db
    .update(chapters)
    .set({ views: sql`${chapters.views} + 1` })
    .where(and(eq(chapters.id, chapterId), eq(chapters.published, true)))
    .returning({ id: chapters.id });

  if (!row) {
    return NextResponse.json({ error: "Capítulo não encontrado." }, { status: 404 });
  }

  // per-day stat (upsert) for the panel charts — dia local do servidor
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  await db
    .insert(readingStats)
    .values({ day, chapterId, views: 1 })
    .onConflictDoUpdate({
      target: [readingStats.day, readingStats.chapterId],
      set: { views: sql`${readingStats.views} + 1` },
    });

  return NextResponse.json({ ok: true });
}
