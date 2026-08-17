"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconBell, IconCalendar } from "@/components/ui/icons";
import { APP_TIME_ZONE, chapterLabel } from "@/lib/utils";

type ScheduledReleaseProps = {
  release: {
    number: number;
    title: string;
    publishAt: string;
    seriesSlug: string;
    seriesTitle: string;
    seriesCover: string;
  };
  kind: "series-premiere" | "chapter-release";
  initialNow: string;
  signedIn: boolean;
};

function countdownLabel(milliseconds: number): string {
  if (milliseconds <= 0) return "liberando agora";
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return `em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    if (!remainingMinutes) return `em ${hours} ${hours === 1 ? "hora" : "horas"}`;
    return `em ${hours}h ${remainingMinutes}min`;
  }
  const days = Math.ceil(hours / 24);
  return `em ${days} ${days === 1 ? "dia" : "dias"}`;
}

export function ScheduledRelease({ release, kind, initialNow, signedIn }: ScheduledReleaseProps) {
  const router = useRouter();
  const target = new Date(release.publishAt).getTime();
  const [now, setNow] = useState(() => new Date(initialNow).getTime());

  useEffect(() => {
    const remaining = target - Date.now();
    if (remaining <= 0) {
      router.refresh();
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(remaining + 250, 60_000));
    return () => window.clearTimeout(timer);
  }, [now, router, target]);

  const exactDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(release.publishAt));
  const notificationsHref = signedIn ? "/perfil#avisos" : "/entrar?next=%2Fperfil%23avisos";

  return (
    <section className={`scheduled-release is-${kind}`} aria-labelledby="scheduled-release-title">
      <Link href={`/obra/${release.seriesSlug}`} className="scheduled-release-cover" aria-label={`Conhecer ${release.seriesTitle}`}>
        <ResponsiveImage src={release.seriesCover} alt={`Capa de ${release.seriesTitle}`} sizes="(max-width: 640px) 6rem, 9rem" />
      </Link>
      <div className="scheduled-release-copy">
        <span className="scheduled-release-icon" aria-hidden="true"><IconCalendar size={18} /></span>
        <h2 id="scheduled-release-title">{kind === "series-premiere" ? "Uma nova história está prestes a ocupar a estante." : "A próxima página já tem hora para virar."}</h2>
        <p>{kind === "series-premiere" ? (
          <><strong>{release.seriesTitle}</strong> estreia com {chapterLabel(release.number)}{release.title ? `, “${release.title}”` : ""}. Chegue antes e descubra essa história desde a primeira página.</>
        ) : (
          <><strong>{release.seriesTitle}</strong> retorna com {chapterLabel(release.number)}{release.title ? `, “${release.title}”` : ""}. O que acontece depois continua guardado até a estreia.</>
        )}</p>
        <div className="scheduled-release-time" aria-live="polite">
          <strong>{countdownLabel(target - now)}</strong>
          <time dateTime={release.publishAt}>{exactDate}, no horário de Brasília</time>
        </div>
        <div className="scheduled-release-actions">
          <Link href={`/obra/${release.seriesSlug}`} className="btn">{kind === "series-premiere" ? "Conhecer a nova obra" : "Entrar no clima"} <IconArrowRight size={15} /></Link>
          <Link href={notificationsHref} className="btn ghost"><IconBell size={15} /> Ativar avisos</Link>
        </div>
      </div>
    </section>
  );
}
