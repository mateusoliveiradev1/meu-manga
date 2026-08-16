import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconCompass } from "@/components/ui/icons";
import { getSeriesList } from "@/features/catalog/queries";
import { GENRES, GENRE_BLURBS, hasGenre } from "@/lib/genres";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gêneros",
  description: "Explore o catálogo por gênero e encontre histórias no clima que você procura.",
};

export default async function GenresPage() {
  const works = await getSeriesList();
  const counts = new Map(GENRES.map((genre) => [genre.slug, works.filter((work) => hasGenre(work.tags, genre.name)).length]));

  return (
    <>
      <section className="catalog-intro genres-intro" aria-labelledby="genres-title">
        <div>
          <h1 id="genres-title"><IconCompass size={24} /> Escolha o clima da próxima leitura</h1>
          <p>Do suspense silencioso à aventura em ritmo acelerado: entre por um gênero e descubra a estante.</p>
        </div>
        <Link href="/obras" className="btn ghost">Ver catálogo completo</Link>
      </section>
      <div className="genre-index" role="list">
        {GENRES.map((genre) => {
          const count = counts.get(genre.slug) ?? 0;
          return (
            <Link key={genre.slug} href={`/genero/${genre.slug}`} className="genre-index-row" role="listitem">
              <span><strong>{genre.name}</strong><small>{GENRE_BLURBS[genre.slug] ?? `Histórias de ${genre.name.toLowerCase()}.`}</small></span>
              <span className="genre-index-count">{count} {count === 1 ? "obra" : "obras"}</span>
              <IconArrowRight size={17} />
            </Link>
          );
        })}
      </div>
    </>
  );
}
