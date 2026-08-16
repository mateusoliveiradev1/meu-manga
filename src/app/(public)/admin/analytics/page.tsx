import Link from "next/link";
import { IconChart } from "@/components/ui/icons";
import { requireAdmin } from "@/features/auth/session";
import { getProductAnalytics } from "@/features/analytics/queries";
import { chapterLabel, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductAnalyticsPage() {
  await requireAdmin();
  const data = await getProductAnalytics(30);

  return (
    <section className="section analytics-page" aria-labelledby="analytics-title">
      <header className="admin-feature-head">
        <div>
          <span className="eyebrow"><IconChart size={14} /> Últimos 30 dias</span>
          <h2 id="analytics-title">Da capa ao fim do capítulo</h2>
          <p>Veja onde leitores entram, continuam e criam vínculo com cada obra.</p>
        </div>
        <div className="admin-feature-stats"><span><strong>{formatNumber(data.eventCount)}</strong> sinais de uso</span></div>
      </header>

      {data.eventCount === 0 ? (
        <div className="analytics-empty">
          <span className="eyebrow">Começando agora</span>
          <h2>O novo funil ainda está reunindo dados</h2>
          <p>Assim que leitores abrirem obras e capítulos, esta página mostrará conversão, conclusão e abandono sem depender de rastreadores externos.</p>
          <Link href="/obras" className="btn small">Ver catálogo</Link>
        </div>
      ) : (
        <>
          <section className="funnel-section" aria-labelledby="funnel-title">
            <div className="section-head compact"><div><span className="eyebrow">Jornada principal</span><h2 id="funnel-title">Funil de leitura</h2></div></div>
            <div className="funnel-track">
              {data.funnel.map((step, index) => (
                <div key={step.key} className="funnel-step" style={{ "--funnel-width": `${Math.max(28, 100 - index * 16)}%` } as React.CSSProperties}>
                  <span>0{index + 1}</span>
                  <strong>{formatNumber(step.value)}</strong>
                  <p>{step.label}</p>
                  {index > 0 && <small>{step.rate}% da etapa anterior</small>}
                </div>
              ))}
            </div>
          </section>

          <section className="analytics-block" aria-labelledby="dropoff-title">
            <div className="section-head compact"><div><span className="eyebrow">Diagnóstico</span><h2 id="dropoff-title">Onde a leitura perde força</h2></div></div>
            {data.chapterMetrics.length ? (
              <div className="data-table-wrap"><table className="admin-table analytics-table"><thead><tr><th>Capítulo</th><th>Inícios</th><th>Conclusões</th><th>Conclusão</th><th>Saída média</th></tr></thead><tbody>
                {data.chapterMetrics.map((item) => <tr key={item.chapterId}><td><strong>{item.seriesTitle}</strong><small>{chapterLabel(item.number)}</small></td><td>{formatNumber(item.starts)}</td><td>{formatNumber(item.completes)}</td><td><span className={item.completionRate >= 60 ? "qa-ready" : "qa-blocker"}>{item.completionRate}%</span></td><td>{item.averageExitPage ? `pág. ${item.averageExitPage}` : "—"}</td></tr>)}
              </tbody></table></div>
            ) : <p className="muted">Ainda não há capítulos com início de leitura neste período.</p>}
          </section>

          <section className="analytics-block" aria-labelledby="bond-title">
            <div className="section-head compact"><div><span className="eyebrow">Vínculo</span><h2 id="bond-title">Obras que transformam visita em hábito</h2></div></div>
            {data.workMetrics.length ? <div className="work-metric-list">
              {data.workMetrics.map((item) => <article key={item.seriesId}><div><strong>{item.title}</strong><small>{formatNumber(item.views)} visitantes</small></div><dl><div><dt>Favoritaram</dt><dd>{item.favoriteConversion}%</dd></div><div><dt>Leram 2+ capítulos</dt><dd>{formatNumber(item.returningReaders)}</dd></div></dl></article>)}
            </div> : <p className="muted">O desempenho por obra aparecerá depois das primeiras visitas.</p>}
          </section>

          <section className="analytics-block" aria-labelledby="release-title">
            <div className="section-head compact"><div><span className="eyebrow">Comparativo</span><h2 id="release-title">Desempenho dos lançamentos</h2></div></div>
            {data.releases.length ? <div className="data-table-wrap"><table className="admin-table analytics-table"><thead><tr><th>Lançamento</th><th>Data</th><th>Leituras</th><th>Inícios medidos</th><th>Conclusões</th></tr></thead><tbody>
              {data.releases.map((item) => <tr key={item.chapterId}><td><strong>{item.seriesTitle}</strong><small>{chapterLabel(item.number)}</small></td><td>{formatDate(item.publishedAt)}</td><td>{formatNumber(item.views)}</td><td>{formatNumber(item.starts)}</td><td>{formatNumber(item.completes)}</td></tr>)}
            </tbody></table></div> : <p className="muted">Nenhum lançamento recente para comparar.</p>}
          </section>
        </>
      )}
    </section>
  );
}
