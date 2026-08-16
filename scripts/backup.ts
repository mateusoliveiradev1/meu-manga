import fs from "node:fs";
import path from "node:path";
import { backupCounts, createBackupSnapshot, encryptBackup } from "../src/lib/backup";
import { sql } from "../src/db/client";

const secret = process.env.BACKUP_ENCRYPTION_KEY;
if (!secret) throw new Error("Defina BACKUP_ENCRYPTION_KEY antes de criar backups.");

async function main() {
  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const snapshot = await createBackupSnapshot();
  const encrypted = encryptBackup(snapshot, secret!);
  const stamp = snapshot.exportedAt.replace(/[:.]/g, "-");
  const file = path.join(dir, `backup-${stamp}.mangabackup`);
  fs.writeFileSync(file, encrypted, { mode: 0o600 });

  console.log(JSON.stringify({ ok: true, file, bytes: encrypted.length, counts: backupCounts(snapshot) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => sql.end());
