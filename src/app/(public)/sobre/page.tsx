import Link from "next/link";
import { IconArrowRight, IconBook, IconChat, IconEye } from "@/components/ui/icons";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { getSeriesList, getStats } from "@/features/catalog/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";
const CATALOG_DEMO = process.env.NEXT_PUBLIC_CATALOG_DEMO !== "false";

export const metadata = {
  title: "Sobre o estúdio",
  description: "Histórias independentes, publicadas capítulo a capítulo e pensadas para uma leitura confortável em qualquer tela.",
};

export default async function SobrePage() {
  const [stats, works] = await Promise.all([getStats(), getSeriesList()]);
  const showcase = works.filter((work) => work.cover).slice(0, 3);

  return (
    <>
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          {CATALOG_DEMO && <span className="demo-note">Catálogo em demonstração</span>}
          <h1 id="about-title">Histórias que crescem capítulo a capítulo</h1>
          <p>
            {SITE_NAME} é um estúdio independente de histórias em sequência. Cada obra é criada,
            editada e publicada aqui, diretamente para quem acompanha desde a primeira página.
          </p>
          <p>
            A estante ainda está crescendo. Algumas histórias estão apenas começando; outras ganharão
            novos capítulos com o tempo. Você escolhe como ler e sempre volta exatamente de onde parou.
          </p>
          <div className="about-hero-actions">
            <Link href="/obras" className="btn">Encontrar uma história <IconArrowRight size={15} /></Link>
            <Link href="/capitulos" className="btn ghost">Ver capítulos recentes</Link>
          </div>
        </div>
        {showcase.length > 0 && (
          <div className="about-cover-stack" aria-label="Obras na estante">
            {showcase.map((work, index) => (
              <Link key={work.id} href={`/obra/${work.slug}`} style={{ "--cover-index": index } as React.CSSProperties}>
                <ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="10rem" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="about-stats" aria-label="Estante em números">
        <div><IconBook size={17} /><strong>{formatNumber(stats.series)}</strong><span>{stats.series === 1 ? "obra" : "obras"}</span></div>
        <div><IconEye size={17} /><strong>{formatNumber(stats.chapters)}</strong><span>{stats.chapters === 1 ? "capítulo" : "capítulos"}</span></div>
        <div><IconChat size={17} /><strong>{formatNumber(stats.comments)}</strong><span>{stats.comments === 1 ? "comentário" : "comentários"}</span></div>
      </section>

      <section className="about-principles" aria-labelledby="reading-title">
        <div className="about-principles-intro">
          <h2 id="reading-title">Uma estante feita para acompanhar</h2>
          <p>O produto existe para deixar a história em primeiro plano e remover atrito entre um capítulo e o próximo.</p>
        </div>
        <ol>
          <li><span>01</span><div><h3>Encontre sua próxima história</h3><p>Explore capas, sinopses e gêneros sem precisar criar uma conta.</p></div></li>
          <li><span>02</span><div><h3>Leia do seu jeito</h3><p>Use rolagem, página única ou página dupla. O leitor se adapta ao seu ritmo e à sua tela.</p></div></li>
          <li><span>03</span><div><h3>Volte de onde parou</h3><p>Seu progresso fica no aparelho; com uma conta, acompanha você entre dispositivos.</p></div></li>
        </ol>
      </section>

      <section className="about-faq-section" aria-labelledby="faq-title">
        <div><h2 id="faq-title">Antes de começar</h2><p>Respostas curtas para as dúvidas mais comuns.</p></div>
        <div className="about-faq-list">
          <details><summary>Quando chegam capítulos novos?</summary><p>Não há uma frequência fixa. A página de capítulos sempre mostra as publicações mais recentes e suas datas.</p></details>
          <details><summary>Preciso de conta para ler?</summary><p>Não. Ler e explorar são livres. A conta serve para sincronizar progresso, avaliar e participar dos comentários.</p></details>
          <details><summary>O que está público no meu perfil?</summary><p>Seu nome, favoritas e comentários podem aparecer no perfil público. Você controla essa visibilidade nas configurações da conta.</p></details>
          <details><summary>Este é o catálogo definitivo?</summary><p>{CATALOG_DEMO ? "Ainda não. As obras atuais apresentam a experiência enquanto a estante definitiva é preparada." : "O catálogo cresce conforme novas obras e capítulos são publicados."}</p></details>
        </div>
      </section>
    </>
  );
}
