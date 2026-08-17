"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconBell, IconCalendar, IconCheck, IconClose } from "@/components/ui/icons";
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

const MAX_VISIBLE_UPCOMING = 2;

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
  const [mounted, setMounted] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const agendaTriggerRef = useRef<HTMLButtonElement>(null);
  const agendaPanelRef = useRef<HTMLElement>(null);
  const visibleUpcoming = upcoming.slice(0, MAX_VISIBLE_UPCOMING);
  const hiddenUpcomingCount = Math.max(0, upcoming.length - visibleUpcoming.length);
  const fullAgenda = [{ ...release, kind }, ...upcoming].sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime());

  useEffect(() => setMounted(true), []);

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

  useEffect(() => {
    if (!agendaOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = agendaPanelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAgendaOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      agendaTriggerRef.current?.focus();
    };
  }, [agendaOpen]);

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
  const agendaLayer = agendaOpen && mounted ? createPortal(
    <div className="schedule-sheet-layer">
      <button className="schedule-sheet-backdrop" type="button" tabIndex={-1} aria-label="Fechar agenda" onClick={() => setAgendaOpen(false)} />
      <aside ref={agendaPanelRef} id="schedule-full-agenda" className="schedule-sheet" role="dialog" aria-modal="true" aria-labelledby="schedule-sheet-title">
        <header className="schedule-sheet-head">
          <div>
            <h2 id="schedule-sheet-title"><IconCalendar size={19} /> Agenda completa</h2>
            <p>{fullAgenda.length} {fullAgenda.length === 1 ? "lançamento confirmado" : "lançamentos confirmados"}, em ordem cronológica.</p>
          </div>
          <button type="button" aria-label="Fechar agenda" onClick={() => setAgendaOpen(false)}><IconClose size={20} /></button>
        </header>
        <ol className="schedule-sheet-list">
          {fullAgenda.map((item) => {
            const itemTarget = new Date(item.publishAt).getTime();
            const calendar = calendarParts(itemTarget);
            return (
              <li key={item.id}>
                <Link href={`/obra/${item.seriesSlug}`} onClick={() => setAgendaOpen(false)}>
                  <time dateTime={item.publishAt}><strong>{calendar.day}</strong><span>{calendar.month}</span></time>
                  <span className="schedule-sheet-copy">
                    <small>{item.kind === "series-premiere" ? "Estreia de obra" : "Novo capítulo"}</small>
                    <strong>{item.seriesTitle}</strong>
                    <span>{chapterLabel(item.number)} · {compactSchedule(itemTarget, now)}</span>
                  </span>
                  <IconArrowRight size={15} />
                </Link>
              </li>
            );
          })}
        </ol>
        <footer className="schedule-sheet-foot">A agenda acompanha automaticamente tudo o que já está pronto para publicação.</footer>
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <>
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
            <span>{upcoming.length} {upcoming.length === 1 ? "próxima data confirmada" : "próximas datas confirmadas"}</span>
          </div>
          <ol>
            {visibleUpcoming.map((item) => {
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
          {hiddenUpcomingCount > 0 ? (
            <button ref={agendaTriggerRef} type="button" className="scheduled-agenda-more" aria-expanded={agendaOpen} aria-controls="schedule-full-agenda" onClick={() => setAgendaOpen(true)}>
              <span>Mais {hiddenUpcomingCount} {hiddenUpcomingCount === 1 ? "lançamento confirmado" : "lançamentos confirmados"}</span>
              <strong>Ver agenda completa <IconArrowRight size={13} /></strong>
            </button>
          ) : <p>Novas datas entram aqui automaticamente.</p>}
        </aside>
      )}
      </section>
      {agendaLayer}
    </>
  );
}
