"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteBookmarkAction, saveBookmarkAction } from "@/features/reader/actions";
import { IconBookmark, IconCheck, IconGear, IconTrash } from "@/components/ui/icons";

type Bookmark = { id: number; page: number; note: string };

export function ReaderTools({
  chapterId,
  currentPage,
  total,
  authenticated,
  initialBookmarks,
  preloadPages,
  onPreloadChange,
}: {
  chapterId: number;
  currentPage: number;
  total: number;
  authenticated: boolean;
  initialBookmarks: Bookmark[];
  preloadPages: boolean;
  onPreloadChange: (value: boolean) => void;
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const current = useMemo(() => bookmarks.find((bookmark) => bookmark.page === currentPage), [bookmarks, currentPage]);

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await saveBookmarkAction({ chapterId, page: currentPage, note });
      if (!result.ok) return setMessage(result.error);
      setBookmarks((items) => [...items.filter((item) => item.page !== currentPage), { id: result.bookmark.id, page: result.bookmark.page, note: result.bookmark.note }].sort((a, b) => a.page - b.page));
      setNote("");
      setMessage("Página marcada na sua biblioteca.");
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await deleteBookmarkAction(id);
      setBookmarks((items) => items.filter((item) => item.id !== id));
      setMessage("Marcador removido.");
    });
  }

  return (
    <details className="reader-tools">
      <summary aria-label="Ferramentas da leitura"><IconGear size={16} /><span>Ferramentas</span></summary>
      <div className="reader-tools-panel">
        <div className="reader-tools-head"><strong>Página {currentPage + 1} de {total}</strong><span>privado e sincronizado</span></div>
        {authenticated ? <>
          <label className="reader-note"><span>Anotação desta página</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder={current?.note || "O que você quer lembrar daqui?"} /></label>
          <button type="button" className="btn small" onClick={save} disabled={pending}><IconBookmark size={14} /> {current ? "Atualizar marcador" : "Marcar esta página"}</button>
          {bookmarks.length > 0 && <div className="reader-bookmark-list">{bookmarks.map((bookmark) => <div key={bookmark.id}><a href={`?pagina=${bookmark.page + 1}`}>Página {bookmark.page + 1}{bookmark.note && <small>{bookmark.note}</small>}</a><button type="button" onClick={() => remove(bookmark.id)} aria-label={`Remover marcador da página ${bookmark.page + 1}`}><IconTrash size={13} /></button></div>)}</div>}
        </> : <p className="muted">Entre na sua conta para guardar páginas e anotações privadas.</p>}
        <label className="reader-preload"><input type="checkbox" checked={preloadPages} onChange={(event) => onPreloadChange(event.target.checked)} /><span><strong>Preparar próximas páginas</strong><small>Antecipar até duas imagens para virar a página sem espera.</small></span>{preloadPages && <IconCheck size={14} />}</label>
        {message && <p className="reader-tools-message" role="status">{message}</p>}
      </div>
    </details>
  );
}
