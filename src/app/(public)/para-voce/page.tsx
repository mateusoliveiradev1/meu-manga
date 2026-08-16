import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconSpark } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getRecommendations } from "@/features/library/queries";

export const metadata: Metadata = { title: "Para você", description: "Recomendações de mangás baseadas na sua estante e no seu histórico de leitura." };
export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=%2Fpara-voce&motivo=recomendacoes");
  const recommendations = await getRecommendations(user.id, 12);
  return <>
    <section className="recommendation-hero"><IconSpark size={34} /><div><h1>Escolhas que partem da sua estante</h1><p>Gêneros que você guarda, notas que dá e histórias que começa ajudam a ordenar estas sugestões. Nenhuma recomendação é patrocinada.</p></div></section>
    <section className="section" aria-label="Recomendações pessoais">
      {recommendations.length ? <div className="recommendation-grid">{recommendations.map((work) => <article key={work.id} className="recommendation-card"><Link href={`/obra/${work.slug}`} className="recommendation-cover"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="(max-width: 600px) 42vw, 210px" /></Link><div><span className="recommendation-reason">{work.reason}</span><h2><Link href={`/obra/${work.slug}`}>{work.title}</Link></h2><p>{work.synopsis}</p><small>{work.chapterCount} {work.chapterCount === 1 ? "capítulo" : "capítulos"}{work.rating ? ` · nota ${work.rating.toFixed(1)}` : ""}</small><Link className="section-link" href={`/obra/${work.slug}`}>Conhecer a obra <IconArrowRight size={13} /></Link></div></article>)}</div> : <div className="manga-panel empty-state"><div className="empty-title">Sua estante ainda está ensinando o caminho</div><p>Guarde ou avalie algumas obras para receber recomendações pessoais. Enquanto isso, o catálogo continua aberto.</p><Link className="btn" href="/obras">Explorar o catálogo</Link></div>}
    </section>
  </>;
}
