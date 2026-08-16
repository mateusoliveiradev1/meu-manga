import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/admin/forms";
import { requireAdmin } from "@/features/auth/session";
import { getSeriesById } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({ searchParams }: { searchParams: Promise<{ obra?: string }> }) {
  await requireAdmin();
  const { obra } = await searchParams;
  const seriesId = Number(obra);
  const series = Number.isFinite(seriesId) && seriesId > 0 ? await getSeriesById(seriesId) : undefined;
  if (!series) notFound();

  return (
    <section className="section" aria-label="Novo capítulo">
      <h2>
        Novo capítulo de <span className="accent">{series.title}</span>
      </h2>
      <p className="muted">Depois de criar, você adiciona as páginas (arquivos ou URLs).</p>
      <div className="manga-panel form-panel">
        <ChapterForm seriesId={series.id} />
      </div>
      <Link href={`/admin/obras/${series.id}/capitulos`} className="btn ghost small">
        ← Voltar aos capítulos
      </Link>
    </section>
  );
}
