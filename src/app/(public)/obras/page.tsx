import type { Metadata } from "next";
import Link from "next/link";
import { SeriesGrid, type SeriesSort } from "@/components/catalog/series-grid";
import { IconCompass } from "@/components/ui/icons";
import { getSeriesList } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Obras — catálogo completo",
  description: "Explore todas as histórias publicadas pelo estúdio e encontre sua próxima leitura.",
};

export default async function ObrasPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const sort: SeriesSort = sp.sort === "reads" || sp.sort === "rated" ? sp.sort : "recent";
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  const works = await getSeriesList(undefined, { q, sort });

  return (
    <>
      <section className="catalog-intro" aria-labelledby="catalog-title">
        <div>
          <h1 id="catalog-title"><IconCompass size={24} /> Encontre sua próxima história</h1>
          <p>Busque por título, percorra os gêneros ou comece pelas obras mais lidas.</p>
        </div>
        <Link className="btn ghost" href="/generos">Ver todos os gêneros</Link>
      </section>
      <section className="section" aria-label="Catálogo de obras">
        <div className="section-head catalog-results-head">
          <h2>{q ? `Resultados para “${q}”` : "Catálogo completo"}</h2>
          <span className="section-sub">{works.length} {works.length === 1 ? "obra disponível" : "obras disponíveis"}</span>
        </div>
        <SeriesGrid series={works} base="/obras" q={q || undefined} sort={sort} page={page} />
      </section>
    </>
  );
}
