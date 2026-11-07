import { normalizeStory } from "@/lib/normalize-story";
import { SAMPLE_STORY_JSON } from "@/lib/sample-story";

/**
 * Story endpoint.
 * - { hardcoded: true } → demo puttu sample only
 * - otherwise → LLM from the user's text (never swap in the demo story on failure)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const hardcoded = Boolean(body.hardcoded);

    if (hardcoded || process.env.DEMO_MODE === "true") {
      return Response.json({
        story: normalizeStory(SAMPLE_STORY_JSON),
        source: "hardcoded",
      });
    }

    if (!text) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.LLM_MODEL;
    if (!apiKey || !model) {
      return Response.json(
        { error: "OPENAI_API_KEY or LLM_MODEL missing" },
        { status: 500 },
      );
    }

    const system = `You are a children's picture-book editor in India. Someone has told you a
story or memory. Turn it into a gentle 4-panel illustrated story for children
aged 4-10.

Rules:
- The input may be Malayalam, Manglish, Hindi/Hinglish, or English. Understand it all.
  Output captions in natural, simple Malayalam (Malayalam script) AND English.
- Keep the heart of THIS story. Do not invent a different plot. Do not replace it
  with another demo story. Keep it warm, simple, and short: each caption max 2 short sentences.
- Captions are NARRATION (the storyteller's voice). Spoken words go in "dialogue".
- Across the 4 panels, include dialogue on at least 2 panels when anyone speaks
  or reacts. Each "dialogue" array has 0-2 short lines:
  {speaker, text_ml, placement, tail_target}. text_ml is in Malayalam script.
  placement is one of top-left, top-right, middle-left, middle-right.
  tail_target is the intended speaker location as normalized {x,y} values from
  0 to 1 within the image. Keep lines very short. Use [] only when silent.
- Pick different placements when a panel has two bubbles. Place bubbles away
  from faces and reserve the bottom quarter for the narration caption.
- Create a single "character_sheet" object with "name" and a NON-EMPTY
  "description" string of fixed visual details (age, face, hair, clothing colours,
  accessories) for THIS story's characters. description must be at least one full sentence.
  Every panel must reuse it exactly so the character looks the same.
- Remove or generalise personal details: real full names (use a first name or a
  role), phone numbers, addresses, exact house/location details.
- Child-safety check: set child_safe=false if unsuitable for children; mild sadness is fine.
- Scene descriptions must be visual and concrete, in English, with NO text, signs,
  or lettering. Mention where speaking characters stand so the image composition
  agrees with tail_target. Preserve some natural negative space in the requested
  bubble zones and keep the bottom quarter visually calm for narration.
- Create "cover_direction" for a SEPARATE portrait cover illustration. It must be
  symbolic key art, not a copy of panel 1. Return:
  {concept, illustration_prompt, focal_point, title_zone, palette}.
  illustration_prompt is a vivid English visual prompt with one strong focal idea,
  expressive characters, depth, and no text, letters, captions, bubbles, logos, or
  watermarks. focal_point describes where the key subject sits. title_zone must be
  either "top" or "bottom" and must identify genuinely calm negative space for our
  HTML title. palette is 3-5 harmonious hex colours. Keep the character identity
  from character_sheet but allow a more iconic, cinematic cover composition.

Return ONLY valid JSON with keys: title_ml, title_en, character_sheet,
cover_direction, panels (exactly 4), safety.`;

    // gpt-6-astra (and some reasoning models) reject custom temperature — omit it
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json(
        {
          error: data?.error?.message || `LLM failed (${res.status})`,
        },
        { status: 500 },
      );
    }

    const content = data.choices?.[0]?.message?.content;
    try {
      const story = normalizeStory(JSON.parse(content));
      return Response.json({ story, source: "llm" });
    } catch {
      return Response.json(
        { error: "Invalid JSON from LLM" },
        { status: 500 },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Story failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
