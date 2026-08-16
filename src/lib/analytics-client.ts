"use client";

const SESSION_KEY = "manga-analytics-session";

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `anonymous-${Date.now()}`;
  }
}

export function trackProductEvent(event: string, data: { seriesId?: number; chapterId?: number; page?: number; path?: string } = {}) {
  const payload = JSON.stringify({ event, sessionId: sessionId(), path: data.path ?? window.location.pathname, seriesId: data.seriesId, chapterId: data.chapterId, page: data.page });
  if (event === "chapter_exit" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}
