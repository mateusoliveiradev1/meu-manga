export default function PublicLoading() {
  return (
    <div className="page-skeleton" role="status" aria-label="Carregando conteúdo">
      <div className="skeleton-featured">
        <span className="skeleton skeleton-cover" />
        <div className="skeleton-copy">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
          <span className="skeleton skeleton-button" />
        </div>
      </div>
      <span className="skeleton skeleton-heading" />
      <div className="skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="skeleton skeleton-volume" />
        ))}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
