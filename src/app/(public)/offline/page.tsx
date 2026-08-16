import { IconBook } from "@/components/ui/icons";
import { OfflineLibrary } from "@/components/pwa/offline-library";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <section className="manga-panel offline-card">
      <span className="offline-icon" aria-hidden="true"><IconBook size={28} /></span>
      <OfflineLibrary />
    </section>
  );
}
