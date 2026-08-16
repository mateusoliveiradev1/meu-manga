/* Removes E2E test data: test series ("Obra E2E *"), test users, their favorites/progress/comments. */
import { db } from "../src/db/client";
import { chapters, comments, pages, series, user, userFavorites, userProgress } from "../src/db/schema";
import { and, eq, like } from "drizzle-orm";

(async () => {
  console.log("selecting test series...");
  const testSeries = await db.select().from(series).where(like(series.title, "Obra E2E %"));
  console.log("found", testSeries.length);
  for (const s of testSeries) {
    const chs = await db.select().from(chapters).where(eq(chapters.seriesId, s.id));
    for (const c of chs) {
      await db.delete(comments).where(eq(comments.chapterId, c.id));
      await db.delete(pages).where(eq(pages.chapterId, c.id));
      await db.delete(userProgress).where(eq(userProgress.chapterId, c.id));
    }
    await db.delete(chapters).where(eq(chapters.seriesId, s.id));
  }
  await db.delete(series).where(like(series.title, "Obra E2E %"));

  console.log("selecting test users...");
  const testUsers = await db.select().from(user).where(like(user.email, "teste-%@exemplo.com"));
  console.log("found", testUsers.length);
  for (const u of testUsers) {
    const userComments = await db.select().from(comments).where(eq(comments.userId, u.id));
    for (const c of userComments) await db.delete(comments).where(eq(comments.id, c.id));
    await db.delete(userFavorites).where(eq(userFavorites.userId, u.id));
    await db.delete(userProgress).where(eq(userProgress.userId, u.id));
    await db.delete(user).where(eq(user.id, u.id));
  }

  console.log(`removed ${testSeries.length} test series, ${testUsers.length} test users`);
  process.exit(0);
})();
