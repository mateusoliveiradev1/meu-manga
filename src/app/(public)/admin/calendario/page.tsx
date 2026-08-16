import Link from "next/link";
import { BulkPublishPanel } from "@/components/admin/editorial-tools";
import { IconCalendar } from "@/components/ui/icons";
import { requireAdmin } from "@/features/auth/session";
import { getEditorialCalendar } from "@/features/editorial/queries";
import { chapterLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditorialCalendarPage() {
  await requireAdmin();
  const chapters = await getEditorialCalendar();
  const scheduled = chapters.filter((chapter) => !chapter.published && chapter.publishAt);
  const drafts = chapters.filter((chapter) => !chapter.published && !chapter.publishAt);
  const recent = chapters.filter((chapter) => chapter.published).sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)).slice(0, 8);
  const blocked = chapters.filter((chapter) => !chapter.published && chapter.blockers.length);

  return (
    <section className="section editorial-page" aria-labelledby="editorial-title">
      <header className="admin-feature-head">
        <div>
          <span className="eyebrow"><IconCalendar size={14} /> Fluxo editorial</span>
          <h2 id="editorial-title">O que entra no ar — e o que ainda precisa de cuidado</h2>
          <p>Agenda, qualidade das páginas e publicação em lote no mesmo lugar.</p>
        </div>
        <div className="admin-feature-stats">
          <span><strong>{scheduled.length}</strong> agendados</span>
          <span><strong>{drafts.length}</strong> rascunhos</span>
          <span><strong>{blocked.length}</strong> com bloqueio</span>
        </div>
      </header>

      <div className="editorial-grid">
        <section className="editorial-timeline" aria-labelledby="agenda-title">
          <div className="section-head compact"><h2 id="agenda-title">Próximas publicações</h2></div>
          {scheduled.length ? scheduled.map((chapter) => (
            <article key={chapter.id} className="timeline-row">
              <time dateTime={chapter.publishAt?.toISOString()}>{formatDate(chapter.publishAt)}</time>
              <span><strong>{chapter.seriesTitle}</strong><small>{chapterLabel(chapter.number)}{chapter.title ? ` — ${chapter.title}` : ""}</small></span>
              <Link href={`/admin/capitulos/${chapter.id}/editar`} className="text-link">Revisar →</Link>
            </article>
          )) : <p className="muted editorial-empty">Nenhum capítulo agendado. Você pode definir uma data ao editar um capítulo.</p>}
        </section>

        <aside className="editorial-recent">
          <h2>Últimas entregas</h2>
          {recent.length ? recent.map((chapter) => (
            <div key={chapter.id} className="recent-release">
              <span>{formatDate(chapter.publishedAt)}</span>
              <p><strong>{chapter.seriesTitle}</strong><small>{chapterLabel(chapter.number)}</small></p>
            </div>
          )) : <p className="muted">As publicações aparecerão aqui.</p>}
        </aside>
      </div>

      <section className="admin-workbench" aria-labelledby="bulk-title">
        <div className="section-head compact">
          <div><span className="eyebrow">Ação em lote</span><h2 id="bulk-title">Rascunhos prontos para sair</h2></div>
        </div>
        <BulkPublishPanel chapters={drafts.map(({ id, seriesTitle, number, title, pageCount, blockers }) => ({ id, seriesTitle, number, title, pageCount, blockers }))} />
      </section>

      {blocked.length > 0 && (
        <section className="qa-overview" aria-labelledby="qa-title">
          <div><span className="eyebrow">Controle de qualidade</span><h2 id="qa-title">Pendências antes da publicação</h2></div>
          <div className="qa-overview-list">
            {blocked.map((chapter) => (
              <Link href={`/admin/capitulos/${chapter.id}/editar`} key={chapter.id}>
                <span><strong>{chapter.seriesTitle}</strong><small>{chapterLabel(chapter.number)}</small></span>
                <span className="qa-blocker">{chapter.blockers.join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
