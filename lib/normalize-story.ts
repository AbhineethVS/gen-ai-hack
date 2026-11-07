import { DEFAULT_CHARACTER_DESCRIPTION } from "@/lib/sample-story";

type LoosePanel = Record<string, unknown>;
type LooseStory = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function characterDescription(sheet: unknown): string {
  if (typeof sheet === "string" && sheet.trim()) return sheet.trim();
  if (sheet && typeof sheet === "object") {
    const obj = sheet as Record<string, unknown>;
    const parts = [
      asString(obj.description),
      asString(obj.visual),
      asString(obj.details),
      asString(obj.appearance),
    ].filter(Boolean);
    if (parts[0] && parts[0].length >= 20) return parts[0];
    const joined = [
      asString(obj.name),
      asString(obj.age),
      asString(obj.clothing),
      asString(obj.hair),
    ]
      .filter(Boolean)
      .join(", ");
    if (joined.length >= 20) return `${joined}. ${DEFAULT_CHARACTER_DESCRIPTION}`;
    if (joined) return `${joined}. ${DEFAULT_CHARACTER_DESCRIPTION}`;
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
      ? `Indian children's comic scene illustrating: ${fallbackCaption}. Leave clear empty space near the top. No text in the image.`
      : "Warm Indian children's comic scene with clear empty space near the top. No text.")
  );
}

function normalizeDialogue(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as {
      speaker: string;
      text_ml: string;
      placement?: string;
      tail_target?: { x: number; y: number };
    }[];
  }
  return raw
    .map((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return {
          speaker: "…",
          text_ml: item.trim(),
          placement: index % 2 === 0 ? "top-left" : "top-right",
        };
      }
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const speaker =
        asString(o.speaker) || asString(o.name) || asString(o.character) || "…";
      const text_ml =
        asString(o.text_ml) ||
        asString(o.text) ||
        asString(o.line) ||
        asString(o.dialogue) ||
        asString(o.caption_ml);
      if (!text_ml) return null;
      const placementRaw = asString(o.placement);
      const placement = [
        "top-left",
        "top-right",
        "middle-left",
        "middle-right",
      ].includes(placementRaw)
        ? placementRaw
        : index % 2 === 0
          ? "top-left"
          : "top-right";
      const targetRaw =
        o.tail_target && typeof o.tail_target === "object"
          ? (o.tail_target as Record<string, unknown>)
          : null;
      const x = Number(targetRaw?.x);
      const y = Number(targetRaw?.y);
      const tail_target =
        Number.isFinite(x) && Number.isFinite(y)
          ? {
              x: Math.min(1, Math.max(0, x)),
              y: Math.min(1, Math.max(0, y)),
            }
          : undefined;
      return { speaker, text_ml, placement, tail_target };
    })
    .filter(Boolean) as {
    speaker: string;
    text_ml: string;
    placement?: string;
    tail_target?: { x: number; y: number };
  }[];
}

function normalizeCoverDirection(raw: unknown, titleHint: string) {
  const cover =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const palette = Array.isArray(cover.palette)
    ? cover.palette
        .map(asString)
        .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
        .slice(0, 5)
    : [];
  const concept =
    asString(cover.concept) ||
    `A single symbolic key-art moment that captures the heart of ${titleHint}`;

  return {
    concept,
    illustration_prompt:
      asString(cover.illustration_prompt) ||
      asString(cover.image_prompt) ||
      `${concept}. A cinematic portrait children's comic cover with one clear focal subject.`,
    focal_point:
      asString(cover.focal_point) || "Main character in the centre-lower area",
    title_zone: asString(cover.title_zone) === "top" ? "top" : "bottom",
    palette:
      palette.length >= 2
        ? palette
        : ["#E8A24A", "#315B52", "#F5E8C8", "#7A302B"],
  };
}

function syntheticPanel(i: number, seedCaption: string) {
  const caption =
    seedCaption ||
    `Part ${i + 1} of the story unfolds with warmth and wonder.`;
  return {
    idx: i + 1,
    scene_description: `Indian children's comic illustration for: ${caption}. Empty space near the top. No text.`,
    caption_ml: caption,
    caption_en: caption,
    dialogue: [] as { speaker: string; text_ml: string }[],
  };
}

/** Coerce messy LLM JSON into the panel API shape. Never injects the demo puttu story. */
export function normalizeStory(raw: unknown) {
  const story = (raw && typeof raw === "object" ? raw : {}) as LooseStory;

  const sheetRaw = story.character_sheet ?? story.characterSheet ?? story.characters;
  let description = characterDescription(sheetRaw);
  if (description.length < 20) {
    description = DEFAULT_CHARACTER_DESCRIPTION;
  }
  const name =
    (sheetRaw &&
      typeof sheetRaw === "object" &&
      asString((sheetRaw as Record<string, unknown>).name)) ||
    "Hero";

  const panelsIn = Array.isArray(story.panels) ? (story.panels as LoosePanel[]) : [];
  const titleHint =
    asString(story.title_en) || asString(story.title_ml) || "the story";

  const panels = (panelsIn.length ? panelsIn : [0, 1, 2, 3].map(() => ({}))).slice(0, 4).map(
    (panel, i) => {
      const p = panel as LoosePanel;
      const caption_ml =
        asString(p.caption_ml) ||
        asString(p.caption) ||
        asString(p.text_ml) ||
        "";
      const caption_en =
        asString(p.caption_en) ||
        asString(p.captionEnglish) ||
        asString(p.text_en) ||
        caption_ml;
      const caption = caption_en || caption_ml;
      const idx = Number(p.idx ?? p.index ?? i + 1) || i + 1;

      if (!caption && !asString(p.scene_description) && !asString(p.scene)) {
        return syntheticPanel(i, `${titleHint}, moment ${i + 1}`);
      }

      return {
        idx,
        scene_description: sceneDescription(p, caption),
        caption_ml: caption_ml || caption_en || `${titleHint} — part ${i + 1}`,
        caption_en: caption_en || caption_ml || `${titleHint} — part ${i + 1}`,
        dialogue: normalizeDialogue(p.dialogue ?? p.dialogs ?? p.speech ?? p.bubbles),
      };
    },
  );

  while (panels.length < 4) {
    panels.push(syntheticPanel(panels.length, `${titleHint}, moment ${panels.length + 1}`));
  }

  return {
    title_ml: asString(story.title_ml) || asString(story.title_en) || titleHint,
    title_en: asString(story.title_en) || asString(story.title_ml) || titleHint,
    character_sheet: { name, description },
    cover_direction: normalizeCoverDirection(
      story.cover_direction ?? story.coverDirection ?? story.cover,
      titleHint,
    ),
    panels,
    safety:
      story.safety && typeof story.safety === "object"
        ? story.safety
        : { child_safe: true, issues: [], removed_personal_details: [] },
  };
}
