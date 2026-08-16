"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addReplyAction, toggleCommentLikeAction, togglePinnedCommentAction } from "@/features/comments/actions";
import { toggleFollowAction } from "@/features/notifications/actions";
import { IconHeart, IconPin, IconReply, IconUsers } from "@/components/ui/icons";

export function CommentLikeButton({ commentId, initialLiked, initialCount, loginHref }: { commentId: number; initialLiked: boolean; initialCount: number; loginHref?: string }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (loginHref) return <Link className="cm-tool" href={loginHref}><IconHeart size={13} /> {count || "Curtir"}</Link>;
  async function toggle() {
    if (busy) return;
    setBusy(true); setError("");
    const result = await toggleCommentLikeAction(commentId);
    if (result.ok) {
      setLiked(result.liked);
      setCount((value) => Math.max(0, value + (result.liked ? 1 : -1)));
    } else setError(result.error);
    setBusy(false);
  }
  return <span className="cm-inline-action"><button type="button" className={`cm-tool ${liked ? "is-active" : ""}`} onClick={toggle} disabled={busy} aria-pressed={liked}><IconHeart size={13} /> {count || "Curtir"}</button>{error && <span className="cm-tool-message" role="alert">{error}</span>}</span>;
}

export function ReplyComposer({ parentId }: { parentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    const result = await addReplyAction(parentId, { content, spoiler });
    if (result.ok) {
      setContent(""); setSpoiler(false); setOpen(false); router.refresh();
    } else setError(result.error);
    setBusy(false);
  }
  return <div className="reply-composer"><button type="button" className="cm-tool" onClick={() => setOpen((value) => !value)} aria-expanded={open}><IconReply size={13} /> Responder</button>{open && <div className="reply-form"><label htmlFor={`reply-${parentId}`}>Sua resposta</label><textarea id={`reply-${parentId}`} value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} rows={3} placeholder="Continue a conversa com respeito…" /><label className="cm-spoiler-toggle"><input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} /> Contém spoiler</label>{error && <div className="form-error" role="alert">{error}</div>}<div className="row"><button type="button" className="btn small" onClick={submit} disabled={busy || !content.trim()}>{busy ? "Publicando…" : "Publicar resposta"}</button><button type="button" className="btn small ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</button></div></div>}</div>;
}

export function PinCommentButton({ commentId, initialPinned }: { commentId: number; initialPinned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const result = await togglePinnedCommentAction(commentId);
    if (result.ok) router.refresh(); else window.alert(result.error);
    setBusy(false);
  }
  return <button type="button" className={`cm-tool ${initialPinned ? "is-active" : ""}`} onClick={toggle} disabled={busy}><IconPin size={13} /> {initialPinned ? "Desafixar" : "Destacar"}</button>;
}

export function FollowButton({ targetUserId, initialFollowing }: { targetUserId: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setBusy(true); setError("");
    const result = await toggleFollowAction(targetUserId);
    if (result.ok) { setFollowing(result.following); router.refresh(); } else setError(result.error);
    setBusy(false);
  }
  return <div className="follow-control"><button type="button" className={following ? "btn ghost" : "btn"} onClick={toggle} disabled={busy} aria-pressed={following}><IconUsers size={15} /> {busy ? "Salvando…" : following ? "Acompanhando" : "Acompanhar leitor"}</button>{error && <span className="form-error" role="alert">{error}</span>}</div>;
}
