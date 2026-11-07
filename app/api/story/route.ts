import { SAMPLE_STORY_JSON } from "@/lib/sample-story";


/**
 * Risk-test story endpoint.
 * - { hardcoded: true } returns the cached sample (fast path for image risk tests)
 * - otherwise calls the LLM with the plan prompt (best-effort JSON)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const hardcoded = Boolean(body.hardcoded);

    if (hardcoded || process.env.DEMO_MODE === "true") {
      return Response.json({ story: SAMPLE_STORY_JSON, source: "hardcoded" });
    }

    if (!text) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.LLM_MODEL;
    if (!apiKey || !model) {
      return Response.json(
        { story: SAMPLE_STORY_JSON, source: "hardcoded_fallback" },
      );
    }

    const system = `You are a children's picture-book editor in Kerala. A grandparent has told you a
story or memory. Turn it into a gentle 4-panel illustrated story for children
aged 4-10.

Rules:
- The input may be Malayalam, Manglish (Malayalam written in English letters), or
  English. Understand it all. Output captions in natural, simple Malayalam
  (Malayalam script) with an English version too.
- Keep the grandparent's voice and the heart of the story. Do not invent a
  different plot. Keep it warm, simple, and short: each caption max 2 short sentences.
- Each panel may include a "dialogue" array of 0-2 short spoken lines
  ({speaker, text_ml}) for comic speech bubbles. Use dialogue only when a
  character clearly speaks; otherwise use an empty array. Keep lines very short.
- Create a single "character_sheet" for the main character(s) with fixed visual
  details (age, face, hair, clothing colours, accessories). Every panel must reuse
  it exactly so the character looks the same.
- Remove or generalise personal details: real full names (use a first name or a
  role like "Ammachi"), phone numbers, addresses, exact house/location details,
  and any identifying info. List what you removed.
- Child-safety check: set child_safe=false if the content includes violence,
  sexual content, self-harm, hate, or anything unsuitable for children, and
  explain in "issues". Mild sadness or a gentle moral is fine.
- Scene descriptions must be visual and concrete, in English, with NO text, signs,
  or lettering in the scene. Leave clear empty space near the top of the scene
  for HTML speech bubbles to be overlaid later.

Return ONLY valid JSON matching the schema.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({
        story: SAMPLE_STORY_JSON,
        source: "hardcoded_fallback",
        error: data?.error?.message || `LLM failed (${res.status})`,
      });
    }

    const content = data.choices?.[0]?.message?.content;
    try {
      const story = JSON.parse(content);
      return Response.json({ story, source: "llm" });
    } catch {
      return Response.json({
        story: SAMPLE_STORY_JSON,
        source: "hardcoded_fallback",
        error: "Invalid JSON from LLM",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Story failed";
    return Response.json(
      { story: SAMPLE_STORY_JSON, source: "hardcoded_fallback", error: message },
      { status: 200 },
    );
  }
}
