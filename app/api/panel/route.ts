import { createServiceClient } from "@/lib/supabase";
import { buildPanelPrompt } from "@/lib/prompts";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const characterDescription = String(body.character_description ?? "");
    const sceneDescription = String(body.scene_description ?? "");
    const idx = Number(body.idx ?? 0);
    const bookId = String(body.book_id ?? "risk");

    if (!characterDescription || !sceneDescription || !idx) {
      return Response.json(
        { error: "character_description, scene_description, and idx are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.IMAGE_MODEL;
    if (!apiKey || !model) {
      return Response.json(
        { error: "OPENAI_API_KEY or IMAGE_MODEL missing" },
        { status: 500 },
      );
    }

    const prompt = buildPanelPrompt({
      characterDescription,
      sceneDescription,
    });

    const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });

    const imageData = await imageRes.json().catch(() => ({}));
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Panel failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
