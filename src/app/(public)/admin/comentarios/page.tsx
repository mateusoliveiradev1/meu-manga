import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getAllComments } from "@/features/comments/queries";
import { DeleteComment } from "@/components/reader/comment-actions";
import { IconArrowLeft, IconChat } from "@/components/ui/icons";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminComentariosPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const comments = await getAllComments(200);

  return (
    <>
      <section className="page-head" aria-label="Moderação de comentários">
        <p className="admin-crumb">
          <Link href="/admin">
            <IconArrowLeft size={13} /> Painel
          </Link>
        </p>
        <h1>
          <IconChat size={22} /> Comentários
        </h1>
        <p className="page-sub">
          Todos os comentários do site — você pode apagar qualquer um (o autor também apaga os próprios).
        </p>
      </section>

      {comments.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum comentário ainda. Seja a primeira pessoa a comentar!</p>
        </div>
      ) : (
        <div className="stack">
          {comments.map((c) => (
            <div key={c.id} className="manga-panel cm-entry">
              <div className="cm-head">
                <span className="cm-avatar">{initials(c.authorName)}</span>
                <span className="cm-name">
                  {c.authorName}
                  {c.authorRole === "admin" && (
                    <span className="badge" style={{ marginLeft: "0.45rem" }}>
                      <span className="badge-dot" aria-hidden="true" /> autor(a)
                    </span>
                  )}
                </span>
                <span className="cm-date">
                  {formatDate(c.createdAt)} · em{" "}
                  {c.chapterId != null && c.chapterNumber != null ? (
                    <Link href={`/ler/${c.chapterId}`}>
                      {c.seriesTitle || "obra"} — {chapterLabel(c.chapterNumber)}
                    </Link>
                  ) : (
                    <Link href={`/obra/${c.seriesSlug}`}>{c.seriesTitle || "obra"}</Link>
                  )}
                </span>
                <DeleteComment commentId={c.id} />
              </div>
              <p className="cm-text">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
