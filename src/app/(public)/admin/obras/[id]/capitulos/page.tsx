import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/forms";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";
import { requireAdmin } from "@/features/auth/session";
import { getChaptersBySeries, getSeriesById } from "@/features/catalog/queries";
import { chapterLabel, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SeriesChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const series = await getSeriesById(Number(id));
  if (!series) notFound();

  const chapters = await getChaptersBySeries(series.id, false);

  return (
    <section className="section" aria-label={`Capítulos de ${series.title}`}>
      <div className="section-head">
        <h2>
          Capítulos de <span className="accent">{series.title}</span>
        </h2>
        <Link href={`/admin/capitulos/novo?obra=${series.id}`} className="btn small">
          <IconPlus size={14} /> Novo capítulo
        </Link>
      </div>

      {chapters.length === 0 ? (
        <div className="manga-panel empty-state">
          <div className="empty-title">Sem capítulos ainda</div>
          <p>Crie o primeiro capítulo e comece a publicar.</p>
          <Link href={`/admin/capitulos/novo?obra=${series.id}`} className="btn">
            Criar primeiro capítulo
          </Link>
        </div>
      ) : (
        <div className="manga-panel" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Capítulo</th>
                <th>Status</th>
                <th>Publicado em</th>
                <th>Páginas</th>
                <th>Leituras</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c.id}>
                  <td className="cell-title">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
                      {c.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.cover} alt="" style={{ width: "1.9rem", height: "2.6rem", objectFit: "cover", borderRadius: 4, border: "1px solid var(--line)", flex: "0 0 auto" }} />
                      )}
                      <span>
                        {chapterLabel(c.number)}
                        {c.title ? ` — ${c.title}` : ""}
                      </span>
                    </span>
                  </td>
                  <td>
                    {c.published ? <span className="ok">publicado</span> : <span className="muted">rascunho</span>}
                  </td>
                  <td className="muted">{formatDate(c.publishedAt)}</td>
                  <td className="mono-num">—</td>
                  <td>{formatNumber(c.views)}</td>
                  <td>
                    <div className="cell-actions">
                      <Link href={`/admin/capitulos/${c.id}/editar`} className="btn small ghost">
                        Editar <IconArrowRight size={12} />
                      </Link>
                      <DeleteButton kind="chapter" id={c.id} label={`o capítulo ${chapterLabel(c.number)}`} redirect={`/admin/obras/${series.id}/capitulos`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
