export const STYLE_PREFIX = `Warm watercolour children's picture-book illustration, soft colours, gentle
lighting, simple shapes, consistent character design, no text.`;

export function buildPanelPrompt(params: {
  characterDescription: string;
  sceneDescription: string;
}) {
  return `${STYLE_PREFIX}
Main character (keep identical in every panel): ${params.characterDescription}
Scene: ${params.sceneDescription}
Setting: Kerala, India. Warm, gentle, child-friendly.
Leave clear empty space near the top of the image for speech bubbles to be overlaid later.
Do NOT include any text, letters, words, speech bubbles, signs or watermarks.
Square composition.`;
}
