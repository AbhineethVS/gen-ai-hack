"use client";

type Props = {
  text: string;
  editable?: boolean;
  onChange?: (text: string) => void;
  label: string;
};

export default function NarrationBox({
  text,
  editable = false,
  onChange,
  label,
}: Props) {
  if (!text && !editable) return null;

  if (editable) {
    return (
      <label className="narration-box narration-box--editable">
        <span className="sr-only">{label}</span>
        <textarea
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          rows={Math.min(4, Math.max(2, Math.ceil(text.length / 48)))}
          className="narration-box__input"
          aria-label={label}
        />
      </label>
    );
  }

  return <p className="narration-box">{text}</p>;
}
