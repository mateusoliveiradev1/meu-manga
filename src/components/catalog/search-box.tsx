"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { IconSearch } from "@/components/ui/icons";

type Suggestion = { title: string; slug: string; cover: string };

export function SearchBox() {
  const id = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setRows([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { results?: Suggestion[] };
        setRows(data.results ?? []);
        setOpen(true);
      } catch {
        // Digitar uma nova consulta cancela a anterior; nenhum erro precisa aparecer.
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <form ref={rootRef} className="header-search" action="/" method="get" role="search" onSubmit={() => setOpen(false)}>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => rows.length > 0 && setOpen(true)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        placeholder="Buscar obras…"
        aria-label="Buscar obras"
        aria-controls={id}
        aria-expanded={open}
        autoComplete="off"
      />
      <button type="submit" aria-label="Buscar">
        <IconSearch size={15} />
      </button>
      {open && (
        <div id={id} className="search-suggestions" role="listbox" aria-label="Sugestões de obras">
          {rows.length > 0 ? (
            rows.map((row) => (
              <Link key={row.slug} href={`/obra/${row.slug}`} role="option" onClick={() => setOpen(false)}>
                {row.cover ? <img src={row.cover} alt="" /> : <span className="search-suggestion-cover" aria-hidden="true" />}
                <span>{row.title}</span>
              </Link>
            ))
          ) : (
            <span className="search-empty">Nenhuma obra encontrada.</span>
          )}
        </div>
      )}
    </form>
  );
}
