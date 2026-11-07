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
      className={`speech-bubble speech-bubble--${side} max-w-[82%] ${
        side === "right" ? "ml-auto" : "mr-auto"
      }`}
    >
      {speaker ? (
        <span className="speech-bubble__speaker">{speaker}</span>
      ) : null}
      <p className="speech-bubble__text">{text}</p>
    </div>
  );
}
