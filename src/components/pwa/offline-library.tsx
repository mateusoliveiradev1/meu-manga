"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBook } from "@/components/ui/icons";

type CachedChapter = { href: string; label: string };

export function OfflineLibrary() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [chapters, setChapters] = useState<CachedChapter[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function inspect() {
      try {
        if (!("caches" in window)) return;
        const found = new Map<string, CachedChapter>();
        for (const cacheName of await caches.keys()) {
          const cache = await caches.open(cacheName);
          for (const request of await cache.keys()) {
            const url = new URL(request.url);
            if (!/^\/ler\/\d+$/.test(url.pathname)) continue;
            let label = `Capítulo salvo ${url.pathname.split("/").at(-1)}`;
            try {
              const response = await cache.match(request);
              const html = await response?.clone().text();
              const title = html ? new DOMParser().parseFromString(html, "text/html").querySelector("title")?.textContent : null;
              if (title) label = title.split("|")[0].trim();
            } catch { /* o link ainda é útil sem o título */ }
            found.set(url.pathname, { href: url.pathname, label });
          }
        }
        if (!cancelled) setChapters([...found.values()]);
      } catch {
        // Some browsers can expose Cache Storage but still deny access.
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    inspect();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className={`connection-status ${online ? "is-online" : "is-offline"}`} role="status">
        <span aria-hidden="true" /> {online ? "Conexão restabelecida" : "Você está offline"}
      </div>
      <h1>{online ? "Já podemos continuar" : "Sua leitura não precisa parar"}</h1>
      <p>{online ? "A conexão voltou. Recarregue para buscar as publicações mais recentes." : "Capítulos abertos anteriormente podem continuar disponíveis neste aparelho."}</p>
      {ready && chapters.length > 0 ? (
        <div className="offline-library"><h2><IconBook size={17} /> Disponíveis neste aparelho</h2>{chapters.map((chapter) => <Link key={chapter.href} href={chapter.href}>{chapter.label}</Link>)}</div>
      ) : ready ? <p className="offline-empty">Nenhum capítulo completo foi encontrado no cache deste aparelho.</p> : <p className="offline-empty">Verificando leituras salvas…</p>}
      <div className="offline-actions"><button className="btn" type="button" onClick={() => window.location.reload()}>Verificar conexão</button><Link className="btn ghost" href="/obras">Abrir catálogo</Link></div>
    </>
  );
}
