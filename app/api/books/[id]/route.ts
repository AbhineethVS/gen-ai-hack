import { createServiceClient } from "@/lib/supabase";

/** Fetch a book by id (private preview + public). Service role for hackathon simplicity. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: book, error } = await supabase
      .from("books")
      .select(
        "id, title_ml, title_en, narrator_label, character_sheet, cover_url, cover_direction, is_public, is_demo, created_at, panels(id, idx, caption_ml, caption_en, scene_description, dialogue, image_url, text_baked)",
      )
      .eq("id", id)
      .single();

    if (error || !book) {
      return Response.json({ error: error?.message || "Not found" }, { status: 404 });
    }

    const panels = Array.isArray(book.panels)
      ? [...book.panels].sort(
          (a: { idx: number }, b: { idx: number }) => a.idx - b.idx,
        )
      : [];

    return Response.json({ book: { ...book, panels } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** Persist editable comic words for one private/public book panel. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const panelIdx = Number(body.panel_idx);
    if (!id) return Response.json({ error: "book id required" }, { status: 400 });

    const panelUpdate: Record<string, unknown> = {};
    if (typeof body.caption_ml === "string") {
      panelUpdate.caption_ml = body.caption_ml.trim().slice(0, 500);
    }
    if (typeof body.caption_en === "string") {
      panelUpdate.caption_en = body.caption_en.trim().slice(0, 500);
    }
    if (Array.isArray(body.dialogue)) {
      panelUpdate.dialogue = body.dialogue.slice(0, 3).map(
        (line: Record<string, unknown>) => ({
          speaker: String(line.speaker || "").trim().slice(0, 80),
          speaker_en: String(line.speaker_en || line.speaker || "")
            .trim()
            .slice(0, 80),
          text_ml: String(line.text_ml || "").trim().slice(0, 240),
          text_en: String(line.text_en || line.text_ml || "")
            .trim()
            .slice(0, 240),
          placement: String(line.placement || "").trim() || undefined,
          tail_target:
            line.tail_target && typeof line.tail_target === "object"
              ? line.tail_target
              : undefined,
        }),
      );
    }
    const bookUpdate: Record<string, unknown> = {};
    if (typeof body.title_ml === "string") {
      bookUpdate.title_ml = body.title_ml.trim().slice(0, 180);
    }
    if (typeof body.title_en === "string") {
      bookUpdate.title_en = body.title_en.trim().slice(0, 180);
    }
    if (
      Object.keys(panelUpdate).length === 0 &&
      Object.keys(bookUpdate).length === 0
    ) {
      return Response.json({ error: "No changes supplied" }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (Object.keys(panelUpdate).length > 0) {
      if (!Number.isInteger(panelIdx) || panelIdx < 1 || panelIdx > 4) {
        return Response.json(
          { error: "panel_idx 1-4 is required for panel changes" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("panels")
        .update(panelUpdate)
        .eq("book_id", id)
        .eq("idx", panelIdx);
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
    if (Object.keys(bookUpdate).length > 0) {
      const { error } = await supabase.from("books").update(bookUpdate).eq("id", id);
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
