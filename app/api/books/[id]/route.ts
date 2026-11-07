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
        "id, title_ml, title_en, narrator_label, character_sheet, is_public, is_demo, created_at, panels(id, idx, caption_ml, caption_en, scene_description, dialogue, image_url)",
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
