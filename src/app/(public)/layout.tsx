import Link from "next/link";
import { PageView } from "@/components/analytics/pageview";
import { HitCounter } from "@/components/ui/counter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/auth/forms";
import { IconGear, IconSearch, IconUser } from "@/components/ui/icons";
import { SiteLogo } from "@/components/ui/logo";
import { getCurrentUser } from "@/features/auth/session";
import { getLatestPublishedAt, getStats } from "@/features/catalog/queries";
import { GENRES } from "@/lib/genres";
import { formatDate } from "@/lib/utils";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, stats, lastPublished] = await Promise.all([getCurrentUser(), getStats(), getLatestPublishedAt()]);

  return (
    <div className="shell">
      <PageView />
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="logo" aria-label={`${SITE_NAME} — início`}>
            <SiteLogo name={SITE_NAME} />
          </Link>
          <form className="header-search" action="/" method="get" role="search">
            <input type="search" name="q" placeholder="Buscar obras…" aria-label="Buscar obras" autoComplete="off" />
            <button type="submit" aria-label="Buscar">
              <IconSearch size={15} />
            </button>
          </form>
          <nav className="site-nav" aria-label="Navegação principal">
            <Link href="/">Obras</Link>
            <details className="genre-drop">
              <summary>Gêneros</summary>
              <div className="genre-drop-panel">
                {GENRES.map((g) => (
                  <Link key={g.slug} href={`/genero/${g.slug}`}>
                    {g.name}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/sobre">Sobre</Link>
            {user ? (
              <>
                <Link href="/perfil" className="nav-btn nav-user">
                  <IconUser size={13} /> {user.name}
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <IconGear size={13} /> Painel
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/entrar">Entrar</Link>
                <Link href="/cadastro" className="btn small">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" aria-label={`${SITE_NAME} — início`}>
              <SiteLogo name={SITE_NAME} />
            </Link>
            <p className="footer-tagline">
              Mangás publicados direto do estúdio — capítulo por capítulo, página por página.
            </p>
            <HitCounter value={stats.views} label="leituras no estúdio" />
          </div>
          <nav className="footer-col" aria-label="Navegação do rodapé">
            <h3>Navegação</h3>
            <Link href="/">As obras</Link>
            <Link href="/capitulos">Capítulos</Link>
            <Link href="/sobre">Sobre o estúdio</Link>
            <Link href="/privacidade">Privacidade & termos</Link>
            {user ? (
              <Link href="/perfil">Meu perfil</Link>
            ) : (
              <>
                <Link href="/entrar">Entrar</Link>
                <Link href="/cadastro">Criar conta</Link>
              </>
            )}
          </nav>
          <div className="footer-col">
            <h3>Estúdio</h3>
            <p className="footer-updated">
              Último capítulo:{" "}
              <span className="mono-num">{lastPublished ? formatDate(lastPublished) : "em breve"}</span>
            </p>
            <Link href="/rss.xml">Feed RSS de capítulos</Link>
            {process.env.SUPPORT_URL && (
              <a href={process.env.SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Apoiar o estúdio
              </a>
            )}
            <p className="footer-note">Feito com tinta, papel e muito chá.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos de desenhar reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
