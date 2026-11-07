/** Generic visual fallback — NOT a specific demo character. */
export const DEFAULT_CHARACTER_DESCRIPTION =
  "A warm-skinned Indian child or elder matching the story, simple traditional Indian clothes in soft colours, kind expressive face, clear silhouette, consistent outfit details for a children's comic";

/** Prefill for typed fallback / "Try a sample story". */
export const SAMPLE_MALAYALAM_STORY = `കേരളത്തിലെ ഒരു ചെറിയ ഗ്രാമത്തിൽ, കനാൽക്കരയിലുള്ള വീട്ടിൽ മുത്തശ്ശി അനുവിന് പുട്ട് ഉണ്ടാക്കാൻ അതിരാവിലെ എഴുന്നേറ്റു. അടുക്കളയിൽ നിന്ന് ആവി ഉയർന്നു. അനു ജനൽ വഴി കനാലിൽ പാറുന്ന തുമ്പികളെ നോക്കി നിന്നു. പെട്ടെന്ന് വൈദ്യുതി മുറിഞ്ഞു, സ്റ്റീമർ നിന്നു. അനുവിന്റെ കണ്ണിൽ കണ്ണീർ. മുത്തശ്ശി ഒരു ചെറിയ വിളക്ക് കത്തിച്ചു, ചിരിച്ചു പറഞ്ഞു, “മകളേ, ഇരുട്ടിന് ചൂടൻ കാലത്തിനെ തടയാനാവില്ല.” അവർ പഴയ അടുപ്പത്തിൽ പുട്ട് പൂർത്തിയാക്കി, നടയിൽ ഇരുന്നു, തേങ്ങാ ചിരകിയത് വിതറി കഴിച്ചു. ഈന്തപ്പനയിലൂടെ ആദ്യത്തെ വെളിച്ചം വീണു.`;

export const SAMPLE_ENGLISH_STORY = `In a quiet Kerala village by the backwaters, Ammachi woke before sunrise to make puttu for little Anu. Steam rose from the cooker while Anu pressed her nose to the kitchen window, watching dragonflies skim the canal. Suddenly the power went out and the steamer stopped. Anu's eyes filled with tears. Ammachi lit a small oil lamp, smiled, and said, "Child, even darkness cannot stop a warm breakfast." They finished the puttu on the old clay stove, sat on the veranda, and shared it with grated coconut as the first light touched the palm trees.`;

export type UILang = "ml" | "en";

export function sampleStoryForLang(lang: UILang) {
  return lang === "en" ? SAMPLE_ENGLISH_STORY : SAMPLE_MALAYALAM_STORY;
}

/** Only used when client explicitly asks { hardcoded: true }. */
export const SAMPLE_STORY_JSON = {
  title_ml: "പുട്ടും വിളക്കും",
  title_en: "Puttu and the Little Lamp",
  character_sheet: {
    name: "Ammachi",
    description:
      "Kind elderly Kerala grandmother named Ammachi, grey hair in a neat bun, warm brown skin, cream and mustard cotton saree with a thin red border, round gentle face, soft smile, simple gold stud earrings; little grandchild Anu has short black hair, bright eyes, and a simple cotton frock",
  },
  panels: [
    {
      idx: 1,
      scene_description:
        "Warm Kerala kitchen at dawn, Ammachi steaming puttu, little Anu watching dragonflies through the window over a canal. Soft morning light. Clear empty space near the top of the frame.",
      caption_ml: "മുത്തശ്ശി അതിരാവിലെ അനുവിന് പുട്ട് ഉണ്ടാക്കി.",
      caption_en: "At dawn, Ammachi made puttu for little Anu.",
      dialogue: [] as {
        speaker: string;
        speaker_en?: string;
        text_ml: string;
        text_en?: string;
      }[],
    },
    {
      idx: 2,
      scene_description:
        "The kitchen goes dim as power fails, steamer stops steaming, Anu looks worried, Ammachi calm beside an unlit lamp. Empty space near the top.",
      caption_ml: "പെട്ടെന്ന് വൈദ്യുതി മുറിഞ്ഞു. അനു ദുഃഖിച്ചു.",
      caption_en: "Suddenly the power went out. Anu felt sad.",
      dialogue: [
        {
          speaker: "അനു",
          speaker_en: "Anu",
          text_ml: "പുട്ട് നിർത്തി!",
          text_en: "The puttu stopped!",
        },
      ],
    },
    {
      idx: 3,
      scene_description:
        "Ammachi lights a small oil lamp and smiles at Anu, warm glow on their faces in the kitchen. Empty space near the top.",
      caption_ml: "മുത്തശ്ശി വിളക്ക് കത്തിച്ചു ചിരിച്ചു.",
      caption_en: "Ammachi lit a lamp and smiled.",
      dialogue: [
        {
          speaker: "മുത്തശ്ശി",
          speaker_en: "Ammachi",
          text_ml: "ഇരുട്ടിന് ചൂടൻ കാലത്തിനെ തടയാനാവില്ല.",
          text_en: "Even darkness cannot stop a warm breakfast.",
        },
      ],
    },
    {
      idx: 4,
      scene_description:
        "Ammachi and Anu sit on a Kerala veranda at sunrise sharing puttu with grated coconut, palms and canal in the soft background. Empty space near the top.",
      caption_ml: "അവർ നടയിൽ ഇരുന്നു പുട്ട് പങ്കിട്ടു.",
      caption_en: "They sat on the veranda and shared the puttu.",
      dialogue: [],
    },
  ],
  safety: {
    child_safe: true,
    issues: [] as string[],
    removed_personal_details: [] as string[],
  },
};
