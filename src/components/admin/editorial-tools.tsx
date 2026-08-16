"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { bulkPublishChaptersAction } from "@/features/catalog/actions";

type PublishableChapter = {
  id: number;
  seriesTitle: string;
  number: number;
  title: string;
  pageCount: number;
  blockers: string[];
};

export function BulkPublishPanel({ chapters }: { chapters: PublishableChapter[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const ready = chapters.filter((chapter) => chapter.blockers.length === 0);

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function publish() {
    setMessage("");
    startTransition(async () => {
      const result = await bulkPublishChaptersAction(selected);
      if (!result.ok) return setMessage(result.error);
      setSelected([]);
      setMessage(`${selected.length} ${selected.length === 1 ? "capítulo publicado" : "capítulos publicados"}.`);
      router.refresh();
    });
  }

  if (!chapters.length) return <p className="muted">Nenhum rascunho aguardando publicação.</p>;

  return (
    <div className="bulk-publish">
      <div className="bulk-toolbar">
        <button type="button" className="text-button" onClick={() => setSelected(ready.map((chapter) => chapter.id))} disabled={!ready.length}>
          Selecionar os prontos
        </button>
        <span className="muted">{selected.length} selecionado(s)</span>
        <button type="button" className="btn small" onClick={publish} disabled={!selected.length || pending}>
          {pending ? "Publicando…" : "Publicar selecionados"}
        </button>
      </div>
      <div className="bulk-list">
        {chapters.map((chapter) => {
          const blocked = chapter.blockers.length > 0;
          return (
            <label key={chapter.id} className={`bulk-row${blocked ? " is-blocked" : ""}`}>
              <input type="checkbox" checked={selected.includes(chapter.id)} onChange={() => toggle(chapter.id)} disabled={blocked || pending} />
              <span>
                <strong>{chapter.seriesTitle}</strong>
                <small>Cap. {chapter.number}{chapter.title ? ` — ${chapter.title}` : ""}</small>
              </span>
              <span className={blocked ? "qa-blocker" : "qa-ready"}>
                {blocked ? chapter.blockers[0] : `${chapter.pageCount} páginas · pronto`}
              </span>
            </label>
          );
        })}
      </div>
      {message && <p className={message.includes("publicado") ? "success-message" : "form-error"}>{message}</p>}
    </div>
  );
}

export function ChapterQualityPanel({
  pages,
  published,
  title,
}: {
  pages: { position: number; src: string }[];
  published: boolean;
  title: string;
}) {
  const checks = useMemo(() => {
    const seen = new Set<string>();
    const duplicates: number[] = [];
    for (const page of pages) {
      if (seen.has(page.src.trim())) duplicates.push(page.position);
      seen.add(page.src.trim());
    }
    const expected = pages.findIndex((page, index) => page.position !== index + 1);
    return [
      { ok: pages.length > 0, label: pages.length ? `${pages.length} páginas adicionadas` : "Adicione pelo menos uma página" },
      { ok: duplicates.length === 0, label: duplicates.length ? `URLs repetidas nas páginas ${duplicates.join(", ")}` : "Nenhuma página duplicada" },
      { ok: expected < 0, label: expected < 0 ? "Sequência de páginas completa" : `A sequência quebra na posição ${expected + 1}` },
      { ok: Boolean(title.trim()), optional: true, label: title.trim() ? "Subtítulo preenchido" : "Subtítulo ainda não preenchido" },
    ];
  }, [pages, title]);
  const blockers = checks.filter((check) => !check.ok && !check.optional).length;

  return (
    <aside className="quality-panel" aria-label="Checklist de publicação">
      <div>
        <span className="eyebrow">Pré-publicação automática</span>
        <h3>{blockers ? `${blockers} ${blockers === 1 ? "bloqueio" : "bloqueios"}` : "Pronto para publicar"}</h3>
        <p>{published ? "Este capítulo já está no ar. O checklist continua monitorando as páginas." : "Resolva os bloqueios antes de colocar o capítulo no ar."}</p>
      </div>
      <ul className="quality-list">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? "is-ok" : check.optional ? "is-warning" : "is-error"}>
            <span aria-hidden>{check.ok ? "✓" : check.optional ? "!" : "×"}</span>
            {check.label}{check.optional && !check.ok ? " · opcional" : ""}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function ChapterPreviewSplit({ chapterId }: { chapterId: number }) {
  const src = `/ler/${chapterId}?preview=1`;
  return (
    <details className="preview-lab">
      <summary>
        <span>
          <strong>Conferir em desktop e celular</strong>
          <small>As duas prévias usam o capítulo salvo.</small>
        </span>
        <span aria-hidden>+</span>
      </summary>
      <div className="preview-stage">
        <div className="preview-device preview-desktop">
          <span>Desktop · 1440 px</span>
          <iframe src={src} title="Prévia do capítulo em desktop" loading="lazy" />
        </div>
        <div className="preview-device preview-mobile">
          <span>Celular · 390 px</span>
          <iframe src={src} title="Prévia do capítulo no celular" loading="lazy" />
        </div>
      </div>
    </details>
  );
}
