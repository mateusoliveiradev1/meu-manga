import Link from "next/link";
import { requireAdmin } from "@/features/auth/session";
import { IconGear, IconPlus } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="admin-head">
        <h1>
          <IconGear size={22} /> Painel do autor
        </h1>
        <Link href="/admin/obras/novo" className="btn">
          <IconPlus size={15} /> Nova obra
        </Link>
      </div>

      <nav className="admin-nav" aria-label="Painel">
        <Link href="/admin">Visão geral</Link>
        <Link href="/admin/obras/novo">Nova obra</Link>
        <Link href="/admin/comentarios">Moderação</Link>
        <Link href="/" className="admin-nav-exit">
          Ver o site →
        </Link>
      </nav>

      {children}
    </div>
  );
}
