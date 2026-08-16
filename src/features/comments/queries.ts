import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, commentLikes, commentReports, comments, series, user, userFollows } from "@/db/schema";

export type CommentWithAuthor = typeof comments.$inferSelect & {
  authorName: string;
  authorImage: string | null;
  authorId: string;
  authorRole: string;
  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;
};

export async function getCommentsByChapter(chapterId: number, limit = 100, viewerId?: string): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      likeCount: sql<number>`(select count(*)::int from ${commentLikes} l where l.comment_id = ${comments.id})`,
      replyCount: sql<number>`(select count(*)::int from ${comments} r where r.parent_id = ${comments.id} and r.hidden = false)`,
      likedByViewer: viewerId
        ? sql<boolean>`exists(select 1 from ${commentLikes} l where l.comment_id = ${comments.id} and l.user_id = ${viewerId})`
        : sql<boolean>`false`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .where(and(eq(comments.chapterId, chapterId), eq(comments.hidden, false)))
    .orderBy(desc(comments.pinned), comments.createdAt)
    .limit(limit);

  return rows.map((r) => ({ ...r.comment, authorName: r.authorName, authorImage: r.authorImage, authorId: r.authorId, authorRole: r.authorRole, likeCount: Number(r.likeCount), replyCount: Number(r.replyCount), likedByViewer: Boolean(r.likedByViewer) }));
}

export async function getCommentsBySeries(seriesId: number, limit = 100, viewerId?: string): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      likeCount: sql<number>`(select count(*)::int from ${commentLikes} l where l.comment_id = ${comments.id})`,
      replyCount: sql<number>`(select count(*)::int from ${comments} r where r.parent_id = ${comments.id} and r.hidden = false)`,
      likedByViewer: viewerId
        ? sql<boolean>`exists(select 1 from ${commentLikes} l where l.comment_id = ${comments.id} and l.user_id = ${viewerId})`
        : sql<boolean>`false`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .where(and(eq(comments.seriesId, seriesId), eq(comments.hidden, false)))
    .orderBy(desc(comments.pinned), comments.createdAt)
    .limit(limit);

  return rows.map((r) => ({ ...r.comment, authorName: r.authorName, authorImage: r.authorImage, authorId: r.authorId, authorRole: r.authorRole, likeCount: Number(r.likeCount), replyCount: Number(r.replyCount), likedByViewer: Boolean(r.likedByViewer) }));
}

export type LatestComment = CommentWithAuthor & {
  chapterTitle: string | null;
  chapterNumber: number | null;
  seriesTitle: string;
  seriesSlug: string;
  reportCount?: number;
};

export async function getCommentsByUser(userId: string, limit = 10): Promise<LatestComment[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      likeCount: sql<number>`(select count(*)::int from ${commentLikes} l where l.comment_id = ${comments.id})`,
      replyCount: sql<number>`(select count(*)::int from ${comments} r where r.parent_id = ${comments.id} and r.hidden = false)`,
      likedByViewer: sql<boolean>`false`,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(chapters, eq(chapters.id, comments.chapterId))
    .leftJoin(series, sql`${series.id} = coalesce(${comments.seriesId}, ${chapters.seriesId})`)
    .where(and(eq(comments.userId, userId), eq(comments.hidden, false)))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.comment,
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorId: r.authorId,
    authorRole: r.authorRole,
    likeCount: Number(r.likeCount),
    replyCount: Number(r.replyCount),
    likedByViewer: false,
    chapterTitle: r.chapterTitle,
    chapterNumber: r.chapterNumber,
    seriesTitle: r.seriesTitle,
    seriesSlug: r.seriesSlug,
  }));
}

export async function getAllComments(limit = 100): Promise<LatestComment[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      likeCount: sql<number>`(select count(*)::int from ${commentLikes} l where l.comment_id = ${comments.id})`,
      replyCount: sql<number>`(select count(*)::int from ${comments} r where r.parent_id = ${comments.id} and r.hidden = false)`,
      likedByViewer: sql<boolean>`false`,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
      reportCount: sql<number>`(select count(*)::int from ${commentReports} r where r.comment_id = ${comments.id} and r.status = 'open')`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(chapters, eq(chapters.id, comments.chapterId))
    .leftJoin(series, sql`${series.id} = coalesce(${comments.seriesId}, ${chapters.seriesId})`)
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.comment,
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorId: r.authorId,
    authorRole: r.authorRole,
    likeCount: Number(r.likeCount),
    replyCount: Number(r.replyCount),
    likedByViewer: false,
    chapterTitle: r.chapterTitle,
    chapterNumber: r.chapterNumber,
    seriesTitle: r.seriesTitle,
    seriesSlug: r.seriesSlug,
    reportCount: Number(r.reportCount),
  }));
}

export async function getLatestComments(limit = 5, viewerId?: string): Promise<LatestComment[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      likeCount: sql<number>`(select count(*)::int from ${commentLikes} l where l.comment_id = ${comments.id})`,
      replyCount: sql<number>`(select count(*)::int from ${comments} r where r.parent_id = ${comments.id} and r.hidden = false)`,
      likedByViewer: viewerId
        ? sql<boolean>`exists(select 1 from ${commentLikes} l where l.comment_id = ${comments.id} and l.user_id = ${viewerId})`
        : sql<boolean>`false`,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(chapters, eq(chapters.id, comments.chapterId))
    .leftJoin(series, sql`${series.id} = coalesce(${comments.seriesId}, ${chapters.seriesId})`)
    .where(and(eq(comments.hidden, false), isNull(comments.parentId)))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.comment,
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorId: r.authorId,
    authorRole: r.authorRole,
    likeCount: Number(r.likeCount),
    replyCount: Number(r.replyCount),
    likedByViewer: Boolean(r.likedByViewer),
    chapterTitle: r.chapterTitle,
    chapterNumber: r.chapterNumber,
    seriesTitle: r.seriesTitle,
    seriesSlug: r.seriesSlug,
  }));
}

export async function getOpenReportCount(): Promise<number> {
  const [row] = await db.select({ total: count() }).from(commentReports).where(eq(commentReports.status, "open"));
  return Number(row?.total ?? 0);
}

export async function getCommunityMetrics(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const [members, likes, follows, replies, activity] = await Promise.all([
    db.select({ total: count() }).from(user),
    db.select({ total: count() }).from(commentLikes),
    db.select({ total: count() }).from(userFollows),
    db.select({ total: count() }).from(comments).where(sql`${comments.parentId} is not null`),
    db.select({ total: count() }).from(comments).where(gte(comments.createdAt, start)),
  ]);
  return {
    members: Number(members[0]?.total ?? 0),
    likes: Number(likes[0]?.total ?? 0),
    follows: Number(follows[0]?.total ?? 0),
    replies: Number(replies[0]?.total ?? 0),
    recentActivity: Number(activity[0]?.total ?? 0),
  };
}
