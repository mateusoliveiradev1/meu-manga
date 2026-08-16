import Link from "next/link";
import { IconStar } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/bits";
import type { SeriesWithStats } from "@/features/catalog/queries";
import { GENRES, genreBySlug, genreSlugsIn, normalizeTags } from "@/lib/genres";
import { formatNumber } from "@/lib/utils";
import { ResponsiveImage } from "@/components/ui/responsive-image";

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

function genreHref(slug: string, q?: string, sort: SeriesSort = "recent"): string {
  return gridHref(`/genero/${slug}`, { q, sort: sort === "recent" ? undefined : sort });
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
  const selected = genre ? GENRES.find((item) => item.slug === genre) : undefined;
  const primary = GENRES.slice(0, 4);
  if (selected && !primary.some((item) => item.slug === selected.slug)) primary.push(selected);
  const more = GENRES.filter((item) => !primary.some((visible) => visible.slug === item.slug));

  return (
    <div className="genre-bar" role="group" aria-label="Filtrar por gênero">
      <div className="genre-primary">
        <Link className={!genre ? "active" : ""} href={gridHref("/obras", { q, sort: sort === "recent" ? undefined : sort })}>
          Todas
        </Link>
        {primary.map((g) => (
          <Link
            key={g.slug}
            className={genre === g.slug ? "active" : ""}
            href={genreHref(g.slug, q, sort)}
          >
            {g.name}
          </Link>
        ))}
      </div>
      {more.length > 0 && (
        <details className="genre-more">
          <summary>Mais gêneros</summary>
          <div className="genre-more-panel">
            {more.map((g) => (
              <Link
                key={g.slug}
                href={genreHref(g.slug, q, sort)}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Pagination({
  base,
  q,
  genre,
  sort,
  page,
  totalPages,
}: {
  base: string;
  q?: string;
  genre?: string;
  sort: SeriesSort;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (target: number) => gridHref(base, {
    q,
    genero: genre,
    sort: sort === "recent" ? undefined : sort,
    pagina: target > 1 ? String(target) : undefined,
  });
  const visible = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1
  );

  return (
    <nav className="catalog-pagination" aria-label="Paginação das obras">
      <Link href={href(Math.max(1, page - 1))} aria-disabled={page === 1} tabIndex={page === 1 ? -1 : undefined}>Anterior</Link>
      {visible.map((number, index) => (
        <span key={number} className="pagination-slot">
          {index > 0 && number - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <Link href={href(number)} className={number === page ? "active" : ""} aria-current={number === page ? "page" : undefined}>
            {number}
          </Link>
        </span>
      ))}
      <Link href={href(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} tabIndex={page === totalPages ? -1 : undefined}>Próxima</Link>
    </nav>
  );
}

export function SeriesGrid({
  series,
  base = "/",
  q,
  genre,
  sort = "recent",
  showGenreBar = true,
  showToolbar = true,
  page = 1,
}: {
  series: SeriesWithStats[];
  base?: string;
  q?: string;
  genre?: string;
  sort?: SeriesSort;
  showGenreBar?: boolean;
  showToolbar?: boolean;
  page?: number;
}) {
  const perPage = 18;
  const totalPages = Math.max(1, Math.ceil(series.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const visibleSeries = series.slice((currentPage - 1) * perPage, currentPage * perPage);
  const selectedGenre = genre ? genreBySlug(genre) : undefined;
  const selectedSort = SORT_TABS.find((item) => item.key === sort)?.label ?? "Mais recentes";
  const empty =
    series.length === 0 ? (
      <div className="empty-state">
        <div className="empty-title">{q || genre ? "Nenhuma história encontrada" : "A estante ainda está vazia"}</div>
        <p>
          {q || genre
            ? "Tente remover um filtro ou buscar por outro título."
            : "A primeira história está sendo preparada. Volte em breve para começar a leitura."}
        </p>
        {(q || genre) && <Link className="btn ghost small mt-1" href="/obras">Limpar busca e filtros</Link>}
      </div>
    ) : null;

  return (
    <>
      {showToolbar && (
        <details className="catalog-controls">
          <summary>
            <span><b>{selectedGenre?.name ?? "Todos os gêneros"}</b><small>Ordenado por {selectedSort.toLowerCase()}</small></span>
            <span className="catalog-controls-action">Alterar filtros</span>
          </summary>
          <div className="catalog-toolbar">
            {showGenreBar && <GenreBar base={base} q={q} genre={genre} sort={sort} />}
            <SortTabs base={base} q={q} genre={genre} sort={sort} />
            {(q || genre || sort !== "recent") && <Link className="catalog-clear" href="/obras">Limpar filtros</Link>}
          </div>
        </details>
      )}
      {empty ?? (
        <div className="cover-grid">
          {visibleSeries.map((s) => (
            <article key={s.id} className="series-card">
              <Link href={`/obra/${s.slug}`} className="cover" aria-label={`Abrir ${s.title}`}>
                <ResponsiveImage src={s.cover} alt={`Capa de ${s.title}`} />
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
                        <Link key={g.slug} href={`/genero/${g.slug}`} className="tag">
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
      {!empty && <Pagination base={base} q={q} genre={genre} sort={sort} page={currentPage} totalPages={totalPages} />}
    </>
  );
}
