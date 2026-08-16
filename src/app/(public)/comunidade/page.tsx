import type { Metadata } from "next";
import Link from "next/link";
import { CommentLikeButton, FollowButton } from "@/components/community/community-actions";
import { CommentContent } from "@/components/reader/comment-actions";
import { AuthorName } from "@/components/reader/comment-head";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconBook, IconChat, IconHeart, IconUsers } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getCommunityMembers, getLatestChapters } from "@/features/catalog/queries";
import { getLatestComments } from "@/features/comments/queries";
import { getClubIndex } from "@/features/clubs/queries";
import { authPath } from "@/lib/navigation";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Comunidade", description: "Leitores, conversas e descobertas que continuam além do último quadro." };
export const dynamic = "force-dynamic";

const STARTER_PROMPTS = [
  "Qual detalhe mudou sua leitura deste capítulo?",
  "Que teoria você levaria para o próximo capítulo?",
  "Qual momento merece uma segunda leitura?",
];

export default async function CommunityPage() {
  const viewer = await getCurrentUser();
  const [activity, members, latestChapters, clubs] = await Promise.all([
    getLatestComments(24, viewer?.id),
    getCommunityMembers(10, viewer?.id),
    getLatestChapters(3),
    getClubIndex(6),
  ]);
  const visibleMembers = members.filter((member) => member.id !== viewer?.id && (member.comments > 0 || member.likes > 0 || member.followers > 0));
  const communityReady = activity.length >= 6 && visibleMembers.length >= 3;
  const voiceCount = visibleMembers.length;
  const hasStarters = latestChapters.length > 0;
  const formingDestination = hasStarters ? "#perguntas" : "/obras";

  return (
    <>
      <section className={`community-hero ${communityReady ? "" : "is-forming"}`}>
        <div>
          <h1>{communityReady ? <>A história termina. <span>A conversa continua.</span></> : <>A primeira conversa <span>começa com uma boa pergunta.</span></>}</h1>
          <p>{communityReady ? "Encontre outros leitores, compartilhe teorias e acompanhe quem sempre percebe um detalhe que passou despercebido." : "A comunidade está abrindo as portas. Escolha um capítulo, compartilhe uma impressão e ajude a dar o tom das primeiras conversas."}</p>
          <div className="community-hero-actions">
            {viewer ? <Link className="btn" href={communityReady ? "#feed-title" : formingDestination}>{communityReady ? "Ver conversas recentes" : hasStarters ? "Escolher uma pergunta" : "Encontrar uma leitura"} <IconArrowRight size={15} /></Link> : <Link className="btn" href={authPath("cadastro", communityReady ? "/comunidade#feed-title" : hasStarters ? "/comunidade#perguntas" : "/obras", "comunidade")}>Entrar para a conversa <IconArrowRight size={15} /></Link>}
            <Link className="btn ghost" href="/obras">Encontrar uma leitura</Link>
          </div>
        </div>
        <div className="community-signal" aria-label={voiceCount === 1 ? "1 voz participando" : `${voiceCount} vozes participando`}>
          <IconUsers size={30} />
          <strong>{voiceCount}</strong>
          <span>{voiceCount === 1 ? "voz participando" : "vozes participando"}</span>
          <small>{voiceCount ? "sem ranking de popularidade: boas conversas vêm primeiro" : "a primeira voz não precisa falar mais alto — só precisa começar"}</small>
        </div>
      </section>

      {!communityReady && hasStarters && (
        <section id="perguntas" className="section conversation-starters" aria-labelledby="starters-title">
          <div className="section-head">
            <div><h2 id="starters-title"><IconBook size={19} /> Perguntas para abrir a conversa</h2><p className="section-description">Um ponto de partida para comentar sem precisar chegar com uma análise pronta.</p></div>
          </div>
          <div className="starter-grid">
            {latestChapters.map((chapter, index) => (
              <Link key={chapter.id} href={`/capitulo/${chapter.id}#comentarios`} className="starter-card">
                <span className="starter-cover"><ResponsiveImage src={chapter.cover || chapter.seriesCover} alt={`Capa de ${chapter.seriesTitle}`} sizes="72px" width={72} height={96} /></span>
                <span className="starter-copy"><small>{chapter.seriesTitle} · {chapterLabel(chapter.number)}</small><strong>{STARTER_PROMPTS[index % STARTER_PROMPTS.length]}</strong><span>Responder depois da leitura <IconArrowRight size={13} /></span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section community-clubs" aria-labelledby="clubs-title">
        <div className="section-head"><div><h2 id="clubs-title"><IconUsers size={19} /> Clubes por obra</h2><p className="section-description">Teorias, enquetes e conversas ficam juntas da história que deu origem a elas.</p></div></div>
        <div className="club-index">{clubs.map(({ work, postCount, chapterCount }) => <Link key={work.id} href={`/clube/${work.slug}`}><span className="starter-cover"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="64px" width={64} height={86} /></span><span><strong>{work.title}</strong><small>{postCount ? `${postCount} ${postCount === 1 ? "publicação" : "publicações"}` : "mesa pronta para começar"} · {chapterCount} {chapterCount === 1 ? "capítulo" : "capítulos"}</small></span><IconArrowRight size={14} /></Link>)}</div>
      </section>

      <section className="section community-feed" aria-labelledby="feed-title">
        <div className="section-head"><div><h2 id="feed-title"><IconChat size={19} /> Conversas recentes</h2><p className="section-description">Ideias, reações e teorias publicadas nas obras e capítulos.</p></div></div>
        {activity.length ? (
          <div className="community-feed-list">
            {activity.map((comment) => {
              const href = comment.chapterId != null ? `/capitulo/${comment.chapterId}#comentario-${comment.id}` : `/obra/${comment.seriesSlug}#comentario-${comment.id}`;
              return (
                <article key={comment.id} className={`manga-panel community-post ${comment.pinned ? "is-pinned" : ""}`}>
                  <div className="cm-head"><span className="cm-avatar">{initials(comment.authorName)}</span><AuthorName authorId={comment.authorId} name={comment.authorName} role={comment.authorRole} /><span className="cm-date">{formatDate(comment.createdAt)}</span></div>
                  <CommentContent commentId={comment.id} content={comment.content} spoiler={comment.spoiler} edited={Boolean(comment.editedAt)} canEdit={false} />
                  <div className="community-post-context"><Link href={href}>em {comment.seriesTitle}{comment.chapterNumber != null ? ` — ${chapterLabel(comment.chapterNumber)}` : ""} <IconArrowRight size={12} /></Link><span className="thread-actions"><CommentLikeButton commentId={comment.id} initialLiked={comment.likedByViewer} initialCount={comment.likeCount} loginHref={viewer ? undefined : authPath("entrar", href, "comunidade")} />{comment.replyCount > 0 && <span>{comment.replyCount} {comment.replyCount === 1 ? "resposta" : "respostas"}</span>}</span></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="manga-panel empty-state"><div className="empty-title">A conversa ainda vai começar</div><p>{hasStarters ? "Escolha uma pergunta acima, leia o capítulo e deixe a primeira impressão." : "Escolha uma obra, leia um capítulo e deixe a primeira impressão."}</p><Link className="btn" href={formingDestination}>{hasStarters ? "Ver perguntas" : "Explorar a estante"}</Link></div>
        )}
      </section>

      <section className="section community-people" aria-labelledby="people-title">
        <div className="section-head"><div><h2 id="people-title"><IconUsers size={19} /> Pessoas para acompanhar</h2><p className="section-description">Perfis que já participaram das conversas da estante.</p></div></div>
        {visibleMembers.length ? (
          <div className="people-grid">
            {visibleMembers.map((member) => (
              <article key={member.id} className="reader-card">
                <Link href={`/leitores/${member.id}`} className="reader-card-main"><span className="profile-avatar small">{member.image ? <img src={member.image} alt="" /> : initials(member.name)}</span><span><strong>{member.name}</strong>{member.role === "admin" && <small className="author-line">autor do estúdio</small>}{member.favoriteGenre && <small>prefere {member.favoriteGenre}</small>}</span></Link>
                {member.bio && <p>{member.bio}</p>}
                <div className="reader-card-stats"><span><IconChat size={13} /> {member.comments}</span><span><IconHeart size={13} /> {member.likes}</span><span><IconUsers size={13} /> {member.followers}</span></div>
                {viewer ? <FollowButton targetUserId={member.id} initialFollowing={member.followedByViewer} /> : <Link className="btn ghost small" href={authPath("entrar", `/leitores/${member.id}`, "seguir")}>Entrar para acompanhar</Link>}
              </article>
            ))}
          </div>
        ) : (
          <div className="community-people-pending"><IconUsers size={22} /><div><strong>Perfis aparecem depois da participação</strong><p>Assim ninguém é promovido apenas por ter uma conta. Comente, responda ou acompanhe uma conversa para entrar nesta descoberta.</p></div></div>
        )}
      </section>
    </>
  );
}
