import { buildCoverPrompt } from "@/lib/prompts";
import { loadStyleRefFiles } from "@/lib/style-refs";
import { createServiceClient } from "@/lib/supabase";

type StyleRef = { name: string; bytes: Buffer; type: string };

function coverDirection(raw: unknown) {
  const value =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const text = (key: string, fallback: string) => {
    const candidate = value[key];
    return typeof candidate === "string" && candidate.trim()
      ? candidate.trim()
      : fallback;
  };
  const palette = Array.isArray(value.palette)
    ? value.palette
        .filter(
          (color): color is string =>
            typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color),
        )
        .slice(0, 5)
    : [];

  return {
    concept: text("concept", "A warm symbolic moment of wonder and discovery"),
    illustrationPrompt: text(
      "illustration_prompt",
      "One iconic scene with a clear hero, emotional warmth, and cinematic depth",
    ),
    focalPoint: text("focal_point", "Main character in the centre-lower area"),
    titleZone: value.title_zone === "top" ? ("top" as const) : ("bottom" as const),
    palette:
      palette.length >= 2
        ? palette
        : ["#E8A24A", "#315B52", "#F5E8C8", "#7A302B"],
  };
}

async function generateWithRefs(params: {
  apiKey: string;
  model: string;
  prompt: string;
  refs: StyleRef[];
}) {
  const form = new FormData();
  form.append("model", params.model);
  form.append("prompt", params.prompt);
  form.append("size", "1024x1536");
  form.append("quality", "high");
  form.append("complexity", "high");
  form.append("n", "1");
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
      size: "1024x1536",
      quality: "high",
      complexity: "high",
      n: 1,
    }),
  });
}

async function imageBytes(item: Record<string, unknown>) {
  if (typeof item.b64_json === "string") {
    return {
      bytes: Buffer.from(item.b64_json, "base64"),
      contentType: "image/png",
    };
  }
  if (typeof item.url === "string") {
    const remote = await fetch(item.url);
    if (!remote.ok) throw new Error("Could not download generated cover");
    return {
      bytes: Buffer.from(await remote.arrayBuffer()),
      contentType: remote.headers.get("content-type") || "image/png",
    };
  }
  throw new Error("No cover image returned");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookId = String(body.book_id ?? "").trim();
    const characterDescription = String(
      body.character_description ?? "",
    ).trim();
    if (!bookId || characterDescription.length < 20) {
      return Response.json(
        { error: "book_id and character_description are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.IMAGE_MODEL || "gpt-image-2.6-sunburst";
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const direction = coverDirection(body.cover_direction);
    const refs = body.use_style_refs === false ? [] : await loadStyleRefFiles();
    const buildPrompt = (withStyleRefs: boolean) =>
      buildCoverPrompt({
        characterDescription,
        concept: direction.concept,
        illustrationPrompt: direction.illustrationPrompt,
        focalPoint: direction.focalPoint,
        titleZone: direction.titleZone,
        palette: direction.palette,
        withStyleRefs,
      });

    let response = refs.length
      ? await generateWithRefs({
          apiKey,
          model,
          prompt: buildPrompt(true),
          refs,
        })
      : await generatePlain({ apiKey, model, prompt: buildPrompt(false) });
    let data = await response.json().catch(() => ({}));

    if (!response.ok && refs.length) {
      response = await generatePlain({
        apiKey,
        model,
        prompt: buildPrompt(false),
      });
      data = await response.json().catch(() => ({}));
    }
    if (!response.ok) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            `Cover generation failed (${response.status})`,
        },
        { status: 500 },
      );
    }

    const generated = await imageBytes(data.data?.[0] ?? {});
    const supabase = createServiceClient();
    const path = `${bookId}/cover-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("panels")
      .upload(path, generated.bytes, {
        contentType: generated.contentType,
        upsert: true,
      });
    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from("panels")
      .getPublicUrl(path);
    const coverUrl = publicData.publicUrl;
    const { error: updateError } = await supabase
      .from("books")
      .update({ cover_url: coverUrl, cover_direction: body.cover_direction })
      .eq("id", bookId);
    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      cover_url: coverUrl,
      path,
      style_refs: refs.length > 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cover generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
