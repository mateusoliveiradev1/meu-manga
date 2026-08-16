import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getAllComments } from "@/features/comments/queries";
import { DeleteComment, ModerateComment } from "@/components/reader/comment-actions";
import { IconArrowLeft, IconChat } from "@/components/ui/icons";
import { chapterLabel, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") redirect("/");

  const comments = await getAllComments(200);
  const ordered = [...comments].sort(
    (a, b) => Number(b.hidden) - Number(a.hidden) || Number(b.reportCount ?? 0) - Number(a.reportCount ?? 0)
  );
  const openReports = comments.reduce((total, comment) => total + Number(comment.reportCount ?? 0), 0);
  const hiddenComments = comments.filter((comment) => comment.hidden).length;

  return (
    <>
      <section className="page-head" aria-label="Moderação de comentários">
        <p className="admin-crumb">
          <Link href="/admin">
            <IconArrowLeft size={13} /> Painel
          </Link>
        </p>
        <h1>
          <IconChat size={22} /> Moderação
        </h1>
        <p className="page-sub">
          Denúncias aparecem primeiro. Oculte conteúdo impróprio ou restaure falsos positivos sem apagar o histórico.
        </p>
      </section>

      <div className="moderation-summary" aria-label="Resumo da moderação">
        <span><strong>{openReports}</strong> denúncias abertas</span>
        <span><strong>{hiddenComments}</strong> comentários ocultos</span>
        <span><strong>{comments.length}</strong> comentários analisáveis</span>
      </div>

      {comments.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum comentário para moderar.</p>
        </div>
      ) : (
        <div className="stack">
          {ordered.map((comment) => (
            <article
              key={comment.id}
              className={`manga-panel cm-entry moderation-entry ${comment.hidden ? "is-hidden" : ""}`}
            >
              <div className="cm-head">
                <span className="cm-avatar">{initials(comment.authorName)}</span>
                <span className="cm-name">
                  {comment.authorName}
                  {comment.authorRole === "admin" && <span className="badge author-badge">autor</span>}
                </span>
                <span className="cm-date">
                  {formatDate(comment.createdAt)} · em{" "}
                  {comment.chapterId != null && comment.chapterNumber != null ? (
                    <Link href={`/ler/${comment.chapterId}`}>
                      {comment.seriesTitle || "obra"} — {chapterLabel(comment.chapterNumber)}
                    </Link>
                  ) : (
                    <Link href={`/obra/${comment.seriesSlug}`}>{comment.seriesTitle || "obra"}</Link>
                  )}
                </span>
              </div>
              <p className="cm-text">{comment.content}</p>
              <div className="moderation-actions">
                <span className={`badge ${comment.hidden ? "badge-hidden" : ""}`}>
                  {comment.hidden ? "oculto" : `${comment.reportCount ?? 0} denúncias abertas`}
                </span>
                <ModerateComment commentId={comment.id} hidden={comment.hidden} />
                <DeleteComment commentId={comment.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
