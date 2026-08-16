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
                <ResponsiveImage src={work.cover} alt="" sizes="64px" width={72} height={96} />
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

export default async function RankingPage() {
  const ranking = await getSeriesRankings(10);
  const leader = ranking.trending[0];

  return (
    <>
      <section className="ranking-hero">
        <div className="ranking-hero-copy">
          <h1><IconTrophy size={34} /> As histórias que estão puxando a fila</h1>
          <p>Leituras recentes, audiência acumulada e avaliações dos leitores — três maneiras honestas de encontrar o que ler agora.</p>
        </div>
        {leader && (
          <Link href={`/obra/${leader.slug}`} className="ranking-leader">
            <span className="ranking-leader-cover"><ResponsiveImage src={leader.cover} alt="" priority sizes="180px" /></span>
            <span className="ranking-leader-copy">
              <strong>1º em alta</strong>
              <b>{leader.title}</b>
              <span>{metricLabel(leader, "trending")}</span>
              <small>Ver obra <IconArrowRight size={13} /></small>
            </span>
          </Link>
        )}
      </section>

      <div className="ranking-board">
        <RankingList title="Em alta agora" description="Movimento de leitura registrado nos últimos 30 dias." items={ranking.trending} metric="trending" />
        <RankingList title="Mais lidas" description="As obras com mais leituras acumuladas na estante." items={ranking.mostRead} metric="reads" />
        <RankingList title="Melhor avaliadas" description="Notas dadas por leitores autenticados." items={ranking.bestRated} metric="rating" />
      </div>
    </>
  );
}
