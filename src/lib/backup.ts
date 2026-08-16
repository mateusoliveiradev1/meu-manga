import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/db/client";
import {
  account,
  chapters,
  commentReports,
  comments,
  pages,
  pageViews,
  readingStats,
  series,
  seriesRatings,
  user,
  userFavorites,
  userProgress,
} from "@/db/schema";

const FORMAT = "manga-backup-v1";

export type BackupSnapshot = {
  format: typeof FORMAT;
  exportedAt: string;
  tables: Record<string, unknown[]>;
};

type EncryptedEnvelope = {
  format: typeof FORMAT;
  algorithm: "aes-256-gcm+gzip";
  iv: string;
  tag: string;
  data: string;
};

function encryptionKey(secret: string) {
  if (secret.length < 32) throw new Error("BACKUP_ENCRYPTION_KEY precisa ter pelo menos 32 caracteres.");
  return createHash("sha256").update(secret).digest();
}

export async function createBackupSnapshot(): Promise<BackupSnapshot> {
  const [
    users,
    accounts,
    allSeries,
    allChapters,
    allPages,
    allComments,
    reports,
    ratings,
    stats,
    favorites,
    progress,
    views,
  ] = await Promise.all([
    db.select().from(user),
    db.select().from(account),
    db.select().from(series),
    db.select().from(chapters),
    db.select().from(pages),
    db.select().from(comments),
    db.select().from(commentReports),
    db.select().from(seriesRatings),
    db.select().from(readingStats),
    db.select().from(userFavorites),
    db.select().from(userProgress),
    db.select().from(pageViews),
  ]);

  return {
    format: FORMAT,
    exportedAt: new Date().toISOString(),
    // Sessions, verification tokens and rate-limit buckets are intentionally
    // omitted: they are ephemeral and must not survive a disaster recovery.
    tables: {
      user: users,
      account: accounts,
      series: allSeries,
      chapters: allChapters,
      pages: allPages,
      comments: allComments,
      commentReports: reports,
      seriesRatings: ratings,
      readingStats: stats,
      userFavorites: favorites,
      userProgress: progress,
      pageViews: views,
    },
  };
}

export function encryptBackup(snapshot: BackupSnapshot, secret: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const compressed = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const envelope: EncryptedEnvelope = {
    format: FORMAT,
    algorithm: "aes-256-gcm+gzip",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
  return Buffer.from(JSON.stringify(envelope));
}

export function decryptBackup(buffer: Buffer, secret: string): BackupSnapshot {
  const envelope = JSON.parse(buffer.toString("utf8")) as EncryptedEnvelope;
  if (envelope.format !== FORMAT || envelope.algorithm !== "aes-256-gcm+gzip") {
    throw new Error("Formato de backup não reconhecido.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
  const snapshot = JSON.parse(gunzipSync(decrypted).toString("utf8")) as BackupSnapshot;
  if (snapshot.format !== FORMAT || !snapshot.tables || !snapshot.exportedAt) {
    throw new Error("O conteúdo descriptografado não é um backup válido.");
  }
  return snapshot;
}

export function backupCounts(snapshot: BackupSnapshot): Record<string, number> {
  return Object.fromEntries(Object.entries(snapshot.tables).map(([name, rows]) => [name, rows.length]));
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary não está configurado para guardar backups.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadEncryptedBackup(buffer: Buffer, keepDays = 30) {
  configureCloudinary();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const publicId = `manga-backups/backup-${stamp}.mangabackup`;
  const result = await cloudinary.uploader.upload(`data:application/octet-stream;base64,${buffer.toString("base64")}`, {
    resource_type: "raw",
    type: "authenticated",
    public_id: publicId,
    overwrite: false,
    tags: ["manga-backup", "automated"],
  });

  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const listed = await cloudinary.api.resources({
    resource_type: "raw",
    type: "authenticated",
    prefix: "manga-backups/",
    max_results: 100,
  });
  const expired = (listed.resources ?? [])
    .filter((item: { created_at?: string }) => item.created_at && new Date(item.created_at).getTime() < cutoff)
    .map((item: { public_id: string }) => item.public_id);
  if (expired.length) {
    await cloudinary.api.delete_resources(expired, { resource_type: "raw", type: "authenticated" });
  }

  return { publicId: result.public_id, bytes: result.bytes, removed: expired.length };
}
