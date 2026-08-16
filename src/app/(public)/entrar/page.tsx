import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { IconLock } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="auth-wrap">
      <div className="manga-panel auth-box">
        <div className="row" style={{ marginBottom: "0.4rem" }}>
          <IconLock size={22} style={{ color: "var(--accent)" }} />
          <h1>Entrar</h1>
        </div>
        <p className="auth-sub">Entre para comentar, favoritar obras e sincronizar seu progresso de leitura.</p>
        <LoginForm />
        <p className="auth-alt">
          Ainda não tem conta? <Link href="/cadastro">Crie uma grátis</Link>
        </p>
      </div>
    </div>
  );
}
