import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm, ResumeNote } from "@/components/reader/reader";
import { DeleteComment } from "@/components/reader/comment-actions";
import { AuthorName } from "@/components/reader/comment-head";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RatingStars } from "@/components/ratings/rating-stars";
import { GenreChips } from "@/components/catalog/genre-chips";
import { StatusBadge } from "@/components/ui/bits";
import { IconArrowLeft, IconArrowRight, IconChat } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getChaptersBySeries, getPagesByChapter, getProgressForSeries, getRelatedSeries, getSeriesBySlug, getSeriesRating } from "@/features/catalog/queries";
import { getCommentsBySeries } from "@/features/comments/queries";
import { genresIn } from "@/lib/genres";
import { absoluteUrl } from "@/lib/site";
import { chapterLabel, formatDate, formatNumber, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return { title: "Obra não encontrada" };
  const description = (series.synopsis || "Uma obra publicada no estúdio, capítulo por capítulo.").slice(0, 160);
  const image = series.cover ? absoluteUrl(series.cover) : undefined;
  return {
    title: series.title,
    description,
    openGraph: {
      title: series.title,
      description,
      type: "book",
      url: `/obra/${slug}`,
      images: image ? [{ url: image, alt: `Capa de ${series.title}` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ObraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const series = await getSeriesBySlug(slug, user?.id);
  if (!series) notFound();

  const [chapters, seriesComments, rating, related] = await Promise.all([
    getChaptersBySeries(series.id, true),
    getCommentsBySeries(series.id),
    getSeriesRating(series.id, user?.id),
    getRelatedSeries(series.id, series.tags),
  ]);
  const firstChapter = chapters[0];
  const serverProgress = user ? await getProgressForSeries(user.id, series.id) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    name: series.title,
    description: series.synopsis,
    ...(series.cover ? { image: absoluteUrl(series.cover) } : {}),
    genre: genresIn(series.tags),
    numberOfEpisodes: series.chapterCount,
    inLanguage: "pt-BR",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mt-2">
        <Link href="/" className="btn ghost small">
          <IconArrowLeft size={14} /> Voltar às obras
        </Link>
      </div>

      <section className="obra-layout" aria-label={series.title}>
        <div className="obra-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.cover || "/samples/cover-farol.svg"} alt={`Capa de ${series.title}`} />
        </div>
        <div>
          <h1>{series.title}</h1>
          <div className="obra-meta">
            <StatusBadge status={series.status} />
            <span>
              {series.chapterCount} {series.chapterCount === 1 ? "capítulo" : "capítulos"}
            </span>
            <span>·</span>
            <span>{formatNumber(series.views)} leituras</span>
          </div>
          <p className="obra-desc">{series.synopsis}</p>
          <GenreChips tags={series.tags} />
          <div className="obra-actions mt-2">
            {firstChapter ? (
              <Link className="btn" href={`/ler/${firstChapter.id}`}>
                Ler do início <IconArrowRight size={16} />
              </Link>
            ) : (
              <span className="muted">Ainda sem capítulos publicados.</span>
            )}
            <FavoriteButton seriesId={series.id} title={series.title} initial={series.favorite} />
          </div>
          <RatingStars seriesId={series.id} avg={rating.avg} count={rating.count} mine={rating.mine} />
        </div>
      </section>

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Capítulos">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              01
            </span>
            <h2>Capítulos</h2>
          </div>
          <span className="section-sub">{series.chapterCount} {series.chapterCount === 1 ? "capítulo" : "capítulos"} · leituras por capítulo</span>
        </div>

        <ResumeNote
          seriesId={series.id}
          chapters={chapters.map((c) => ({ id: c.id, number: c.number, title: c.title }))}
          serverProgress={serverProgress ? { chapterId: serverProgress.chapterId, page: serverProgress.page } : null}
        />

        {chapters.length === 0 ? (
          <div className="manga-panel empty-state">
            <div className="empty-title">Em breve...</div>
            <p>O primeiro capítulo ainda está sendo desenhado. Volte em breve!</p>
          </div>
        ) : (
          <div className="manga-panel chapter-list">
            {chapters.map((c) => {
              return (
                <div key={c.id} className="chapter-row">
                  <Link href={`/capitulo/${c.id}`} className="ch-main" aria-label={`${chapterLabel(c.number)} — ${c.title || "Sem título"}`}>
                    {c.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="ch-cover" src={c.cover} alt="" loading="lazy" />
                    )}
                    <span className="ch-num">{chapterLabel(c.number)}</span>
                    <span className="ch-title">{c.title || "Sem título"}</span>
                    <span className="ch-meta">
                      {formatNumber(c.views)} leituras
                      {Number(c.commentCount) > 0 ? ` · ${formatNumber(Number(c.commentCount))} ${Number(c.commentCount) === 1 ? "comentário" : "comentários"}` : ""}
                      {c.publishedAt ? ` · ${formatDate(c.publishedAt)}` : ""}
                    </span>
                  </Link>
                  <Link className="ch-read" href={`/ler/${c.id}`}>
                    Ler <IconArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <>
          <div className="hairline" aria-hidden="true" />
          <section className="section" aria-label="Obras relacionadas">
            <div className="section-head">
              <div className="section-head-title">
                <span className="section-idx mono-num" aria-hidden="true">
                  03
                </span>
                <h2>Se você gostou desta, veja também</h2>
              </div>
            </div>
            <div className="cover-grid">
              {related.map((s) => (
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
                    <span>{s.chapterCount} caps.</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Comentários da obra">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              02
            </span>
            <h2>
              <IconChat size={18} /> Comentários da obra
            </h2>
          </div>
          <span className="section-sub">
            {seriesComments.length} {seriesComments.length === 1 ? "comentário" : "comentários"} no total
          </span>
        </div>

        {seriesComments.length === 0 ? (
          <p className="cm-login-hint">Nenhum comentário sobre a obra ainda. Seja a primeira pessoa a comentar!</p>
        ) : (
          <div className="stack">
            {seriesComments.map((c) => {
              const mine = user ? c.userId === user.id || user.role === "admin" : false;
              return (
                <div key={c.id} className="manga-panel cm-entry">
                  <div className="cm-head">
                    <span className="cm-avatar">{initials(c.authorName)}</span>
                    <AuthorName authorId={c.authorId} name={c.authorName} role={c.authorRole} />
                    <span className="cm-date">{formatDate(c.createdAt)}</span>
                    {mine && <DeleteComment commentId={c.id} />}
                  </div>
                  <p className="cm-text">{c.content}</p>
                </div>
              );
            })}
          </div>
        )}

        <CommentForm seriesId={series.id} />
      </section>
    </>
  );
}
