"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/features/profile/actions";
import { IconEye, IconUser } from "@/components/ui/icons";

export function ProfileSettings({ initial }: { initial: { name: string; image: string; favoritesPublic: boolean; commentsPublic: boolean } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image);
  const [favoritesPublic, setFavoritesPublic] = useState(initial.favoritesPublic);
  const [commentsPublic, setCommentsPublic] = useState(initial.commentsPublic);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await updateProfileAction({ name, image, favoritesPublic, commentsPublic });
      if (!result.ok) return setError(result.error);
      setMessage("Perfil e privacidade atualizados.");
      router.refresh();
    } catch {
      setError("Não foi possível salvar agora. Tente novamente em instantes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section profile-settings" aria-labelledby="profile-settings-title">
      <div className="section-head"><div><h2 id="profile-settings-title"><IconUser size={18} /> Identidade e privacidade</h2><p className="section-description">Escolha como você aparece e o que outras pessoas podem ver.</p></div></div>
      <form className="manga-panel profile-settings-form" onSubmit={submit}>
        <div className="profile-settings-fields">
          <div className="field"><label htmlFor="profile-name">Nome público</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required /></div>
          <div className="field"><label htmlFor="profile-image">URL do avatar <span>(opcional)</span></label><input id="profile-image" type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://…" /></div>
        </div>
        <fieldset className="privacy-options"><legend><IconEye size={16} /> No meu perfil público</legend>
          <label><input type="checkbox" checked={favoritesPublic} onChange={(event) => setFavoritesPublic(event.target.checked)} /><span><strong>Mostrar favoritas</strong><small>Outros leitores poderão ver as obras guardadas na sua estante.</small></span></label>
          <label><input type="checkbox" checked={commentsPublic} onChange={(event) => setCommentsPublic(event.target.checked)} /><span><strong>Mostrar comentários</strong><small>Sua atividade recente aparecerá no perfil público.</small></span></label>
        </fieldset>
        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-success" role="status">{message}</div>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar perfil e privacidade"}</button>
      </form>
    </section>
  );
}
