import { notFound } from "next/navigation";
import { SeriesForm } from "@/components/admin/forms";
import { requireAdmin } from "@/features/auth/session";
import { getSeriesById } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const series = await getSeriesById(Number(id));
  if (!series) notFound();

  return (
    <section className="section" aria-label="Editar obra">
      <h2>Identidade da obra</h2>
      <p className="muted">Revise como esta história aparece no catálogo e nas buscas.</p>
      <div className="manga-panel form-panel">
        <SeriesForm
          seriesId={series.id}
          initial={{
            title: series.title,
            slug: series.slug,
            synopsis: series.synopsis,
            cover: series.cover,
            status: series.status,
            tags: series.tags,
          }}
        />
      </div>
    </section>
  );
}
