"use client";

import { subscribePushAction } from "@/features/push/actions";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function browserPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function currentBrowserPushActive(): Promise<boolean> {
  if (!browserPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  return Boolean(await registration?.pushManager.getSubscription());
}

export async function enableBrowserPush(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!browserPushSupported()) return { ok: false, error: "Este navegador não oferece avisos push." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "O navegador não autorizou avisos neste aparelho." };
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
      });
    }
    const json = subscription.toJSON();
    const result = await subscribePushAction({
      endpoint: subscription.endpoint,
      keys: { p256dh: json.keys?.p256dh || "", auth: json.keys?.auth || "" },
    });
    return result.ok ? { ok: true } : result;
  } catch {
    return { ok: false, error: "Não foi possível registrar este aparelho para avisos." };
  }
}
