import { timingSafeEqual } from "node:crypto";
import { publishDueChapters } from "@/features/catalog/publish";
import { logError, logEvent, requestContext } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!secret || !provided) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    logEvent("warn", "publish.unauthorized", requestContext(request));
    return Response.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const published = await publishDueChapters();
    logEvent("info", "publish.completed", { ...requestContext(request), published });
    return Response.json({ ok: true, published }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logError("publish.failed", error, requestContext(request));
    return Response.json({ ok: false, error: "Falha ao publicar capítulos agendados." }, { status: 500 });
  }
}
