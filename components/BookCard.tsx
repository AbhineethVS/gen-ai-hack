import Link from "next/link";

export type LibraryBook = {
  id: string;
  title_ml: string;
  title_en?: string | null;
  narrator_label?: string | null;
  is_demo: boolean;
  created_at: string;
  cover_url?: string | null;
};

export default function BookCard({ book }: { book: LibraryBook }) {
  const isNew =
    !book.is_demo &&
    Date.now() - new Date(book.created_at).getTime() < 24 * 60 * 60 * 1000;

  return (
    <Link href={`/book/${book.id}`} className="library-card">
      <div className="library-card__cover">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover_url} alt="" className="library-card__image" />
        ) : (
          <div className="library-card__empty">മുത്തശ്ശി കഥ</div>
        )}
        <div className="library-card__badges">
          {isNew ? <span className="library-badge library-badge--new">New</span> : null}
          {book.is_demo ? <span className="library-badge">Demo story</span> : null}
          <span className="library-badge">AI-illustrated</span>
        </div>
      </div>
      <div className="library-card__body">
        <h2 className="library-card__title">{book.title_ml}</h2>
        {book.title_en ? (
          <p className="library-card__subtitle">{book.title_en}</p>
        ) : null}
        <p className="library-card__credit">
          Told by {book.narrator_label || "മുത്തശ്ശി"}
        </p>
      </div>
    </Link>
  );
}
