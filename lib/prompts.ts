/**
 * Indian children's graphic-novel look:
 * bold comic outlines + flat colour (inspired by modern graphic novels),
 * not locked to one state — scene text carries the place.
 */
export const STYLE_PREFIX = `Indian children's graphic-novel comic illustration.
Bold clean black outlines, flat cel-shaded colours, expressive faces, simple readable shapes.
Modern comic-book energy with warm Indian palette (ochres, greens, vermillion, cream, indigo).
Consistent character design across panels. Child-friendly, gentle mood.
Do not copy any existing artist's characters, costumes, or compositions.
No watercolour wash; no photorealism.`;

export function buildPanelPrompt(params: {
  characterDescription: string;
  sceneDescription: string;
  withStyleRefs?: boolean;
  bakeText?: boolean;
  captionText?: string;
  dialogueLines?: {
    speaker?: string;
    text?: string;
    placement?: string;
    tailTarget?: { x: number; y: number };
  }[];
}) {
  const refNote = params.withStyleRefs
    ? `Match ONLY the art technique of the reference images (line weight, flat colour, comic framing).
Do NOT copy the reference characters, faces, clothes, culture-specific props, or story.
Redraw as an original Indian children's comic panel for the scene below.`
    : "";
  const dialogue = (params.dialogueLines || [])
    .map((line) => `${line.speaker || "Character"}: ${line.text || ""}`.trim())
    .filter(Boolean)
    .join("\n");
  const overlayPlan = (params.dialogueLines || [])
    .map((line) => {
      const target = line.tailTarget
        ? `speaker near (${line.tailTarget.x.toFixed(2)}, ${line.tailTarget.y.toFixed(2)})`
        : "speaker clearly visible";
      return `${line.placement || "top"} bubble zone; ${target}`;
    })
    .join("; ");
  const textInstruction = params.bakeText
    ? `Experimental text-in-image mode:
Draw clean comic speech bubbles and one small narration caption box inside the image.
Use ONLY the exact text below. Do not invent or paraphrase words.
Speech bubble text:
${dialogue || "(none)"}
Narration caption:
${params.captionText || "(none)"}
Keep lettering large, readable, correctly spelled, and inside the bubbles/caption.`
    : `Compose for later HTML comic overlays. Keep faces expressive and clearly visible.
Preserve natural negative space in these intended bubble zones: ${overlayPlan || "upper corners"}.
Keep the bottom quarter visually calm for a small narration strip, but do not make the scene unnaturally empty.
Do NOT include any text, letters, words, speech bubbles, captions, signs or watermarks inside the image.`;

  return `${STYLE_PREFIX}
${refNote}
Main character (keep identical in every panel): ${params.characterDescription}
Scene: ${params.sceneDescription}
Setting: India — follow the region and place described in the scene (village, city, coast, hills, etc.). Warm, gentle, child-friendly.
${textInstruction}
Square composition.`;
}
