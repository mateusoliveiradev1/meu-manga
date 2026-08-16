import Link from "next/link";

export default function NotFound() {
  return (
    <div className="nf-wrap">
      <div>
        <div className="nf-title">Página fora do volume</div>
        <p className="muted">A página que você procura não existe neste tankōbon.</p>
        <p className="mt-2">
          <Link href="/" className="btn">
            Voltar às obras
          </Link>
        </p>
      </div>
    </div>
  );
}
