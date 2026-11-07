import { DEFAULT_CHARACTER_DESCRIPTION } from "@/lib/sample-story";
import { createServiceClient } from "@/lib/supabase";
import { buildPanelPrompt } from "@/lib/prompts";
import { loadStyleRefFiles } from "@/lib/style-refs";

async function generateWithRefs(params: {
  apiKey: string;
  model: string;
  prompt: string;
  refs: { name: string; bytes: Buffer; type: string }[];
}) {
  const form = new FormData();
  form.append("model", params.model);
  form.append("prompt", params.prompt);
  form.append("size", "1024x1024");
  form.append("quality", "high");
  form.append("n", "1");
  // complexity is supported on GPT Image 2.5/2.6
  form.append("complexity", "high");

  for (const ref of params.refs) {
    form.append(
      "image[]",
      new Blob([new Uint8Array(ref.bytes)], { type: ref.type }),
      ref.name,
    );
  }

  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${params.apiKey}` },
    body: form,
  });
}

async function generatePlain(params: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      size: "1024x1024",
      quality: "high",
      complexity: "high",
      n: 1,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let characterDescription = String(
      body.character_description ?? body.characterDescription ?? "",
    ).trim();
    const sceneDescription = String(
      body.scene_description ?? body.sceneDescription ?? body.scene ?? "",
    ).trim();
    const idx = Number(body.idx ?? body.index ?? 0);
    const bookId = String(body.book_id ?? "risk");
    const useStyleRefs = body.use_style_refs !== false;

    if (characterDescription.length < 40) {
      characterDescription = DEFAULT_CHARACTER_DESCRIPTION;
    }

    if (!characterDescription || !sceneDescription || !Number.isFinite(idx) || idx < 1) {
      return Response.json(
        {
          error: "character_description, scene_description, and idx are required",
          received: {
            character_description: Boolean(characterDescription),
            scene_description: Boolean(sceneDescription),
            idx,
          },
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.IMAGE_MODEL || "gpt-image-2.6-sunburst";
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const refs = useStyleRefs ? await loadStyleRefFiles() : [];
    const withStyleRefs = refs.length > 0;

    const prompt = buildPanelPrompt({
      characterDescription,
      sceneDescription,
      withStyleRefs,
    });

    let imageRes = withStyleRefs
      ? await generateWithRefs({ apiKey, model, prompt, refs })
      : await generatePlain({ apiKey, model, prompt });

    let imageData = await imageRes.json().catch(() => ({}));

    // If edits+refs fail, fall back to plain generation so demo doesn't die
    if (!imageRes.ok && withStyleRefs) {
      imageRes = await generatePlain({ apiKey, model, prompt: buildPanelPrompt({
        characterDescription,
        sceneDescription,
        withStyleRefs: false,
      }) });
      imageData = await imageRes.json().catch(() => ({}));
    }

    if (!imageRes.ok) {
      return Response.json(
        {
          error:
            imageData?.error?.message ||
            `Image generation failed (${imageRes.status})`,
        },
        { status: 500 },
      );
    }

    const item = imageData.data?.[0] ?? {};
    let bytes: Buffer;
    let contentType = "image/png";

    if (item.b64_json) {
      bytes = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const remote = await fetch(item.url);
      const arr = await remote.arrayBuffer();
      bytes = Buffer.from(arr);
      contentType = remote.headers.get("content-type") || contentType;
    } else {
      return Response.json({ error: "No image returned" }, { status: 500 });
    }

    const supabase = createServiceClient();
    const path = `${bookId}/panel-${idx}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("panels")
      .upload(path, bytes, { contentType, upsert: true });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("panels").getPublicUrl(path);

    return Response.json({
      idx,
      image_url: publicData.publicUrl,
      path,
      style_refs: withStyleRefs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Panel failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
