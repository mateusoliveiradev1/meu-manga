"use client";

import { useEffect, useRef, useState } from "react";

export function HitCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const dur = 1100;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const digits = String(display).padStart(Math.max(3, String(value).length), "0").split("");

  return (
    <div>
      <span className="counter-label">{label}</span>
      <span className="counter-display" aria-hidden="true">
        {digits.map((d, i) => (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", height: "1em", verticalAlign: "top" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(-${Number(d)}em)`,
                transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
                transitionDelay: `${i * 40}ms`,
              }}
            >
              {"0123456789".split("").map((n, j) => (
                <span key={j} style={{ display: "block", height: "1em", lineHeight: 1 }}>
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span className="sr-only">{value.toLocaleString("pt-BR")} {label}</span>
    </div>
  );
}
