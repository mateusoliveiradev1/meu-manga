"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/features/auth/client";
import { setRatingAction } from "@/features/ratings/actions";
import { IconStar } from "@/components/ui/icons";
import { authPath } from "@/lib/navigation";

export function RatingStars({
  seriesId,
  avg,
  count,
  mine,
}: {
  seriesId: number;
  avg: number;
  count: number;
  mine: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [hover, setHover] = useState(0);
  const [value, setValue] = useState<number | null>(mine);
  const [busy, setBusy] = useState(false);

  const logged = !!session?.user;
  const ready = logged && !isPending;
  const show = hover || value || 0;

  async function set(v: number) {
    if (!ready || busy) return;
    setBusy(true);
    const res = await setRatingAction(seriesId, v);
    setBusy(false);
    if (res.ok) {
      setValue(v);
      router.refresh();
    }
  }

  return (
    <div className="rating-block">
      <div className="rating-stars" role="radiogroup" aria-label={`Nota média ${avg > 0 ? avg : "—"} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={!ready || busy}
            onMouseEnter={() => ready && setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => set(n)}
            className={n <= show ? "on" : ""}
            aria-label={`${n} ${n > 1 ? "estrelas" : "estrela"}`}
          >
            <IconStar size={20} />
          </button>
        ))}
      </div>
      <span className="rating-num mono-num">{avg > 0 ? avg.toFixed(1) : "—"}</span>
      <span className="rating-count">
        {count === 0 ? "sem notas ainda" : `${count} ${count === 1 ? "nota" : "notas"}`}
      </span>
      {!logged && <Link className="rating-hint" href={authPath("entrar", pathname, "avaliacao")}>entre para dar sua nota</Link>}
    </div>
  );
}
