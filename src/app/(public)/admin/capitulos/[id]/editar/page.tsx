import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterForm, DeleteButton, PageManager } from "@/components/admin/forms";
import { ChapterPreviewSplit, ChapterQualityPanel } from "@/components/admin/editorial-tools";
import { requireAdmin } from "@/features/auth/session";
import { getChapterWithSeries, getPagesByChapter } from "@/features/catalog/queries";
import { chapterLabel, formatDateTimeLocal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const chapter = await getChapterWithSeries(Number(id));
  if (!chapter) notFound();

  const pages = await getPagesByChapter(chapter.id);

  return (
    <section className="section" aria-label="Editar capítulo">
      <div className="section-head">
        <h2>
          {chapterLabel(chapter.number)}
          {chapter.title ? ` — ${chapter.title}` : ""}
        </h2>
        <div className="cell-actions">
          <Link href={`/admin/obras/${chapter.series_id}/capitulos`} className="btn ghost small">
            ← Voltar
          </Link>
          {chapter.published && (
            <Link href={`/ler/${chapter.id}`} className="btn small">
              Ler como leitor →
            </Link>
          )}
          <Link href={`/ler/${chapter.id}?preview=1`} className="btn ghost small">
            Pré-visualizar
          </Link>
          <DeleteButton kind="chapter" id={chapter.id} label={`o capítulo ${chapterLabel(chapter.number)}`} redirect={`/admin/obras/${chapter.series_id}/capitulos`} />
        </div>
      </div>

      <div className="chapter-edit-grid">
        <div className="manga-panel form-panel">
          <ChapterForm
            seriesId={chapter.series_id}
            chapterId={chapter.id}
            initial={{
              number: chapter.number,
              title: chapter.title,
              cover: chapter.cover ?? "",
              published: chapter.published,
              publishAt: chapter.publishAt ? formatDateTimeLocal(chapter.publishAt) : "",
            }}
          />
        </div>
        <ChapterQualityPanel
          pages={pages.map((page) => ({ position: page.position, src: page.src }))}
          published={chapter.published}
          title={chapter.title}
        />
      </div>

      <h3 style={{ marginTop: "1.6rem" }}>Páginas do capítulo</h3>
      <PageManager chapterId={chapter.id} initialPages={pages.map((p) => ({ id: p.id, src: p.src }))} />
      <ChapterPreviewSplit chapterId={chapter.id} />
    </section>
  );
}
