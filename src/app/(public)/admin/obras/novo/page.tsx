import { SeriesForm } from "@/components/admin/forms";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function NewSeriesPage() {
  await requireAdmin();
  return (
    <section className="section" aria-label="Nova obra">
      <h2>Nova obra</h2>
      <p className="muted">Título, sinopse e capa — depois você adiciona os capítulos.</p>
      <div className="manga-panel form-panel">
        <SeriesForm />
      </div>
    </section>
  );
}
