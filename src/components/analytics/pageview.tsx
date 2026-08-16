"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires one lightweight pageview per (path, session) — deduped via
 * sessionStorage so reloads/navigations don't inflate the counter.
 */
export function PageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      const key = `manga-pv:${pathname}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
      fetch("/api/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
