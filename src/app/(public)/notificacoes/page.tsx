import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationCenter } from "@/components/community/notification-center";
import { IconBell } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getNotifications } from "@/features/notifications/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificações", description: "Novidades da sua estante e da comunidade." };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=%2Fnotificacoes&motivo=notificacoes");
  const rows = await getNotifications(user.id);
  return <>
    <section className="page-head community-head"><h1><IconBell size={28} /> Suas notificações</h1><p className="page-sub">A conversa continua aqui, mesmo depois que você fecha o capítulo.</p></section>
    <NotificationCenter initialRows={rows.map((row) => ({ id: row.id, title: row.title, message: row.message, href: row.href, type: row.type, read: Boolean(row.readAt), createdLabel: formatDate(row.createdAt), actorName: row.actorName, actorImage: row.actorImage }))} />
  </>;
}
