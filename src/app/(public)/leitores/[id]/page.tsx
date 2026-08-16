import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconChat, IconStar } from "@/components/ui/icons";
import { getPublicProfile, getUserFavorites } from "@/features/catalog/queries";
import { getCommentsByUser } from "@/features/comments/queries";
import { chapterLabel, formatDate, formatNumber, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return { title: profile ? profile.name : "Leitor não encontrado" };
}

export default async function ReaderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const [favs, comments] = await Promise.all([
    profile.favoritesPublic ? getUserFavorites(id) : Promise.resolve([]),
    profile.commentsPublic ? getCommentsByUser(id, 20) : Promise.resolve([]),
  ]);
  const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;

  return (
    <>
      <div className="mt-2">
        <Link href="/" className="btn ghost small">
          <IconArrowLeft size={14} /> Voltar às obras
        </Link>
      </div>

      <section className="manga-panel profile-card" aria-label={`Perfil de ${profile.name}`}>
        {profile.image ? <img className="profile-avatar profile-avatar-image" src={profile.image} alt="" /> : <span className="profile-avatar">{initials(profile.name)}</span>}
        <div style={{ minWidth: 0 }}>
          <div className="profile-name">{profile.name}</div>
          <div className="row" style={{ marginTop: "0.55rem" }}>
            {profile.role === "admin" && (
              <span className="badge">
                <span className="badge-dot" aria-hidden="true" /> autor(a) do estúdio
              </span>
            )}
            <span className="badge">{createdAt ? `membro desde ${formatDate(createdAt)}` : "membro"}</span>
            {profile.favoritesPublic && <span className="badge">{formatNumber(profile.favoriteCount)} favoritas</span>}
            {profile.commentsPublic && <span className="badge">{formatNumber(profile.commentCount)} comentários</span>}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Favoritas do leitor">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              01
            </span>
            <h2>
              <IconStar size={18} /> Favoritas
            </h2>
          </div>
        </div>
        {!profile.favoritesPublic ? (
          <div className="manga-panel empty-state"><p>Este leitor escolheu manter as favoritas privadas.</p></div>
        ) : favs.length === 0 ? (
          <div className="manga-panel empty-state">
            <p>Este leitor ainda não guardou nenhuma obra.</p>
          </div>
        ) : (
          <div className="row" style={{ gap: "0.9rem", flexWrap: "wrap" }}>
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

      <div className="hairline" aria-hidden="true" />

      <section className="section" aria-label="Comentários do leitor">
        <div className="section-head">
          <div className="section-head-title">
            <span className="section-idx mono-num" aria-hidden="true">
              02
            </span>
            <h2>
              <IconChat size={18} /> Comentários recentes
            </h2>
          </div>
        </div>
        {!profile.commentsPublic ? (
          <div className="manga-panel empty-state"><p>Este leitor escolheu manter a atividade privada.</p></div>
        ) : comments.length === 0 ? (
          <div className="manga-panel empty-state">
            <p>Este leitor ainda não comentou nada.</p>
          </div>
        ) : (
          <div className="stack">
            {comments.map((c) => (
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
                </div>
                <p className="cm-text">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
