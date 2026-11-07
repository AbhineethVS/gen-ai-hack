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

type TurnDir = "next" | "prev" | null;

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

function ComicCard({
  panel,
  lang,
  pageNumber,
}: {
  panel?: FlipPanel;
  lang: UILang;
  pageNumber: number;
}) {
  if (!panel) {
    return <div className="comic-card comic-card--blank" />;
  }

  const caption =
    lang === "en"
      ? panel.caption_en || panel.caption_ml
      : panel.caption_ml || panel.caption_en;
  const dialogue = normalizeDialogue(panel.dialogue);

  return (
    <div className="comic-card">
      {panel.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={panel.image_url} alt="" className="comic-card__img" />
      ) : (
        <div className="comic-card__empty">
          {panel.error || (lang === "en" ? "Drawing..." : "വരയ്ക്കുന്നു...")}
        </div>
      )}

      {dialogue.length > 0 ? (
        <div className="comic-card__bubbles">
          {dialogue.map((line, i) => (
            <SpeechBubble
              key={`${line.speaker}-${i}-${pageNumber}`}
              speaker={line.speaker}
              text={line.text_ml}
              side={i % 2 === 0 ? "left" : "right"}
            />
          ))}
        </div>
      ) : null}

      {caption ? <p className="comic-card__caption">{caption}</p> : null}
      <span className="comic-card__page">{pageNumber}</span>
    </div>
  );
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
  const [spread, setSpread] = useState(Math.floor(initialPage / 2) * 2);
  const [turning, setTurning] = useState<TurnDir>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const touchX = useRef<number | null>(null);
  const busy = useRef(false);
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
      if (busy.current || total < 1) return;
      const nextIdx = dir === "next" ? spread + 2 : spread - 2;
      if (nextIdx < 0 || nextIdx >= total) return;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        setSpread(nextIdx);
        return;
      }

      busy.current = true;
      setTurning(dir);
      window.setTimeout(() => {
        setSpread(nextIdx);
        setTurning(null);
        busy.current = false;
      }, 760);
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
  const nextLeft = panels[spread + 2];
  const prevRight = panels[spread - 1];

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
            <ComicCard panel={leftPanel} lang={lang} pageNumber={spread + 1} />
          </div>
          <div className="comic-page comic-page--right">
            <ComicCard
              panel={turning === "next" && nextLeft ? nextLeft : rightPanel}
              lang={lang}
              pageNumber={turning === "next" && nextLeft ? spread + 3 : spread + 2}
            />
          </div>

          {turning === "next" && rightPanel && nextLeft ? (
            <div className="comic-turn comic-turn--next" aria-hidden>
              <div className="comic-turn__front">
                <ComicCard panel={rightPanel} lang={lang} pageNumber={spread + 2} />
              </div>
              <div className="comic-turn__back">
                <ComicCard panel={nextLeft} lang={lang} pageNumber={spread + 3} />
              </div>
            </div>
          ) : null}

          {turning === "prev" && prevRight ? (
            <div className="comic-turn comic-turn--prev" aria-hidden>
              <div className="comic-turn__front">
                <ComicCard panel={prevRight} lang={lang} pageNumber={spread} />
              </div>
              <div className="comic-turn__back">
                <ComicCard panel={leftPanel} lang={lang} pageNumber={spread + 1} />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="book-hotzone book-hotzone--left"
            aria-label={lang === "en" ? "Previous page" : "മുൻ പേജ്"}
            disabled={spread <= 0 || Boolean(turning)}
            onClick={() => go("prev")}
          />
          <button
            type="button"
            className="book-hotzone book-hotzone--right"
            aria-label={lang === "en" ? "Next page" : "അടുത്ത പേജ്"}
            disabled={spread + 2 >= total || Boolean(turning)}
            onClick={() => go("next")}
          />
        </div>
      </div>

      <div className="book-flip__nav">
        <button
          type="button"
          className="book-nav-btn"
          disabled={spread <= 0 || Boolean(turning)}
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
          disabled={spread + 2 >= total || Boolean(turning)}
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
