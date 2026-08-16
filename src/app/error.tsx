"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro de rota", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="nf-wrap">
      <div className="manga-panel error-state" role="alert">
        <h1 className="nf-title">A página saiu do quadro</h1>
        <p>Algo falhou ao carregar esta parte do site. Seus dados continuam salvos.</p>
        <button type="button" className="btn" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
