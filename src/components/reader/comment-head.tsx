import Link from "next/link";

/** Nome do autor com link para o perfil público + badge de autor do estúdio. */
export function AuthorName({ authorId, name, role }: { authorId: string; name: string; role: string }) {
  return (
    <span className="cm-author">
      <Link href={`/leitores/${authorId}`} className="cm-name">
        {name}
      </Link>
      {role === "admin" && (
        <span className="badge author-badge" title="Autor(a) do estúdio">
          <span className="badge-dot" aria-hidden="true" /> autor
        </span>
      )}
    </span>
  );
}
