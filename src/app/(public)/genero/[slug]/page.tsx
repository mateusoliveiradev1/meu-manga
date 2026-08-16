import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesGrid } from "@/components/catalog/series-grid";
import type { SeriesSort } from "@/components/catalog/series-grid";
import { IconArrowLeft } from "@/components/ui/icons";
import { getSeriesList } from "@/features/catalog/queries";
import { GENRE_BLURBS, genreBySlug } from "@/lib/genres";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const genre = genreBySlug(slug);
  if (!genre) return { title: "Gênero não encontrado" };
  return {
    title: `Gênero: ${genre.name}`,
    description: GENRE_BLURBS[genre.slug] ?? `Obras do gênero ${genre.name} publicadas no estúdio.`,
  };
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { slug } = await params;
  const genre = genreBySlug(slug);
  if (!genre) notFound();
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const sort: SeriesSort = sp.sort === "reads" || sp.sort === "rated" ? sp.sort : "recent";
  const series = await getSeriesList(undefined, { q, genreName: genre.name, sort });

  return (
    <>
      <div className="mt-2">
        <Link href="/generos" className="btn ghost small">
          <IconArrowLeft size={14} /> Todos os gêneros
        </Link>
      </div>

      <section className="section" aria-label={`Gênero ${genre.name}`}>
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              gênero
            </span>
            <h1>{genre.name}</h1>
          </div>
          <span className="section-sub">
            {series.length} {series.length === 1 ? "história encontrada" : "histórias encontradas"}
          </span>
        </div>
        <p className="genre-blurb">{GENRE_BLURBS[genre.slug]}</p>

        <SeriesGrid series={series} base={`/genero/${genre.slug}`} q={q || undefined} genre={genre.slug} sort={sort} showGenreBar={false} />
      </section>
    </>
  );
}
