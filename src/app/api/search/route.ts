import { ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { series } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return Response.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });

  const results = await db
    .select({ title: series.title, slug: series.slug, cover: series.cover })
    .from(series)
    .where(or(ilike(series.title, `%${q}%`), ilike(series.tags, `%${q}%`)))
    .limit(6);

  return Response.json({ results }, { headers: { "Cache-Control": "private, max-age=30" } });
}
