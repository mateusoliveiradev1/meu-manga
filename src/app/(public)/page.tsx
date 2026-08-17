import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconBook, IconChat, IconCompass, IconHeart, IconStar } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/bits";
import { GenreChips } from "@/components/catalog/genre-chips";
import { SeriesGrid } from "@/components/catalog/series-grid";
import { LatestStrip } from "@/components/catalog/latest-strip";
import { ScheduledRelease } from "@/components/catalog/scheduled-release";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { getCurrentUser } from "@/features/auth/session";
import { getLatestComments } from "@/features/comments/queries";
import { getChaptersBySeries, getFavoritedSeriesIds, getLatestChapters, getScheduledChapters, getSeriesByIds, getSeriesList, getUserProgress } from "@/features/catalog/queries";
import { chapterLabel, formatDate, formatNumber, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PUSH_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function ContinueReading({ progress, inProgress }: { progress: Awaited<ReturnType<typeof getUserProgress>>; inProgress: number }) {
  return (
    <section className="section returning-reader" aria-label="Continuar lendo">
      <div className="section-head">
        <div className="section-head-title"><h2><IconBook size={18} /> De volta à sua estante</h2></div>
        <span className="section-sub">{inProgress} {inProgress === 1 ? "leitura em andamento" : "leituras em andamento"}</span>
      </div>
      <p className="returning-reader-intro">Sua próxima página está pronta. Continue sem procurar novamente o capítulo em que parou.</p>
      <div className="home-progress">
        {progress.map((item) => {
          const fraction = item.totalPages > 0 ? Math.min(1, Math.max(0, item.page / Math.max(1, item.totalPages - 1))) : 0;
          const done = fraction >= 0.99;
          return (
            <Link key={item.chapterId} href={`/ler/${item.chapterId}`} className="home-progress-card">
              <ResponsiveImage src={item.seriesCover} alt={`Capa de ${item.seriesTitle}`} sizes="4rem" />
              <span className="hp-title">{item.seriesTitle}</span>
              <span className="hp-ch">{chapterLabel(item.chapterNumber)}{item.chapterTitle ? ` — ${item.chapterTitle}` : ""}</span>
              <span className="hp-track" aria-hidden="true"><span style={{ width: `${Math.round(fraction * 100)}%` }} /></span>
              <span className="hp-foot"><span className="muted">{done ? "concluído" : `página ${item.page + 1} de ${item.totalPages}`}</span><span className="hp-go">{done ? "Reler" : "Continuar"} <IconArrowRight size={12} /></span></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (sp.q || sp.genero || sp.sort || sp.pagina) {
    const genre = first(sp.genero);
    if (genre) redirect(`/genero/${encodeURIComponent(genre)}`);
    const query = new URLSearchParams();
    for (const key of ["q", "sort", "pagina"]) {
      const value = first(sp[key]);
      if (value) query.set(key, value);
    }
    redirect(`/obras${query.size ? `?${query}` : ""}`);
  }

  const [user, works, latestChapters, scheduledChapters] = await Promise.all([getCurrentUser(), getSeriesList(), getLatestChapters(8), getScheduledChapters(8)]);
  const renderedAt = new Date().toISOString();
  const scheduledPremiere = scheduledChapters.find((chapter) => chapter.seriesStatus === "planned" && chapter.publishedChapterCount === 0);
  const mainSchedule = scheduledPremiere ?? scheduledChapters[0];
  const scheduleKind = (chapter: (typeof scheduledChapters)[number]) => chapter.seriesStatus === "planned" && chapter.publishedChapterCount === 0 ? "series-premiere" as const : "chapter-release" as const;
  const featured = works.find((work) => work.chapterCount > 0) ?? works[0];
  const featuredChapters = featured ? await getChaptersBySeries(featured.id, true) : [];
  const [favoriteIds, progress] = user
    ? await Promise.all([getFavoritedSeriesIds(user.id), getUserProgress(user.id, 4)])
    : [null, []];
  const favorites = favoriteIds?.length ? await getSeriesByIds(favoriteIds.slice(0, 5)) : [];
  const community = await getLatestComments(3, user?.id);
  const inProgress = progress.filter((item) => item.totalPages > 0 && item.page < item.totalPages - 1).length;

  return (
    <>
      {featured ? (
        <section className="featured" aria-label="História em destaque">
          <Link href={`/obra/${featured.slug}`} className="featured-cover" aria-label={`Conhecer ${featured.title}`}>
            <span className="featured-obi mono-num" aria-hidden="true">em destaque</span>
            <ResponsiveImage src={featured.cover} alt={`Capa de ${featured.title}`} sizes="(max-width: 720px) 11rem, 16rem" priority />
          </Link>
          <div className="featured-body">
            <h1>{featured.title}</h1>
            <p className="featured-synopsis">{featured.synopsis}</p>
            <div className="featured-meta">
              <StatusBadge status={featured.status} />
              <span>{featured.chapterCount} {featured.chapterCount === 1 ? "capítulo" : "capítulos"}</span>
              <span>·</span><span>{formatNumber(featured.views)} leituras</span>
              {featured.rating != null && featured.rating > 0 && <span className="featured-rating"><IconStar size={13} /> {featured.rating.toFixed(1)}</span>}
              {featured.lastUpdate && <span>atualizada em {formatDate(featured.lastUpdate)}</span>}
            </div>
            <GenreChips tags={featured.tags} />
            {featuredChapters.length > 1 && (
              <Link className="featured-new" href={`/ler/${featuredChapters.at(-1)!.id}`}><IconStar size={12} /> {chapterLabel(featuredChapters.at(-1)!.number)} disponível</Link>
            )}
            <div className="featured-actions">
              {featuredChapters.length > 0 ? <Link className="btn" href={`/ler/${featuredChapters[0].id}`}>Começar pelo capítulo 1 <IconArrowRight size={16} /></Link> : <span className="muted">O primeiro capítulo está em produção.</span>}
              <Link className="btn ghost" href={`/obra/${featured.slug}`}>Conhecer a história</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero editorial-empty" aria-label="Boas-vindas">
          <h1>Histórias que crescem <span className="hero-accent">capítulo a capítulo</span></h1>
          <p>A primeira obra está sendo preparada. Em breve, esta estante começa a ganhar vida.</p>
        </section>
      )}

      {mainSchedule?.publishAt && (
        <ScheduledRelease
          initialNow={renderedAt}
          signedIn={Boolean(user)}
          pushConfigured={PUSH_CONFIGURED}
          initialFollowing={Boolean(favoriteIds?.includes(mainSchedule.seriesId))}
          kind={scheduleKind(mainSchedule)}
          release={{
            id: mainSchedule.id,
            seriesId: mainSchedule.seriesId,
            number: mainSchedule.number,
            title: mainSchedule.title,
            publishAt: mainSchedule.publishAt.toISOString(),
            seriesSlug: mainSchedule.seriesSlug,
            seriesTitle: mainSchedule.seriesTitle,
            image: mainSchedule.chapterCover || mainSchedule.seriesCover,
          }}
          upcoming={scheduledChapters.filter((chapter) => chapter.id !== mainSchedule.id && chapter.publishAt).map((chapter) => ({
            id: chapter.id,
            seriesId: chapter.seriesId,
            number: chapter.number,
            title: chapter.title,
            publishAt: chapter.publishAt!.toISOString(),
            seriesSlug: chapter.seriesSlug,
            seriesTitle: chapter.seriesTitle,
            image: chapter.chapterCover || chapter.seriesCover,
            kind: scheduleKind(chapter),
          }))}
        />
      )}

      {progress.length > 0 && <ContinueReading progress={progress} inProgress={inProgress} />}

      {latestChapters.length > 0 && (
        <section className="section" aria-label="Capítulos recentes">
          <div className="section-head"><div className="section-head-title"><h2>Acabaram de chegar</h2></div><Link href="/capitulos" className="section-link">Ver todos <IconArrowRight size={12} /></Link></div>
          <LatestStrip rows={latestChapters} />
        </section>
      )}

      {favorites.length > 0 && (
        <section className="section" aria-label="Sua estante">
          <div className="section-head"><h2><IconStar size={18} /> Sua estante</h2><Link href="/perfil" className="section-link">Abrir perfil <IconArrowRight size={12} /></Link></div>
          <div className="favorite-shelf">{favorites.map((work) => <Link key={work.id} href={`/obra/${work.slug}`} className="profile-fav"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="6.5rem" /><span>{work.title}</span></Link>)}</div>
        </section>
      )}

      {community.length > 0 && (
        <section className="section home-community" aria-label="Conversas da comunidade">
          <div className="section-head"><div className="section-head-title"><h2><IconChat size={18} /> A conversa continua</h2></div><Link href="/comunidade" className="section-link">Abrir comunidade <IconArrowRight size={12} /></Link></div>
          <div className="home-community-grid">{community.map((comment) => { const href = comment.chapterId != null ? `/capitulo/${comment.chapterId}#comentario-${comment.id}` : `/obra/${comment.seriesSlug}#comentario-${comment.id}`; return <Link key={comment.id} href={href} className="manga-panel community-teaser"><span className="cm-avatar">{initials(comment.authorName)}</span><span className="community-teaser-copy"><strong>{comment.authorName}</strong><span>{comment.spoiler ? "Deixou uma impressão com spoiler protegido." : comment.content}</span><small>em {comment.seriesTitle}{comment.chapterNumber != null ? ` — ${chapterLabel(comment.chapterNumber)}` : ""}</small></span><span className="community-teaser-signal"><IconHeart size={12} /> {comment.likeCount}</span></Link>; })}</div>
        </section>
      )}

      {works.length > 0 && (
        <section className="section home-catalog-preview" aria-label="Descobrir obras">
          <div className="section-head"><div className="section-head-title"><h2><IconCompass size={18} /> Descubra outra história</h2></div><Link href="/obras" className="section-link">Explorar catálogo <IconArrowRight size={12} /></Link></div>
          <SeriesGrid series={works.slice(0, 6)} showToolbar={false} showGenreBar={false} />
        </section>
      )}
    </>
  );
}
