import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterWithSeriesAndPages } from "@/features/catalog/queries";
import { getCommentsByChapter } from "@/features/comments/queries";
import { CommentForm, ResumeNote } from "@/components/reader/reader";
import { CommentThread } from "@/components/community/comment-thread";
import { ShareButton } from "@/components/community/share-button";
import { getCurrentUser } from "@/features/auth/session";
import { absoluteUrl } from "@/lib/site";
import { chapterLabel, formatDate, formatNumber } from "@/lib/utils";
import { IconArrowLeft, IconArrowRight, IconBook } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chapterId = Number(id);
  if (!Number.isInteger(chapterId) || chapterId <= 0) return { title: "Capítulo não encontrado" };
  const row = await getChapterWithSeriesAndPages(chapterId);
  if (!row) return {};
  const title = `${row.series_title} — ${chapterLabel(row.number)}${row.title ? `: ${row.title}` : ""}`;
  const cover = row.series_cover || row.cover;
  return {
    title,
    description: `Leia o capítulo ${chapterLabel(row.number)} de ${row.series_title}${
      row.title ? ` — ${row.title}` : ""
    }.`,
    openGraph: {
      title,
      description: `Leia o capítulo ${chapterLabel(row.number)} de ${row.series_title}.`,
      images: cover ? [{ url: absoluteUrl(cover) }] : undefined,
    },
  };
}

export default async function CapituloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chapterId = Number(id);
  if (!Number.isInteger(chapterId) || chapterId <= 0) notFound();
  const row = await getChapterWithSeriesAndPages(chapterId);
  if (!row) notFound();
  const user = await getCurrentUser();
  const comments = await getCommentsByChapter(row.id, 100, user?.id);

  return (
    <>
      <section className="page-head" aria-label={`Capítulo ${chapterLabel(row.number)}`}>
        <p className="admin-crumb">
          <Link href={`/obra/${row.series_slug}`}>
            <IconArrowLeft size={13} /> {row.series_title}
          </Link>
        </p>
        <h1>
          {chapterLabel(row.number)}
          {row.title ? ` — ${row.title}` : ""}
        </h1>
        <p className="page-sub">
          {row.series_title} ·{" "}
          {row.publishedAt ? formatDate(row.publishedAt) : "rascunho"} · {formatNumber(row.views)} leituras ·{" "}
          {row.pages.length} {row.pages.length === 1 ? "página" : "páginas"}
        </p>
        <div className="chapter-cta">
          <Link className="btn" href={`/ler/${row.id}`}>
            <IconBook size={16} /> Começar este capítulo <IconArrowRight size={16} />
          </Link>
          <Link className="btn ghost" href={`/obra/${row.series_slug}`}>
            Voltar à história
          </Link>
          <ShareButton title={`${row.series_title} — ${chapterLabel(row.number)}`} text={row.title || undefined} />
        </div>
      </section>

      <ResumeNote seriesId={row.series_id} chapters={[{ id: row.id, number: row.number, title: row.title }]} serverProgress={null} />

      {row.pages.length > 0 && (
        <div className="chapter-strip">
          {row.pages.slice(0, 4).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.src} alt={`Página ${i + 1} de ${row.title || row.series_title}`} loading="lazy" />
          ))}
        </div>
      )}

      <div className="hairline" aria-hidden="true" />

      <section className="section" id="comentarios" aria-label="Comentários do capítulo">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              {comments.length}
            </span>
            <h2>Comentários</h2>
          </div>
          <span className="section-sub">neste capítulo</span>
        </div>

        <CommentForm chapterId={row.id} />

        {comments.length === 0 ? (
          <div className="manga-panel empty-state">
            <div className="empty-title">A conversa ainda não começou</div>
            <p>Depois da leitura, volte aqui para contar o que mais chamou sua atenção.</p>
          </div>
        ) : (
          <CommentThread comments={comments} viewer={user ? { id: user.id, role: user.role ?? "user" } : null} returnPath={`/capitulo/${row.id}`} />
        )}
      </section>
    </>
  );
}
