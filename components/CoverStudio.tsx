"use client";

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
  {
    name: "Art Director",
    action: "Framing",
    className: "cover-cursor--director",
  },
  {
    name: "Illustrator",
    action: "Painting",
    className: "cover-cursor--illustrator",
  },
  {
    name: "Letterer",
    action: "Typesetting",
    className: "cover-cursor--letterer",
  },
  {
    name: "Editor",
    action: "Reviewing",
    className: "cover-cursor--editor",
  },
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
  const palette = direction?.palette?.length
    ? direction.palette.slice(0, 3)
    : ["#E8A24A", "#315B52", "#F5E8C8"];
  const note = coverFailed
    ? lang === "en"
      ? "Cover preview · using page one as fallback"
      : "കവർ പ്രിവ്യൂ · ഒന്നാം പേജ് ഉപയോഗിക്കുന്നു"
    : imageUrl
      ? lang === "en"
        ? `Cover ready · ${completedPanels}/4 story pages drawn`
        : `കവർ തയ്യാർ · ${completedPanels}/4 കഥാ പേജുകൾ`
      : lang === "en"
        ? `Composing cover · ${completedPanels}/4 story pages drawn`
        : `കവർ ഒരുക്കുന്നു · ${completedPanels}/4 കഥാ പേജുകൾ`;

  return (
    <figure
      className={`cover-studio ${
        imageUrl ? "cover-studio--ready" : "cover-studio--building"
      } cover-studio--title-${direction?.title_zone === "top" ? "top" : "bottom"}`}
    >
      <div className="cover-studio__canvas">
        <div className="cover-studio__artboard">
          <BookCover
            title={title}
            subtitle={subtitle}
            imageUrl={imageUrl}
            direction={direction}
            building={!imageUrl}
          />

          <span className="cover-edit__selection" aria-hidden />
          <span className="cover-edit__title-line" aria-hidden />
          <span className="cover-edit__swatches" aria-hidden>
            {palette.map((color) => (
              <i key={color} style={{ backgroundColor: color }} />
            ))}
          </span>

          {ROLES.map((role) => (
            <span
              key={role.name}
              className={`cover-cursor ${role.className}`}
              aria-hidden
            >
              <svg viewBox="0 0 20 24">
                <path d="M2 1.8 17.5 15l-7.2 1.1-4.1 6.1z" />
              </svg>
              <strong>
                <span>{role.name}</span>
                <small>
                  {imageUrl && role.name === "Editor"
                    ? "Final pass"
                    : role.action}
                </small>
              </strong>
            </span>
          ))}
        </div>
      </div>
      <figcaption className="cover-studio__note">{note}</figcaption>
    </figure>
  );
}
