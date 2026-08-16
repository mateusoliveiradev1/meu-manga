import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/forms";
import { IconUser } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="auth-wrap">
      <div className="manga-panel auth-box">
        <div className="row" style={{ marginBottom: "0.4rem" }}>
          <IconUser size={22} style={{ color: "var(--accent)" }} />
          <h1>Criar conta</h1>
        </div>
        <p className="auth-sub">Uma conta para comentar, guardar favoritas e continuar de onde parou.</p>
        <RegisterForm />
        <p className="auth-alt">
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
