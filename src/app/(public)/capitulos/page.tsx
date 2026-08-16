import type { Metadata } from "next";
import Link from "next/link";
import { getAllChapters } from "@/features/catalog/queries";
import { chapterLabel, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Capítulos — todos os capítulos publicados",
  description: "Arquivo de todos os capítulos publicados pelo estúdio, do mais recente ao mais antigo.",
};

export default async function CapitulosPage() {
  const rows = await getAllChapters();
  return (
    <>
      <section className="page-head" aria-label="Arquivo de capítulos">
        <h1>Capítulos</h1>
        <p className="page-sub">
          Todos os capítulos publicados, do mais recente ao mais antigo —{" "}
          {rows.length === 0 ? "nada publicado ainda" : `${rows.length} ${rows.length === 1 ? "capítulo" : "capítulos"} no ar`}.
        </p>
      </section>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">O estúdio está em silêncio...</div>
          <p>O primeiro capítulo ainda está sendo desenhado. Volte em breve!</p>
        </div>
      ) : (
        <div className="chapter-archive">
          {rows.map((c, i) => (
            <Link key={c.id} href={`/ler/${c.id}`} className="ch-row">
              <span className="ch-idx mono-num" aria-hidden="true">
                {String(rows.length - i).padStart(2, "0")}
              </span>
              {c.cover || c.seriesCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ch-thumb" src={c.cover || c.seriesCover} alt="" loading="lazy" />
              ) : (
                <span className="ch-thumb placeholder" aria-hidden="true" />
              )}
              <span className="ch-info">
                <span className="ch-series">{c.seriesTitle}</span>
                <span className="ch-cap">
                  {chapterLabel(c.number)}
                  {c.title ? ` — ${c.title}` : ""}
                </span>
              </span>
              <span className="ch-date">
                {c.publishedAt ? formatDate(c.publishedAt) : "em breve"} · {formatNumber(c.views)} leituras
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
