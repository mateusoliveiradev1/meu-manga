import Link from "next/link";
import { PageView } from "@/components/analytics/pageview";
import { HitCounter } from "@/components/ui/counter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/auth/forms";
import { IconBell, IconGear, IconTrophy, IconUser, IconUsers } from "@/components/ui/icons";
import { SiteLogo } from "@/components/ui/logo";
import { NavLink } from "@/components/ui/nav-link";
import { SearchBox } from "@/components/catalog/search-box";
import { MobileNav } from "@/components/ui/mobile-nav";
import { PwaControls } from "@/components/pwa/pwa-controls";
import { getCurrentUser } from "@/features/auth/session";
import { getLatestPublishedAt, getStats } from "@/features/catalog/queries";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { GENRES } from "@/lib/genres";
import { formatDate } from "@/lib/utils";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, stats, lastPublished] = await Promise.all([getCurrentUser(), getStats(), getLatestPublishedAt()]);
  const unreadNotifications = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <div className="shell">
      <PageView />
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="logo" aria-label={`${SITE_NAME} — início`}>
            <SiteLogo name={SITE_NAME} />
          </Link>
          <SearchBox />
          <nav className="site-nav" aria-label="Navegação principal">
            <NavLink href="/" exact>Início</NavLink>
            <NavLink href="/obras">Obras</NavLink>
            <NavLink href="/ranking"><IconTrophy size={13} /> Ranking</NavLink>
            <NavLink href="/comunidade"><IconUsers size={13} /> Comunidade</NavLink>
            <details className="genre-drop">
              <summary>Gêneros</summary>
              <div className="genre-drop-panel">
                <Link href="/generos" className="genre-all-link">Todos os gêneros</Link>
                {GENRES.map((g) => (
                  <Link key={g.slug} href={`/genero/${g.slug}`}>
                    {g.name}
                  </Link>
                ))}
              </div>
            </details>
            <NavLink href="/sobre">Sobre</NavLink>
          </nav>
          <div className="site-account">
            {user ? (
              <>
                <NavLink href="/notificacoes" className="notification-nav-link" aria-label={unreadNotifications ? `${unreadNotifications} notificações não lidas` : "Notificações"}>
                  <IconBell size={15} /> {unreadNotifications > 0 && <span className="notification-nav-count">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
                </NavLink>
                <details className="account-drop">
                  <summary><IconUser size={14} /><span>{user.name}</span></summary>
                  <div className="account-drop-panel">
                    <Link href="/perfil"><IconUser size={15} /> Meu perfil</Link>
                    <Link href="/notificacoes"><IconBell size={15} /> Notificações {unreadNotifications > 0 && <span className="notification-nav-count">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>
                    {user.role === "admin" && <Link href="/admin"><IconGear size={15} /> Painel do autor</Link>}
                    <LogoutButton className="account-menu-logout" />
                  </div>
                </details>
              </>
            ) : (
              <>
                <Link className="account-login" href="/entrar">Entrar</Link>
                <Link href="/cadastro" className="btn small">Criar conta</Link>
              </>
            )}
          </div>
          <ThemeToggle />
          <MobileNav user={user ? { name: user.name, role: user.role ?? "user", unreadNotifications } : null} />
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
              Histórias independentes que crescem capítulo a capítulo, direto do estúdio para a sua estante.
            </p>
            <HitCounter value={stats.views} label="leituras no estúdio" />
          </div>
          <nav className="footer-col" aria-label="Navegação do rodapé">
            <h3>Navegação</h3>
            <Link href="/">Início</Link>
            <Link href="/obras">Explorar obras</Link>
            <Link href="/ranking">Ranking</Link>
            <Link href="/capitulos">Capítulos</Link>
            <Link href="/generos">Gêneros</Link>
            <Link href="/comunidade">Comunidade</Link>
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
            <p className="footer-note">Criado, editado e publicado pelo estúdio.</p>
            <PwaControls />
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Histórias e personagens pertencem aos seus respectivos autores.
          </p>
        </div>
      </footer>
    </div>
  );
}
