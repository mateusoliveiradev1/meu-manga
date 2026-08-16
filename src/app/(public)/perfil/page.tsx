import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getUserFavorites, getUserProgress } from "@/features/catalog/queries";
import { getCommentsByUser } from "@/features/comments/queries";
import { CommentContent, DeleteComment } from "@/components/reader/comment-actions";
import { IconArrowRight, IconBook, IconChat, IconEye, IconGear, IconStar } from "@/components/ui/icons";
import { AccountSecurity } from "@/components/profile/account-security";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const [favs, progress, myComments] = await Promise.all([
    getUserFavorites(user.id),
    getUserProgress(user.id),
    getCommentsByUser(user.id, 10),
  ]);

  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const inProgress = progress.filter((p) => p.totalPages > 0 && p.page < p.totalPages - 1).length;

  return (
    <>
      <section className="manga-panel profile-card" aria-label="Seu perfil">
        <span className="profile-avatar">{initials(user.name)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="profile-name">{user.name}</div>
          <div className="profile-mail mono-num">{user.email}</div>
          <div className="row" style={{ marginTop: "0.55rem", flexWrap: "wrap" }}>
            {user.role === "admin" && (
              <span className="badge">
                <span className="badge-dot" aria-hidden="true" /> autor(a) do estúdio
              </span>
            )}
            <span className="badge">{createdAt ? `membro desde ${formatDate(createdAt)}` : "membro"}</span>
          </div>
        </div>
        <div className="profile-stats" role="list" aria-label="Suas estatísticas">
          <div className="profile-stat" role="listitem">
            <span className="mono-num">{progress.length}</span>
            <span className="stat-label">
              <IconBook size={12} /> em andamento
            </span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="mono-num">{favs.length}</span>
            <span className="stat-label">
              <IconStar size={12} /> favoritas
            </span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="mono-num">{myComments.length}+</span>
            <span className="stat-label">
              <IconChat size={12} /> comentários
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/leitores/${user.id}`} className="btn ghost small">
            <IconEye size={14} /> Perfil público
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="btn ghost small">
              <IconGear size={14} /> Painel
            </Link>
          )}
        </div>
      </section>

      <section className="section" aria-label="Continuar lendo">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              01
            </span>
            <h2>
              <IconBook size={18} /> Continuar lendo
            </h2>
          </div>
          <span className="section-sub">
            {inProgress > 0 ? `${inProgress} ${inProgress === 1 ? "obra no meio" : "obras no meio"} — de onde você parou` : "sua estante de leituras"}
          </span>
        </div>
        {progress.length === 0 ? (
          <div className="manga-panel empty-state">
            <p>Você ainda não começou nenhuma leitura. Explore as obras e boa leitura!</p>
          </div>
        ) : (
          <div className="manga-panel chapter-list">
            {progress.map((p) => {
              const frac = p.totalPages > 0 ? Math.min(1, Math.max(0, p.page / Math.max(1, p.totalPages - 1))) : 0;
              const done = frac >= 0.99;
              return (
                <Link key={p.chapterId} href={`/ler/${p.chapterId}`} className="progress-row">
                  {p.seriesCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="progress-cover" src={p.seriesCover} alt="" loading="lazy" />
                  ) : (
                    <span className="progress-cover placeholder" aria-hidden="true" />
                  )}
                  <div className="progress-body">
                    <div className="progress-title">
                      <span className="ch-title">{p.seriesTitle}</span>
                      <span className="ch-meta">
                        {chapterLabel(p.chapterNumber)}
                        {p.chapterTitle ? ` — ${p.chapterTitle}` : ""}
                      </span>
                    </div>
                    <div className="progress-track" aria-hidden="true">
                      <div className="progress-fill" style={{ transform: `scaleX(${frac})` }} />
                    </div>
                    <div className="progress-foot">
                      <span className="muted">
                        {done
                          ? "capítulo concluído"
                          : p.totalPages > 0
                            ? `página ${p.page + 1} de ${p.totalPages}`
                            : `página ${p.page + 1}`}
                      </span>
                      <span className="progress-go">
                        {done ? "Reler" : "Continuar"} <IconArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="section" aria-label="Favoritas">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              02
            </span>
            <h2>
              <IconStar size={18} /> Favoritas
            </h2>
          </div>
          <span className="section-sub">
            {favs.length} {favs.length === 1 ? "obra guardada" : "obras guardadas"}
          </span>
        </div>
        {favs.length === 0 ? (
          <div className="manga-panel empty-state">
            <p>Nada por aqui ainda — toque na estrela de uma obra para guardá-la.</p>
          </div>
        ) : (
          <div className="row" style={{ gap: "0.9rem" }}>
            {favs.map(({ s }) => (
              <Link key={s.id} href={`/obra/${s.slug}`} className="profile-fav">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover || "/samples/cover-farol.svg"} alt="" />
                <span>{s.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-label="Meus comentários">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              03
            </span>
            <h2>
              <IconChat size={18} /> Meus comentários
            </h2>
          </div>
          <span className="section-sub">o que você escreveu por aqui</span>
        </div>
        {myComments.length === 0 ? (
          <div className="manga-panel empty-state">
            <p>Você ainda não comentou em nenhum capítulo. Depois de ler, deixe sua opinião!</p>
          </div>
        ) : (
          <div className="stack">
            {myComments.map((c) => (
              <div key={c.id} className="manga-panel cm-entry">
                <div className="cm-head">
                  <span className="cm-avatar">{initials(c.authorName)}</span>
                  <span className="cm-name">{c.authorName}</span>
                  <span className="cm-date">
                    {formatDate(c.createdAt)} · em{" "}
                    {c.chapterId != null && c.chapterNumber != null ? (
                      <Link href={`/ler/${c.chapterId}`}>
                        {c.seriesTitle} — {chapterLabel(c.chapterNumber)}
                      </Link>
                    ) : (
                      <Link href={`/obra/${c.seriesSlug}`}>{c.seriesTitle}</Link>
                    )}
                  </span>
                  <DeleteComment commentId={c.id} />
                </div>
                <CommentContent commentId={c.id} content={c.content} spoiler={c.spoiler} edited={Boolean(c.editedAt)} canEdit />
              </div>
            ))}
          </div>
        )}
      </section>
      <AccountSecurity canDelete={user.role !== "admin"} />
    </>
  );
}
