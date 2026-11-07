"use client";

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
}: Props) {
  return (
    <div className={`book-cover ${compact ? "book-cover--compact" : ""}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="book-cover__image" />
      ) : (
        <div className="book-cover__empty" />
      )}
      <div className="book-cover__shade" aria-hidden />
      <div className="book-cover__top">
        <span className="book-cover__brand">മുത്തശ്ശി കഥ</span>
        <div className="book-cover__badges">
          {isNew ? <span>New</span> : null}
          <span>AI-illustrated</span>
          {isDemo ? <span>Demo story</span> : null}
        </div>
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
    </div>
  );
}
