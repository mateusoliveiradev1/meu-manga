"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/features/auth/client";
import { addCommentAction } from "@/features/comments/actions";
import { saveProgressAction } from "@/features/reader/actions";
import { IconArrowLeft, IconArrowRight, IconChat, IconBook } from "@/components/ui/icons";
import { cloudinaryImageUrl, READER_WIDTHS, responsiveImageProps } from "@/lib/images";
import { authPath } from "@/lib/navigation";

type PageSrc = { id: number; src: string };

const PROGRESS_KEY = (chapterId: number) => `manga-progress:${chapterId}`;
const SCROLL_KEY = (chapterId: number) => `manga-scroll:${chapterId}`;
const LAST_KEY = (seriesId: number) => `manga-last:${seriesId}`;
const MODE_KEY = "manga-mode";

function readLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode — ignore */
  }
}

export function Reader({
  pages,
  chapterId,
  seriesId,
  seriesTitle,
  chapterTitle,
  chapterNumber,
  prevHref,
  nextHref,
  backHref,
  initialPage,
  authenticated = false,
}: {
  pages: PageSrc[];
  chapterId: number;
  seriesId: number;
  seriesTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  prevHref: string | null;
  nextHref: string | null;
  backHref: string;
  initialPage: number | null;
  authenticated?: boolean;
}) {
  // scroll is the main reading mode; page is the single-page mode; dupla is the two-page spread
  const [mode, setMode] = useState<"scroll" | "page" | "dupla">("scroll");
  const [pageIdx, setPageIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [scrollFrac, setScrollFrac] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({}); // pageId -> erro
  const [halfPos, setHalfPos] = useState<0 | 1>(0); // spread: which half is shown (0 = left, 1 = right)
  const [sizesVer, setSizesVer] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<Map<number, { w: number; h: number }>>(new Map());
  const lastFrac = useRef(0);
  const total = pages.length;
  const { data: session } = authClient.useSession();
  const isAuthenticated = authenticated || Boolean(session?.user?.id);

  /* remember the natural size of each page (measured on load) so spreads —
     images wider than tall — can be detected without any DB metadata */
  const measure = useCallback((id: number, el: HTMLImageElement) => {
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (!w || !h) return;
    const prev = sizesRef.current.get(id);
    if (!prev || prev.w !== w || prev.h !== h) {
      sizesRef.current.set(id, { w, h });
      setSizesVer((v) => v + 1);
    }
  }, []);

  const isSpread = useCallback((id: number) => {
    const s = sizesRef.current.get(id);
    return !!s && s.w > s.h; // wider than tall = a two-page spread image
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pushProgress = useCallback(
    (page: number) => {
      if (isAuthenticated) {
        saveProgressAction({ chapterId, page }).catch(() => {});
      } else {
        writeLS(PROGRESS_KEY(chapterId), String(page));
      }
      writeLS(LAST_KEY(seriesId), String(chapterId));
    },
    [isAuthenticated, chapterId, seriesId]
  );

  const saveScroll = useCallback(
    (frac: number) => {
      lastFrac.current = frac;
      if (isAuthenticated) {
        saveProgressAction({ chapterId, page: Math.min(total, Math.round(frac * total)) }).catch(() => {});
      } else {
        writeLS(SCROLL_KEY(chapterId), String(frac));
      }
      writeLS(LAST_KEY(seriesId), String(chapterId));
    },
    [isAuthenticated, chapterId, total, seriesId]
  );

  /* register the visit once per session + restore reading mode, progress and scroll */
  useEffect(() => {
    const savedMode = readLS(MODE_KEY);
    if (savedMode === "page" || savedMode === "dupla") setMode(savedMode); // scroll is the default; page/dupla opt out
    try {
      if (!window.sessionStorage.getItem(`manga-read:${chapterId}`)) {
        window.sessionStorage.setItem(`manga-read:${chapterId}`, "1");
        fetch(`/api/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    if (!isAuthenticated) {
      const saved = Number(readLS(PROGRESS_KEY(chapterId)) ?? "0");
      if (Number.isFinite(saved) && saved > 0 && saved < total) setPageIdx(saved);
    }
    // scroll restore: logged-in users come from the server page, guests from localStorage
    let savedFrac = 0;
    if (isAuthenticated) {
      if (initialPage != null && initialPage > 0 && initialPage < total) savedFrac = initialPage / total;
    } else {
      const scroll = Number(readLS(SCROLL_KEY(chapterId)) ?? "");
      if (Number.isFinite(scroll) && scroll > 0.02) savedFrac = scroll;
    }
    if (savedFrac > 0.02) {
      // jump only once the pages have dimensions (images load async)
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".reader-stage.scroll img"));
        const ready = imgs.length > 0 && imgs.every((im) => im.complete && im.naturalWidth > 0);
        if (ready || tries > 25) {
          clearInterval(timer);
          const max = document.documentElement.scrollHeight - window.innerHeight;
          if (max > 0) window.scrollTo(0, max * savedFrac);
        }
      }, 200);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, total, isAuthenticated]);

  /* page mode: reset image fade-in + zoom on every page turn. Images served from
     cache never fire onLoad in React, so check img.complete as well — otherwise the
     page would stay invisible (opacity 0) for cached pages. */
  useEffect(() => {
    setImgLoaded(false);
    if (imgRef.current?.complete) setImgLoaded(true);
  }, [pageIdx]);

  const onImgError = useCallback((id: number) => {
    setImgFailed((f) => ({ ...f, [id]: true }));
  }, []);

  /* preload the next pages so page turns are instant: warm the browser cache for
     the next 2 images in page/dupla modes (scroll mode already renders all imgs) */
  useEffect(() => {
    if (mode === "scroll" || total === 0) return;
    const step = mode === "dupla" && !narrow ? 2 : 1;
    for (let i = 1; i <= 2; i++) {
      const idx = pageIdx + i * step;
      const src = pages[idx]?.src;
      if (!src) continue;
      const img = new Image();
      img.src = cloudinaryImageUrl(src, 1600);
    }
  }, [pageIdx, mode, narrow, pages, total]);

  /* scroll mode: track the NATIVE document scroll (manga-site style), throttled */
  useEffect(() => {
    if (mode !== "scroll") return;
    let raf = 0;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let lastSave = 0;
    const doSave = (frac: number, force = false) => {
      const now = Date.now();
      if (!force && now - lastSave < 2000) return;
      lastSave = now;
      saveScroll(frac);
    };
    const measure = (forceSave = false) => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setScrollFrac(frac);
      setFinished(frac > 0.985);
      lastFrac.current = frac; // always track the true position, so the unmount flush is exact
      doSave(frac, forceSave);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => measure(false));
      clearTimeout(debounce);
      debounce = setTimeout(() => measure(true), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const flush = () => saveScroll(lastFrac.current); // best effort on tab close / reload
    window.addEventListener("pagehide", flush);
    measure(false);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", flush);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(debounce);
      flush(); // the final position on leave (client-side navigation)
    };
  }, [mode, chapterId, total, isAuthenticated, saveScroll]);

  const goPrev = useCallback(() => {
    setFinished(false);
    setZoom(false);
    setHalfPos(0);
    const step = mode === "dupla" && !narrow ? 2 : 1;
    const next = Math.max(0, pageIdx - step);
    setPageIdx(next);
    pushProgress(next);
  }, [mode, narrow, pageIdx, pushProgress]);

  const goNext = useCallback(() => {
    setZoom(false);
    setHalfPos(0);
    if (pageIdx >= total - 1) {
      setFinished(true);
      pushProgress(pageIdx);
      return;
    }
    const step = mode === "dupla" && !narrow ? 2 : 1;
    const next = Math.min(total - 1, pageIdx + step);
    setPageIdx(next);
    pushProgress(next);
  }, [total, mode, narrow, pageIdx, pushProgress]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // typing in a field (header search, comment box…) must never page the reader
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (mode === "page") {
        const spread = isSpread(pages[pageIdx]?.id ?? -1);
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();
          if (spread && halfPos === 0) setHalfPos(1);
          else goNext();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          if (spread && halfPos === 1) setHalfPos(0);
          else goPrev();
        }
      } else if (mode === "dupla") {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();
          goNext();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          goPrev();
        }
      } else {
        if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight * 0.9, behavior: "smooth" });
        }
      }
    },
    [mode, goNext, goPrev, isSpread, pages, pageIdx, halfPos]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const chooseMode = (m: "scroll" | "page" | "dupla") => {
    setMode(m);
    setHalfPos(0);
    writeLS(MODE_KEY, m);
  };

  /* spread tap zones: right half advances to the right half, then to the next
     page; left half goes back to the left half, then to the previous page */
  const tapSpread = (e: React.MouseEvent) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const onRight = e.clientX - rect.left > rect.width / 2;
    if (onRight) {
      if (halfPos === 0) setHalfPos(1);
      else goNext();
    } else {
      if (halfPos === 1) setHalfPos(0);
      else goPrev();
    }
  };

  /* pan the spread so the selected half fills the frame */
  useEffect(() => {
    if (mode !== "page" || !spread) return;
    const el = frameRef.current;
    if (!el) return;
    el.scrollLeft = halfPos === 1 ? el.scrollWidth - el.clientWidth : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, halfPos, mode, sizesVer]);

  const spread = mode === "page" && isSpread(pages[pageIdx]?.id ?? -1);
  const duplaStep = mode === "dupla" && !narrow ? 2 : 1;
  const progress =
    mode === "scroll" ? scrollFrac : finished ? 1 : pageIdx / Math.max(1, total - 1);
  const pageLabel =
    mode === "scroll"
      ? `${Math.round(scrollFrac * 100)}%`
      : mode === "dupla"
        ? `${pageIdx + 1}–${Math.min(pageIdx + duplaStep, total)} / ${total}`
        : `${Math.min(pageIdx + 1, total)} / ${total}`;

  return (
    <div className="reader-shell">
      <div className="reader-top">
        <Link href={backHref} className="rt-back">
          <IconArrowLeft size={18} /> Obra
        </Link>
        <h1 className="rt-title">
          <Link href={`/capitulo/${chapterId}`} className="rt-chapter-link">
            <b>{seriesTitle}</b> — {chapterNumber} · {chapterTitle}
          </Link>
        </h1>
        <div className="rt-mode" role="group" aria-label="Controles de leitura" style={{ display: "flex", gap: "0.3rem" }}>
          {mode === "page" && !spread && (
            <button
              type="button"
              onClick={() => setZoom((z) => !z)}
              aria-pressed={zoom}
              className="btn small ghost"
              style={zoom ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
            >
              {zoom ? "Reduzir" : "Ampliar"}
            </button>
          )}
          {(["scroll", "page", "dupla"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => chooseMode(m)}
              aria-pressed={mode === m}
              className="btn small ghost"
              style={mode === m ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
            >
              {m === "page" ? "Página" : m === "dupla" ? "Dupla" : "Rolagem"}
            </button>
          ))}
        </div>
      </div>
      <div className="reader-progress" role="progressbar" aria-label="Progresso do capítulo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="bar" style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} />
        <span className="sr-only">{pageLabel}</span>
      </div>

      {mode === "page" && (
        <div className="reader-stage">
          {!finished ? (
            <>
              <div
                ref={spread ? frameRef : undefined}
                className={`page-frame ${zoom ? "zoomed" : ""} ${spread ? "spread" : ""}`}
                key={pageIdx}
                onDoubleClick={spread ? undefined : () => setZoom((z) => !z)}
                onClick={spread && !zoom ? tapSpread : undefined}
                style={!spread ? { animation: "page-in 0.3s var(--ease-out)" } : undefined}
                title={
                  spread ? "Página dupla — toque para navegar as metades" : zoom ? "Duplo clique para reduzir" : "Duplo clique para ampliar"
                }
              >
                {imgFailed[pages[pageIdx].id] ? (
                  <div className="page-frame page-broken">
                    <p>Esta página não pôde ser carregada.</p>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => setImgFailed((f) => ({ ...f, [pages[pageIdx].id]: false }))}
                    >
                      Tentar de novo
                    </button>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    ref={imgRef}
                    className={`page-img ${imgLoaded ? "loaded" : ""}`}
                    {...responsiveImageProps(pages[pageIdx].src, READER_WIDTHS, "(max-width: 900px) 100vw, 90vw")}
                    alt={`Página ${pageIdx + 1} de ${chapterTitle}`}
                    onLoad={(e) => {
                      measure(pages[pageIdx].id, e.currentTarget);
                      setImgLoaded(true);
                    }}
                    onError={() => onImgError(pages[pageIdx].id)}
                  />
                )}
                <span className="page-count">
                  {spread ? `${pageLabel} · ${halfPos === 0 ? "metade 1/2" : "metade 2/2"}` : pageLabel}
                </span>
              </div>
              {!zoom && !spread && pageIdx > 0 && (
                <button className="page-nav prev" onClick={goPrev} aria-label="Página anterior">
                  <span className="nav-arrow prev">
                    <IconArrowLeft size={34} />
                  </span>
                </button>
              )}
              {!zoom && !spread && (
                <button className="page-nav next" onClick={goNext} aria-label="Próxima página">
                  <span className="nav-arrow next">
                    <IconArrowRight size={34} />
                  </span>
                </button>
              )}
              {spread && (
                <p className="spread-hint">página dupla — toque em cada metade para navegar</p>
              )}
            </>
          ) : (
            <ChapterEnd
              seriesTitle={seriesTitle}
              chapterTitle={chapterTitle}
              chapterNumber={chapterNumber}
              prevHref={prevHref}
              nextHref={nextHref}
              backHref={backHref}
              onReplay={() => {
                setFinished(false);
                setPageIdx(0);
              }}
            />
          )}
        </div>
      )}

      {mode === "dupla" && (
        <div className="reader-stage dupla">
          {!finished ? (
            <>
              {(() => {
                const a = pages[pageIdx];
                const showPair = !narrow && !isSpread(a.id) && pageIdx + 1 < total;
                const b = showPair ? pages[pageIdx + 1] : null;
                const items = b ? [a, b] : [a];
                return items.map((p) => (
                  <div key={p.id} className={`page-frame ${isSpread(p.id) ? "spread-inline" : ""}`}>
                    {imgFailed[p.id] ? (
                      <div className="page-broken">
                        <p>Esta página não pôde ser carregada.</p>
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => setImgFailed((f) => ({ ...f, [p.id]: false }))}
                        >
                          Tentar de novo
                        </button>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="page-img loaded"
                        {...responsiveImageProps(p.src, READER_WIDTHS, "(max-width: 900px) 100vw, 48vw")}
                        alt={`Página ${pageIdx + 1} de ${chapterTitle}`}
                        onLoad={(e) => measure(p.id, e.currentTarget)}
                        onError={() => onImgError(p.id)}
                      />
                    )}
                  </div>
                ));
              })()}
              <span className="page-count dupla-count">{pageLabel}</span>
              {pageIdx > 0 && (
                <button className="page-nav prev" onClick={goPrev} aria-label="Páginas anteriores">
                  <span className="nav-arrow prev">
                    <IconArrowLeft size={34} />
                  </span>
                </button>
              )}
              {pageIdx < total - 1 && (
                <button className="page-nav next" onClick={goNext} aria-label="Próximas páginas">
                  <span className="nav-arrow next">
                    <IconArrowRight size={34} />
                  </span>
                </button>
              )}
            </>
          ) : (
            <ChapterEnd
              seriesTitle={seriesTitle}
              chapterTitle={chapterTitle}
              chapterNumber={chapterNumber}
              prevHref={prevHref}
              nextHref={nextHref}
              backHref={backHref}
              onReplay={() => {
                setFinished(false);
                setPageIdx(0);
              }}
            />
          )}
        </div>
      )}

      {mode === "scroll" && (
        <div className="reader-stage scroll">
          {pages.map((p, i) => (
            <div className="page-frame" key={p.id} style={{ marginBottom: "0.9rem" }}>
              {imgFailed[p.id] ? (
                <div className="page-frame page-broken">
                  <p>Esta página não pôde ser carregada.</p>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => setImgFailed((f) => ({ ...f, [p.id]: false }))}
                  >
                    Tentar de novo
                  </button>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="page-img loaded"
                  {...responsiveImageProps(p.src, READER_WIDTHS, "100vw")}
                  alt={`Página ${i + 1} de ${chapterTitle}`}
                  onLoad={(e) => measure(p.id, e.currentTarget)}
                  onError={() => onImgError(p.id)}
                />
              )}
            </div>
          ))}
          <ChapterEnd
            seriesTitle={seriesTitle}
            chapterTitle={chapterTitle}
            chapterNumber={chapterNumber}
            prevHref={prevHref}
            nextHref={nextHref}
            backHref={backHref}
            onReplay={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        </div>
      )}
    </div>
  );
}

function ChapterEnd({
  seriesTitle,
  chapterTitle,
  chapterNumber,
  prevHref,
  nextHref,
  backHref,
  onReplay,
}: {
  seriesTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  prevHref: string | null;
  nextHref: string | null;
  backHref: string;
  onReplay: () => void;
}) {
  const supportUrl = process.env.SUPPORT_URL;
  return (
    <div className="reader-end">
      <div className="end-title">Fim do capítulo</div>
      <p className="end-sub">
        Você chegou ao fim de <b>{seriesTitle}</b> — capítulo {chapterNumber} · {chapterTitle}. Obrigado por ler até
        aqui!
      </p>
      <div className="end-actions">
        <button type="button" className="btn ghost" onClick={onReplay}>
          Reler
        </button>
        {prevHref && (
          <Link href={prevHref} className="btn ghost">
            <IconArrowLeft size={16} /> Capítulo anterior
          </Link>
        )}
        {nextHref && (
          <Link href={nextHref} className="btn">
            Próximo capítulo <IconArrowRight size={16} />
          </Link>
        )}
        <Link href={backHref} className="btn ghost">
          Voltar à obra
        </Link>
        <a href="#comentarios" className="btn ghost">
          <IconChat size={16} /> Conversar sobre o capítulo
        </a>
      </div>
      {supportUrl && (
        <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="end-support">
          Gostou do capítulo? Apoie o estúdio ♥
        </a>
      )}
    </div>
  );
}

/* ---------- resume note: merges server (logged-in) and guest progress ---------- */

export function ResumeNote({
  seriesId,
  chapters,
  serverProgress,
}: {
  seriesId: number;
  chapters: { id: number; number: number; title: string }[];
  serverProgress: { chapterId: number; page: number } | null;
}) {
  const [note, setNote] = useState<{ id: number; number: number; title: string; page: number | null } | null>(() => {
    if (!serverProgress || serverProgress.page <= 0) return null;
    const chapter = chapters.find((item) => item.id === serverProgress.chapterId);
    return chapter ? { ...chapter, page: serverProgress.page } : null;
  });

  useEffect(() => {
    // logged-in users get server progress; guests read localStorage
    if (serverProgress) {
      const ch = chapters.find((c) => c.id === serverProgress.chapterId);
      if (ch && serverProgress.page > 0) setNote({ ...ch, page: serverProgress.page });
      return;
    }
    const last = readLS(LAST_KEY(seriesId));
    if (!last) return;
    const ch = chapters.find((c) => String(c.id) === last);
    if (!ch) return;
    const p = Number(readLS(PROGRESS_KEY(ch.id)) ?? "0");
    setNote({ ...ch, page: Number.isFinite(p) && p > 0 ? p : null });
  }, [seriesId, chapters, serverProgress]);

  if (!note) return null;
  return (
    <div className="manga-panel resume-note">
      <span className="blink" style={{ color: "var(--accent)", display: "inline-flex" }}>
        <IconBook size={15} />
      </span>
      <span>
        Você estava em <b>{note.title}</b>
        {note.page !== null ? `, página ${note.page + 1}` : ""} —{" "}
        <Link href={`/ler/${note.id}`}>continuar de onde parei</Link>
      </span>
    </div>
  );
}

/* ---------- comment form ---------- */

export function CommentForm({ chapterId, seriesId }: { chapterId?: number; seriesId?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [spoiler, setSpoiler] = useState(false);

  if (!session?.user) {
    return (
      <p className="manga-panel cm-login-hint">
        <IconChat size={16} /> Quer participar da conversa?{" "}
        <Link href={authPath("entrar", `${pathname}#comentarios`, "comentario")}>Entre para comentar</Link> ou{" "}
        <Link href={authPath("cadastro", `${pathname}#comentarios`, "comentario")}>crie sua estante</Link>. Você volta para esta conversa depois.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!content.trim()) {
      setError("Escreva um comentário antes de publicar.");
      return;
    }
    setSending(true);
    const res = await addCommentAction({ chapterId, seriesId }, { content, spoiler });
    if (!res.ok) {
      setError(res.error || "Não foi possível publicar o comentário.");
      setSending(false);
      return;
    }
    setContent("");
    setSpoiler(false);
    setSending(false);
    router.refresh();
  }

  return (
    <form className="cm-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="cm-msg">
          Comentando como {session.user.name}
        </label>
        <textarea
          id="cm-msg"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={chapterId ? "O que mais chamou sua atenção neste capítulo?" : "O que você achou desta história?"}
        />
      </div>
      <label className="cm-spoiler-toggle">
        <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
        Este comentário contém spoiler
      </label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" className="btn" disabled={sending}>
        <IconChat size={16} /> {sending ? "Publicando…" : "Publicar comentário"}
      </button>
    </form>
  );
}
