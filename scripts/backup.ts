/* Backup portátil do banco: despeja as tabelas do app em um JSON em backups/.
   Não depende de pg_dump — roda onde o app roda (local, VPS, CI).

     npx tsx scripts/backup.ts            -> backups/backup-<timestamp>.json
     npx tsx scripts/backup.ts --keep 7   -> também apaga backups com +7 dias

   O Neon tem PITR automático (7 dias); este é o complemento portátil para
   restaurar em qualquer Postgres. */
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db/client";
import * as schema from "../src/db/schema";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const KEEP = Number(process.argv.find((a) => a.startsWith("--keep"))?.split("=")[1] ?? 0);

const TABLES = [
  "series",
  "chapters",
  "pages",
  "comments",
  "seriesRatings",
  "readingStats",
  "userFavorites",
  "userProgress",
  "pageViews",
] as const;

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out: Record<string, unknown[]> = {};

  for (const name of TABLES) {
    const t = (schema as Record<string, any>)[name];
    if (!t) continue;
    const rows = await db.select().from(t);
    out[name] = rows;
    console.log(`  ${name}: ${rows.length} linhas`);
  }

  const file = path.join(BACKUP_DIR, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ exportedAt: new Date().toISOString(), tables: out }, null, 2));
  console.log(`\nBackup salvo em ${file}`);

  if (KEEP > 0) {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup-") && f.endsWith(".json")).sort();
    const cutoff = Date.now() - KEEP * 24 * 60 * 60 * 1000;
    for (const f of files) {
      const p = path.join(BACKUP_DIR, f);
      if (fs.statSync(p).mtimeMs < cutoff) {
        fs.unlinkSync(p);
        console.log(`  removido (antigo): ${f}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Falha no backup:", err);
  process.exit(1);
});
