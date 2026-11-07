import Link from "next/link";
import BookCover from "@/components/BookCover";

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
        <BookCover
          title={book.title_ml}
          subtitle={book.title_en}
          narratorLabel={book.narrator_label}
          imageUrl={book.cover_url}
          isDemo={book.is_demo}
          isNew={isNew}
          compact
        />
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
