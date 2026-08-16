import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionManager } from "@/components/library/library-controls";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { IconArrowRight, IconBookmark, IconBook, IconList, IconSpark } from "@/components/ui/icons";
import { getCurrentUser } from "@/features/auth/session";
import { getLibraryEntries, getReadingHistory, getUserBookmarks, getUserCollections } from "@/features/library/queries";
import { LIBRARY_STATUS, type LibraryStatus } from "@/features/library/types";
import { chapterLabel, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha biblioteca", description: "Fila de leitura, histórico, marcadores e listas pessoais." };
export const dynamic = "force-dynamic";

export default async function BibliotecaPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=%2Fbiblioteca&motivo=biblioteca");
  const requested = (await searchParams).status;
  const status = requested && requested in LIBRARY_STATUS ? requested as LibraryStatus : undefined;
  const [entries, collections, history, bookmarks] = await Promise.all([
    getLibraryEntries(user.id, status),
    getUserCollections(user.id),
    getReadingHistory(user.id, 12),
    getUserBookmarks(user.id, 12),
  ]);

  return <>
    <section className="library-hero">
      <div><h1>Sua próxima leitura já tem lugar</h1><p>Organize o que quer começar, retome histórias pausadas e guarde páginas que merecem uma segunda visita.</p></div>
      <Link className="btn" href="/para-voce"><IconSpark size={16} /> Ver recomendações</Link>
    </section>

    <nav className="library-tabs" aria-label="Estados da biblioteca">
      <Link href="/biblioteca" aria-current={!status ? "page" : undefined}>Todas</Link>
      {Object.entries(LIBRARY_STATUS).map(([value, label]) => <Link key={value} href={`/biblioteca?status=${value}`} aria-current={status === value ? "page" : undefined}>{label}</Link>)}
    </nav>

    <section className="section" aria-labelledby="library-shelf-title">
      <div className="section-head"><div><h2 id="library-shelf-title"><IconBook size={18} /> {status ? LIBRARY_STATUS[status] : "Sua fila de leitura"}</h2><p className="section-description">{entries.length} {entries.length === 1 ? "obra organizada" : "obras organizadas"}</p></div></div>
      {entries.length === 0 ? <div className="manga-panel empty-state"><div className="empty-title">Nenhuma obra neste espaço</div><p>Abra uma obra e escolha “Quero ler”, “Lendo”, “Pausada” ou “Concluída”.</p><Link className="btn" href="/obras">Explorar histórias</Link></div> : <div className="library-shelf">{entries.map(({ entry, work, unreadCount, chapterCount }) => <Link href={`/obra/${work.slug}`} key={work.id} className="library-work"><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="110px" /><span><strong>{work.title}</strong><small>{LIBRARY_STATUS[entry.status as LibraryStatus]} · {chapterCount} {chapterCount === 1 ? "capítulo" : "capítulos"}</small><em>{unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? "capítulo novo" : "capítulos novos"}` : "Leitura em dia"}</em></span><IconArrowRight size={15} /></Link>)}</div>}
    </section>

    <section id="listas" className="section" aria-labelledby="collections-title"><div className="section-head"><div><h2 id="collections-title"><IconList size={18} /> Listas pessoais</h2><p className="section-description">Agrupe histórias por tema, momento ou qualquer lógica que faça sentido para você.</p></div></div><CollectionManager collections={collections.map(({ id, name, description, itemCount }) => ({ id, name, description, itemCount }))} />{collections.map((collection) => collection.items.length > 0 && <div className="collection-shelf" key={collection.id}><h3>{collection.name}</h3><div>{collection.items.map((work) => <Link href={`/obra/${work.slug}`} key={work.id}><ResponsiveImage src={work.cover} alt={`Capa de ${work.title}`} sizes="72px" /><span>{work.title}</span></Link>)}</div></div>)}</section>

    <div className="library-secondary">
      <section className="section" aria-labelledby="bookmarks-title"><div className="section-head"><h2 id="bookmarks-title"><IconBookmark size={18} /> Páginas marcadas</h2></div>{bookmarks.length ? <div className="library-compact-list">{bookmarks.map((bookmark) => <Link href={`/ler/${bookmark.chapterId}?pagina=${bookmark.page + 1}`} key={bookmark.id}><strong>{bookmark.seriesTitle}</strong><span>{chapterLabel(bookmark.chapterNumber)} · página {bookmark.page + 1}</span>{bookmark.note && <small>“{bookmark.note}”</small>}</Link>)}</div> : <p className="muted">Use o marcador dentro do leitor para guardar uma página e uma anotação privada.</p>}</section>
      <section className="section" aria-labelledby="history-title"><div className="section-head"><h2 id="history-title">Histórico recente</h2></div>{history.length ? <div className="library-compact-list">{history.map((item) => <Link href={`/ler/${item.chapterId}`} key={item.chapterId}><strong>{item.seriesTitle}</strong><span>{chapterLabel(item.chapterNumber)} · {item.completedAt ? "concluído" : "em andamento"}</span><small>{formatDate(item.lastReadAt)} · {item.visits} {item.visits === 1 ? "visita" : "visitas"}</small></Link>)}</div> : <p className="muted">Seu histórico aparece aqui quando você abrir um capítulo.</p>}</section>
    </div>
  </>;
}
