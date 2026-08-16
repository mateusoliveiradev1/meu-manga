import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { IconBook, IconLock, IconStar } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { safeNextPath } from "@/lib/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar e continuar" };

const REASONS: Record<string, string> = {
  comentario: "Entre para publicar seu comentário. Depois você volta exatamente para a leitura.",
  avaliacao: "Entre para registrar sua nota e voltar para esta obra.",
  perfil: "Entre para abrir sua estante e continuar de onde parou.",
  admin: "Entre com a conta do estúdio para acessar a bancada de publicação.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; motivo?: string }> }) {
  const sp = await searchParams;
  const nextPath = safeNextPath(sp.next);
  if (await getCurrentUser()) redirect(nextPath);
  const context = sp.motivo ? REASONS[sp.motivo] : undefined;
  const registerHref = `/cadastro?next=${encodeURIComponent(nextPath)}${sp.motivo ? `&motivo=${encodeURIComponent(sp.motivo)}` : ""}`;

  return (
    <div className="auth-shell">
      <section className="auth-promise" aria-label="Por que criar uma conta">
        <span className="auth-mark"><IconBook size={22} /></span>
        <h1>Sua leitura continua com você</h1>
        <p>Entre para sincronizar progresso, guardar histórias e participar da conversa sem perder o ponto em que estava.</p>
        <ul><li><IconBook size={16} /> Retome na página certa</li><li><IconStar size={16} /> Mantenha sua estante organizada</li></ul>
      </section>
      <section className="manga-panel auth-box" aria-labelledby="login-title">
        <div className="auth-title"><IconLock size={20} /><div><h2 id="login-title">Entrar</h2><p>{context ?? "Use sua conta para voltar à sua estante."}</p></div></div>
        <LoginForm nextPath={nextPath} />
        <p className="auth-alt">Ainda não tem conta? <Link href={registerHref}>Crie sua estante</Link></p>
      </section>
    </div>
  );
}
