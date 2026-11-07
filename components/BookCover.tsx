"use client";

import type { CSSProperties } from "react";
import type { CoverDirection } from "@/lib/types";

type Props = {
  title: string;
  subtitle?: string | null;
  narratorLabel?: string | null;
  imageUrl?: string | null;
  isDemo?: boolean;
  isNew?: boolean;
  compact?: boolean;
  editable?: boolean;
  onTitleChange?: (title: string) => void;
  direction?: CoverDirection | null;
  building?: boolean;
};

export default function BookCover({
  title,
  subtitle,
  narratorLabel,
  imageUrl,
  isDemo = false,
  isNew = false,
  compact = false,
  editable = false,
  onTitleChange,
  direction,
  building = false,
}: Props) {
  const palette = direction?.palette?.length
    ? direction.palette
    : ["#E8A24A", "#315B52", "#F5E8C8", "#7A302B"];
  const style = {
    "--cover-accent": palette[0],
    "--cover-deep": palette[1] || "#315B52",
    "--cover-paper": palette[2] || "#F5E8C8",
  } as CSSProperties;
  const titleZone = direction?.title_zone === "top" ? "top" : "bottom";

  return (
    <div
      className={`book-cover book-cover--title-${titleZone} ${
        compact ? "book-cover--compact" : ""
      } ${building ? "book-cover--building" : ""}`}
      style={style}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="book-cover__image" />
      ) : (
        <div className="book-cover__empty" />
      )}
      <div className="book-cover__shade" aria-hidden />
      <div className="book-cover__top">
        <span className="book-cover__brand">മുത്തശ്ശി കഥ</span>
        <span className="book-cover__edition" aria-hidden>
          {isNew ? "NEW STORY" : isDemo ? "STORY EDITION" : "ORIGINAL"}
        </span>
      </div>
      <div className="book-cover__content">
        {editable ? (
          <input
            value={title}
            onChange={(event) => onTitleChange?.(event.target.value)}
            className="book-cover__title-input"
            aria-label="Book title"
          />
        ) : (
          <h2 className="book-cover__title">{title}</h2>
        )}
        {subtitle && subtitle !== title && !compact ? (
          <p className="book-cover__subtitle">{subtitle}</p>
        ) : null}
        <p className="book-cover__credit">
          Told by {narratorLabel || "മുത്തശ്ശി"}
        </p>
      </div>
      <span className="book-cover__rule" aria-hidden />
    </div>
  );
}
