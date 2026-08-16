"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommentAction, moderateCommentAction, reportCommentAction, updateCommentAction } from "@/features/comments/actions";
import { IconEdit, IconEye, IconEyeOff, IconFlag, IconTrash } from "@/components/ui/icons";
import { SpoilerText } from "@/components/community/spoiler-text";

export function DeleteComment({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!window.confirm("Apagar este comentário?")) return;
    setBusy(true);
    const res = await deleteCommentAction(commentId);
    if (res.ok) router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" className="btn small ghost" onClick={del} disabled={busy} aria-label="Apagar comentário" style={{ marginLeft: "auto" }}>
      <IconTrash size={13} />
    </button>
  );
}

export function CommentContent({
  commentId,
  content,
  spoiler,
  edited,
  canEdit,
}: {
  commentId: number;
  content: string;
  spoiler: boolean;
  edited: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(!spoiler);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [draftSpoiler, setDraftSpoiler] = useState(spoiler);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const result = await updateCommentAction(commentId, { content: draft, spoiler: draftSpoiler });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setEditing(false);
    setRevealed(!draftSpoiler);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="cm-edit-form">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} rows={3} />
        <label><input type="checkbox" checked={draftSpoiler} onChange={(event) => setDraftSpoiler(event.target.checked)} /> Contém spoiler</label>
        {error && <span className="form-error">{error}</span>}
        <div className="row">
          <button type="button" className="btn small" onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
          <button type="button" className="btn small ghost" onClick={() => setEditing(false)} disabled={busy}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-content">
      {spoiler && !revealed ? (
        <button type="button" className="cm-spoiler" onClick={() => setRevealed(true)}>
          Spoiler oculto — tocar para revelar
        </button>
      ) : (
        <SpoilerText content={content} />
      )}
      <div className="cm-content-meta">
        {edited && <span>editado</span>}
        {canEdit && <button type="button" className="cm-tool" onClick={() => setEditing(true)}><IconEdit size={12} /> Editar</button>}
      </div>
    </div>
  );
}

export function ReportComment({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<"spam" | "abuse" | "spoiler" | "other">("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    const result = await reportCommentAction(commentId, { reason, details });
    if (result.ok) {
      setMessage("Denúncia enviada para moderação.");
      setOpen(false);
      router.refresh();
    } else {
      setMessage(result.error);
    }
    setBusy(false);
  }

  return (
    <div className="cm-report">
      <button
        type="button"
        className="cm-tool"
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
        }}
        aria-expanded={open}
      >
        <IconFlag size={13} /> Denunciar
      </button>
      {open && (
        <div className="cm-report-form">
          <label>
            Motivo
            <select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)}>
              <option value="spam">Spam</option>
              <option value="abuse">Abuso ou assédio</option>
              <option value="spoiler">Spoiler sem aviso</option>
              <option value="other">Outro</option>
            </select>
          </label>
          <label>
            Detalhes opcionais
            <input value={details} onChange={(event) => setDetails(event.target.value)} maxLength={240} />
          </label>
          <div className="cm-report-buttons">
            <button type="button" className="btn small" onClick={submit} disabled={busy}>
              {busy ? "Enviando…" : "Enviar denúncia"}
            </button>
            <button type="button" className="btn small ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {message && <span className="cm-tool-message" aria-live="polite">{message}</span>}
    </div>
  );
}

export function ModerateComment({ commentId, hidden }: { commentId: number; hidden: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function moderate() {
    if (!hidden && !window.confirm("Ocultar este comentário dos leitores?")) return;
    setBusy(true);
    const result = await moderateCommentAction(commentId, hidden ? "restore" : "hide");
    if (result.ok) router.refresh();
    else window.alert(result.error);
    setBusy(false);
  }

  return (
    <button type="button" className="btn small ghost" onClick={moderate} disabled={busy}>
      {hidden ? <IconEye size={13} /> : <IconEyeOff size={13} />}
      {busy ? "Salvando…" : hidden ? "Restaurar" : "Ocultar"}
    </button>
  );
}
