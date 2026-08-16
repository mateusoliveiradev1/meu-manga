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
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const genre = genreBySlug(slug);
  if (!genre) notFound();
  const sp = await searchParams;
  const sort: SeriesSort = sp.sort === "reads" || sp.sort === "rated" ? sp.sort : "recent";
  const series = await getSeriesList(undefined, { genreName: genre.name, sort });

  return (
    <>
      <div className="mt-2">
        <Link href="/" className="btn ghost small">
          <IconArrowLeft size={14} /> Todas as obras
        </Link>
      </div>

      <section className="section" aria-label={`Gênero ${genre.name}`}>
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              {genre.slug.slice(0, 2).toUpperCase()}
            </span>
            <h1>{genre.name}</h1>
          </div>
          <span className="section-sub">
            {series.length} {series.length === 1 ? "obra" : "obras"} em exibição
          </span>
        </div>
        <p className="genre-blurb">{GENRE_BLURBS[genre.slug]}</p>

        <SeriesGrid series={series} base={`/genero/${genre.slug}`} genre={genre.slug} sort={sort} />
      </section>
    </>
  );
}
