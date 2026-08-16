import { STATUS_LABELS } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  return <span className={`badge ${status}`}>{label}</span>;
}

export function TagChips({ tags }: { tags: string }) {
  const list = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className="row" style={{ gap: "0.4rem" }}>
      {list.map((t) => (
        <span key={t} className="tag">
          {t}
        </span>
      ))}
    </div>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {sub && <span className="section-sub">{sub}</span>}
    </div>
  );
}
