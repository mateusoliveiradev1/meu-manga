"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Dropdown <details>/<summary> que fecha ao clicar fora dele, ao pressionar
 * Esc ou ao trocar de rota. Mantém o comportamento nativo (o summary abre e
 * fecha) e continua funcionando sem JS — só perde o fechar por clique fora.
 */
export function DetailsMenu({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (el?.open) el.open = false;
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(event.target as Node)) {
        el.open = false;
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const el = ref.current;
      if (!el?.open) return;
      el.open = false;
      (el.querySelector("summary") as HTMLElement | null)?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
