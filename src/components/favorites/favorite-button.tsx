"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/client";
import { toggleFavoriteAction } from "@/features/favorites/actions";
import { IconStar } from "@/components/ui/icons";
import { trackProductEvent } from "@/lib/analytics-client";

const GUEST_FAVS_KEY = "manga-guest-favs";

function readGuestFavs(): number[] {
  try {
    const raw = window.localStorage.getItem(GUEST_FAVS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function FavoriteButton({ seriesId, title, initial }: { seriesId: number; title: string; initial: boolean }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [fav, setFav] = useState(initial);

  useEffect(() => {
    if (session?.user) return;
    setFav(readGuestFavs().includes(seriesId));
  }, [session, seriesId]);

  // wait for the session to resolve before enabling: clicking early would treat
  // a logged-in user as a guest and stash the favorite in localStorage only
  const ready = !isPending;

  async function toggle() {
    if (!session?.user) {
      // guest: store locally
      const next = readGuestFavs();
      const idx = next.indexOf(seriesId);
      if (idx >= 0) next.splice(idx, 1);
      else next.push(seriesId);
      try {
        window.localStorage.setItem(GUEST_FAVS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setFav(next.includes(seriesId));
      if (next.includes(seriesId)) trackProductEvent("favorite", { seriesId });
      return;
    }
    const res = await toggleFavoriteAction(seriesId);
    if (res.ok) {
      setFav(res.favorite);
      if (res.favorite) trackProductEvent("favorite", { seriesId });
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className={`btn ghost ${fav ? "fav-on" : ""}`}
      onClick={toggle}
      aria-pressed={fav}
      disabled={!ready}
      title={!ready ? "Carregando..." : fav ? `Remover “${title}” dos favoritos` : `Adicionar “${title}” aos favoritos`}
    >
      <IconStar size={16} /> {fav ? "Favorita" : "Favoritar"}
    </button>
  );
}
