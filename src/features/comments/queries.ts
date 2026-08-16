import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, comments, series, user } from "@/db/schema";

export type CommentWithAuthor = typeof comments.$inferSelect & {
  authorName: string;
  authorImage: string | null;
  authorId: string;
  authorRole: string;
};

export async function getCommentsByChapter(chapterId: number, limit = 100): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .where(eq(comments.chapterId, chapterId))
    .orderBy(comments.createdAt)
    .limit(limit);

  return rows.map((r) => ({ ...r.comment, authorName: r.authorName, authorImage: r.authorImage, authorId: r.authorId, authorRole: r.authorRole }));
}

export async function getCommentsBySeries(seriesId: number, limit = 100): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .where(eq(comments.seriesId, seriesId))
    .orderBy(comments.createdAt)
    .limit(limit);

  return rows.map((r) => ({ ...r.comment, authorName: r.authorName, authorImage: r.authorImage, authorId: r.authorId, authorRole: r.authorRole }));
}

export type LatestComment = CommentWithAuthor & {
  chapterTitle: string | null;
  chapterNumber: number | null;
  seriesTitle: string;
  seriesSlug: string;
};

export async function getCommentsByUser(userId: string, limit = 10): Promise<LatestComment[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.userId))
    .leftJoin(chapters, eq(chapters.id, comments.chapterId))
    .leftJoin(series, sql`${series.id} = coalesce(${comments.seriesId}, ${chapters.seriesId})`)
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.comment,
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorId: r.authorId,
    authorRole: r.authorRole,
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
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
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
    chapterTitle: r.chapterTitle,
    chapterNumber: r.chapterNumber,
    seriesTitle: r.seriesTitle,
    seriesSlug: r.seriesSlug,
  }));
}

export async function getLatestComments(limit = 5): Promise<LatestComment[]> {
  const rows = await db
    .select({
      comment: comments,
      authorName: user.name,
      authorImage: user.image,
      authorId: user.id,
      authorRole: user.role,
      chapterTitle: chapters.title,
      chapterNumber: chapters.number,
      seriesTitle: sql<string>`coalesce(${series.title}, '')`,
      seriesSlug: sql<string>`coalesce(${series.slug}, '')`,
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
    chapterTitle: r.chapterTitle,
    chapterNumber: r.chapterNumber,
    seriesTitle: r.seriesTitle,
    seriesSlug: r.seriesSlug,
  }));
}
