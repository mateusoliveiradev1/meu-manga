import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, user } from "@/db/schema";

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(row?.total ?? 0);
}

export async function getNotifications(userId: string, limit = 50) {
  const actor = user;
  const rows = await db
    .select({
      notification: notifications,
      actorName: actor.name,
      actorImage: actor.image,
    })
    .from(notifications)
    .leftJoin(actor, eq(actor.id, notifications.actorId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((row) => ({ ...row.notification, actorName: row.actorName, actorImage: row.actorImage }));
}
