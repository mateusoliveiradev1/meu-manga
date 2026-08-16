import type { Metadata } from "next";
import Link from "next/link";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconEye, IconStar, IconTrophy } from "@/components/ui/icons";
import { getSeriesRankings, type RankedSeries } from "@/features/catalog/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ranking de mangás",
  description: "Descubra as obras em alta, mais lidas e melhor avaliadas pelos leitores do Meu Mangá.",
};

type RankingMetric = "trending" | "reads" | "rating";

function metricLabel(work: RankedSeries, metric: RankingMetric) {
  if (metric === "rating") {
    const count = work.ratingCount;
    return <><IconStar size={13} /> {(work.rating ?? 0).toFixed(1)} · {count} {count === 1 ? "avaliação" : "avaliações"}</>;
  }
  const views = metric === "trending" ? work.recentViews : work.views;
  return <><IconEye size={13} /> {formatNumber(views)} {metric === "trending" ? "nos últimos 30 dias" : "leituras"}</>;
}

function RankingList({ title, description, items, metric }: {
  title: string;
  description: string;
  items: RankedSeries[];
  metric: RankingMetric;
}) {
  return (
    <section className="ranking-lane" aria-labelledby={`ranking-${metric}`}>
      <div className="ranking-lane-head">
        <h2 id={`ranking-${metric}`}>{title}</h2>
        <p>{description}</p>
      </div>
      {items.length ? (
        <ol className="ranking-list">
          {items.map((work, index) => (
            <li key={work.id}>
              <span className="ranking-position" aria-label={`${index + 1}º lugar`}>{String(index + 1).padStart(2, "0")}</span>
              <Link href={`/obra/${work.slug}`} className="ranking-cover" aria-label={`Abrir ${work.title}`}>
                <ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="64px" width={72} height={96} />
              </Link>
              <div className="ranking-copy">
                <Link href={`/obra/${work.slug}`}>{work.title}</Link>
                <span>{metricLabel(work, metric)}</span>
                <small>{work.chapterCount} {work.chapterCount === 1 ? "capítulo publicado" : "capítulos publicados"}</small>
              </div>
              <Link className="ranking-open" href={`/obra/${work.slug}`} aria-label={`Ver ${work.title}`}><IconArrowRight size={15} /></Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ranking-empty">Ainda não há dados suficientes para esta lista.</div>
      )}
    </section>
  );
}

function CuratedShelf({ items }: { items: RankedSeries[] }) {
  return (
    <section className="ranking-curated" aria-labelledby="curated-title">
      <div className="ranking-curated-copy">
        <h2 id="curated-title">Comece por aqui</h2>
        <p>Enquanto a estante ganha novas leituras e avaliações, estas são as histórias que já têm capítulos disponíveis.</p>
        <div className="ranking-method">
          <strong>Quando o ranking completo aparece?</strong>
          <span>Assim que cada lista tiver dados suficientes para contar uma história diferente — sem posições artificiais.</span>
        </div>
      </div>
      <div className="ranking-curated-grid">
        {items.map((work) => (
          <Link key={work.id} href={`/obra/${work.slug}`} className="ranking-curated-card">
            <span className="ranking-curated-cover"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="(max-width: 600px) 38vw, 160px" /></span>
            <span className="ranking-curated-info">
              <strong>{work.title}</strong>
              <small>{work.chapterCount} {work.chapterCount === 1 ? "capítulo publicado" : "capítulos publicados"}</small>
              <span>Conhecer a obra <IconArrowRight size={14} /></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function RankingPage() {
  const ranking = await getSeriesRankings(10);
  const unique = Array.from(new Map([...ranking.trending, ...ranking.mostRead, ...ranking.bestRated].map((work) => [work.id, work])).values());
  const enoughMovement = ranking.trending.filter((work) => work.recentViews > 0).length >= 3;
  const enoughRatings = ranking.bestRated.filter((work) => work.ratingCount >= 3).length >= 3;
  const rankingReady = unique.length >= 4 && enoughMovement && enoughRatings;
  const leader = rankingReady ? ranking.trending[0] : undefined;

  return (
    <>
      <section className={`ranking-hero ${rankingReady ? "" : "is-forming"}`}>
        <div className="ranking-hero-copy">
          <h1><IconTrophy size={34} /> {rankingReady ? "As histórias que estão puxando a fila" : "Um ranking que cresce com os leitores"}</h1>
          <p>{rankingReady ? "Leituras recentes, audiência acumulada e avaliações dos leitores — três maneiras honestas de encontrar o que ler agora." : "A estante ainda está ganhando público. Até haver dados suficientes, você encontra uma curadoria transparente — sem transformar poucas leituras em competição."}</p>
        </div>
        {leader && (
          <Link href={`/obra/${leader.slug}`} className="ranking-leader">
            <span className="ranking-leader-cover"><ResponsiveImage src={leader.cover} alt={`Capa de ${leader.title}`} priority sizes="180px" /></span>
            <span className="ranking-leader-copy">
              <strong>1º em alta</strong>
              <b>{leader.title}</b>
              <span>{metricLabel(leader, "trending")}</span>
              <small>Ver obra <IconArrowRight size={13} /></small>
            </span>
          </Link>
        )}
      </section>

      {rankingReady ? (
        <div className="ranking-board">
          <RankingList title="Em alta agora" description="Movimento de leitura registrado nos últimos 30 dias." items={ranking.trending} metric="trending" />
          <RankingList title="Mais lidas" description="As obras com mais leituras acumuladas na estante." items={ranking.mostRead} metric="reads" />
          <RankingList title="Melhor avaliadas" description="Notas dadas por leitores autenticados." items={ranking.bestRated} metric="rating" />
        </div>
      ) : unique.length ? <CuratedShelf items={unique.slice(0, 6)} /> : (
        <div className="manga-panel empty-state ranking-no-data"><div className="empty-title">A primeira leitura abre o caminho</div><p>Assim que os capítulos forem publicados, esta página começa com uma curadoria e evolui para rankings reais.</p><Link className="btn" href="/obras">Explorar a estante</Link></div>
      )}
    </>
  );
}
