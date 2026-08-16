import {
  AnyPgColumn,
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------
   Better Auth core tables (Postgres, snake_case columns)
   ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  notifyNewChapters: boolean("notify_new_chapters").notNull().default(true),
  favoritesPublic: boolean("favorites_public").notNull().default(true),
  commentsPublic: boolean("comments_public").notNull().default(true),
  bio: text("bio").notNull().default(""),
  favoriteGenre: text("favorite_genre").notNull().default(""),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("account_user_idx").on(t.userId)]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

/* ------------------------------------------------------------------
   App tables
   ------------------------------------------------------------------ */

export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull().default(""),
  cover: text("cover").notNull().default(""),
  status: text("status").notNull().default("ongoing"),
  tags: text("tags").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chapters = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    number: doublePrecision("number").notNull(),
    title: text("title").notNull().default(""),
    cover: text("cover").notNull().default(""),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    publishAt: timestamp("publish_at"),
    notified: boolean("notified").notNull().default(false),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("chapters_series_idx").on(t.seriesId)]
);

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    src: text("src").notNull(),
  },
  (t) => [index("pages_chapter_idx").on(t.chapterId)]
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),
    seriesId: integer("series_id").references(() => series.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    spoiler: boolean("spoiler").notNull().default(false),
    editedAt: timestamp("edited_at"),
    hidden: boolean("hidden").notNull().default(false),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: text("moderated_by").references(() => user.id, { onDelete: "set null" }),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comments_chapter_idx").on(t.chapterId),
    index("comments_series_idx").on(t.seriesId),
    index("comments_parent_idx").on(t.parentId),
    index("comments_hidden_idx").on(t.hidden),
  ]
);

export const commentLikes = pgTable(
  "comment_likes",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] }), index("comment_likes_user_idx").on(t.userId)]
);

export const userFollows = pgTable(
  "user_follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("user_follows_following_idx").on(t.followingId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull().default(""),
    href: text("href").notNull().default("/notificacoes"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    index("notifications_user_read_idx").on(t.userId, t.readAt),
  ]
);

export const commentReports = pgTable(
  "comment_reports",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    details: text("details").notNull().default(""),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("comment_reports_comment_reporter_uniq").on(t.commentId, t.reporterId),
    index("comment_reports_status_idx").on(t.status),
    index("comment_reports_comment_idx").on(t.commentId),
  ]
);

export const seriesRatings = pgTable(
  "series_ratings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesId] }), index("ratings_series_idx").on(t.seriesId)]
);

/* ------------------------------------------------------------------
   Reading stats (per-day views for the panel charts)
   ------------------------------------------------------------------ */

export const readingStats = pgTable(
  "reading_stats",
  {
    id: serial("id").primaryKey(),
    day: timestamp("day", { mode: "date", withTimezone: false }).notNull(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
  },
  (t) => [
    index("reading_stats_chapter_idx").on(t.chapterId),
    index("reading_stats_day_idx").on(t.day),
    // alvo do upsert (dia + capítulo)
    uniqueIndex("reading_stats_day_chapter_uniq").on(t.day, t.chapterId),
  ]
);

export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesId] })]
);

export const userProgress = pgTable(
  "user_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    page: integer("page").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.chapterId] })]
);

/* ------------------------------------------------------------------
   Lightweight analytics: page views per day (no trackers — just a
   counter so the author sees how the site is doing)
   ------------------------------------------------------------------ */

export const pageViews = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    day: timestamp("day", { mode: "date", withTimezone: false }).notNull(),
    path: text("path").notNull(),
    views: integer("views").notNull().default(0),
  },
  (t) => [uniqueIndex("page_views_day_path_uniq").on(t.day, t.path)]
);

/* ------------------------------------------------------------------
   Rate limiting (sliding window, DB-backed so it survives restarts
   and works across instances)
   ------------------------------------------------------------------ */

export const rateLimits = pgTable("rate_limits", {
  id: text("id").notNull().unique().$defaultFn(() => crypto.randomUUID()),
  key: text("key").primaryKey(),
  // Better Auth calls this field `lastRequest`. Keep the existing DB column
  // so the same durable table can serve both auth and application limits.
  lastRequest: bigint("window_start", { mode: "number" }).notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Series = typeof series.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type CommentReport = typeof commentReports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type User = typeof user.$inferSelect;
