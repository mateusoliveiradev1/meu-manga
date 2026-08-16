import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, series } from "@/db/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { chapterLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const rows = await db
    .select({
      id: chapters.id,
      number: chapters.number,
      title: chapters.title,
      publishedAt: chapters.publishedAt,
      seriesTitle: series.title,
      seriesSlug: series.slug,
      seriesCover: series.cover,
    })
    .from(chapters)
    .innerJoin(series, eq(series.id, chapters.seriesId))
    .where(eq(chapters.published, true))
    .orderBy(desc(chapters.publishedAt))
    .limit(20);

  const items = rows
    .map((r) => {
      const url = `${SITE_URL}/ler/${r.id}`;
      const title = `${r.seriesTitle} — ${chapterLabel(r.number)}${r.title ? ` · ${r.title}` : ""}`;
      const date = r.publishedAt ? r.publishedAt.toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description>Novo capítulo de ${esc(r.seriesTitle)} publicado no ${esc(SITE_NAME)}.</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} — capítulos novos</title>
    <link>${SITE_URL}</link>
    <description>Capítulos publicados direto do estúdio.</description>
    <language>pt-BR</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
