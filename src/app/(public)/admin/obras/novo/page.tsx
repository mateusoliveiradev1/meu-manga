import { SeriesForm } from "@/components/admin/forms";
import { requireAdmin } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function NewSeriesPage() {
  await requireAdmin();
  return (
    <section className="section" aria-label="Começar nova obra">
      <h2>Começar uma nova obra</h2>
      <p className="muted">Defina a identidade da história. Depois você monta e publica os capítulos.</p>
      <div className="manga-panel form-panel">
        <SeriesForm />
      </div>
    </section>
  );
}
