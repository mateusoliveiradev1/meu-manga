import Link from "next/link";

export default function NotFound() {
  return (
    <div className="nf-wrap">
      <div>
        <div className="nf-title">Esta página saiu da estante</div>
        <p className="muted">O endereço pode ter mudado ou o conteúdo não está mais disponível.</p>
        <div className="row mt-2" style={{ justifyContent: "center" }}>
          <Link href="/obras" className="btn">Explorar o catálogo</Link>
          <Link href="/" className="btn ghost">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
