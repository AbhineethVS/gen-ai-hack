"use client";

import { useEffect, useState } from "react";
import SpeechBubble from "@/components/SpeechBubble";
import type { BookRecord, DialogueLine, UILang } from "@/lib/types";

type Props = {
  bookId: string;
};

export default function BookReader({ bookId }: Props) {
  const [lang, setLang] = useState<UILang>("ml");
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

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
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-[var(--ink)]">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-[var(--ink-soft)]">
        …
      </div>
    );
  }

  const panels = book.panels || [];
  const current = panels[page];
  const caption =
    lang === "en"
      ? current?.caption_en || current?.caption_ml
      : current?.caption_ml || current?.caption_en;
  const title =
    lang === "en" ? book.title_en || book.title_ml : book.title_ml;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          {book.narrator_label ? (
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Told by {book.narrator_label}
            </p>
          ) : null}
          <span className="mt-3 inline-block rounded-full bg-[var(--wash)] px-3 py-1 text-xs font-medium text-[var(--teal)]">
            AI-illustrated
          </span>
          {book.is_demo ? (
            <span className="ml-2 inline-block rounded-full bg-[var(--wash)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              Demo story
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLang("ml")}
            className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
              lang === "ml"
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 ring-1 ring-[var(--line)]"
            }`}
          >
            മലയാളം
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
              lang === "en"
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 ring-1 ring-[var(--line)]"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {current ? (
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-soft)]">
          <div className="relative aspect-square w-full bg-[var(--wash)]">
            {current.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--ink-soft)]">
                …
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col gap-2 sm:inset-x-5 sm:top-5">
              {(current.dialogue as DialogueLine[] | undefined)?.map((line, i) => (
                <SpeechBubble
                  key={`${line.speaker}-${i}`}
                  speaker={line.speaker}
                  text={line.text_ml}
                  side={i % 2 === 0 ? "left" : "right"}
                />
              ))}
            </div>
          </div>
          <p className="border-t border-[var(--line)] p-5 text-lg leading-relaxed text-[var(--ink)] sm:text-xl">
            {caption}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 pb-8">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="min-h-14 min-w-28 rounded-2xl bg-white px-5 text-lg font-medium ring-1 ring-[var(--line)] disabled:opacity-40"
        >
          പിന്നോട്ട്
        </button>
        <p className="text-base text-[var(--ink-soft)]">
          {page + 1} / {panels.length}
        </p>
        <button
          type="button"
          disabled={page >= panels.length - 1}
          onClick={() => setPage((p) => Math.min(panels.length - 1, p + 1))}
          className="min-h-14 min-w-28 rounded-2xl bg-[var(--teal)] px-5 text-lg font-medium text-white disabled:opacity-40"
        >
          അടുത്തത്
        </button>
      </div>
    </div>
  );
}
