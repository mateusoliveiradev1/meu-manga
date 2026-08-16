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
  notifySocial: boolean("notify_social").notNull().default(true),
  favoritesPublic: boolean("favorites_public").notNull().default(true),
  commentsPublic: boolean("comments_public").notNull().default(true),
  readingMode: text("reading_mode").notNull().default("scroll"),
  preloadPages: boolean("preload_pages").notNull().default(true),
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

export const libraryEntries = pgTable(
  "library_entries",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("want"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesId] }), index("library_entries_status_idx").on(t.userId, t.status)]
);

export const userCollections = pgTable(
  "user_collections",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("user_collections_user_idx").on(t.userId)]
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: integer("collection_id")
      .notNull()
      .references(() => userCollections.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.seriesId] }), index("collection_items_series_idx").on(t.seriesId)]
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

export const readingHistory = pgTable(
  "reading_history",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    visits: integer("visits").notNull().default(1),
    firstReadAt: timestamp("first_read_at").notNull().defaultNow(),
    lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.chapterId] }), index("reading_history_recent_idx").on(t.userId, t.lastReadAt)]
);

export const readingBookmarks = pgTable(
  "reading_bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reading_bookmarks_page_uniq").on(t.userId, t.chapterId, t.page),
    index("reading_bookmarks_user_idx").on(t.userId, t.updatedAt),
  ]
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)]
);

export const clubPosts = pgTable(
  "club_posts",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id").references(() => chapters.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("discussion"),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    spoiler: boolean("spoiler").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("club_posts_series_idx").on(t.seriesId, t.createdAt), index("club_posts_user_idx").on(t.userId)]
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => clubPosts.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("poll_options_post_idx").on(t.postId)]
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => clubPosts.id, { onDelete: "cascade" }),
    optionId: integer("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] }), index("poll_votes_option_idx").on(t.optionId)]
);

export const postReactions = pgTable(
  "post_reactions",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => clubPosts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reaction: text("reaction").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] }), index("post_reactions_post_idx").on(t.postId)]
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionId: text("session_id").notNull(),
    event: text("event").notNull(),
    path: text("path").notNull().default(""),
    seriesId: integer("series_id").references(() => series.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),
    page: integer("page"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("analytics_events_created_idx").on(t.createdAt),
    index("analytics_events_event_idx").on(t.event, t.createdAt),
    index("analytics_events_chapter_idx").on(t.chapterId, t.createdAt),
  ]
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
export type LibraryEntry = typeof libraryEntries.$inferSelect;
export type ReadingBookmark = typeof readingBookmarks.$inferSelect;
export type ClubPost = typeof clubPosts.$inferSelect;
