"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconBell, IconCalendar, IconCheck } from "@/components/ui/icons";
import { enableChapterReminderAction } from "@/features/push/actions";
import { browserPushSupported, currentBrowserPushActive, enableBrowserPush } from "@/features/push/client";
import { APP_TIME_ZONE, chapterLabel } from "@/lib/utils";

type ReleaseKind = "series-premiere" | "chapter-release";

type Release = {
  id: number;
  seriesId: number;
  number: number;
  title: string;
  publishAt: string;
  seriesSlug: string;
  seriesTitle: string;
  image: string;
};

type ScheduledReleaseProps = {
  release: Release;
  upcoming: (Release & { kind: ReleaseKind })[];
  kind: ReleaseKind;
  initialNow: string;
  signedIn: boolean;
  pushConfigured: boolean;
  initialFollowing: boolean;
};

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, weekday: "short" });
const calendarFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, day: "2-digit", month: "short" });
const exactDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function localDay(timestamp: number): number {
  const parts = dateParts.formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
}

function dayDistance(target: number, now: number): number {
  return Math.round((localDay(target) - localDay(now)) / 86_400_000);
}

function countdownLabel(target: number, now: number): string {
  const milliseconds = target - now;
  if (milliseconds <= 0) return "liberando agora";
  const days = dayDistance(target, now);
  if (days === 0) {
    const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
    if (minutes < 60) return `em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `em ${hours}h ${remainingMinutes}min` : `em ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }
  if (days === 1) return "amanhã";
  if (days === 2) return "depois de amanhã";
  return `em ${days} dias`;
}

function compactSchedule(target: number, now: number): string {
  const time = timeFormatter.format(new Date(target));
  const distance = dayDistance(target, now);
  if (distance === 0) return `Hoje, ${time}`;
  if (distance === 1) return `Amanhã, ${time}`;
  if (distance === 2) return `Depois de amanhã, ${time}`;
  const weekday = weekdayFormatter.format(new Date(target)).replace(".", "");
  return `${weekday}, ${time}`;
}

function calendarParts(timestamp: number) {
  const parts = calendarFormatter.formatToParts(new Date(timestamp));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: (parts.find((part) => part.type === "month")?.value ?? "").replace(".", ""),
  };
}

