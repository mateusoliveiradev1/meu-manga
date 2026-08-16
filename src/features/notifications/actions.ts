"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { notifications, user, userFollows } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createNotification } from "@/features/notifications/create";

export async function markNotificationReadAction(id: number) {
  const current = await requireUser();
  if (!Number.isInteger(id) || id <= 0) return { ok: false as const, error: "Notificação inválida." };
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, current.id)));
  revalidatePath("/notificacoes");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const current = await requireUser();
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, current.id));
  revalidatePath("/notificacoes");
  return { ok: true as const };
}

export async function toggleFollowAction(targetUserId: string) {
  const current = await requireUser();
  if (!targetUserId || targetUserId === current.id) return { ok: false as const, error: "Não é possível seguir este perfil." };
  const [target] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!target) return { ok: false as const, error: "Leitor não encontrado." };
  const [existing] = await db
    .select()
    .from(userFollows)
    .where(and(eq(userFollows.followerId, current.id), eq(userFollows.followingId, targetUserId)))
    .limit(1);
  if (existing) {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, current.id), eq(userFollows.followingId, targetUserId)));
  } else {
    await db.insert(userFollows).values({ followerId: current.id, followingId: targetUserId });
    await createNotification({
      userId: targetUserId,
      actorId: current.id,
      type: "follow",
      title: `${current.name} começou a acompanhar você`,
      href: `/leitores/${current.id}`,
    });
  }
  revalidatePath(`/leitores/${targetUserId}`);
  revalidatePath("/comunidade");
  return { ok: true as const, following: !existing };
}
