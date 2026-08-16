import Link from "next/link";
import { IconBook } from "@/components/ui/icons";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <section className="manga-panel offline-card">
      <span className="offline-icon" aria-hidden="true"><IconBook size={28} /></span>
      <h1>Você está sem conexão</h1>
      <p>As páginas e capítulos que você já abriu continuam disponíveis no cache deste aparelho.</p>
      <Link className="btn" href="/">Tentar novamente</Link>
    </section>
  );
}
