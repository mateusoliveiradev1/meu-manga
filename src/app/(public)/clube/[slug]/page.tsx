import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClubComposer, ClubPoll, ClubReactions, DeleteClubPost } from "@/components/community/club-actions";
import { SpoilerText } from "@/components/community/spoiler-text";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowLeft, IconChat, IconLightbulb, IconPoll, IconUsers } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getChaptersBySeries, getSeriesBySlug } from "@/features/catalog/queries";
import { getClubPosts } from "@/features/clubs/queries";
import { authPath } from "@/lib/navigation";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const work = await getSeriesBySlug(slug);
  return work ? { title: `Clube de ${work.title}`, description: `Teorias, enquetes e conversas dos leitores de ${work.title}.` } : { title: "Clube não encontrado" };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const work = await getSeriesBySlug(slug, user?.id);
  if (!work) notFound();
  const [chapters, posts] = await Promise.all([getChaptersBySeries(work.id, true), getClubPosts(work.id, user?.id)]);
  const loginHref = authPath("entrar", `/clube/${slug}`, "clube");
  const icon = (type: string) => type === "theory" ? <IconLightbulb size={15} /> : type === "poll" ? <IconPoll size={15} /> : <IconChat size={15} />;
  return <>
    <Link className="btn ghost small mt-2" href={`/obra/${slug}`}><IconArrowLeft size={14} /> Voltar à obra</Link>
    <section className="club-hero"><div className="club-cover"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="150px" priority /></div><div><span><IconUsers size={16} /> Clube de leitura</span><h1>{work.title}</h1><p>Um espaço por obra para teorias, enquetes e conversas que continuam depois da última página.</p><small>{posts.length} {posts.length === 1 ? "publicação" : "publicações"} · spoilers sempre sinalizados</small></div></section>
    <section className="club-compose-section" aria-labelledby="club-compose-title"><div><h2 id="club-compose-title">Coloque uma ideia na mesa</h2><p>Uma pergunta específica costuma abrir conversas melhores que uma opinião solta.</p></div>{user ? <ClubComposer seriesId={work.id} chapters={chapters.map(({ id, number, title }) => ({ id, number, title }))} /> : <div className="manga-panel club-auth-callout"><strong>Sua voz entra com uma conta</strong><p>Entre para publicar teorias, abrir enquetes e reagir sem perder o contexto da obra.</p><Link className="btn" href={loginHref}>Entrar no clube</Link></div>}</section>
    <section className="section" aria-labelledby="club-feed-title"><div className="section-head"><div><h2 id="club-feed-title">Mesa do clube</h2><p className="section-description">As conversas mais recentes aparecem primeiro.</p></div></div>{posts.length ? <div className="club-feed">{posts.map(({ post, authorName, authorRole, chapterNumber, options, totalVotes, myVote, reactions }) => <article key={post.id} className="club-post"><header><span className="cm-avatar">{initials(authorName)}</span><div><strong>{authorName}{authorRole === "admin" && <small>autor</small>}</strong><span>{formatDate(post.createdAt)}{chapterNumber != null ? ` · ${chapterLabel(chapterNumber)}` : " · obra inteira"}</span></div><span className={`club-post-type ${post.type}`}>{icon(post.type)}{post.type === "theory" ? "Teoria" : post.type === "poll" ? "Enquete" : "Conversa"}</span>{user && (user.id === post.userId || user.role === "admin") && <DeleteClubPost postId={post.id} />}</header><h3>{post.title}</h3>{post.spoiler ? <details className="club-spoiler"><summary>Esta publicação contém spoiler — revelar</summary>{post.content && <SpoilerText content={post.content} className="club-post-copy" />}{post.type === "poll" && <ClubPoll postId={post.id} options={options} totalVotes={totalVotes} myVote={myVote} authenticated={Boolean(user)} loginHref={loginHref} seriesId={work.id} />}</details> : <>{post.content && <SpoilerText content={post.content} className="club-post-copy" />}{post.type === "poll" && <ClubPoll postId={post.id} options={options} totalVotes={totalVotes} myVote={myVote} authenticated={Boolean(user)} loginHref={loginHref} seriesId={work.id} />}</>}<ClubReactions postId={post.id} reactions={reactions} authenticated={Boolean(user)} loginHref={loginHref} /></article>)}</div> : <div className="manga-panel empty-state"><div className="empty-title">A mesa está pronta para a primeira ideia</div><p>Abra uma teoria, uma enquete ou uma conversa ligada a um capítulo.</p></div>}</section>
  </>;
}
