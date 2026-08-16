"use client";

import { useState } from "react";
import { setNotifyNewChapters } from "@/features/profile/actions";

export function NotifyToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !on;
    const res = await setNotifyNewChapters(next);
    if (res.ok) setOn(next);
    setBusy(false);
  }

  return (
    <label className="notify-toggle" style={{ cursor: "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={on} onChange={toggle} disabled={busy} />
      <span>
        Avisar por email quando sair capítulo novo das minhas favoritas
      </span>
    </label>
  );
}
