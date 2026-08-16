import Link from "next/link";
import { requireAdmin } from "@/features/auth/session";
import { getDailyViews, getOperationalMetrics, getSeriesList, getStats } from "@/features/catalog/queries";
import { formatDate, formatNumber } from "@/lib/utils";
import { IconArrowRight, IconBook, IconChat, IconEye, IconHeart, IconImage, IconPen, IconUsers } from "@/components/ui/icons";
import { DeleteButton } from "@/components/admin/forms";
import { getCommunityMetrics, getOpenReportCount } from "@/features/comments/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, seriesList, daily, openReports, operations, community] = await Promise.all([
    getStats(),
    getSeriesList(),
    getDailyViews(14),
    getOpenReportCount(),
    getOperationalMetrics(30),
    getCommunityMetrics(30),
  ]);
  const maxViews = Math.max(1, ...daily.map((d) => d.views));
  const needsEditorial = seriesList.find((work) => !work.cover.trim() || work.synopsis.trim().length < 80);
  const nextAction = seriesList.length === 0
    ? { title: "Comece a primeira obra", description: "Cadastre título, capa e sinopse para abrir a estante.", href: "/admin/obras/novo", label: "Criar primeira obra" }
    : needsEditorial
      ? { title: `Complete “${needsEditorial.title}”`, description: !needsEditorial.cover.trim() ? "A obra ainda precisa de uma capa antes de ganhar destaque." : "A sinopse precisa contar melhor por que esta história merece ser aberta.", href: `/admin/obras/${needsEditorial.id}/editar`, label: "Revisar obra" }
      : operations.editorial.drafts > 0
        ? { title: "Há capítulos esperando revisão", description: `${operations.editorial.drafts} ${operations.editorial.drafts === 1 ? "rascunho precisa" : "rascunhos precisam"} de páginas, prévia ou data de publicação.`, href: `/admin/obras/${seriesList[0].id}/capitulos`, label: "Revisar capítulos" }
        : openReports > 0
          ? { title: "A comunidade precisa de atenção", description: `${openReports} ${openReports === 1 ? "denúncia aguarda" : "denúncias aguardam"} uma decisão.`, href: "/admin/comentarios", label: "Abrir moderação" }
          : { title: "A estante está pronta para crescer", description: "Crie o próximo capítulo e mantenha a sequência de publicação.", href: `/admin/capitulos/novo?obra=${seriesList[0].id}`, label: "Criar capítulo" };

  const cards = [
    { icon: <IconChat size={18} />, num: openReports, label: "denúncias", href: "/admin/comentarios" },
    { icon: <IconBook size={18} />, num: stats.series, label: "obras" },
    { icon: <IconPen size={18} />, num: stats.chapters, label: "capítulos" },
    { icon: <IconImage size={18} />, num: stats.pages, label: "páginas" },
    { icon: <IconChat size={18} />, num: stats.comments, label: "comentários", href: "/admin/comentarios" },
    { icon: <IconEye size={18} />, num: stats.views, label: "leituras" },
  ];

  return (
    <>
      <section className="admin-focus" aria-labelledby="next-action-title">
        <div><span className="admin-focus-label">Próxima ação</span><h2 id="next-action-title">{nextAction.title}</h2><p>{nextAction.description}</p></div>
        <Link className="btn" href={nextAction.href}>{nextAction.label} <IconArrowRight size={14} /></Link>
      </section>

      <section className="section" aria-label="Comunidade">
        <div className="section-head"><div><h2>Comunidade · 30 dias</h2><p className="section-description">Relações que indicam se a leitura está virando conversa.</p></div><Link href="/comunidade" className="section-link">Ver área pública <IconArrowRight size={12} /></Link></div>
        <div className="community-admin-metrics"><div><IconUsers size={17} /><strong>{community.members}</strong><span>membros</span></div><div><IconChat size={17} /><strong>{community.recentActivity}</strong><span>mensagens recentes</span></div><div><IconHeart size={17} /><strong>{community.likes}</strong><span>curtidas</span></div><div><IconUsers size={17} /><strong>{community.follows}</strong><span>conexões</span></div></div>
      </section>

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
            <div className="chart-bars" role="img" aria-label="Gráfico de leituras por dia nos últimos 14 dias. Os valores também estão disponíveis abaixo.">
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
          <details className="chart-data"><summary>Ver valores por dia</summary><table><thead><tr><th>Dia</th><th>Leituras</th></tr></thead><tbody>{daily.map((day) => <tr key={day.day}><td>{day.day}</td><td>{day.views}</td></tr>)}</tbody></table></details>
        </div>
      </section>

      <section className="section" aria-label="Operação do estúdio">
        <div className="section-head">
          <h2>Operação · 30 dias</h2>
          <span className="section-sub">sinais para decidir o próximo passo</span>
        </div>
        <div className="ops-grid">
          <div className="manga-panel ops-panel">
            <h3>Leitura</h3>
            <div className="ops-metrics">
              <span><strong>{operations.activeReaders}</strong> leitores ativos</span>
              <span><strong>{operations.completedReads}</strong> capítulos concluídos</span>
            </div>
            <h3>Rotas mais acessadas</h3>
            {operations.topPaths.length ? (
              <ol className="ops-paths">
                {operations.topPaths.map((row) => <li key={row.path}><code>{row.path}</code><span>{formatNumber(row.views)}</span></li>)}
              </ol>
            ) : <p className="muted">O tráfego aparecerá aqui conforme as visitas forem registradas.</p>}
          </div>
          <div className="manga-panel ops-panel">
            <h3>Prontidão editorial</h3>
            <ul className="editorial-checks">
              <li className={operations.editorial.missingCover ? "needs-work" : "ready"}>
                <span>Obras sem capa</span><strong>{operations.editorial.missingCover}</strong>
              </li>
              <li className={operations.editorial.shortSynopsis ? "needs-work" : "ready"}>
                <span>Sinopses com menos de 80 caracteres</span><strong>{operations.editorial.shortSynopsis}</strong>
              </li>
              <li><span>Capítulos em rascunho</span><strong>{operations.editorial.drafts}</strong></li>
              <li><span>Publicações agendadas</span><strong>{operations.editorial.scheduled}</strong></li>
            </ul>
          </div>
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
                  <th>Capa</th>
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
                    <td data-label="Capa">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="cell-thumb" src={s.cover || "/samples/cover-farol.svg"} alt="" />
                    </td>
                    <td className="cell-title" data-label="Obra">
                      <Link href={`/admin/obras/${s.id}/capitulos`}>{s.title}</Link>
                    </td>
                    <td className="muted" data-label="Status">{s.status}</td>
                    <td data-label="Capítulos">{s.chapterCount}</td>
                    <td data-label="Leituras">{formatNumber(s.views)}</td>
                    <td className="muted" data-label="Atualizada">{formatDate(s.lastUpdate)}</td>
                    <td data-label="Ações">
                      <div className="cell-actions">
                        <Link href={`/admin/obras/${s.id}/editar`} className="btn small ghost">
                          Editar dados
                        </Link>
                        <Link href={`/obra/${s.slug}`} className="btn small ghost">
                          Ver publicada
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
