export type DialogueLine = {
  speaker: string;
  text_ml: string;
};

export type StoryPanel = {
  idx: number;
  scene_description: string;
  caption_ml: string;
  caption_en: string;
  dialogue: DialogueLine[];
};

export type CharacterSheet = {
  name: string;
  description: string;
};

export type StoryPayload = {
  title_ml: string;
  title_en: string;
  character_sheet: CharacterSheet;
  panels: StoryPanel[];
  safety?: {
    child_safe?: boolean;
    issues?: string[];
    removed_personal_details?: string[];
  };
};

export type BookRecord = {
  id: string;
  title_ml: string;
  title_en: string | null;
  narrator_label: string | null;
  character_sheet: CharacterSheet;
  is_public: boolean;
  is_demo: boolean;
  created_at: string;
  panels: Array<{
    id: string;
    idx: number;
    caption_ml: string;
    caption_en: string | null;
    scene_description: string;
    dialogue: DialogueLine[];
    image_url: string | null;
  }>;
};

export type UILang = "ml" | "en";
