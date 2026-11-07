type Props = {
  speaker?: string;
  text: string;
  side?: "left" | "right";
};

/** HTML speech bubble — never baked into generated images. */
export default function SpeechBubble({ speaker, text, side = "left" }: Props) {
  if (!text.trim()) return null;

  return (
    <div
      className={`speech-bubble max-w-[78%] ${
        side === "right" ? "ml-auto" : "mr-auto"
      }`}
    >
      {speaker ? (
        <span className="mb-0.5 block text-[0.65rem] font-semibold tracking-wide text-[var(--ink-soft)]">
          {speaker}
        </span>
      ) : null}
      <p className="text-[0.95rem] leading-snug text-[var(--ink)] sm:text-base">
        {text}
      </p>
    </div>
  );
}
