"use client";

import { NavLink } from "@/components/ui/nav-link";

export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Painel do autor">
      <NavLink href="/admin" exact>Próxima ação</NavLink>
      <NavLink href="/admin/obras/novo">Nova obra</NavLink>
      <NavLink href="/admin/comentarios">Moderação</NavLink>
      <NavLink href="/obras" className="admin-nav-exit">Ver o catálogo →</NavLink>
    </nav>
  );
}
