import "server-only";

import webpush from "web-push";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { pushSubscriptions, user } from "@/db/schema";

type PushPayload = { title: string; body: string; href: string; tag?: string };

function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || `mailto:${process.env.ADMIN_EMAIL?.split(",")[0] || "admin@example.com"}`, publicKey, privateKey);
  return true;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload, category: "chapter" | "social" = "social") {
  if (!userIds.length || !configured()) return { sent: 0 };
  const rows = await db
    .select({ subscription: pushSubscriptions, notifyNewChapters: user.notifyNewChapters, notifySocial: user.notifySocial })
    .from(pushSubscriptions)
    .innerJoin(user, eq(user.id, pushSubscriptions.userId))
    .where(and(inArray(pushSubscriptions.userId, [...new Set(userIds)]), category === "chapter" ? eq(user.notifyNewChapters, true) : eq(user.notifySocial, true)));
  let sent = 0;
  await Promise.all(rows.map(async ({ subscription }) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), { TTL: category === "chapter" ? 86400 : 3600, urgency: category === "chapter" ? "normal" : "low" });
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
      else console.error("[push] falha de entrega", { status, endpoint: subscription.endpoint.slice(0, 80) });
    }
  }));
  return { sent };
}
