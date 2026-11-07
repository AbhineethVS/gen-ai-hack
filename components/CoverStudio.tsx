"use client";

import { useEffect, useMemo, useState } from "react";
import BookCover from "@/components/BookCover";
import type { CoverDirection, UILang } from "@/lib/types";

type Props = {
  title: string;
  subtitle?: string | null;
  direction: CoverDirection | null;
  imageUrl?: string | null;
  completedPanels: number;
  coverFailed?: boolean;
  lang: UILang;
};

const ROLES = [
  { name: "Art Director", className: "cover-cursor--director" },
  { name: "Illustrator", className: "cover-cursor--illustrator" },
  { name: "Letterer", className: "cover-cursor--letterer" },
  { name: "Editor", className: "cover-cursor--editor" },
] as const;

export default function CoverStudio({
  title,
  subtitle,
  direction,
  imageUrl,
  completedPanels,
  coverFailed = false,
  lang,
}: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (imageUrl) return;
    const timer = window.setInterval(
      () => setPhase((current) => Math.min(3, current + 1)),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [imageUrl]);

  const effectivePhase = imageUrl ? 4 : phase;
  const statuses = useMemo(
    () => [
      effectivePhase >= 1 ? "done" : "active",
      imageUrl ? "done" : effectivePhase >= 1 ? "active" : "queued",
      effectivePhase >= 2
        ? "done"
        : effectivePhase >= 1
          ? "active"
          : "queued",
      imageUrl && completedPanels === 4
        ? "done"
        : effectivePhase >= 2
          ? "active"
          : "queued",
    ],
    [completedPanels, effectivePhase, imageUrl],
  );

  return (
    <div className="cover-studio">
      <div className="cover-studio__canvas">
        <div className="cover-studio__artboard">
          <BookCover
            title={title}
            subtitle={subtitle}
            imageUrl={imageUrl}
            direction={direction}
            building={!imageUrl}
          />
          {ROLES.map((role, index) =>
            statuses[index] === "queued" ? null : (
              <span
                key={role.name}
                className={`cover-cursor ${role.className} cover-cursor--${statuses[index]}`}
                aria-hidden
              >
                <svg viewBox="0 0 20 24">
                  <path d="M2 1.8 17.5 15l-7.2 1.1-4.1 6.1z" />
                </svg>
                <b>{role.name}</b>
              </span>
            ),
          )}
        </div>
      </div>

      <aside className="cover-studio__panel">
        <p className="cover-studio__eyebrow">
          {lang === "en" ? "Live cover studio" : "ലൈവ് കവർ സ്റ്റുഡിയോ"}
        </p>
        <h2>
          {coverFailed
            ? lang === "en"
              ? "Using page one as a safe fallback"
              : "ഒന്നാം പേജ് കവറായി ഉപയോഗിക്കുന്നു"
            : imageUrl
              ? lang === "en"
                ? "Cover ready"
                : "കവർ തയ്യാർ"
              : lang === "en"
                ? "Building your front cover"
                : "മുഖചിത്രം തയ്യാറാക്കുന്നു"}
        </h2>
        <p className="cover-studio__concept">
          {direction?.concept ||
            (lang === "en"
              ? "Finding the one visual idea at the heart of your story."
              : "കഥയുടെ ഹൃദയത്തിലുള്ള ഒരു ദൃശ്യം കണ്ടെത്തുന്നു.")}
        </p>

        <div className="cover-studio__roles">
          {ROLES.map((role, index) => (
            <div
              className={`cover-role cover-role--${statuses[index]}`}
              key={role.name}
            >
              <span className="cover-role__dot" />
              <span>{role.name}</span>
              <small>
                {statuses[index] === "done"
                  ? "Ready"
                  : statuses[index] === "active"
                    ? "Working"
                    : "Queued"}
              </small>
            </div>
          ))}
        </div>

        <div className="cover-studio__palette" aria-label="Cover palette">
          {(direction?.palette || ["#E8A24A", "#315B52", "#F5E8C8"]).map(
            (color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ),
          )}
        </div>
        <p className="cover-studio__note">
          {lang === "en"
            ? `${completedPanels}/4 story pages illustrated in parallel`
            : `${completedPanels}/4 കഥാ പേജുകൾ ഒരേസമയം വരയ്ക്കുന്നു`}
        </p>
      </aside>
    </div>
  );
}
