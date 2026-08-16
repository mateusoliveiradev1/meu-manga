import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm, Reader } from "@/components/reader/reader";
import { CommentThread } from "@/components/community/comment-thread";
import { IconChat } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getChapterProgress, getChapterWithSeries, getPagesByChapter, getPrevNextChapter } from "@/features/catalog/queries";
import { getCommentsByChapter } from "@/features/comments/queries";
import { absoluteUrl } from "@/lib/site";
import { chapterLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ chapterId: string }> }): Promise<Metadata> {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (!Number.isInteger(id) || id <= 0) return { title: "Capítulo não encontrado" };
  const chapter = await getChapterWithSeries(id);
  if (!chapter || !chapter.published) return { title: "Capítulo não encontrado" };
  const title = `${chapter.series_title} — ${chapterLabel(chapter.number)}${chapter.title ? ` · ${chapter.title}` : ""}`;
  const image = chapter.cover || chapter.series_cover;
  const abs = image ? absoluteUrl(image) : undefined;
  return {
    title,
    openGraph: {
      title,
      type: "book",
      url: `/ler/${chapter.id}`,
      images: abs ? [{ url: abs, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: abs ? [abs] : undefined,
    },
  };
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const chapter = await getChapterWithSeries(id);
  const isPreview = sp.preview === "1" && user?.role === "admin";
  if (!chapter || (!chapter.published && !isPreview)) notFound();

  const [pages, comments, { prev, next }] = await Promise.all([
    getPagesByChapter(chapter.id),
    getCommentsByChapter(chapter.id, 100, user?.id),
    getPrevNextChapter(chapter.series_id, chapter.number),
  ]);
  const progress = user ? await getChapterProgress(chapter.id, user.id) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicIssue",
    name: chapter.title || `Capítulo ${chapter.number}`,
    position: chapter.number,
    isPartOf: {
      "@type": "ComicSeries",
      name: chapter.series_title,
      url: absoluteUrl(`/obra/${chapter.series_slug}`),
    },
    inLanguage: "pt-BR",
  };

  if (pages.length === 0) {
    return (
      <div className="reader-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="manga-panel" style={{ padding: "2rem", maxWidth: "30rem", textAlign: "center" }}>
          <h2>Este capítulo ainda não tem páginas</h2>
          <p className="muted">As páginas deste capítulo ainda estão sendo preparadas pelo estúdio.</p>
          <Link className="btn ghost mt-2" href={`/obra/${chapter.series_slug}`}>
            Voltar à obra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-shell">
      {isPreview && (
        <div className="preview-banner">
          <strong>Prévia do autor</strong> — este capítulo ainda não está publicado; os leitores não veem esta página.
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reader
        pages={pages.map((p) => ({ id: p.id, src: p.src }))}
        chapterId={chapter.id}
        seriesId={chapter.series_id}
        seriesTitle={chapter.series_title}
        chapterTitle={chapter.title || `Capítulo ${chapter.number}`}
        chapterNumber={chapter.number}
        prevHref={prev ? `/ler/${prev.id}` : null}
        nextHref={next ? `/ler/${next.id}` : null}
        backHref={`/obra/${chapter.series_slug}`}
        initialPage={progress?.page ?? null}
        authenticated={Boolean(user)}
      />

      <div className="comments" id="comentarios">
        <div className="speed-divider" aria-hidden="true" />
        <div className="section-head">
          <h2>Comentários deste capítulo</h2>
        </div>
        <p className="cm-sub">
          <IconChat size={14} /> {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
          {chapter.publishedAt ? ` desde ${formatDate(chapter.publishedAt)}` : ""}
        </p>

        {comments.length === 0 ? (
          <p className="cm-login-hint">Nenhum comentário ainda. Seja a primeira pessoa a comentar!</p>
        ) : (
          <CommentThread comments={comments} viewer={user ? { id: user.id, role: user.role ?? "user" } : null} returnPath={`/ler/${chapter.id}`} />
        )}

        <CommentForm chapterId={chapter.id} />
      </div>
    </div>
  );
}
