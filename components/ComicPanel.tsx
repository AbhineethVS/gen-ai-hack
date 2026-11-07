"use client";

import NarrationBox from "@/components/NarrationBox";
import SpeechBubble from "@/components/SpeechBubble";
import { layoutDialogue } from "@/lib/comic-layout";
import type { DialogueLine, UILang } from "@/lib/types";

export type ComicPanelData = {
  idx: number;
  caption_ml?: string | null;
  caption_en?: string | null;
  scene_description?: string;
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
  onRedraw?: () => void;
  redrawing?: boolean;
};

export default function ComicPanel({
  panel,
  lang,
  pageNumber,
  editable = false,
  onChange,
  onRedraw,
  redrawing = false,
}: Props) {
  if (!panel) {
    return <div className="comic-card comic-card--blank" />;
  }

  const caption =
    lang === "en"
      ? panel.caption_en || panel.caption_ml || ""
      : panel.caption_ml || panel.caption_en || "";
  const dialogue = panel.text_baked ? [] : (panel.dialogue || []).slice(0, 3);
  const layouts = layoutDialogue(dialogue, lang);

  function changeDialogue(index: number, text: string) {
    const next = dialogue.map((line, lineIndex) =>
      lineIndex === index
        ? lang === "en"
          ? { ...line, text_en: text }
          : { ...line, text_ml: text }
        : line,
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
              speaker={
                lang === "en"
                  ? line.speaker_en || line.speaker
                  : line.speaker || line.speaker_en
              }
              text={
                lang === "en"
                  ? line.text_en || line.text_ml
                  : line.text_ml || line.text_en || ""
              }
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
      {onRedraw ? (
        <button
          type="button"
          className="comic-card__redraw"
          disabled={redrawing}
          onClick={(event) => {
            event.stopPropagation();
            onRedraw();
          }}
        >
          {redrawing
            ? lang === "en"
              ? "Drawing..."
              : "വരയ്ക്കുന്നു..."
            : lang === "en"
              ? "Draw again"
              : "വീണ്ടും വരയ്ക്കുക"}
        </button>
      ) : null}
    </div>
  );
}
