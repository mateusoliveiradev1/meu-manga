/**
 * Marca do estúdio: imagem enviada pelo autor (public/logo.png), com fundo
 * removido. No tema escuro usa a versão clara; no claro, uma variante "tinta"
 * (public/logo-ink.png) para manter o contraste. A troca é feita por CSS
 * ([data-theme="light"]), sem JS.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" height={size} className="logo-img logo-img-dark" style={{ height: size }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-ink.png" alt="" height={size} className="logo-img logo-img-light" style={{ height: size }} />
    </>
  );
}

export function SiteLogo({ name }: { name: string }) {
  return (
    <span className="logo-mark" aria-hidden="true">
      <LogoMark size={36} />
    </span>
  );
}
