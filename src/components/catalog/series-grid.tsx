import Link from "next/link";
import { IconStar } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/bits";
import type { SeriesWithStats } from "@/features/catalog/queries";
import { GENRES, genreBySlug, genreSlugsIn, normalizeTags } from "@/lib/genres";
import { formatNumber } from "@/lib/utils";

export type SeriesSort = "recent" | "reads" | "rated";

const SORT_TABS: { key: SeriesSort; label: string }[] = [
  { key: "recent", label: "Mais recentes" },
  { key: "reads", label: "Mais lidas" },
  { key: "rated", label: "Melhor avaliadas" },
];

function gridHref(base: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function SortTabs({
  base,
  q,
  genre,
  sort,
}: {
  base: string;
  q?: string;
  genre?: string;
  sort: SeriesSort;
}) {
  return (
    <div className="sort-tabs" role="group" aria-label="Ordenar obras">
      {SORT_TABS.map((t) => (
        <Link
          key={t.key}
          className={sort === t.key ? "active" : ""}
          href={gridHref(base, { q, genero: genre, sort: t.key === "recent" ? undefined : t.key })}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function GenreBar({
  base,
  q,
  genre,
  sort,
}: {
  base: string;
  q?: string;
  genre?: string;
  sort: SeriesSort;
}) {
  return (
    <div className="genre-bar" role="group" aria-label="Filtrar por gênero">
      <Link className={!genre ? "active" : ""} href={gridHref(base, { q, sort: sort === "recent" ? undefined : sort })}>
        Todas
      </Link>
      {GENRES.map((g) => (
        <Link
          key={g.slug}
          className={genre === g.slug ? "active" : ""}
          href={gridHref(base, { q, genero: g.slug, sort: sort === "recent" ? undefined : sort })}
        >
          {g.name}
        </Link>
      ))}
    </div>
  );
}

export function SeriesGrid({
  series,
  base = "/",
  q,
  genre,
  sort = "recent",
  showGenreBar = true,
}: {
  series: SeriesWithStats[];
  base?: string;
  q?: string;
  genre?: string;
  sort?: SeriesSort;
  showGenreBar?: boolean;
}) {
  const empty =
    series.length === 0 ? (
      <div className="empty-state">
        <div className="empty-title">{q || genre ? "Nada por aqui..." : "O estúdio está em silêncio..."}</div>
        <p>
          {q || genre
            ? "Nenhuma obra bate com o filtro. Tente outra busca ou outro gênero."
            : "O primeiro volume ainda está sendo desenhado. Volte em breve!"}
        </p>
      </div>
    ) : null;

  return (
    <>
      <div className="catalog-toolbar">
        {showGenreBar && <GenreBar base={base} q={q} genre={genre} sort={sort} />}
        <SortTabs base={base} q={q} genre={genre} sort={sort} />
      </div>
      {empty ?? (
        <div className="cover-grid">
          {series.map((s) => (
            <article key={s.id} className="series-card">
              <Link href={`/obra/${s.slug}`} className="cover" aria-label={`Abrir ${s.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover || "/samples/cover-farol.svg"} alt="" />
              </Link>
              <Link href={`/obra/${s.slug}`} className="card-title">
                {s.title}
              </Link>
              <div className="card-meta">
                <StatusBadge status={s.status} />
                <span>
                  {s.chapterCount} {s.chapterCount === 1 ? "cap." : "caps."} · {formatNumber(s.views)} leituras
                </span>
              </div>
              {s.rating != null && s.rating > 0 && (
                <div className="card-rating" aria-label={`Avaliação ${s.rating.toFixed(1)} de 5`}>
                  <IconStar size={11} /> {s.rating.toFixed(1)}
                </div>
              )}
              {genreSlugsIn(normalizeTags(s.tags)).length > 0 && (
                <div className="card-tags">
                  {genreSlugsIn(normalizeTags(s.tags))
                    .slice(0, 3)
                    .map((slug) => {
                      const g = genreBySlug(slug);
                      return g ? (
                        <Link key={g.slug} href={`/?genero=${g.slug}`} className="tag">
                          {g.name}
                        </Link>
                      ) : null;
                    })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
