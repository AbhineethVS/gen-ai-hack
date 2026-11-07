"use client";

import { useEffect, useState } from "react";
import BookCard, { type LibraryBook } from "@/components/BookCard";

export default function LibraryGrid() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await fetch("/api/library", { cache: "no-store" });
        let data = await res.json();
        if (!res.ok) {
          res = await fetch("/demo-books.json");
          data = await res.json();
        }
        if (!cancelled) {
          setBooks(Array.isArray(data.books) ? data.books : []);
        }
      } catch {
        if (!cancelled) setError("The library could not load. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="library-grid" aria-label="Loading stories">
        {[1, 2, 3].map((item) => (
          <div key={item} className="library-card library-card--loading" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-red-300">{error}</p>;
  if (books.length === 0) {
    return <p className="text-lg text-[#9a9a9a]">No stories yet.</p>;
  }

  return (
    <div className="library-grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
