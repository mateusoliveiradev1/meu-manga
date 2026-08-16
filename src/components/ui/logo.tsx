export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-mark.svg" alt="" width={size} height={size} className="logo-img" />
  );
}

export function SiteLogo({ name }: { name: string }) {
  return (
    <span className="logo-lockup" aria-hidden="true">
      <span className="logo-mark">
        <LogoMark size={36} />
      </span>
      <span className="logo-wordmark">{name}</span>
    </span>
  );
}
