"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClubPostAction, deleteClubPostAction, togglePostReactionAction, votePollAction } from "@/features/clubs/actions";
import { IconChat, IconLightbulb, IconPoll, IconTrash } from "@/components/ui/icons";
import { trackProductEvent } from "@/lib/analytics-client";

export function ClubComposer({ seriesId, chapters }: { seriesId: number; chapters: { id: number; number: number; title: string }[] }) {
  const router = useRouter();
  const [type, setType] = useState<"discussion" | "theory" | "poll">("discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [options, setOptions] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createClubPostAction({ seriesId, type, title, content, chapterId: chapterId ? Number(chapterId) : null, spoiler, options });
      if (!result.ok) return setError(result.error);
      trackProductEvent("club_post", { seriesId, chapterId: chapterId ? Number(chapterId) : undefined });
      setTitle(""); setContent(""); setChapterId(""); setSpoiler(false); setOptions(["", "", ""]);
      router.refresh();
    });
  }

  const types = [
    { value: "discussion" as const, label: "Conversa", icon: <IconChat size={15} /> },
    { value: "theory" as const, label: "Teoria", icon: <IconLightbulb size={15} /> },
    { value: "poll" as const, label: "Enquete", icon: <IconPoll size={15} /> },
  ];

  return <form className="club-composer" onSubmit={submit}>
    <div className="club-type-tabs" role="radiogroup" aria-label="Tipo de publicação">{types.map((item) => <button key={item.value} type="button" role="radio" aria-checked={type === item.value} onClick={() => setType(item.value)}>{item.icon}{item.label}</button>)}</div>
    <div className="field"><label htmlFor="club-title">{type === "poll" ? "Pergunta" : "Título"}</label><input id="club-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder={type === "theory" ? "A pista que sustenta sua teoria" : type === "poll" ? "O que você quer perguntar ao clube?" : "Dê um ponto de partida para a conversa"} required /></div>
    <div className="club-composer-row"><div className="field"><label htmlFor="club-chapter">Contexto <span className="muted">(opcional)</span></label><select id="club-chapter" value={chapterId} onChange={(event) => setChapterId(event.target.value)}><option value="">Obra inteira</option>{chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>Cap. {chapter.number}{chapter.title ? ` — ${chapter.title}` : ""}</option>)}</select></div><label className="club-spoiler-check"><input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} /> A publicação contém spoiler</label></div>
    {type === "poll" ? <div className="poll-option-fields">{options.map((option, index) => <div className="field" key={index}><label htmlFor={`poll-option-${index}`}>Opção {index + 1}</label><input id={`poll-option-${index}`} value={option} onChange={(event) => setOptions((current) => current.map((value, position) => position === index ? event.target.value : value))} maxLength={100} required={index < 2} /></div>)}</div> : <div className="field"><label htmlFor="club-content">Desenvolva a ideia</label><textarea id="club-content" value={content} onChange={(event) => setContent(event.target.value)} rows={4} maxLength={1600} placeholder="Use ||trecho|| para esconder apenas uma parte com spoiler." required /></div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <button type="submit" className="btn" disabled={pending}>{pending ? "Publicando…" : type === "poll" ? "Abrir enquete" : type === "theory" ? "Publicar teoria" : "Iniciar conversa"}</button>
  </form>;
}

export function ClubReactions({ postId, reactions, authenticated, loginHref }: { postId: number; reactions: { reaction: string; count: number; mine: boolean }[]; authenticated: boolean; loginHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const labels: Record<string, string> = { insight: "Boa leitura", agree: "Também acho", curious: "Quero saber" };
  if (!authenticated) return <Link className="club-login-action" href={loginHref}>Entre para reagir</Link>;
  return <div className="club-reactions">{reactions.map((item) => <button key={item.reaction} type="button" aria-pressed={item.mine} disabled={pending} onClick={() => startTransition(async () => { await togglePostReactionAction(postId, item.reaction); router.refresh(); })}><span>{labels[item.reaction]}</span>{item.count > 0 && <b>{item.count}</b>}</button>)}</div>;
}

export function ClubPoll({ postId, options, totalVotes, myVote, authenticated, loginHref, seriesId }: { postId: number; options: { id: number; label: string; votes: number }[]; totalVotes: number; myVote: number | null; authenticated: boolean; loginHref: string; seriesId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="club-poll">{options.map((option) => { const percentage = totalVotes ? Math.round(option.votes / totalVotes * 100) : 0; return authenticated ? <button key={option.id} type="button" aria-pressed={myVote === option.id} disabled={pending} onClick={() => startTransition(async () => { const result = await votePollAction(postId, option.id); if (result.ok) { trackProductEvent("poll_vote", { seriesId }); router.refresh(); } })}><span className="club-poll-fill" style={{ transform: `scaleX(${percentage / 100})` }} aria-hidden="true" /><span>{option.label}</span><b>{percentage}%</b></button> : <div key={option.id}><span className="club-poll-fill" style={{ transform: `scaleX(${percentage / 100})` }} aria-hidden="true" /><span>{option.label}</span><b>{percentage}%</b></div>; })}<small>{totalVotes} {totalVotes === 1 ? "voto" : "votos"}{!authenticated && <> · <Link href={loginHref}>entre para votar</Link></>}</small></div>;
}

export function DeleteClubPost({ postId }: { postId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="club-delete" disabled={pending} aria-label="Apagar publicação" onClick={() => window.confirm("Apagar esta publicação?") && startTransition(async () => { const result = await deleteClubPostAction(postId); if (result.ok) router.refresh(); })}><IconTrash size={13} /></button>;
}
