"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createChapterAction,
  createSeriesAction,
  deleteChapterAction,
  deleteSeriesAction,
  duplicateChapterAction,
  setPagesAction,
  updateChapterAction,
  updateSeriesAction,
} from "@/features/catalog/actions";
import JSZip from "jszip";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconImage,
  IconLink,
  IconPlus,
  IconTrash,
} from "@/components/ui/icons";
import { GENRES, genreBySlug, genreSlugsIn, normalizeTags } from "@/lib/genres";

function slugifyClient(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ---------------- upload helpers ---------------- */

const UPLOAD_CONCURRENCY = 4;

/** Numeric-aware filename comparison: "página 2" < "página 10".
    Browsers hand back multi-selected files in alphabetical order, so
    numbered files (página 1, página 10, página 2…) arrive shuffled —
    this restores the numeric order before uploading. */
function compareFileNames(a: File, b: File): number {
  return String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true, sensitivity: "base" });
}

/** Uploads files in parallel (bounded concurrency) preserving selection order. */
async function uploadFilesParallel(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const srcs: string[] = [];
  let done = 0;
  const total = files.length;
  for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
    const batch = files.slice(i, i + UPLOAD_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (file, idx) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Falha no upload de ${file.name}`);
        done++;
        onProgress?.(done, total);
        return { idx, src: data.src as string };
      })
    );
    results.sort((a, b) => a.idx - b.idx).forEach((r) => srcs.push(r.src));
  }
  return srcs;
}

/** Image files from a paste/drop data transfer. */
function imageFilesFrom(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];
  return Array.from(data.files).filter((f) => f.type.startsWith("image/"));
}

/* ---------------- series form ---------------- */

export function SeriesForm({
  initial,
  seriesId,
}: {
  initial?: { title: string; slug: string; synopsis: string; cover: string; status: string; tags: string };
  seriesId?: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? "");
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ongoing");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(Boolean(initial));
  const fileRef = useRef<HTMLInputElement>(null);
  const draftKey = seriesId ? null : "manga:admin:draft:series";

  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null") as Partial<{
        title: string; slug: string; synopsis: string; cover: string; status: string; tags: string;
      }> | null;
      if (saved) {
        setTitle(saved.title ?? "");
        setSlug(saved.slug ?? "");
        setSynopsis(saved.synopsis ?? "");
        setCover(saved.cover ?? "");
        setStatus(saved.status ?? "ongoing");
        setTags(saved.tags ?? "");
        setSlugTouched(Boolean(saved.slug));
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
    setDraftReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ title, slug, synopsis, cover, status, tags }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cover, draftKey, draftReady, slug, status, synopsis, tags, title]);

  const selectedGenres = useMemo(() => {
    return new Set(genreSlugsIn(tags).map((slug) => genreBySlug(slug)?.name).filter(Boolean) as string[]);
  }, [tags]);
  const extraTags = useMemo(() => {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !selectedGenres.has(t))
      .join(", ");
  }, [tags, selectedGenres]);

  function toggleGenre(name: string) {
    const parts = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const lower = parts.map((p) => p.toLowerCase());
    if (lower.includes(name.toLowerCase())) {
      setTags(normalizeTags(parts.filter((p) => p.toLowerCase() !== name.toLowerCase()).join(", ")));
    } else {
      setTags(normalizeTags([...parts, name].join(", ")));
    }
  }

  function onExtraTags(v: string) {
    setTags(normalizeTags([...selectedGenres, v].join(", ")));
  }

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugifyClient(v));
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload falhou");
    return data.src as string;
  }

  async function onCoverFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      const src = await uploadFile(file);
      setCover(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload da capa falhou.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* paste an image from the clipboard, or drop it on the preview, to set the cover */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = imageFilesFrom(e.clipboardData);
      if (files.length === 0) return;
      e.preventDefault();
      onCoverFile(files[0]);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const action = seriesId ? updateSeriesAction.bind(null, seriesId) : createSeriesAction;
    const res = await action({
      title,
      slug,
      synopsis,
      cover,
      status,
      tags,
    });
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    if (draftKey) localStorage.removeItem(draftKey);
    router.push(`/admin/obras/${res.id}/capitulos`);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="sf-title">Título</label>
        <input id="sf-title" value={title} onChange={(e) => onTitleChange(e.target.value)} maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="sf-slug">Endereço (slug)</label>
        <input
          id="sf-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          maxLength={60}
        />
        <span className="hint">O endereço da obra na URL. Deixe em branco para gerar automaticamente.</span>
      </div>
      <div className="field">
        <label htmlFor="sf-synopsis">Sinopse</label>
        <textarea id="sf-synopsis" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={6} />
      </div>
      <div className="field">
        <label htmlFor="sf-status">Status</label>
        <select id="sf-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ongoing">Em publicação</option>
          <option value="completed">Concluída</option>
          <option value="hiatus">Em pausa</option>
          <option value="planned">Em breve</option>
        </select>
      </div>
      <div className="field">
        <label>Gêneros</label>
        <div className="genre-picker" role="group" aria-label="Gêneros da obra">
          {GENRES.map((g) => {
            const on = selectedGenres.has(g.name);
            return (
              <button
                key={g.slug}
                type="button"
                className={`tag-btn ${on ? "active" : ""}`}
                aria-pressed={on}
                onClick={() => toggleGenre(g.name)}
              >
                {on && <IconCheck size={12} />}
                {g.name}
              </button>
            );
          })}
        </div>
        <span className="hint">Toque nos gêneros que combinam com a obra.</span>
      </div>
      <div className="field">
        <label htmlFor="sf-tags">Outras tags (separadas por vírgula)</label>
        <input id="sf-tags" value={extraTags} onChange={(e) => onExtraTags(e.target.value)} placeholder="ex.: universo expandido, história original" />
      </div>
      <div className="field">
        <label>Capa</label>
        <span className="hint">Proporção ideal 3:4 (ex.: 900×1200). Capas fora disso aparecem inteiras, com faixa lateral.</span>
        <div
          className="pm-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onCoverFile(imageFilesFrom(e.dataTransfer)[0]);
          }}
        >
          <div className="row" style={{ justifyContent: "center", gap: "0.8rem" }}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={(e) => onCoverFile(e.target.files?.[0])} />
            <span className="muted">· arraste uma imagem para cá ou cole (Ctrl+V)</span>
          </div>
          <div className="row mt-1" style={{ justifyContent: "center" }}>
            <span className="muted">ou</span>
            <input
              value={cover.startsWith("http") || cover.startsWith("/") ? cover : ""}
              onChange={(e) => setCover(e.target.value)}
              placeholder="cole a URL da imagem"
              style={{ flex: 1, minWidth: "14rem" }}
            />
          </div>
        </div>
        {cover && (
          <div className="mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt="Prévia da capa"
              style={{ width: "6rem", height: "8rem", objectFit: "contain", background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--line)" }}
            />
          </div>
        )}
      </div>
      {error && <div className="form-error">{error}</div>}
      {draftKey && draftReady && <p className="draft-note">Rascunho salvo automaticamente neste aparelho.</p>}
      <div className="row">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar obra"}
        </button>
        <a href="/admin" className="btn ghost">
          Cancelar
        </a>
      </div>
    </form>
  );
}

/* ---------------- chapter form ---------------- */

export function ChapterForm({
  seriesId,
  initial,
  chapterId,
}: {
  seriesId: number;
  initial?: { number: number; title: string; cover: string; published: boolean; publishAt: string };
  chapterId?: number;
}) {
  const router = useRouter();
  const [number, setNumber] = useState(String(initial?.number ?? ""));
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [published, setPublished] = useState(Boolean(initial?.published));
  const [publishAt, setPublishAt] = useState(initial?.publishAt ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(Boolean(initial));
  const fileRef = useRef<HTMLInputElement>(null);
  const draftKey = chapterId ? null : `manga:admin:draft:chapter:${seriesId}`;

  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null") as Partial<{
        number: string; title: string; cover: string; published: boolean; publishAt: string;
      }> | null;
      if (saved) {
        setNumber(saved.number ?? "");
        setTitle(saved.title ?? "");
        setCover(saved.cover ?? "");
        setPublished(Boolean(saved.published));
        setPublishAt(saved.publishAt ?? "");
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
    setDraftReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ number, title, cover, published, publishAt }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cover, draftKey, draftReady, number, publishAt, published, title]);

  async function onCoverFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload da capa falhou");
      setCover(data.src as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload da capa falhou.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* paste an image from the clipboard, or drop it on the preview, to set the cover */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = imageFilesFrom(e.clipboardData);
      if (files.length === 0) return;
      e.preventDefault();
      onCoverFile(files[0]);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const num = parseFloat(number.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      setError("Informe o número do capítulo (ex.: 1, 1.5, 2).");
      return;
    }
    setSaving(true);
    const res = chapterId
      ? await updateChapterAction(chapterId, { number: num, title, cover, published, publishAt })
      : await createChapterAction(seriesId, { number: num, title, cover, published, publishAt });
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    if (draftKey) localStorage.removeItem(draftKey);
    router.push(`/admin/capitulos/${res.id}/editar`);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "0 0 10rem" }}>
          <label htmlFor="cf-number">Número</label>
          <input id="cf-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1" inputMode="decimal" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cf-title">Título do capítulo (opcional)</label>
          <input id="cf-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>
      </div>
      <div className="field">
        <label>Capa do capítulo (opcional)</label>
        <span className="hint">Proporção ideal 3:4 — capas fora disso aparecem inteiras, sem cortar.</span>
        <div
          className="pm-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onCoverFile(imageFilesFrom(e.dataTransfer)[0]);
          }}
        >
          <div className="row" style={{ justifyContent: "center", gap: "0.8rem" }}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={(e) => onCoverFile(e.target.files?.[0])} />
            <span className="muted">· arraste uma imagem para cá ou cole (Ctrl+V)</span>
          </div>
          <div className="row mt-1" style={{ justifyContent: "center" }}>
            <span className="muted">ou</span>
            <input
              value={cover.startsWith("http") || cover.startsWith("/") ? cover : ""}
              onChange={(e) => setCover(e.target.value)}
              placeholder="cole a URL da imagem"
              style={{ flex: 1, minWidth: "14rem" }}
            />
          </div>
        </div>
        {cover && (
          <div className="mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt="Prévia da capa do capítulo"
              style={{ width: "4.5rem", height: "6rem", objectFit: "contain", background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--line)" }}
            />
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="cf-publish-at">Agendar publicação (opcional)</label>
        <input
          id="cf-publish-at"
          type="datetime-local"
          value={publishAt}
          onChange={(e) => {
            setPublishAt(e.target.value);
            if (e.target.value) setPublished(false);
          }}
        />
        <span className="hint">Com uma data preenchida, o capítulo fica oculto e entra no ar automaticamente assim que o horário chegar. A verificação diária do estúdio funciona como garantia mesmo sem visitas.</span>
      </div>
      <label className="row" style={{ marginBottom: "1.2rem", cursor: "pointer", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => {
            setPublished(e.target.checked);
            if (e.target.checked) setPublishAt("");
          }}
        />
        <span>Publicar agora (fica visível para os leitores)</span>
      </label>
      {error && <div className="form-error">{error}</div>}
      {draftKey && draftReady && <p className="draft-note">Rascunho salvo automaticamente neste aparelho.</p>}
      <button type="submit" className="btn" disabled={saving}>
        {saving ? "Salvando..." : chapterId ? "Salvar capítulo" : "Criar capítulo"}
      </button>
    </form>
  );
}

/* ---------------- page manager ---------------- */

export function PageManager({ chapterId, initialPages }: { chapterId: number; initialPages: { id: number; src: string }[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const pagesRef = useRef(pages);
  const [urlText, setUrlText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  async function persist(next: { id: number; src: string }[]) {
    setPages(next);
    const res = await setPagesAction(chapterId, { srcs: next.map((p) => p.src) });
    if (!res.ok) {
      setError(res.error);
      router.refresh();
      return false;
    }
    return true;
  }

  /* paste images from the clipboard straight into the chapter */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = imageFilesFrom(e.clipboardData);
      if (files.length === 0) return;
      e.preventDefault();
      uploadFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    const next = [...pages];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  }

  function moveTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragIndex(null);
    persist(next);
  }

  async function remove(i: number) {
    const next = pages.filter((_, idx) => idx !== i);
    await persist(next);
    router.refresh();
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    setProgress({ done: 0, total: files.length });
    try {
      // reorder numbered files before uploading, so page order follows the numbering
      const ordered = [...files].sort(compareFileNames);
      const srcs = await uploadFilesParallel(ordered, (done, total) => setProgress({ done, total }));
      await persist([...pagesRef.current, ...srcs.map((src) => ({ id: 0, src }))]);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload falhou.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  /* import a ZIP/CBZ archive — extract the image files in numeric order and upload each */
  async function importArchive(file: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress({ done: 0, total: 1 });
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files)
        .filter((f) => !f.dir && /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name))
        .sort((a, b) =>
          String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true, sensitivity: "base" })
        );
      if (entries.length === 0) {
        setError("O arquivo não contém imagens (PNG, JPG, WEBP, GIF ou AVIF).");
        return;
      }
      setProgress({ done: 0, total: entries.length });
      const files: File[] = [];
      for (const entry of entries) {
        const blob = await entry.async("blob");
        files.push(new File([blob], entry.name.split("/").pop()!, { type: blob.type }));
      }
      const srcs = await uploadFilesParallel(files, (done, total) => setProgress({ done, total }));
      await persist([...pagesRef.current, ...srcs.map((src) => ({ id: 0, src }))]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function addUrls() {
    const lines = urlText
      .split(/\s+/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http"));
    if (lines.length === 0) {
      setError("Cole uma ou mais URLs de imagem (uma por linha), começando com http.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await persist([...pages, ...lines.map((src) => ({ id: 0, src }))]);
      setUrlText("");
      router.refresh();
    } catch {
      /* persist reports errors */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-manager">
      <div className="pm-head">
        <h3 style={{ margin: 0 }}>Páginas ({pages.length})</h3>
        <span className="muted">arraste para ordenar ou use as setas</span>
        {pages.length > 0 && (
          <button type="button" className="btn small danger" onClick={() => window.confirm("Apagar todas as páginas deste capítulo?") && persist([])} disabled={busy}>
            <IconTrash size={14} /> Limpar todas
          </button>
        )}
      </div>

      {pages.length === 0 && <p className="muted">Nenhuma página ainda. Envie arquivos ou cole URLs abaixo.</p>}

      {pages.map((p, i) => (
        <div
          key={p.id || `${p.src}-${i}`}
          className={`pm-row ${dragIndex === i ? "is-dragging" : ""}`}
          draggable={!busy}
          onDragStart={() => setDragIndex(i)}
          onDragEnd={() => setDragIndex(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex != null) moveTo(dragIndex, i);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pm-thumb" src={p.src} alt={`Página ${i + 1}`} />
          <div>
            <div>
              Página <span className="mono-num">{i + 1}</span>
            </div>
            <div className="pm-src">{p.src}</div>
          </div>
          <div className="pm-actions">
            <button type="button" className="btn small ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">
              <IconArrowUp size={14} />
            </button>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => move(i, 1)}
              disabled={i === pages.length - 1}
              aria-label="Mover para baixo"
            >
              <IconArrowDown size={14} />
            </button>
            <button type="button" className="btn small danger" onClick={() => remove(i)} aria-label="Apagar página">
              <IconTrash size={14} />
            </button>
          </div>
        </div>
      ))}

      <div
        className={`pm-dropzone ${dragging ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(imageFilesFrom(e.dataTransfer));
        }}
      >
        <div className="pm-upload" style={{ justifyContent: "center" }}>
          <IconImage size={16} />
          <span className="muted">arraste e solte imagens aqui, cole do clipboard (Ctrl+V) ou…</span>
        </div>
        <div className="pm-upload mt-1" style={{ justifyContent: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
            disabled={busy}
          />
          <button
            type="button"
            className="btn small"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <IconPlus size={14} />
            {busy && progress ? `Enviando ${progress.done}/${progress.total}...` : "Escolher arquivos"}
          </button>
        </div>
        <div className="pm-url mt-1" style={{ justifyContent: "center" }}>
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder="ou cole URLs de imagem, uma por linha"
            disabled={busy}
            rows={2}
          />
          <button type="button" className="btn ghost small" onClick={addUrls} disabled={busy}>
            <IconLink size={14} /> Adicionar URLs
          </button>
        </div>
        <div className="pm-upload mt-1" style={{ justifyContent: "center" }}>
          <span className="muted">tem o capítulo em .zip/.cbz?</span>
          <input
            className="pm-zip-input"
            type="file"
            accept=".zip,.cbz,application/zip,application/x-cbz"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importArchive(f);
              e.target.value = "";
            }}
            disabled={busy}
          />
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>(".pm-zip-input");
              input?.click();
            }}
            disabled={busy}
          >
            <IconImage size={14} /> Importar ZIP/CBZ
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

