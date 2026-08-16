type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

function safeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }
  return { message: String(error) };
}

export function logEvent(level: LogLevel, message: string, fields: LogFields = {}) {
  const payload = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export function logError(message: string, error: unknown, fields: LogFields = {}) {
  logEvent("error", message, { ...fields, error: safeError(error) });
}

export function requestContext(request: Request) {
  return {
    requestId: request.headers.get("x-vercel-id") ?? request.headers.get("x-request-id") ?? undefined,
    method: request.method,
    path: new URL(request.url).pathname,
  };
}
