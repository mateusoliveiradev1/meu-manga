import Link from "next/link";
import { IconArrowLeft, IconBook, IconChat, IconEye } from "@/components/ui/icons";
import { getStats } from "@/features/catalog/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";

export const metadata = {
  title: "Sobre o estúdio",
  description: "Quem desenha, como os capítulos nascem e como aproveitar a leitura.",
};

export default async function SobrePage() {
  const stats = await getStats();

  return (
    <>
      <div className="mt-2">
        <Link href="/" className="btn ghost small">
          <IconArrowLeft size={14} /> Voltar às obras
        </Link>
      </div>

      <section className="section" aria-label="Sobre o estúdio">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              01
            </span>
            <h1>O estúdio</h1>
          </div>
          <span className="section-sub">por trás de cada página</span>
        </div>

        <div className="manga-panel about-prose">
          <p>
            {SITE_NAME} é um estúdio de um artista só: histórias desenhadas, entintadas e
            publicadas página por página, direto da bancada para a sua tela. Aqui não existe
            editora no meio do caminho — o que você lê é o que saiu do traço (e do teclado).
          </p>
          <p>
            Cada capítulo nasce como um punhado de páginas soltas e vira uma obra completa:
            capa, capítulos numerados, progresso de leitura e comentários de quem acompanha.
            O estúdio é pequeno, mas a estante cresce a cada publicação.
          </p>
          <div className="stats-row">
            <div className="stat">
              <IconBook size={16} />
              <span className="mono-num">{formatNumber(stats.series)}</span>
              <span className="stat-label">obras na estante</span>
            </div>
            <div className="stat">
              <IconEye size={16} />
              <span className="mono-num">{formatNumber(stats.chapters)}</span>
              <span className="stat-label">capítulos publicados</span>
            </div>
            <div className="stat">
              <IconChat size={16} />
              <span className="mono-num">{formatNumber(stats.comments)}</span>
              <span className="stat-label">comentários de leitores</span>
            </div>
          </div>
        </div>
      </section>

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Como funciona">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              02
            </span>
            <h2>Como funciona</h2>
          </div>
        </div>
        <div className="about-cols">
          <div className="manga-panel">
            <h3>Publicação</h3>
            <p>
              Capítulos entram pela bancada do autor e são publicados quando estão prontos.
              Obras novas aparecem na estante com capa, sinopse e gêneros — e cada capítulo
              pode ter a própria capa, leituras e comentários.
            </p>
          </div>
          <div className="manga-panel">
            <h3>Leitura</h3>
            <p>
              Três jeitos de ler: <strong>Rolagem</strong> (o padrão, página após página),
              <strong> Página</strong> (virar com toque ou teclado) e <strong>Dupla</strong>{" "}
              (duas páginas lado a lado no desktop). O progresso fica salvo — você volta
              exatamente de onde parou.
            </p>
          </div>
          <div className="manga-panel">
            <h3>Comunidade</h3>
            <p>
              Comente cada capítulo ou a obra inteira, dê sua nota de 1 a 5 estrelas e
              favorite as histórias. Os comentários mais recentes aparecem na home e no
              seu perfil.
            </p>
          </div>
        </div>
      </section>

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Perguntas frequentes">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              03
            </span>
            <h2>Perguntas frequentes</h2>
          </div>
        </div>
        <div className="manga-panel about-faq">
          <h3>Os capítulos são publicados em que ritmo?</h3>
          <p>
            Quando estiverem prontos. A home mostra sempre a data do capítulo mais recente —
            se o estúdio está em silêncio, é porque a tinta ainda está secando.
          </p>
          <h3>Posso comentar sem criar conta?</h3>
          <p>
            Comentar e avaliar exigem conta. Ler, navegar e favoritar (no dispositivo) são
            livres.
          </p>
          <h3>O progresso de leitura é salvo?</h3>
          <p>
            Sim. Visitantes sem conta têm o progresso guardado no navegador; quem tem conta,
            salvo na conta — vale para qualquer dispositivo.
          </p>
        </div>
      </section>
    </>
  );
}
