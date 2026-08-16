import Link from "next/link";
import type { getLatestChapters } from "@/features/catalog/queries";
import { chapterLabel, formatDate } from "@/lib/utils";
import { ResponsiveImage } from "@/components/ui/responsive-image";

type Row = Awaited<ReturnType<typeof getLatestChapters>>[number];

export function LatestStrip({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="latest-strip" role="list" aria-label="Capítulos recém-publicados">
      {rows.map((c) => (
        <Link key={c.id} href={`/capitulo/${c.id}`} className="latest-card" role="listitem">
          <span className="latest-cover">
            <ResponsiveImage src={c.cover || c.seriesCover} alt="" sizes="(max-width: 720px) 38vw, 10rem" />
            <span className="latest-num mono-num">{chapterLabel(c.number)}</span>
          </span>
          <span className="latest-title">{c.seriesTitle}</span>
          <span className="latest-date">
            {c.title ? `${c.title} · ` : ""}
            {c.publishedAt ? formatDate(c.publishedAt) : "em breve"}
          </span>
        </Link>
      ))}
    </div>
  );
}
