import type { CSSProperties } from "react";
import type { BubbleLayout } from "@/lib/comic-layout";

type Props = {
  speaker?: string;
  text: string;
  layout: BubbleLayout;
  editable?: boolean;
  onChange?: (text: string) => void;
};

/** HTML speech bubble — never baked into generated images. */
export default function SpeechBubble({
  speaker,
  text,
  layout,
  editable = false,
  onChange,
}: Props) {
  if (!text.trim() && !editable) return null;

  const startX = (layout.x + layout.width / 2) * 100;
  const startY = (layout.y + layout.height * 0.86) * 100;
  const targetX = layout.tailTarget.x * 100;
  const targetY = layout.tailTarget.y * 100;
  const midX = (startX + targetX) / 2;
  const midY = (startY + targetY) / 2;
  const style = {
    "--bubble-x": `${layout.x * 100}%`,
    "--bubble-y": `${layout.y * 100}%`,
    "--bubble-w": `${layout.width * 100}%`,
  } as CSSProperties;

  return (
    <div className="positioned-bubble" style={style}>
      <svg
        className="speech-tail"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={`M ${startX - 1.8} ${startY - 0.8}
              Q ${midX - 1} ${midY} ${targetX} ${targetY}
              Q ${midX + 1.5} ${midY + 1.2} ${startX + 1.8} ${startY + 0.8} Z`}
        />
      </svg>
      <div className="speech-bubble">
        {speaker ? (
          <span className="speech-bubble__speaker">{speaker}</span>
        ) : null}
        {editable ? (
          <textarea
            value={text}
            onChange={(event) => onChange?.(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            rows={Math.min(4, Math.max(1, Math.ceil(text.length / 24)))}
            className="speech-bubble__input"
            aria-label={`${speaker || "Character"} dialogue`}
          />
        ) : (
          <p className="speech-bubble__text">{text}</p>
        )}
      </div>
    </div>
  );
}
