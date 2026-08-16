import "server-only";

import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { pushSubscriptions, user } from "@/db/schema";

export async function getPushState(userId: string) {
  const [[settings], [subscriptions]] = await Promise.all([
    db.select({ notifyNewChapters: user.notifyNewChapters, notifySocial: user.notifySocial }).from(user).where(eq(user.id, userId)).limit(1),
    db.select({ count: count() }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)),
  ]);
  return { configured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY), subscriptionCount: Number(subscriptions?.count ?? 0), notifyNewChapters: settings?.notifyNewChapters ?? true, notifySocial: settings?.notifySocial ?? true };
}
