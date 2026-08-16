export function safeNextPath(value: string | string[] | undefined, fallback = "/"): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}

export function authPath(kind: "entrar" | "cadastro", nextPath: string, reason?: string): string {
  const query = new URLSearchParams({ next: safeNextPath(nextPath) });
  if (reason) query.set("motivo", reason);
  return `/${kind}?${query}`;
}
