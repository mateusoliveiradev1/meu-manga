import { sql as query } from "drizzle-orm";
import { db } from "@/db/client";
import { storageMode } from "@/lib/storage";
import { logError, logEvent, requestContext } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    await db.execute(query`select 1`);
    const payload = {
      ok: true,
      database: "reachable",
      storage: storageMode(),
      deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      timestamp: new Date().toISOString(),
    };
    logEvent("info", "health.check.ok", {
      ...requestContext(request),
      durationMs: Date.now() - startedAt,
      storage: payload.storage,
    });
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("health.check.failed", error, {
      ...requestContext(request),
      durationMs: Date.now() - startedAt,
    });
    return Response.json(
      { ok: false, database: "unreachable", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
