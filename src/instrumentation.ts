import type { Instrumentation } from "next";
import { logError, logEvent } from "@/lib/observability";

export function register() {
  logEvent("info", "server.started", {
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error);
  // O App Router encerra streams RSC quando uma navegação ou prefetch é cancelada.
  if (message.includes("destination stream closed early") || message.includes("aborted")) return;
  logError("request.unhandled_error", error, {
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });
};
