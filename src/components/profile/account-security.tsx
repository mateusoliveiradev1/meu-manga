"use client";

import { useState } from "react";
import { authClient } from "@/features/auth/client";
import { IconLock, IconTrash } from "@/components/ui/icons";

export function AccountSecurity({ canDelete }: { canDelete: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) return setError("A nova senha precisa ter pelo menos 8 caracteres.");
    if (newPassword !== confirmPassword) return setError("A confirmação não corresponde à nova senha.");
    setBusy(true);
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setBusy(false);
    if (result.error) return setError(result.error.message || "Não foi possível alterar a senha.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Senha alterada e outras sessões encerradas.");
  }

  async function revokeSessions() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await authClient.revokeOtherSessions();
    setBusy(false);
    if (result.error) return setError(result.error.message || "Não foi possível encerrar as sessões.");
    setMessage("Outras sessões foram encerradas.");
  }

  async function deleteAccount() {
    if (deleteConfirm !== "APAGAR") return setError("Digite APAGAR para confirmar.");
    if (!deletePassword) return setError("Informe sua senha atual.");
    setBusy(true);
    setError("");
    const result = await authClient.deleteUser({ password: deletePassword });
    if (result.error) {
      setBusy(false);
      return setError(result.error.message || "Não foi possível apagar a conta.");
    }
    window.location.assign("/");
  }

  return (
    <section className="section" aria-labelledby="security-title">
      <div className="section-head">
        <div className="section-head-title">
          <span className="section-idx mono-num" aria-hidden="true">04</span>
          <h2 id="security-title"><IconLock size={18} /> Segurança da conta</h2>
        </div>
        <span className="section-sub">senha e sessões ativas</span>
      </div>
      <div className="account-security-grid">
        <form className="manga-panel account-security-form" onSubmit={changePassword}>
          <h3>Alterar senha</h3>
          <div className="field">
            <label htmlFor="current-password">Senha atual</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="new-password">Nova senha</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? "Salvando…" : "Alterar senha"}</button>
        </form>
        <div className="manga-panel account-security-actions">
          <h3>Sessões</h3>
          <p>Se você entrou em outro aparelho, encerre todas as sessões menos esta.</p>
          <button className="btn ghost" type="button" disabled={busy} onClick={revokeSessions}>Encerrar outras sessões</button>
          {canDelete && (
            <div className="danger-zone">
              <h3>Apagar conta</h3>
              <p>Remove permanentemente seu perfil, favoritos, progresso e comentários.</p>
              {!deleteOpen ? (
                <button className="btn danger" type="button" onClick={() => setDeleteOpen(true)}><IconTrash size={14} /> Apagar minha conta</button>
              ) : (
                <div className="stack delete-confirm">
                  <input type="password" autoComplete="current-password" placeholder="Senha atual" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
                  <input placeholder="Digite APAGAR" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} />
                  <div className="row">
                    <button className="btn danger" type="button" disabled={busy} onClick={deleteAccount}>Confirmar exclusão</button>
                    <button className="btn ghost" type="button" onClick={() => setDeleteOpen(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {error && <div className="form-error mt-1">{error}</div>}
      {message && <div className="form-success mt-1">{message}</div>}
    </section>
  );
}
