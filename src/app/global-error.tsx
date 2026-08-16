"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#0a0a0f", color: "#ecebe6", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", textAlign: "center" }}>
          <div>
            <h1 style={{ color: "#f5c518", textTransform: "uppercase" }}>O site encontrou um erro</h1>
            <p>Recarregue esta tela para voltar à leitura.</p>
            <button
              type="button"
              onClick={reset}
              style={{ border: 0, borderRadius: 10, padding: ".7rem 1rem", background: "#f5c518", color: "#191204", fontWeight: 700 }}
            >
              Recarregar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
