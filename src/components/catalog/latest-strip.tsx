import Link from "next/link";
import type { getLatestChapters } from "@/features/catalog/queries";
import { chapterLabel, formatDate } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof getLatestChapters>>[number];

export function LatestStrip({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="latest-strip" role="list" aria-label="Capítulos recém-publicados">
      {rows.map((c) => (
        <Link key={c.id} href={`/ler/${c.id}`} className="latest-card" role="listitem">
          <span className="latest-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.cover || c.seriesCover || "/samples/cover-farol.svg"} alt="" loading="lazy" />
            <span className="latest-num mono-num">cap. {chapterLabel(c.number)}</span>
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
