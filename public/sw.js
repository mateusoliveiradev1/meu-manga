/* Service worker — Plataforma Dark Premium
   - Navegação: network-first com fallback para cache (sempre mostra o capítulo novo)
   - Imagens (/api/files e R2): cache-first com preenchimento em runtime (leitura offline) */
const CACHE = "manga-studio-v1";
const PRECACHE = ["/", "/sobre"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isImage(url) {
  return url.pathname.startsWith("/api/files/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !url.hostname.includes("r2.dev")) return;

  // imagens: cache-first (a leitura fica disponível offline após a primeira visita)
  if (isImage(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // navegação/páginas: network-first (dados frescos), cache como fallback offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode === "navigate") {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
  );
});
