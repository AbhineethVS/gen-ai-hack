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
}) {
  const refNote = params.withStyleRefs
    ? `Match ONLY the art technique of the reference images (line weight, flat colour, comic framing, empty bubble space).
Do NOT copy the reference characters, faces, clothes, culture-specific props, or story.
Redraw as an original Indian children's comic panel for the scene below.`
    : "";

  return `${STYLE_PREFIX}
${refNote}
Main character (keep identical in every panel): ${params.characterDescription}
Scene: ${params.sceneDescription}
Setting: India — follow the region and place described in the scene (village, city, coast, hills, etc.). Warm, gentle, child-friendly.
Leave clear empty space near the top of the image for speech bubbles to be overlaid later in HTML.
Do NOT include any text, letters, words, speech bubbles, signs or watermarks inside the image.
Square composition.`;
}
