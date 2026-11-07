"use client";

type Props = {
  recording: boolean;
  disabled?: boolean;
  label: string;
  stopLabel: string;
  onClick: () => void;
};

export default function MicButton({
  recording,
  disabled,
  label,
  stopLabel,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={recording}
      className={`mic-btn relative flex min-h-36 min-w-36 flex-col items-center justify-center rounded-full text-xl font-semibold text-white transition duration-300 disabled:opacity-50 sm:min-h-44 sm:min-w-44 sm:text-2xl ${
        recording ? "mic-btn--live bg-[var(--accent)]" : "bg-[var(--teal)]"
      }`}
    >
      {recording ? (
        <span className="mic-pulse absolute inset-0 rounded-full" aria-hidden />
      ) : null}
      <span className="relative z-10 px-4 text-center leading-tight">
        {recording ? stopLabel : label}
      </span>
    </button>
  );
}
