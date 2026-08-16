import fs from "node:fs";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import { chapters, pages, series } from "../src/db/schema";
import { saveImage, storageMode } from "../src/lib/storage";
import { safeUploadName } from "../src/lib/uploads";

type LegacyImage = {
  label: string;
  value: string;
  update: (url: string) => Promise<unknown>;
};

async function main() {
  if (storageMode() === "local") {
    throw new Error("Configure Cloudinary ou R2 antes de migrar imagens locais.");
  }

  const legacy: LegacyImage[] = [];
  const seriesRows = await db
    .select({ id: series.id, value: series.cover })
    .from(series)
    .where(like(series.cover, "/api/files/%"));
  const chapterRows = await db
    .select({ id: chapters.id, value: chapters.cover })
    .from(chapters)
    .where(like(chapters.cover, "/api/files/%"));
  const pageRows = await db
    .select({ id: pages.id, value: pages.src })
    .from(pages)
    .where(like(pages.src, "/api/files/%"));

  for (const row of seriesRows) {
    legacy.push({
      label: `series:${row.id}:cover`,
      value: row.value,
      update: (url) => db.update(series).set({ cover: url, updatedAt: new Date() }).where(eq(series.id, row.id)),
    });
  }
  for (const row of chapterRows) {
    legacy.push({
      label: `chapter:${row.id}:cover`,
      value: row.value,
      update: (url) => db.update(chapters).set({ cover: url }).where(eq(chapters.id, row.id)),
    });
  }
  for (const row of pageRows) {
    legacy.push({
      label: `page:${row.id}:src`,
      value: row.value,
      update: (url) => db.update(pages).set({ src: url }).where(eq(pages.id, row.id)),
    });
  }

  console.log(`Encontradas ${legacy.length} referências locais.`);
  let migrated = 0;
  for (const image of legacy) {
    const name = decodeURIComponent(image.value.slice("/api/files/".length));
    const parsed = safeUploadName(name);
    if (!parsed || !fs.existsSync(parsed.file)) {
      throw new Error(`Arquivo ausente para ${image.label}: ${name}`);
    }

    const publicId = path.basename(name, path.extname(name));
    const url = await saveImage(fs.readFileSync(parsed.file), parsed.ext, publicId);
    await image.update(url);
    migrated += 1;
    console.log(`${migrated}/${legacy.length} ${image.label}`);
  }

  console.log(JSON.stringify({ ok: true, migrated }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