export function ScheduledRelease({ release, upcoming, kind, initialNow, signedIn, pushConfigured, initialFollowing }: ScheduledReleaseProps) {
  const router = useRouter();
  const target = new Date(release.publishAt).getTime();
  const refreshTarget = Math.min(target, ...upcoming.map((item) => new Date(item.publishAt).getTime()));
  const [now, setNow] = useState(() => new Date(initialNow).getTime());
  const [following, setFollowing] = useState(initialFollowing);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [devicePushActive, setDevicePushActive] = useState(false);
  const [activating, setActivating] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    const remaining = refreshTarget - Date.now();
    if (remaining <= 0) {
      router.refresh();
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(remaining + 250, 60_000));
    return () => window.clearTimeout(timer);
  }, [now, refreshTarget, router]);

  useEffect(() => {
    const available = pushConfigured && browserPushSupported();
    setPushAvailable(available);
    if (!available) return;
    currentBrowserPushActive().then(setDevicePushActive).catch(() => setDevicePushActive(false));
  }, [pushConfigured]);

  async function activateReminder() {
    if (!signedIn) {
      router.push(`/entrar?next=${encodeURIComponent("/#agenda-da-estante")}`);
      return;
    }

    setActivating(true);
    setReminderMessage("");
    try {
      const pushPromise = pushAvailable
        ? enableBrowserPush()
        : Promise.resolve({ ok: false as const, error: "Avisos do navegador indisponíveis." });
      const [reminderResult, pushResult] = await Promise.all([
        enableChapterReminderAction(release.seriesId),
        pushPromise,
      ]);

      if (!reminderResult.ok) {
        setReminderMessage(reminderResult.error);
        return;
      }

      setFollowing(true);
      if (pushResult.ok) {
        setDevicePushActive(true);
        setReminderMessage("Obra acompanhada. Avisaremos neste aparelho quando o capítulo sair.");
      } else {
        setReminderMessage("Obra acompanhada. O aviso aparecerá dentro do site.");
      }
      router.refresh();
    } catch {
      setReminderMessage("Não foi possível ativar os avisos agora. Tente novamente.");
    } finally {
      setActivating(false);
    }
  }

  const exactDate = exactDateFormatter.format(new Date(release.publishAt));
  const deviceReminderActive = following && devicePushActive;
  const siteReminderOnly = following && !pushAvailable;

  return (
    <section id="agenda-da-estante" className={`scheduled-release is-${kind}${upcoming.length ? " has-agenda" : ""}`} aria-labelledby="scheduled-release-title">
      <Link href={`/obra/${release.seriesSlug}`} className="scheduled-release-cover" aria-label={`Conhecer ${release.seriesTitle}`}>
        <ResponsiveImage src={release.image} alt={`Capa do ${chapterLabel(release.number)} de ${release.seriesTitle}`} sizes="(max-width: 640px) 6rem, 10rem" />
        <span className="scheduled-cover-label">{kind === "series-premiere" ? "Estreia" : chapterLabel(release.number)}</span>
      </Link>
      <div className="scheduled-release-copy">
        <span className="scheduled-release-icon" aria-hidden="true"><IconCalendar size={18} /></span>
        <h2 id="scheduled-release-title">{kind === "series-premiere" ? "Uma nova história vai ocupar a estante." : "A próxima página já tem hora para virar."}</h2>
        <p>{kind === "series-premiere" ? (
          <><strong>{release.seriesTitle}</strong> estreia com {chapterLabel(release.number)}{release.title ? `, “${release.title}”` : ""}. Chegue antes e descubra essa história desde a primeira página.</>
        ) : (
          <><strong>{release.seriesTitle}</strong> retorna com {chapterLabel(release.number)}{release.title ? `, “${release.title}”` : ""}. O que acontece depois continua guardado até a estreia.</>
        )}</p>
        <div className="scheduled-release-time" aria-live="polite">
          <strong>{countdownLabel(target, now)}</strong>
          <span><time dateTime={release.publishAt}>{exactDate}</time><small>Horário de Brasília · publicação automática</small></span>
        </div>
        <div className="scheduled-release-actions">
          <Link href={`/obra/${release.seriesSlug}`} className="btn">{kind === "series-premiere" ? "Conhecer a nova obra" : "Entrar no clima"} <IconArrowRight size={15} /></Link>
          <button type="button" className="btn ghost" onClick={activateReminder} disabled={activating || siteReminderOnly} aria-pressed={following}>
            {following ? <IconCheck size={15} /> : <IconBell size={15} />}
            {activating ? "Ativando…" : deviceReminderActive ? "Avisos ativos" : siteReminderOnly ? "Avisos no site ativos" : following ? "Ativar neste aparelho" : signedIn ? "Ativar avisos" : "Entrar para ativar"}
          </button>
        </div>
        {reminderMessage && <p className="scheduled-reminder-message" role="status">{reminderMessage}</p>}
      </div>

      {upcoming.length > 0 && (
        <aside className="scheduled-agenda" aria-labelledby="scheduled-agenda-title">
          <div className="scheduled-agenda-head">
            <h3 id="scheduled-agenda-title"><IconCalendar size={16} /> Agenda da estante</h3>
            <span>Esta data + {upcoming.length} {upcoming.length === 1 ? "próxima" : "próximas"}</span>
          </div>
          <ol>
            {upcoming.slice(0, 4).map((item) => {
              const itemTarget = new Date(item.publishAt).getTime();
              const calendar = calendarParts(itemTarget);
              return (
                <li key={item.id}>
                  <Link href={`/obra/${item.seriesSlug}`}>
                    <time dateTime={item.publishAt}><strong>{calendar.day}</strong><span>{calendar.month}</span></time>
                    <span className="scheduled-agenda-copy">
                      <small>{item.kind === "series-premiere" ? "Estreia de obra" : "Novo capítulo"}</small>
                      <strong>{item.seriesTitle}</strong>
                      <span>{chapterLabel(item.number)} · {compactSchedule(itemTarget, now)}</span>
                    </span>
                    <IconArrowRight size={14} />
                  </Link>
                </li>
              );
            })}
          </ol>
          <p>A agenda é atualizada automaticamente a cada novo agendamento.</p>
        </aside>
      )}
    </section>
  );
}
