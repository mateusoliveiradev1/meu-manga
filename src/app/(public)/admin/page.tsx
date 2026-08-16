import Link from "next/link";
import { requireAdmin } from "@/features/auth/session";
import { getDailyViews, getSeriesList, getStats } from "@/features/catalog/queries";
import { formatDate, formatNumber } from "@/lib/utils";
import { IconArrowRight, IconBook, IconChat, IconEye, IconImage, IconPen } from "@/components/ui/icons";
import { DeleteButton } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, seriesList, daily] = await Promise.all([getStats(), getSeriesList(), getDailyViews(14)]);
  const maxViews = Math.max(1, ...daily.map((d) => d.views));

  const cards = [
    { icon: <IconBook size={18} />, num: stats.series, label: "obras" },
    { icon: <IconPen size={18} />, num: stats.chapters, label: "capítulos" },
    { icon: <IconImage size={18} />, num: stats.pages, label: "páginas" },
    { icon: <IconChat size={18} />, num: stats.comments, label: "comentários", href: "/admin/comentarios" },
    { icon: <IconEye size={18} />, num: stats.views, label: "leituras" },
  ];

  return (
    <>
      <div className="stat-grid">
        {cards.map((c) =>
          c.href ? (
            <Link key={c.label} href={c.href} className="stat-box manga-panel stat-link">
              <div className="stat-num">{formatNumber(c.num)}</div>
              <div className="stat-label">
                {c.icon} {c.label}
              </div>
            </Link>
          ) : (
            <div key={c.label} className="stat-box manga-panel">
              <div className="stat-num">{formatNumber(c.num)}</div>
              <div className="stat-label">
                {c.icon} {c.label}
              </div>
            </div>
          )
        )}
      </div>

      <section className="section" aria-label="Leituras">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              01
            </span>
            <h2>Leituras · 14 dias</h2>
          </div>
          <span className="section-sub">
            {daily.reduce((acc, d) => acc + d.views, 0)} no período
          </span>
        </div>
        <div className="manga-panel chart">
          {daily.every((d) => d.views === 0) ? (
            <p className="muted">Ainda sem leituras registradas por dia — abra um capítulo publicado para ver o gráfico crescer.</p>
          ) : (
            <div className="chart-bars" role="img" aria-label="Leituras por dia nos últimos 14 dias">
              {daily.map((d) => (
                <div key={d.day} className="chart-col" title={`${d.day}: ${d.views} leituras`}>
                  <div className="chart-bar" style={{ height: `${Math.max(4, Math.round((d.views / maxViews) * 100))}%` }}>
                    {d.views > 0 && <span className="chart-val mono-num">{d.views}</span>}
                  </div>
                  <span className="chart-label mono-num">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Suas obras">
        <div className="section-head">
          <h2>Suas obras</h2>
          <Link href="/admin/obras/novo" className="btn ghost small">
            <IconArrowRight size={13} /> criar nova
          </Link>
        </div>

        {seriesList.length === 0 ? (
          <div className="manga-panel empty-state">
            <div className="empty-title">Estúdio vazio</div>
            <p>Comece criando sua primeira obra — capa, sinopse e capítulos ficam prontos em poucos cliques.</p>
            <Link href="/admin/obras/novo" className="btn">
              Criar primeira obra
            </Link>
          </div>
        ) : (
          <div className="manga-panel" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Obra</th>
                  <th>Status</th>
                  <th>Capítulos</th>
                  <th>Leituras</th>
                  <th>Atualizada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {seriesList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="cell-thumb" src={s.cover || "/samples/cover-farol.svg"} alt="" />
                    </td>
                    <td className="cell-title">
                      <Link href={`/admin/obras/${s.id}/capitulos`}>{s.title}</Link>
                    </td>
                    <td className="muted">{s.status}</td>
                    <td>{s.chapterCount}</td>
                    <td>{formatNumber(s.views)}</td>
                    <td className="muted">{formatDate(s.lastUpdate)}</td>
                    <td>
                      <div className="cell-actions">
                        <Link href={`/admin/obras/${s.id}/editar`} className="btn small ghost">
                          Editar
                        </Link>
                        <Link href={`/obra/${s.slug}`} className="btn small ghost">
                          Ver
                        </Link>
                        <DeleteButton kind="series" id={s.id} label={`a obra ${s.title}`} redirect="/admin" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
