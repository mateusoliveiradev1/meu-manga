import type { MetadataRoute } from "next";
import { db } from "@/db/client";
import { chapters, series } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GENRES } from "@/lib/genres";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seriesRows, chapterRows] = await Promise.all([
    db.select({ slug: series.slug, updatedAt: series.updatedAt }).from(series),
    db
      .select({ id: chapters.id, publishedAt: chapters.publishedAt })
      .from(chapters)
      .where(eq(chapters.published, true)),
  ]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/capitulos`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/sobre`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
    ...GENRES.map((g) => ({
      url: `${SITE_URL}/genero/${g.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...seriesRows.map((s) => ({
      url: `${SITE_URL}/obra/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...chapterRows.map((c) => ({
      url: `${SITE_URL}/ler/${c.id}`,
      lastModified: c.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...chapterRows.map((c) => ({
      url: `${SITE_URL}/capitulo/${c.id}`,
      lastModified: c.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
