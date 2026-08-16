import Link from "next/link";
import { requireAdmin } from "@/features/auth/session";
import { IconGear, IconPlus } from "@/components/ui/icons";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="admin-head">
        <h1>
          <IconGear size={22} /> Bancada do autor
        </h1>
        <Link href="/admin/obras/novo" className="btn">
          <IconPlus size={15} /> Começar uma obra
        </Link>
      </div>

      <AdminNav />

      {children}
    </div>
  );
}
