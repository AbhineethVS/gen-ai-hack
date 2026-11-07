import {
  DEFAULT_CHARACTER_DESCRIPTION,
  SAMPLE_STORY_JSON,
} from "@/lib/sample-story";

type LoosePanel = Record<string, unknown>;
type LooseStory = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function characterDescription(sheet: unknown): string {
  if (typeof sheet === "string" && sheet.trim()) return sheet.trim();
  if (sheet && typeof sheet === "object") {
    const obj = sheet as Record<string, unknown>;
    return (
      asString(obj.description) ||
      asString(obj.visual) ||
      asString(obj.details) ||
      asString(obj.appearance) ||
      [asString(obj.name), asString(obj.clothing), asString(obj.age)]
        .filter(Boolean)
        .join(", ")
    );
  }
  return DEFAULT_CHARACTER_DESCRIPTION;
}

function sceneDescription(panel: LoosePanel, fallbackCaption: string): string {
  return (
    asString(panel.scene_description) ||
    asString(panel.scene) ||
    asString(panel.sceneDescription) ||
    asString(panel.visual) ||
    asString(panel.image_prompt) ||
    (fallbackCaption
      ? `Children's picture-book scene in Kerala illustrating: ${fallbackCaption}. Leave clear empty space near the top. No text in the image.`
      : SAMPLE_STORY_JSON.panels[0].scene_description)
  );
}

/** Coerce messy LLM JSON into the shape the panel API needs. */
export function normalizeStory(raw: unknown) {
  const story = (raw && typeof raw === "object" ? raw : {}) as LooseStory;
  const fallback = SAMPLE_STORY_JSON;

  const sheetRaw = story.character_sheet ?? story.characterSheet ?? story.characters;
  let description = characterDescription(sheetRaw);
  if (description.length < 40) {
    description = DEFAULT_CHARACTER_DESCRIPTION;
  }
  const name =
    (sheetRaw &&
      typeof sheetRaw === "object" &&
      asString((sheetRaw as Record<string, unknown>).name)) ||
    fallback.character_sheet.name;

  const panelsIn = Array.isArray(story.panels) ? (story.panels as LoosePanel[]) : [];
  const sourcePanels: LoosePanel[] = panelsIn.length
    ? panelsIn
    : (fallback.panels as unknown as LoosePanel[]);
  const panels = sourcePanels.slice(0, 4).map((panel, i) => {
    const caption_ml =
      asString(panel.caption_ml) ||
      asString(panel.caption) ||
      asString(panel.text_ml) ||
      fallback.panels[i]?.caption_ml ||
      "";
    const caption_en =
      asString(panel.caption_en) ||
      asString(panel.captionEnglish) ||
      asString(panel.text_en) ||
      caption_ml;
    const idx = Number(panel.idx ?? panel.index ?? i + 1) || i + 1;

    return {
      idx,
      scene_description: sceneDescription(panel, caption_en || caption_ml),
      caption_ml,
      caption_en,
      dialogue: Array.isArray(panel.dialogue) ? panel.dialogue : [],
    };
  });

  while (panels.length < 4) {
    const i = panels.length;
    panels.push({ ...fallback.panels[i], idx: i + 1 });
  }

  return {
    title_ml: asString(story.title_ml) || fallback.title_ml,
    title_en: asString(story.title_en) || fallback.title_en,
    character_sheet: { name, description },
    panels,
    safety:
      story.safety && typeof story.safety === "object"
        ? story.safety
        : fallback.safety,
  };
}
