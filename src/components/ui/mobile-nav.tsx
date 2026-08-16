"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/forms";
import { SearchBox } from "@/components/catalog/search-box";
import { IconBell, IconBook, IconBookmark, IconClose, IconCompass, IconGear, IconHome, IconMenu, IconSpark, IconTrophy, IconUser, IconUsers } from "@/components/ui/icons";

type MobileUser = { name: string; role: string; unreadNotifications: number } | null;

export function MobileNav({ user }: { user: MobileUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])');
    focusable?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  const overlay = open && mounted ? createPortal(
    <div className="mobile-menu-layer">
      <button className="mobile-menu-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />
      <aside ref={panelRef} id="mobile-site-menu" className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Navegação principal">
        <div className="mobile-menu-head">
          <strong>Para onde vamos?</strong>
          <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)}><IconClose size={20} /></button>
        </div>
        <SearchBox />
        <nav className="mobile-menu-links" aria-label="Destinos principais">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}><IconHome size={18} /> Início</Link>
          <Link href="/obras" aria-current={pathname.startsWith("/obra") ? "page" : undefined}><IconCompass size={18} /> Explorar obras</Link>
          <Link href="/ranking" aria-current={pathname === "/ranking" ? "page" : undefined}><IconTrophy size={18} /> Ranking de obras</Link>
          <Link href="/comunidade" aria-current={pathname === "/comunidade" ? "page" : undefined}><IconUsers size={18} /> Comunidade</Link>
          <Link href="/generos" aria-current={pathname.startsWith("/genero") ? "page" : undefined}><IconBook size={18} /> Todos os gêneros</Link>
        </nav>
        <div className="mobile-menu-account">
          {user ? (
            <>
              <Link href="/perfil"><IconUser size={18} /> {user.name}</Link>
              <Link href="/biblioteca"><IconBookmark size={18} /> Minha biblioteca</Link>
              <Link href="/para-voce"><IconSpark size={18} /> Para você</Link>
              <Link href="/notificacoes"><IconBell size={18} /> Notificações {user.unreadNotifications > 0 && <span className="notification-nav-count">{user.unreadNotifications}</span>}</Link>
              {user.role === "admin" && <Link href="/admin"><IconGear size={18} /> Painel do autor</Link>}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="btn ghost" href="/entrar">Entrar e continuar</Link>
              <Link className="btn" href="/cadastro">Criar minha estante</Link>
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <div className="mobile-nav-root">
      <button ref={triggerRef} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-site-menu" onClick={() => setOpen(true)}>
        <IconMenu size={20} /> <span>Menu</span>
      </button>
      {overlay}
    </div>
  );
}
