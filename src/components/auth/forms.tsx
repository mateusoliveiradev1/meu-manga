"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/client";
import { grantAdminIfNeeded } from "@/features/auth/actions";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import { safeNextPath } from "@/lib/navigation";

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
  if (err?.status === 401) return "Email ou senha não conferem. Revise os dados e tente novamente.";
  if (err?.status === 409 || err?.status === 422) return "Não foi possível usar esses dados. Confira os campos e tente novamente.";
  return fallback;
}

function PasswordField({ id, label, value, onChange, autoComplete, minLength }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} minLength={minLength} required />
        <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
          {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
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
      router.push(safeNextPath(nextPath));
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
      <PasswordField id="login-password" label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
        {busy ? "Entrando…" : "Entrar e continuar"}
      </button>
    </form>
  );
}

export function RegisterForm({ nextPath = "/" }: { nextPath?: string }) {
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
      router.push(safeNextPath(nextPath));
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
      <div>
        <PasswordField id="reg-password" label="Senha" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} />
        <span className="hint">Mínimo de 8 caracteres.</span>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
        {busy ? "Criando sua estante…" : "Criar minha estante"}
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
