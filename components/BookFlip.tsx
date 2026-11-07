"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SpeechBubble from "@/components/SpeechBubble";
import type { DialogueLine, UILang } from "@/lib/types";

export type FlipPanel = {
  idx: number;
  caption_ml?: string | null;
  caption_en?: string | null;
  dialogue?: DialogueLine[] | null;
  image_url?: string | null;
  error?: string;
};

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
};

type Dir = "next" | "prev" | null;

function normalizeDialogue(raw: unknown): DialogueLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line) => {
      if (!line || typeof line !== "object") return null;
      const o = line as Record<string, unknown>;
      const speaker = String(o.speaker ?? o.name ?? "").trim();
      const text = String(
        o.text_ml ?? o.text ?? o.line ?? o.caption_ml ?? "",
      ).trim();
      if (!text) return null;
      return { speaker: speaker || "…", text_ml: text };
    })
    .filter(Boolean) as DialogueLine[];
}

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
}: Props) {
  const [page, setPage] = useState(initialPage);
  const [anim, setAnim] = useState<Dir>(null);
  const [displayPage, setDisplayPage] = useState(initialPage);
  const touchX = useRef<number | null>(null);
  const busy = useRef(false);

  const total = panels.length;

  useEffect(() => {
    setPage(initialPage);
    setDisplayPage(initialPage);
  }, [initialPage, panels]);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (busy.current || total < 1) return;
      const nextIdx = dir === "next" ? page + 1 : page - 1;
      if (nextIdx < 0 || nextIdx >= total) return;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        setPage(nextIdx);
        setDisplayPage(nextIdx);
        return;
      }

      busy.current = true;
      setAnim(dir);
      window.setTimeout(() => {
        setPage(nextIdx);
        setDisplayPage(nextIdx);
        setAnim(null);
        busy.current = false;
      }, 420);
    },
    [page, total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const current = panels[displayPage];
  if (!current) return null;

  const caption =
    lang === "en"
      ? current.caption_en || current.caption_ml
      : current.caption_ml || current.caption_en;
  const dialogue = normalizeDialogue(current.dialogue);

  return (
    <div className="book-flip">
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
              {isDemo ? <span className="book-badge book-badge--muted">Demo story</span> : null}
            </div>
          ) : null}
        </div>
      </header>

      <div
        className="book-shell"
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
        <div className="book-shell__spine" aria-hidden />
        <div
          className={`book-page ${
            anim === "next"
              ? "book-page--turn-next"
              : anim === "prev"
                ? "book-page--turn-prev"
                : ""
          }`}
        >
          <button
            type="button"
            className="book-hotzone book-hotzone--left"
            aria-label={lang === "en" ? "Previous page" : "മുൻ പേജ്"}
            disabled={page <= 0}
            onClick={() => go("prev")}
          />
          <button
            type="button"
            className="book-hotzone book-hotzone--right"
            aria-label={lang === "en" ? "Next page" : "അടുത്ത പേജ്"}
            disabled={page >= total - 1}
            onClick={() => go("next")}
          />

          <div className="book-page__art">
            {current.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image_url} alt="" className="book-page__img" />
            ) : (
              <div className="book-page__empty">
                {current.error || (lang === "en" ? "Drawing…" : "വരയ്ക്കുന്നു…")}
              </div>
            )}

            {dialogue.length > 0 ? (
              <div className="book-page__bubbles">
                {dialogue.map((line, i) => (
                  <SpeechBubble
                    key={`${line.speaker}-${i}-${displayPage}`}
                    speaker={line.speaker}
                    text={line.text_ml}
                    side={i % 2 === 0 ? "left" : "right"}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="book-page__narrator">
            <span className="book-page__narrator-label">
              {lang === "en" ? "Narrator" : "കഥാകാരൻ"}
            </span>
            <p className="book-page__caption">{caption}</p>
          </div>
        </div>
      </div>

      <div className="book-flip__nav">
        <button
          type="button"
          className="book-nav-btn"
          disabled={page <= 0}
          onClick={() => go("prev")}
        >
          {lang === "en" ? "← Prev" : "← പിന്നോട്ട്"}
        </button>
        <p className="book-flip__count">
          {page + 1} / {total}
        </p>
        <button
          type="button"
          className="book-nav-btn book-nav-btn--primary"
          disabled={page >= total - 1}
          onClick={() => go("next")}
        >
          {lang === "en" ? "Next →" : "അടുത്തത് →"}
        </button>
      </div>

      {footer ? <div className="book-flip__footer">{footer}</div> : null}
    </div>
  );
}
