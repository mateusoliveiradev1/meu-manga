"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/features/profile/actions";
import { IconEye, IconUser } from "@/components/ui/icons";
import { GENRES } from "@/lib/genres";

type ProfileSettingsValue = {
  name: string;
  image: string;
  bio: string;
  favoriteGenre: string;
  favoritesPublic: boolean;
  commentsPublic: boolean;
};

export function ProfileSettings({ initial }: { initial: ProfileSettingsValue }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image);
  const [bio, setBio] = useState(initial.bio);
  const [favoriteGenre, setFavoriteGenre] = useState(initial.favoriteGenre);
  const [favoritesPublic, setFavoritesPublic] = useState(initial.favoritesPublic);
  const [commentsPublic, setCommentsPublic] = useState(initial.commentsPublic);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await updateProfileAction({ name, image, bio, favoriteGenre, favoritesPublic, commentsPublic });
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
      <div className="section-head">
        <div>
          <h2 id="profile-settings-title"><IconUser size={18} /> Identidade e privacidade</h2>
          <p className="section-description">Conte um pouco sobre seu gosto e escolha o que aparece para a comunidade.</p>
        </div>
      </div>
      <form className="manga-panel profile-settings-form" onSubmit={submit}>
        <div className="profile-settings-fields">
          <div className="field"><label htmlFor="profile-name">Nome público</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required /></div>
          <div className="field"><label htmlFor="profile-image">URL do avatar <span>(opcional)</span></label><input id="profile-image" type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://…" /></div>
        </div>
        <div className="field"><label htmlFor="profile-bio">Sobre você <span>(opcional)</span></label><textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} placeholder="O que você gosta de encontrar em uma boa história?" /><span className="hint">{bio.length}/240</span></div>
        <div className="field"><label htmlFor="profile-genre">Gênero favorito <span>(opcional)</span></label><select id="profile-genre" value={favoriteGenre} onChange={(event) => setFavoriteGenre(event.target.value)}><option value="">Prefiro não escolher</option>{GENRES.map((genre) => <option key={genre.slug} value={genre.name}>{genre.name}</option>)}</select></div>
        <fieldset className="privacy-options"><legend><IconEye size={16} /> No meu perfil público</legend>
          <label><input type="checkbox" checked={favoritesPublic} onChange={(event) => setFavoritesPublic(event.target.checked)} /><span><strong>Mostrar favoritas</strong><small>Outros leitores poderão ver as obras guardadas na sua estante.</small></span></label>
          <label><input type="checkbox" checked={commentsPublic} onChange={(event) => setCommentsPublic(event.target.checked)} /><span><strong>Mostrar comentários</strong><small>Sua atividade recente aparecerá no perfil público.</small></span></label>
        </fieldset>
        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-success" role="status">{message}</div>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar identidade e privacidade"}</button>
      </form>
    </section>
  );
}
