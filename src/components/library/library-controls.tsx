"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createCollectionAction, deleteCollectionAction, setLibraryStatusAction, toggleCollectionItemAction } from "@/features/library/actions";
import { LIBRARY_STATUS, type LibraryStatus } from "@/features/library/types";
import { IconBookmark, IconCheck, IconList, IconPlus, IconTrash } from "@/components/ui/icons";
import { trackProductEvent } from "@/lib/analytics-client";

type CollectionOption = { id: number; name: string; included: boolean };

export function LibraryControls({
  seriesId,
  initialStatus,
  collections: initialCollections,
  loginHref,
}: {
  seriesId: number;
  initialStatus: LibraryStatus | null;
  collections: CollectionOption[];
  loginHref?: string;
}) {
  const [status, setStatus] = useState<LibraryStatus | null>(initialStatus);
  const [collections, setCollections] = useState(initialCollections);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (loginHref) return <Link className="btn ghost" href={loginHref}><IconBookmark size={16} /> Guardar para ler</Link>;

  function updateStatus(value: string) {
    const next = (value || null) as LibraryStatus | null;
    setMessage("");
    startTransition(async () => {
      const result = await setLibraryStatusAction(seriesId, next);
      if (result.ok) {
        setStatus(next);
        if (next) trackProductEvent("library_add", { seriesId });
        setMessage(next ? `Marcada como “${LIBRARY_STATUS[next]}”.` : "Removida da fila de leitura.");
      } else setMessage(result.error);
    });
  }

  function toggleCollection(collectionId: number) {
    setMessage("");
    startTransition(async () => {
      const result = await toggleCollectionItemAction(collectionId, seriesId);
      if (!result.ok) return setMessage(result.error);
      setCollections((current) => current.map((item) => item.id === collectionId ? { ...item, included: result.included } : item));
      setMessage(result.included ? "Adicionada à lista." : "Removida da lista.");
    });
  }

  return (
    <div className="library-control">
      <label>
        <IconBookmark size={16} />
        <span className="sr-only">Estado na biblioteca</span>
        <select value={status ?? ""} onChange={(event) => updateStatus(event.target.value)} disabled={pending}>
          <option value="">Guardar para ler…</option>
          {Object.entries(LIBRARY_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {collections.length > 0 && (
        <details className="collection-picker">
          <summary><IconList size={15} /> Listas pessoais</summary>
          <div className="collection-picker-panel">
            {collections.map((collection) => (
              <button key={collection.id} type="button" onClick={() => toggleCollection(collection.id)} disabled={pending}>
                <span>{collection.name}</span>{collection.included && <IconCheck size={15} />}
              </button>
            ))}
            <Link href="/biblioteca#listas">Gerenciar listas</Link>
          </div>
        </details>
      )}
      {message && <span className="library-control-message" role="status">{message}</span>}
    </div>
  );
}

export function CollectionManager({ collections }: { collections: { id: number; name: string; description: string; itemCount: number }[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createCollectionAction(name, description);
      if (!result.ok) return setError(result.error);
      setName("");
      setDescription("");
      window.location.reload();
    });
  }

  function remove(id: number, label: string) {
    if (!window.confirm(`Apagar a lista “${label}”? As obras não serão removidas da sua biblioteca.`)) return;
    startTransition(async () => {
      await deleteCollectionAction(id);
      window.location.reload();
    });
  }

  return (
    <div className="collection-manager">
      <form onSubmit={create} className="collection-create">
        <div className="field"><label htmlFor="collection-name">Nome da nova lista</label><input id="collection-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Ex.: Para ler no fim de semana" required /></div>
        <div className="field"><label htmlFor="collection-description">Descrição <span className="muted">(opcional)</span></label><input id="collection-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="O que une estas histórias?" /></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn" type="submit" disabled={pending}><IconPlus size={15} /> Criar lista</button>
      </form>
      <div className="collection-index">
        {collections.length === 0 ? <p className="muted">Crie sua primeira lista para organizar obras por momento, tema ou humor.</p> : collections.map((collection) => (
          <div key={collection.id}>
            <span><strong>{collection.name}</strong><small>{collection.itemCount} {collection.itemCount === 1 ? "obra" : "obras"}{collection.description ? ` · ${collection.description}` : ""}</small></span>
            <button type="button" className="btn ghost small danger" onClick={() => remove(collection.id, collection.name)} disabled={pending} aria-label={`Apagar lista ${collection.name}`}><IconTrash size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
