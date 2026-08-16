"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/client";
import { grantAdminIfNeeded } from "@/features/auth/actions";

function useSubmit() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return { error, setError, busy, setBusy };
}

/** Rate-limited (429) responses show a calm, human message instead of the raw API text. */
function authErrorMessage(err: { status?: number; message?: string } | undefined, fallback: string): string {
  if (err?.status === 429) {
    return "Muitas tentativas em sequência. Aguarde um minuto e tente de novo.";
  }
  return err?.message || fallback;
}

export function LoginForm() {
  const router = useRouter();
  const { error, setError, busy, setBusy } = useSubmit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(authErrorMessage(res.error, "Não foi possível entrar. Confira email e senha."));
        return;
      }
      // promote to admin on login too — accounts created before ADMIN_EMAIL
      // was set never went through the signup-time grant
      await grantAdminIfNeeded();
      router.push("/");
      router.refresh();
    } catch {
      setError("Algo deu errado. Tente de novo em instantes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
        {busy ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { error, setError, busy, setBusy } = useSubmit();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res.error) {
        setError(authErrorMessage(res.error, "Não foi possível criar a conta."));
        return;
      }
      await grantAdminIfNeeded();
      router.push("/");
      router.refresh();
    } catch {
      setError("Algo deu errado. Tente de novo em instantes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="reg-name">Apelido</label>
        <input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" required />
      </div>
      <div className="field">
        <label htmlFor="reg-email">Email</label>
        <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="reg-password">Senha</label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="hint">Mínimo de 8 caracteres.</span>
      </div>
      {error && <div className="form-error">{error}</div>}
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
        {busy ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" className={`nav-btn ${className ?? ""}`} onClick={logout} disabled={busy}>
      {busy ? "Saindo..." : "Sair"}
    </button>
  );
}
