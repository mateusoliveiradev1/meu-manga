CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" timestamp NOT NULL,
	"path" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "page_views_day_path_uniq" ON "page_views" USING btree ("day","path");