/* ---------------- delete button ---------------- */

export function DeleteButton({
  kind,
  id,
  label,
  redirect,
}: {
  kind: "series" | "chapter";
  id: number;
  label: string;
  redirect?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function del() {
    if (!window.confirm(`Apagar ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(true);
    setError("");
    const res = kind === "series" ? await deleteSeriesAction(id) : await deleteChapterAction(id);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(redirect || "/admin");
    router.refresh();
  }

  return (
    <span>
      <button type="button" className="btn small danger" onClick={del} disabled={busy}>
        <IconTrash size={14} /> Apagar
      </button>
      {error && (
        <span className="muted" style={{ marginLeft: "0.6rem" }}>
          {error}
        </span>
      )}
    </span>
  );
}

export function DuplicateChapterButton({ chapterId }: { chapterId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function duplicate() {
    setBusy(true);
    setError("");
    const result = await duplicateChapterAction(chapterId);
    if (!result.ok || !result.id) {
      setError(result.ok ? "Não foi possível duplicar o capítulo." : result.error);
      setBusy(false);
      return;
    }
    router.push(`/admin/capitulos/${result.id}/editar`);
    router.refresh();
  }

  return (
    <span>
      <button type="button" className="btn small ghost" onClick={duplicate} disabled={busy}>
        {busy ? "Duplicando…" : "Duplicar"}
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}
