"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/features/notifications/actions";
import { IconBell, IconCheckAll } from "@/components/ui/icons";
import { initials } from "@/lib/utils";

type NotificationRow = {
  id: number;
  title: string;
  message: string;
  href: string;
  type: string;
  read: boolean;
  createdLabel: string;
  actorName: string | null;
  actorImage: string | null;
};

export function NotificationCenter({ initialRows }: { initialRows: NotificationRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState(false);
  const unread = rows.filter((row) => !row.read).length;

  async function open(row: NotificationRow) {
    if (!row.read) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, read: true } : item));
      await markNotificationReadAction(row.id);
    }
    router.push(row.href);
  }

  async function markAll() {
    setBusy(true);
    await markAllNotificationsReadAction();
    setRows((current) => current.map((row) => ({ ...row, read: true })));
    setBusy(false);
  }

  if (!rows.length) return <div className="manga-panel empty-state notifications-empty"><IconBell size={28} /><div className="empty-title">Tudo tranquilo por aqui</div><p>Respostas, curtidas, novos seguidores e capítulos das suas favoritas aparecerão aqui.</p><button type="button" className="btn ghost" onClick={() => router.push("/comunidade")}>Conhecer a comunidade</button></div>;

  return <div className="notification-center">
    <div className="notification-toolbar"><span>{unread ? `${unread} ${unread === 1 ? "novidade" : "novidades"}` : "Você está em dia"}</span>{unread > 0 && <button type="button" className="btn small ghost" onClick={markAll} disabled={busy}><IconCheckAll size={14} /> {busy ? "Salvando…" : "Marcar tudo como lido"}</button>}</div>
    <div className="notification-list">{rows.map((row) => <button key={row.id} type="button" className={`notification-row ${row.read ? "is-read" : "is-unread"}`} onClick={() => open(row)}><span className="notification-avatar">{row.actorImage ? <img src={row.actorImage} alt="" /> : row.actorName ? initials(row.actorName) : <IconBell size={17} />}</span><span className="notification-copy"><strong>{row.title}</strong>{row.message && <span>{row.message}</span>}<small>{row.createdLabel}</small></span>{!row.read && <span className="notification-dot" aria-label="Não lida" />}</button>)}</div>
  </div>;
}
