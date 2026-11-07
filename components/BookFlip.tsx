"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ComicPanel, {
  type ComicPanelData,
  type ComicPanelPatch,
} from "@/components/ComicPanel";
import type { UILang } from "@/lib/types";

export type FlipPanel = ComicPanelData;

type Props = {
  panels: FlipPanel[];
  lang: UILang;
  title?: string;
  titleEditable?: boolean;
  onTitleChange?: (value: string) => void;
  narratorLabel?: string | null;
  showBadges?: boolean;
  isDemo?: boolean;
  initialPage?: number;
  footer?: ReactNode;
  editable?: boolean;
  onPanelChange?: (idx: number, patch: ComicPanelPatch) => void;
};

export default function BookFlip({
  panels,
  lang,
  title = "",
  titleEditable = false,
  onTitleChange,
  narratorLabel,
  showBadges = false,
  isDemo = false,
  initialPage = 0,
  footer,
  editable = false,
  onPanelChange,
}: Props) {
  const [spread, setSpread] = useState(Math.floor(initialPage / 2) * 2);
  const [fullscreen, setFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const touchX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const total = panels.length;

  useEffect(() => {
    const page = Math.floor(initialPage / 2) * 2;
    setSpread(Math.min(Math.max(0, page), Math.max(0, total - 1)));
  }, [initialPage, panels, total]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (total < 1) return;
      const nextIdx = dir === "next" ? spread + 2 : spread - 2;
      if (nextIdx < 0 || nextIdx >= total) return;
      setSpread(nextIdx);
    },
    [spread, total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
      if (e.key === "f" || e.key === "F") setFullscreen((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, fullscreen]);

  const leftPanel = panels[spread];
  const rightPanel = panels[spread + 1];

  if (!leftPanel) return null;

  return (
    <div
      ref={rootRef}
      className={`book-flip ${fullscreen ? "book-flip--fs" : ""}`}
    >
      <header className="book-flip__header">
        <div className="min-w-0 flex-1">
          {titleEditable ? (
            <input
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              className="book-flip__title-input"
              aria-label={lang === "en" ? "Book title" : "പുസ്തകത്തിന്റെ പേര്"}
            />
          ) : (
            <h1 className="book-flip__title">{title}</h1>
          )}
          {narratorLabel ? (
            <p className="book-flip__told">
              {lang === "en" ? "Told by" : "പറഞ്ഞത്"} {narratorLabel}
            </p>
          ) : null}
          {showBadges ? (
            <div className="book-flip__badges">
              <span className="book-badge">AI-illustrated</span>
              {isDemo ? (
                <span className="book-badge book-badge--muted">Demo story</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="book-fs-btn"
          onClick={() => setFullscreen((v) => !v)}
          aria-pressed={fullscreen}
        >
          {fullscreen
            ? lang === "en"
              ? "Exit"
              : "അടയ്ക്കുക"
            : lang === "en"
              ? "Full screen"
              : "പൂർണ്ണ സ്ക്രീൻ"}
        </button>
        {editable ? (
          <button
            type="button"
            className={`book-edit-btn ${editing ? "book-edit-btn--on" : ""}`}
            onClick={() => setEditing((value) => !value)}
            aria-pressed={editing}
          >
            {editing
              ? lang === "en"
                ? "Done"
                : "കഴിഞ്ഞു"
              : lang === "en"
                ? "Edit words"
                : "വാക്കുകൾ മാറ്റുക"}
          </button>
        ) : null}
      </header>

      <div
        className="comic-book"
        onTouchStart={(e) => {
          touchX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) < 48) return;
          if (dx < 0) go("next");
          else go("prev");
        }}
      >
        <div className="comic-book__cover" aria-hidden />
        <div className="comic-spread">
          <div className="comic-spread__gutter" aria-hidden />

          <div className="comic-page comic-page--left">
            <ComicPanel
              panel={leftPanel}
              lang={lang}
              pageNumber={spread + 1}
              editable={editing}
              onChange={(patch) => onPanelChange?.(leftPanel.idx, patch)}
            />
          </div>
          <div className="comic-page comic-page--right">
            <ComicPanel
              panel={rightPanel}
              lang={lang}
              pageNumber={spread + 2}
              editable={editing}
              onChange={(patch) =>
                rightPanel && onPanelChange?.(rightPanel.idx, patch)
              }
            />
          </div>

          <button
            type="button"
            className="book-hotzone book-hotzone--left"
            aria-label={lang === "en" ? "Previous page" : "മുൻ പേജ്"}
            disabled={spread <= 0}
            onClick={() => go("prev")}
          />
          <button
            type="button"
            className="book-hotzone book-hotzone--right"
            aria-label={lang === "en" ? "Next page" : "അടുത്ത പേജ്"}
            disabled={spread + 2 >= total}
            onClick={() => go("next")}
          />
        </div>
      </div>

      <div className="book-flip__nav">
        <button
          type="button"
          className="book-nav-btn"
          disabled={spread <= 0}
          onClick={() => go("prev")}
        >
          {lang === "en" ? "← Prev" : "← പിന്നോട്ട്"}
        </button>
        <p className="book-flip__count">
          {spread + 1}
          {rightPanel ? `-${Math.min(spread + 2, total)}` : ""} / {total}
        </p>
        <button
          type="button"
          className="book-nav-btn book-nav-btn--primary"
          disabled={spread + 2 >= total}
          onClick={() => go("next")}
        >
          {lang === "en" ? "Next →" : "അടുത്തത് →"}
        </button>
      </div>

      {footer && !fullscreen ? (
        <div className="book-flip__footer">{footer}</div>
      ) : null}
    </div>
  );
}
