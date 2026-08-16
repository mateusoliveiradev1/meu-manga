import fs from "node:fs";
import { backupCounts, decryptBackup } from "../src/lib/backup";

const file = process.argv[2];
const secret = process.env.BACKUP_ENCRYPTION_KEY;
if (!file) throw new Error("Uso: npm run backup:verify -- backups/arquivo.mangabackup");
if (!secret) throw new Error("Defina BACKUP_ENCRYPTION_KEY para verificar o backup.");

const snapshot = decryptBackup(fs.readFileSync(file), secret);
console.log(JSON.stringify({ ok: true, format: snapshot.format, exportedAt: snapshot.exportedAt, counts: backupCounts(snapshot) }, null, 2));
