import type { Metadata } from "next";
import Link from "next/link";
import { CommentLikeButton, FollowButton } from "@/components/community/community-actions";
import { CommentContent } from "@/components/reader/comment-actions";
import { AuthorName } from "@/components/reader/comment-head";
import { IconArrowRight, IconChat, IconHeart, IconUsers } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getCommunityMembers } from "@/features/catalog/queries";
import { getLatestComments } from "@/features/comments/queries";
import { authPath } from "@/lib/navigation";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Comunidade", description: "Leitores, conversas e descobertas que continuam além do último quadro." };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const viewer = await getCurrentUser();
  const [activity, members] = await Promise.all([getLatestComments(24, viewer?.id), getCommunityMembers(10, viewer?.id)]);
  const visibleMembers = members.filter((member) => member.id !== viewer?.id);
  return <>
    <section className="community-hero"><div><h1>A história termina.<br />A conversa continua.</h1><p>Encontre outros leitores, compartilhe teorias e acompanhe quem sempre percebe um detalhe que passou despercebido.</p><div className="community-hero-actions">{viewer ? <Link className="btn" href="/notificacoes">Ver minhas notificações <IconArrowRight size={15} /></Link> : <Link className="btn" href={authPath("cadastro", "/comunidade", "comunidade")}>Entrar para a conversa <IconArrowRight size={15} /></Link>}<Link className="btn ghost" href="/obras">Encontrar uma leitura</Link></div></div><div className="community-signal" aria-label="A comunidade em movimento"><IconUsers size={30} /><strong>{members.length}</strong><span>vozes para conhecer</span><small>sem ranking de popularidade: boas conversas vêm primeiro</small></div></section>

    <section className="section community-people" aria-labelledby="people-title"><div className="section-head"><div><h2 id="people-title"><IconUsers size={19} /> Pessoas para acompanhar</h2><p className="section-description">Perfis com participação recente na estante.</p></div></div>{visibleMembers.length ? <div className="people-grid">{visibleMembers.map((member) => <article key={member.id} className="reader-card"><Link href={`/leitores/${member.id}`} className="reader-card-main"><span className="profile-avatar small">{member.image ? <img src={member.image} alt="" /> : initials(member.name)}</span><span><strong>{member.name}</strong>{member.role === "admin" && <small className="author-line">autor do estúdio</small>}{member.favoriteGenre && <small>prefere {member.favoriteGenre}</small>}</span></Link>{member.bio && <p>{member.bio}</p>}<div className="reader-card-stats"><span><IconChat size={13} /> {member.comments}</span><span><IconHeart size={13} /> {member.likes}</span><span><IconUsers size={13} /> {member.followers}</span></div>{viewer ? <FollowButton targetUserId={member.id} initialFollowing={member.followedByViewer} /> : <Link className="btn ghost small" href={authPath("entrar", `/leitores/${member.id}`, "seguir")}>Entrar para acompanhar</Link>}</article>)}</div> : <div className="manga-panel empty-state"><div className="empty-title">Os primeiros leitores estão chegando</div><p>Quando alguém participar das conversas, os perfis aparecerão aqui.</p></div>}</section>

    <section className="section community-feed" aria-labelledby="feed-title"><div className="section-head"><div><h2 id="feed-title"><IconChat size={19} /> Conversas recentes</h2><p className="section-description">Ideias, reações e teorias publicadas nas obras e capítulos.</p></div></div>{activity.length ? <div className="community-feed-list">{activity.map((comment) => { const href = comment.chapterId != null ? `/capitulo/${comment.chapterId}#comentario-${comment.id}` : `/obra/${comment.seriesSlug}#comentario-${comment.id}`; return <article key={comment.id} className={`manga-panel community-post ${comment.pinned ? "is-pinned" : ""}`}><div className="cm-head"><span className="cm-avatar">{initials(comment.authorName)}</span><AuthorName authorId={comment.authorId} name={comment.authorName} role={comment.authorRole} /><span className="cm-date">{formatDate(comment.createdAt)}</span></div><CommentContent commentId={comment.id} content={comment.content} spoiler={comment.spoiler} edited={Boolean(comment.editedAt)} canEdit={false} /><div className="community-post-context"><Link href={href}>em {comment.seriesTitle}{comment.chapterNumber != null ? ` — ${chapterLabel(comment.chapterNumber)}` : ""} <IconArrowRight size={12} /></Link><span className="thread-actions"><CommentLikeButton commentId={comment.id} initialLiked={comment.likedByViewer} initialCount={comment.likeCount} loginHref={viewer ? undefined : authPath("entrar", href, "comunidade")} />{comment.replyCount > 0 && <span>{comment.replyCount} {comment.replyCount === 1 ? "resposta" : "respostas"}</span>}</span></div></article>; })}</div> : <div className="manga-panel empty-state"><div className="empty-title">A conversa ainda vai começar</div><p>Leia um capítulo e seja a primeira pessoa a deixar uma impressão.</p><Link className="btn" href="/obras">Escolher uma história</Link></div>}</section>
  </>;
}
