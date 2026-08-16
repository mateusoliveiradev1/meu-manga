import { timingSafeEqual } from "node:crypto";
import { backupCounts, createBackupSnapshot, encryptBackup, uploadEncryptedBackup } from "@/lib/backup";
import { logError, logEvent, requestContext } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!secret || !provided) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  if (!authorized(request)) {
    logEvent("warn", "backup.unauthorized", requestContext(request));
    return Response.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const secret = process.env.BACKUP_ENCRYPTION_KEY;
    if (!secret) throw new Error("BACKUP_ENCRYPTION_KEY não está configurada.");
    const snapshot = await createBackupSnapshot();
    const encrypted = encryptBackup(snapshot, secret);
    const stored = await uploadEncryptedBackup(encrypted);
    logEvent("info", "backup.completed", {
      ...requestContext(request),
      durationMs: Date.now() - startedAt,
      bytes: stored.bytes,
      removed: stored.removed,
      counts: backupCounts(snapshot),
    });
    return Response.json({ ok: true, exportedAt: snapshot.exportedAt, ...stored, counts: backupCounts(snapshot) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logError("backup.failed", error, { ...requestContext(request), durationMs: Date.now() - startedAt });
    return Response.json({ ok: false, error: "Falha ao criar o backup." }, { status: 500 });
  }
}
