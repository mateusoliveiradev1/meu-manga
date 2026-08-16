"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "manga-theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(THEME_KEY);
    } catch {
      /* ignore */
    }
    setTheme(saved === "light" ? "light" : "dark");
    applyTheme(saved === "light" ? "light" : "dark");
  }, []);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={theme === "light"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
      }}
    >
      {theme === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
