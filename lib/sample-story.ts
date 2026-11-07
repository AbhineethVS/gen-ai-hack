/** Prefill for typed fallback / "Try a sample story". */
export const SAMPLE_MALAYALAM_STORY = `ഒരു മുത്തശ്ശിക്ക് ഒരു ചെറിയ തോട്ടം ഉണ്ടായിരുന്നു. അവിടെ ഒരു മാമ്പഴ മരം ഉണ്ടായിരുന്നു. ഒരു ദിവസം ഒരു കുരങ്ങൻ വന്ന് പഴം പറിച്ചു. മുത്തശ്ശി ചിരിച്ചുകൊണ്ട് പറഞ്ഞു, “മകനേ, നീയും കഴിക്കൂ, ഞാനും കഴിക്കാം.” അവർ ഒരുമിച്ച് ഇന്നു കഴിച്ചു.`;

export const SAMPLE_ENGLISH_STORY = `Once there was a grandmother in a Kerala village who kept a tiny garden and one mango tree. One afternoon a cheeky monkey climbed up and plucked a ripe mango. Instead of scolding him, she laughed and said, "Child, you eat some, I will eat some too." They sat under the tree and shared the sweet fruit together.`;

export type UILang = "ml" | "en";

export function sampleStoryForLang(lang: UILang) {
  return lang === "en" ? SAMPLE_ENGLISH_STORY : SAMPLE_MALAYALAM_STORY;
}

/** Hardcoded 4-panel story for risk testing when LLM is skipped or fails. */
export const SAMPLE_STORY_JSON = {
  title_ml: "മാമ്പഴവും കുരങ്ങനും",
  title_en: "The Mango and the Monkey",
  character_sheet: {
    name: "Ammachi",
    description:
      "Kind elderly Kerala grandmother, grey hair in a neat bun, warm brown skin, cream and mustard cotton saree with a thin red border, round gentle face, soft smile, simple gold stud earrings",
  },
  panels: [
    {
      idx: 1,
      scene_description:
        "A sunny Kerala courtyard garden with a mango tree. Ammachi stands near the tree looking up at ripe mangoes. Clear empty space near the top of the frame.",
      caption_ml: "മുത്തശ്ശിക്ക് ഒരു ചെറിയ തോട്ടവും മാമ്പഴ മരവും ഉണ്ടായിരുന്നു.",
      caption_en: "Ammachi had a little garden and a mango tree.",
      dialogue: [] as { speaker: string; text_ml: string }[],
    },
    {
      idx: 2,
      scene_description:
        "A small brown monkey sits on a mango-tree branch holding a ripe mango. Ammachi looks up from below, surprised but soft. Empty space near the top.",
      caption_ml: "ഒരു കുരങ്ങൻ വന്ന് ഒരു പഴം പറിച്ചു.",
      caption_en: "A monkey came and picked a fruit.",
      dialogue: [{ speaker: "കുരങ്ങൻ", text_ml: "ഇതെനിക്ക്!" }],
    },
    {
      idx: 3,
      scene_description:
        "Ammachi smiles and gestures kindly toward the monkey, offering to share. Warm afternoon light. Empty space near the top.",
      caption_ml: "മുത്തശ്ശി ചിരിച്ചു. അവൾ പങ്കുവയ്ക്കാൻ തയ്യാറായി.",
      caption_en: "Ammachi smiled. She was ready to share.",
      dialogue: [{ speaker: "മുത്തശ്ശി", text_ml: "മകനേ, നീയും കഴിക്കൂ." }],
    },
    {
      idx: 4,
      scene_description:
        "Ammachi and the monkey sit together under the mango tree sharing sliced mango on a banana leaf. Peaceful, warm. Empty space near the top.",
      caption_ml: "അവർ ഒരുമിച്ച് മാമ്പഴം കഴിച്ചു.",
      caption_en: "They ate the mango together.",
      dialogue: [],
    },
  ],
  safety: {
    child_safe: true,
    issues: [] as string[],
    removed_personal_details: [] as string[],
  },
};
