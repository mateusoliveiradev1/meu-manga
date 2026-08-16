import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/forms";
import { IconBook, IconStar, IconUser } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { safeNextPath } from "@/lib/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Criar minha estante" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; motivo?: string }> }) {
  const sp = await searchParams;
  const nextPath = safeNextPath(sp.next);
  if (await getCurrentUser()) redirect(nextPath);
  const loginHref = `/entrar?next=${encodeURIComponent(nextPath)}${sp.motivo ? `&motivo=${encodeURIComponent(sp.motivo)}` : ""}`;

  return (
    <div className="auth-shell">
      <section className="auth-promise" aria-label="Benefícios da conta">
        <span className="auth-mark"><IconStar size={22} /></span>
        <h1>Monte uma estante que lembra de você</h1>
        <p>A conta existe para servir à leitura: sincroniza seu progresso, reúne favoritas e conecta você às conversas da comunidade.</p>
        <ul><li><IconBook size={16} /> Ler continua livre</li><li><IconStar size={16} /> Seus dados ficam sob seu controle</li></ul>
      </section>
      <section className="manga-panel auth-box" aria-labelledby="register-title">
        <div className="auth-title"><IconUser size={20} /><div><h2 id="register-title">Criar minha estante</h2><p>Leva menos de um minuto. Você pode apagar a conta quando quiser.</p></div></div>
        <RegisterForm nextPath={nextPath} />
        <p className="auth-alt">Já tem conta? <Link href={loginHref}>Entre e continue</Link></p>
      </section>
    </div>
  );
}
