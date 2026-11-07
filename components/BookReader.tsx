"use client";

import { useEffect, useState } from "react";
import BookFlip from "@/components/BookFlip";
import type { BookRecord, UILang } from "@/lib/types";

type Props = {
  bookId: string;
};

export default function BookReader({ bookId }: Props) {
  const [lang, setLang] = useState<UILang>("ml");
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Not found");
          return;
        }
        if (!cancelled) setBook(data.book);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-16 text-[var(--ink)]">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-16 text-[var(--ink-soft)]">
        …
      </div>
    );
  }

  const title =
    lang === "en" ? book.title_en || book.title_ml : book.title_ml;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-8">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setLang("ml")}
          className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
            lang === "ml"
              ? "bg-[#f2f2f2] text-[#0a0a0a]"
              : "bg-[var(--wash)] ring-1 ring-[var(--line)]"
          }`}
        >
          മലയാളം
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
            lang === "en"
              ? "bg-[#f2f2f2] text-[#0a0a0a]"
              : "bg-[var(--wash)] ring-1 ring-[var(--line)]"
          }`}
        >
          English
        </button>
      </div>

      <BookFlip
        panels={book.panels || []}
        lang={lang}
        title={title}
        narratorLabel={book.narrator_label}
        showBadges
        isDemo={book.is_demo}
      />
    </div>
  );
}
