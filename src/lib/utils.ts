export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const APP_TIME_ZONE = "America/Sao_Paulo";

export function formatDate(iso: Date | string | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: APP_TIME_ZONE });
}

export function formatDateTime(iso: Date | string | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** Formata um Date no horário editorial de Brasília para um input datetime-local. */
export function formatDateTimeLocal(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

/** Converte o valor de datetime-local, entendido como horário de Brasília, para UTC. */
export function brasiliaDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  const wallClockAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let candidate = wallClockAsUtc;

  // Duas passagens cobrem mudanças históricas/futuras de offset sem fixar UTC-3 no código.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value ?? 0);
    const representedWallClock = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
    candidate += wallClockAsUtc - representedWallClock;
  }

  return new Date(candidate).toISOString();
}

export const STATUS_LABELS: Record<string, string> = {
  ongoing: "Em publicação",
  completed: "Concluída",
  hiatus: "Em pausa",
  planned: "Em breve",
};

export function chapterLabel(number: number): string {
  return `Cap. ${number}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
