"use client";

import NarrationBox from "@/components/NarrationBox";
import SpeechBubble from "@/components/SpeechBubble";
import { layoutDialogue } from "@/lib/comic-layout";
import type { DialogueLine, UILang } from "@/lib/types";

export type ComicPanelData = {
  idx: number;
  caption_ml?: string | null;
  caption_en?: string | null;
  dialogue?: DialogueLine[] | null;
  image_url?: string | null;
  text_baked?: boolean | null;
  error?: string;
};

export type ComicPanelPatch = {
  caption_ml?: string;
  caption_en?: string;
  dialogue?: DialogueLine[];
};

type Props = {
  panel?: ComicPanelData;
  lang: UILang;
  pageNumber: number;
  editable?: boolean;
  onChange?: (patch: ComicPanelPatch) => void;
};

export default function ComicPanel({
  panel,
  lang,
  pageNumber,
  editable = false,
  onChange,
}: Props) {
  if (!panel) {
    return <div className="comic-card comic-card--blank" />;
  }

  const caption =
    lang === "en"
      ? panel.caption_en || panel.caption_ml || ""
      : panel.caption_ml || panel.caption_en || "";
  const dialogue = panel.text_baked ? [] : (panel.dialogue || []).slice(0, 3);
  const layouts = layoutDialogue(dialogue);

  function changeDialogue(index: number, text: string) {
    const next = dialogue.map((line, lineIndex) =>
      lineIndex === index ? { ...line, text_ml: text } : line,
    );
    onChange?.({ dialogue: next });
  }

  function changeCaption(text: string) {
    onChange?.(lang === "en" ? { caption_en: text } : { caption_ml: text });
  }

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

      {!panel.text_baked
        ? dialogue.map((line, index) => (
            <SpeechBubble
              key={`${line.speaker}-${index}-${pageNumber}`}
              speaker={line.speaker}
              text={line.text_ml}
              layout={layouts[index]}
              editable={editable}
              onChange={(text) => changeDialogue(index, text)}
            />
          ))
        : null}

      {!panel.text_baked ? (
        <NarrationBox
          text={caption}
          editable={editable}
          onChange={changeCaption}
          label={lang === "en" ? "Narration" : "കഥാവിവരണം"}
        />
      ) : null}

      <span className="comic-card__page">{pageNumber}</span>
    </div>
  );
}
