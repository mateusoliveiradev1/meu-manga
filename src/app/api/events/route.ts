import { NextRequest, NextResponse } from "next/server";
import { analyticsEvents } from "@/db/schema";
import { db } from "@/db/client";
import { getCurrentUser } from "@/features/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EVENTS = new Set(["page_view", "work_view", "chapter_start", "chapter_complete", "chapter_exit", "favorite", "rating", "library_add", "club_post", "poll_vote"]);

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  const limited = await checkRateLimit({ key: `events:ip:${ip}:1h`, limit: 500, windowSeconds: 3600 });
  if (!limited.ok) return NextResponse.json({ error: "Muitos eventos." }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }); }
  const event = typeof body.event === "string" ? body.event : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : "";
  if (!EVENTS.has(event) || !sessionId) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  const user = await getCurrentUser();
  const positive = (value: unknown) => { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; };
  const pageNumber = Number(body.page);
  await db.insert(analyticsEvents).values({
    userId: user?.id ?? null,
    sessionId,
    event,
    path: typeof body.path === "string" ? body.path.slice(0, 300) : "",
    seriesId: positive(body.seriesId),
    chapterId: positive(body.chapterId),
    page: Number.isInteger(pageNumber) && pageNumber >= 0 ? pageNumber : null,
  });
  return NextResponse.json({ ok: true });
}
