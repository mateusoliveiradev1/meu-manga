import fs from "node:fs";
import { count, sql } from "drizzle-orm";
import { db, sql as postgresClient } from "../src/db/client";
import * as schema from "../src/db/schema";
import { backupCounts, decryptBackup } from "../src/lib/backup";

const file = process.argv.find((arg) => arg.endsWith(".mangabackup"));
const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm=RESTORE_EMPTY_DATABASE");
const secret = process.env.BACKUP_ENCRYPTION_KEY;

if (!file) throw new Error("Uso: npm run backup:restore -- arquivo.mangabackup [--apply --confirm=RESTORE_EMPTY_DATABASE]");
if (!secret) throw new Error("Defina BACKUP_ENCRYPTION_KEY para ler o backup.");

async function main() {
const snapshot = decryptBackup(fs.readFileSync(file!), secret!);
console.log(JSON.stringify({ valid: true, exportedAt: snapshot.exportedAt, counts: backupCounts(snapshot) }, null, 2));

if (!apply) {
  console.log("Validação concluída. Nenhum dado foi alterado. Use --apply apenas em um banco vazio.");
  process.exit(0);
}
if (!confirmed) throw new Error("Restauração bloqueada: acrescente --confirm=RESTORE_EMPTY_DATABASE.");

const [users, works, chapterRows] = await Promise.all([
  db.select({ n: count() }).from(schema.user),
  db.select({ n: count() }).from(schema.series),
  db.select({ n: count() }).from(schema.chapters),
]);
if (Number(users[0]?.n) + Number(works[0]?.n) + Number(chapterRows[0]?.n) > 0) {
  throw new Error("Restauração recusada: o banco de destino não está vazio.");
}

const tables = snapshot.tables as Record<string, Record<string, unknown>[]>;
const revive = (name: string, fields: string[]) =>
  (tables[name] ?? []).map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, fields.includes(key) && value ? new Date(String(value)) : value]))
  );

await db.transaction(async (tx) => {
  const insert = async (table: Parameters<typeof tx.insert>[0], rows: Record<string, unknown>[]) => {
    if (rows.length) await tx.insert(table).values(rows as never[]);
  };
  await insert(schema.user, revive("user", ["banExpires", "createdAt", "updatedAt"]));
  await insert(schema.account, revive("account", ["accessTokenExpiresAt", "refreshTokenExpiresAt", "createdAt", "updatedAt"]));
  await insert(schema.series, revive("series", ["createdAt", "updatedAt"]));
  await insert(schema.chapters, revive("chapters", ["publishedAt", "publishAt", "createdAt"]));
  await insert(schema.pages, revive("pages", []));
  await insert(schema.comments, revive("comments", ["moderatedAt", "createdAt"]));
  await insert(schema.commentReports, revive("commentReports", ["createdAt", "resolvedAt"]));
  await insert(schema.seriesRatings, revive("seriesRatings", ["createdAt"]));
  await insert(schema.readingStats, revive("readingStats", ["day"]));
  await insert(schema.userFavorites, revive("userFavorites", ["createdAt"]));
  await insert(schema.userProgress, revive("userProgress", ["updatedAt"]));
  await insert(schema.pageViews, revive("pageViews", ["day"]));

  for (const table of ["series", "chapters", "pages", "comments", "comment_reports", "reading_stats", "page_views"]) {
    await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`));
  }
});

console.log("Restauração concluída com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => postgresClient.end());
