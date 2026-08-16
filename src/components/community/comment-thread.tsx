import Link from "next/link";
import { AuthorName } from "@/components/reader/comment-head";
import { CommentContent, DeleteComment, ReportComment } from "@/components/reader/comment-actions";
import { CommentLikeButton, PinCommentButton, ReplyComposer } from "@/components/community/community-actions";
import type { CommentWithAuthor } from "@/features/comments/queries";
import { IconPin } from "@/components/ui/icons";
import { authPath } from "@/lib/navigation";
import { formatDate, initials } from "@/lib/utils";

type Viewer = { id: string; role: string } | null;

export function CommentThread({ comments, viewer, returnPath }: { comments: CommentWithAuthor[]; viewer: Viewer; returnPath: string }) {
  const roots = comments.filter((comment) => !comment.parentId);
  const replies = new Map<number, CommentWithAuthor[]>();
  for (const comment of comments) {
    if (!comment.parentId) continue;
    replies.set(comment.parentId, [...(replies.get(comment.parentId) ?? []), comment]);
  }
  if (!roots.length) return null;
  return <div className="comment-threads">{roots.map((comment) => <CommentCard key={comment.id} comment={comment} replies={replies.get(comment.id) ?? []} viewer={viewer} returnPath={returnPath} />)}</div>;
}

function CommentCard({ comment, replies, viewer, returnPath }: { comment: CommentWithAuthor; replies: CommentWithAuthor[]; viewer: Viewer; returnPath: string }) {
  const owns = viewer?.id === comment.userId;
  const admin = viewer?.role === "admin";
  const canDelete = Boolean(owns || admin);
  const loginHref = viewer ? undefined : authPath("entrar", `${returnPath}#comentario-${comment.id}`, "comunidade");
  return <article id={`comentario-${comment.id}`} className={`manga-panel cm-entry cm-thread ${comment.pinned ? "is-pinned" : ""}`}>
    {comment.pinned && <div className="pinned-note"><IconPin size={13} /> comentário destacado pelo estúdio</div>}
    <div className="cm-head"><span className="cm-avatar">{initials(comment.authorName)}</span><AuthorName authorId={comment.authorId} name={comment.authorName} role={comment.authorRole} /><span className="cm-date">{formatDate(comment.createdAt)}</span>{canDelete && <DeleteComment commentId={comment.id} />}{viewer && !canDelete && <ReportComment commentId={comment.id} />}</div>
    <CommentContent commentId={comment.id} content={comment.content} spoiler={comment.spoiler} edited={Boolean(comment.editedAt)} canEdit={owns} />
    <div className="thread-actions"><CommentLikeButton commentId={comment.id} initialLiked={comment.likedByViewer} initialCount={comment.likeCount} loginHref={loginHref} />{viewer ? <ReplyComposer parentId={comment.id} /> : <Link className="cm-tool" href={loginHref!}>Responder</Link>}{admin && <PinCommentButton commentId={comment.id} initialPinned={comment.pinned} />}{replies.length > 0 && <span className="reply-count">{replies.length} {replies.length === 1 ? "resposta" : "respostas"}</span>}</div>
    {replies.length > 0 && <div className="thread-replies">{replies.map((reply) => <ReplyCard key={reply.id} reply={reply} viewer={viewer} returnPath={returnPath} />)}</div>}
  </article>;
}

function ReplyCard({ reply, viewer, returnPath }: { reply: CommentWithAuthor; viewer: Viewer; returnPath: string }) {
  const owns = viewer?.id === reply.userId;
  const admin = viewer?.role === "admin";
  const loginHref = viewer ? undefined : authPath("entrar", `${returnPath}#comentario-${reply.parentId}`, "comunidade");
  return <div className="thread-reply"><div className="cm-head"><span className="cm-avatar">{initials(reply.authorName)}</span><AuthorName authorId={reply.authorId} name={reply.authorName} role={reply.authorRole} /><span className="cm-date">{formatDate(reply.createdAt)}</span>{(owns || admin) && <DeleteComment commentId={reply.id} />}{viewer && !owns && !admin && <ReportComment commentId={reply.id} />}</div><CommentContent commentId={reply.id} content={reply.content} spoiler={reply.spoiler} edited={Boolean(reply.editedAt)} canEdit={owns} /><div className="thread-actions"><CommentLikeButton commentId={reply.id} initialLiked={reply.likedByViewer} initialCount={reply.likeCount} loginHref={loginHref} /></div></div>;
}
