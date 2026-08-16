import Link from "next/link";
import { GENRES, genreSlugsIn, normalizeTags } from "@/lib/genres";

/** Chips dos gêneros canônicos de uma obra, linkando para /genero/[slug]. */
export function GenreChips({ tags }: { tags: string }) {
  const slugs = genreSlugsIn(normalizeTags(tags));
  if (slugs.length === 0) return null;
  return (
    <div className="genre-chips" aria-label="Gêneros da obra">
      {slugs.map((slug) => {
        const g = GENRES.find((x) => x.slug === slug);
        if (!g) return null;
        return (
          <Link key={slug} href={`/genero/${slug}`} className="tag">
            {g.name}
          </Link>
        );
      })}
    </div>
  );
}
