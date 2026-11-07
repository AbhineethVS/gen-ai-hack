"use client";

import { useEffect, useState } from "react";
import BookFlip from "@/components/BookFlip";
import type { ComicPanelPatch } from "@/components/ComicPanel";
import SharePanel from "@/components/SharePanel";
import type { BookRecord, UILang } from "@/lib/types";

type Props = {
  bookId: string;
};

export default function BookReader({ bookId }: Props) {
  const [lang, setLang] = useState<UILang>("ml");
  const [book, setBook] = useState<BookRecord | null>(null);
  const [error, setError] = useState("");
  const [redrawingIdx, setRedrawingIdx] = useState<number | null>(null);

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
  const subtitle =
    lang === "en" ? book.title_ml : book.title_en;

  function updatePanel(idx: number, patch: ComicPanelPatch) {
    setBook((current) =>
      current
        ? {
            ...current,
            panels: current.panels.map((panel) =>
              panel.idx === idx ? { ...panel, ...patch } : panel,
            ),
          }
        : current,
    );
    void fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel_idx: idx, ...patch }),
    });
  }

  async function redrawPanel(idx: number) {
    const panel = book?.panels.find((item) => item.idx === idx);
    if (!book || !panel) return;
    setRedrawingIdx(idx);
    setError("");
    try {
      const res = await fetch("/api/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          idx,
          character_description: book.character_sheet.description,
          scene_description: panel.scene_description,
          caption_text:
            lang === "en"
              ? panel.caption_en || panel.caption_ml
              : panel.caption_ml || panel.caption_en,
          dialogue_lines: panel.dialogue,
          bake_text: false,
          use_style_refs: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not redraw");
      setBook((current) =>
        current
          ? {
              ...current,
              panels: current.panels.map((item) =>
                item.idx === idx
                  ? { ...item, image_url: data.image_url, text_baked: false }
                  : item,
              ),
            }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redraw");
    } finally {
      setRedrawingIdx(null);
    }
  }

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
        subtitle={subtitle}
        narratorLabel={book.narrator_label}
        coverUrl={book.cover_url}
        coverDirection={book.cover_direction}
        showBadges
        isDemo={book.is_demo}
        editable={!book.is_public}
        onPanelChange={updatePanel}
        onRedraw={redrawPanel}
        redrawingIdx={redrawingIdx}
      />
      {!book.is_public ? (
        <SharePanel
          bookId={bookId}
          lang={lang}
          title={title}
          coverUrl={book.cover_url}
          coverDirection={book.cover_direction}
          onPublished={() =>
            setBook((current) =>
              current ? { ...current, is_public: true } : current,
            )
          }
        />
      ) : null}
    </div>
  );
}
