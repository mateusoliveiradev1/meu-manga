import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { chapters, clubPosts, pollOptions, pollVotes, postReactions, series, user } from "@/db/schema";

export async function getClubIndex(limit = 12) {
  const rows = await db
    .select({
      work: series,
      chapterCount: sql<number>`(select count(*)::int from ${chapters} c where c.series_id = ${series.id} and c.published = true)`,
      postCount: count(clubPosts.id),
      lastActivity: sql<Date | null>`max(${clubPosts.createdAt})`,
    })
    .from(series)
    .leftJoin(clubPosts, and(eq(clubPosts.seriesId, series.id), eq(clubPosts.hidden, false)))
    .groupBy(series.id)
    .orderBy(sql`max(${clubPosts.createdAt}) desc nulls last`, desc(series.updatedAt))
    .limit(limit);
  return rows.filter((row) => Number(row.chapterCount) > 0).map((row) => ({ ...row, chapterCount: Number(row.chapterCount), postCount: Number(row.postCount) }));
}

export async function getClubPosts(seriesId: number, viewerId?: string) {
  const posts = await db
    .select({ post: clubPosts, authorName: user.name, authorImage: user.image, authorRole: user.role, chapterNumber: chapters.number, chapterTitle: chapters.title })
    .from(clubPosts)
    .innerJoin(user, eq(user.id, clubPosts.userId))
    .leftJoin(chapters, eq(chapters.id, clubPosts.chapterId))
    .where(and(eq(clubPosts.seriesId, seriesId), eq(clubPosts.hidden, false)))
    .orderBy(desc(clubPosts.createdAt))
    .limit(80);
  const ids = posts.map((row) => row.post.id);
  if (!ids.length) return [];
  const [options, votes, reactions] = await Promise.all([
    db.select().from(pollOptions).where(inArray(pollOptions.postId, ids)).orderBy(pollOptions.position),
    db.select().from(pollVotes).where(inArray(pollVotes.postId, ids)),
    db.select().from(postReactions).where(inArray(postReactions.postId, ids)),
  ]);
  return posts.map((row) => ({
    ...row,
    options: options.filter((option) => option.postId === row.post.id).map((option) => ({ ...option, votes: votes.filter((vote) => vote.optionId === option.id).length })),
    totalVotes: votes.filter((vote) => vote.postId === row.post.id).length,
    myVote: viewerId ? votes.find((vote) => vote.postId === row.post.id && vote.userId === viewerId)?.optionId ?? null : null,
    reactions: ["insight", "agree", "curious"].map((reaction) => ({ reaction, count: reactions.filter((item) => item.postId === row.post.id && item.reaction === reaction).length, mine: viewerId ? reactions.some((item) => item.postId === row.post.id && item.userId === viewerId && item.reaction === reaction) : false })),
  }));
}
