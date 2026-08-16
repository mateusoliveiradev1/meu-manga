import Link from "next/link";
import { IconArrowRight, IconBook, IconStar } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/bits";
import { GenreChips } from "@/components/catalog/genre-chips";
import { SeriesGrid } from "@/components/catalog/series-grid";
import type { SeriesSort } from "@/components/catalog/series-grid";
import { getCurrentUser } from "@/features/auth/session";
import {
  getChaptersBySeries,
  getFavoritedSeriesIds,
  getLatestChapters,
  getLatestPublishedAt,
  getSeriesByIds,
  getSeriesList,
  getUserProgress,
} from "@/features/catalog/queries";
import { LatestStrip } from "@/components/catalog/latest-strip";
import { genreBySlug } from "@/lib/genres";
import { chapterLabel, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genero?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const genero = sp.genero ?? "";
  const sort: SeriesSort = sp.sort === "reads" || sp.sort === "rated" ? sp.sort : "recent";
  const genre = genreBySlug(genero);
  const [user, series, lastPublished, latestChapters] = await Promise.all([
    getCurrentUser(),
    getSeriesList(undefined, { q: q.trim(), genreName: genre?.name, sort }),
    getLatestPublishedAt(),
    getLatestChapters(8),
  ]);

  const featured = series[0];
  const featuredChapters = featured ? await getChaptersBySeries(featured.id, true) : [];

  const [favIds, progress] = user
    ? await Promise.all([getFavoritedSeriesIds(user.id), getUserProgress(user.id, 4)])
    : [null, []];
  const favSeries = favIds && favIds.length > 0 ? await getSeriesByIds(favIds) : [];
  const inProgress = progress.filter((p) => p.totalPages > 0 && p.page < p.totalPages - 1).length;

  return (
    <>
      {featured ? (
        <section className="featured" aria-label="Obra em destaque">
          <Link href={`/obra/${featured.slug}`} className="featured-cover" aria-label={`Abrir ${featured.title}`}>
            <span className="featured-obi mono-num" aria-hidden="true">
              em destaque
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.cover || "/samples/cover-farol.svg"} alt="" />
          </Link>
          <div className="featured-body">
            <h1>{featured.title}</h1>
            <p className="featured-synopsis">{featured.synopsis}</p>
            <div className="featured-meta">
              <StatusBadge status={featured.status} />
              <span>
                {featured.chapterCount} {featured.chapterCount === 1 ? "capítulo" : "capítulos"}
              </span>
              <span>·</span>
              <span>{formatNumber(featured.views)} leituras</span>
              {featured.rating != null && featured.rating > 0 && (
                <>
                  <span>·</span>
                  <span className="featured-rating">
                    <IconStar size={13} /> {featured.rating.toFixed(1)}
                  </span>
                </>
              )}
              {featured.lastUpdate && (
                <>
                  <span>·</span>
                  <span>atualizado em {formatDate(featured.lastUpdate)}</span>
                </>
              )}
            </div>
            <GenreChips tags={featured.tags} />
            {featuredChapters.length > 1 && (
              <Link className="featured-new" href={`/ler/${featuredChapters[featuredChapters.length - 1].id}`}>
                <IconStar size={12} /> Capítulo {chapterLabel(featuredChapters[featuredChapters.length - 1].number)} novo
              </Link>
            )}
            <div className="featured-actions">
              {featuredChapters.length > 0 ? (
                <Link className="btn" href={`/ler/${featuredChapters[0].id}`}>
                  Ler do início <IconArrowRight size={16} />
                </Link>
              ) : (
                <span className="muted">O primeiro capítulo está a caminho</span>
              )}
              <Link className="btn ghost" href={`/obra/${featured.slug}`}>
                Ver obra
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero" aria-label="Boas-vindas">
          <h1>
            {SITE_NAME.split(" ")[0]} <span className="hero-accent">{SITE_NAME.split(" ").slice(1).join(" ") || "MANGÁ"}</span>
          </h1>
          <p>
            Capítulos novos direto do estúdio, página por página. Navegue pela estante e boa leitura —
            {lastPublished ? ` o mais recente saiu em ${formatDate(lastPublished)}` : " o primeiro capítulo está a caminho"}.
          </p>
        </section>
      )}

      {user && progress.length > 0 && !q.trim() && !genre && (
        <section className="section" aria-label="Continuar lendo">
          <div className="section-head">
            <div className="section-head-title">
              <span className="section-idx mono-num" aria-hidden="true">
                01
              </span>
              <h2>
                <IconBook size={18} /> Continuar lendo
              </h2>
            </div>
            <span className="section-sub">
              {inProgress > 0 ? `${inProgress} ${inProgress === 1 ? "obra no meio" : "obras no meio"}` : "sua estante de leituras"}
            </span>
          </div>
          <div className="home-progress">
            {progress.map((p) => {
              const frac = p.totalPages > 0 ? Math.min(1, Math.max(0, p.page / Math.max(1, p.totalPages - 1))) : 0;
              const done = frac >= 0.99;
              return (
                <Link key={p.chapterId} href={`/ler/${p.chapterId}`} className="home-progress-card">
                  {p.seriesCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.seriesCover} alt="" loading="lazy" />
                  ) : (
                    <span className="placeholder" aria-hidden="true" />
                  )}
                  <span className="hp-title">{p.seriesTitle}</span>
                  <span className="hp-ch">
                    {chapterLabel(p.chapterNumber)}
                    {p.chapterTitle ? ` — ${p.chapterTitle}` : ""}
                  </span>
                  <span className="hp-track" aria-hidden="true">
                    <span style={{ width: `${Math.round(frac * 100)}%` }} />
                  </span>
                  <span className="hp-foot">
                    <span className="muted">
                      {done ? "concluído" : p.totalPages > 0 ? `pág. ${p.page + 1}/${p.totalPages}` : `pág. ${p.page + 1}`}
                    </span>
                    <span className="hp-go">
                      {done ? "Reler" : "Continuar"} <IconArrowRight size={12} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!q.trim() && !genre && latestChapters.length > 0 && (
        <section className="section" aria-label="Últimos capítulos">
          <div className="section-head">
            <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              {user && progress.length > 0 ? "02" : "01"}
            </span>
            <h2>Últimos capítulos</h2>
            </div>
            <span className="section-sub">
              <Link href="/capitulos" className="section-link">
                ver todos <IconArrowRight size={12} />
              </Link>
            </span>
          </div>
          <LatestStrip rows={latestChapters} />
        </section>
      )}

      {favSeries.length > 0 && (
        <section className="section" aria-label="Suas favoritas">
          <div className="section-head">
            <div className="section-head-title">
              <span className="section-idx mono-num" aria-hidden="true">
                ★
              </span>
              <h2>Suas favoritas</h2>
            </div>
            <span className="section-sub">{user?.name}</span>
          </div>
          <div className="row" style={{ gap: "0.9rem", flexWrap: "wrap" }}>
            {favSeries.map((s) => (
              <Link key={s.id} href={`/obra/${s.slug}`} className="profile-fav">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover || "/samples/cover-farol.svg"} alt="" />
                <span>{s.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-label="Obras">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              {q.trim() || genre ? "01" : user && progress.length > 0 ? "03" : "02"}
            </span>
            <h2>
              {genre ? `Gênero: ${genre.name}` : q.trim() ? `Busca: “${q.trim()}”` : "As obras"}
            </h2>
          </div>
          <span className="section-sub">
            {series.length === 0
              ? "nada encontrado por aqui"
              : `${series.length} ${series.length === 1 ? "volume" : "volumes"} em exibição`}
          </span>
        </div>

        <SeriesGrid series={series} q={q.trim() || undefined} genre={genre?.slug} sort={sort} />
      </section>

    </>
  );
}
