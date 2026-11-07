import { createServiceClient } from "@/lib/supabase";

/** Create a private book + 4 panel rows (images filled later by /api/panel). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title_ml = String(body.title_ml ?? "").trim();
    const title_en = String(body.title_en ?? "").trim() || null;
    const original_text = String(body.original_text ?? "").trim() || null;
    const narrator_label =
      String(body.narrator_label ?? "").trim() || "മുത്തശ്ശി";
    const character_sheet = body.character_sheet;
    const cover_direction =
      body.cover_direction && typeof body.cover_direction === "object"
        ? body.cover_direction
        : {};
    const panels = Array.isArray(body.panels) ? body.panels : [];

    if (!title_ml || !character_sheet || panels.length < 1) {
      return Response.json(
        { error: "title_ml, character_sheet, and panels are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        title_ml,
        title_en,
        narrator_label,
        original_text,
        character_sheet,
        cover_direction,
        is_public: false,
        is_demo: false,
      })
      .select("id")
      .single();

    if (bookError || !book) {
      return Response.json(
        { error: bookError?.message || "Could not create book" },
        { status: 500 },
      );
    }

    const rows = panels.slice(0, 4).map(
      (
        p: {
          idx?: number;
          caption_ml?: string;
          caption_en?: string;
          scene_description?: string;
          dialogue?: unknown;
        },
        i: number,
      ) => ({
        book_id: book.id,
        idx: Number(p.idx ?? i + 1) || i + 1,
        caption_ml: String(p.caption_ml || p.caption_en || `Panel ${i + 1}`),
        caption_en: String(p.caption_en || p.caption_ml || "") || null,
        scene_description: String(p.scene_description || ""),
        dialogue: Array.isArray(p.dialogue) ? p.dialogue : [],
        image_url: null as string | null,
      }),
    );

    const { error: panelsError } = await supabase.from("panels").insert(rows);
    if (panelsError) {
      await supabase.from("books").delete().eq("id", book.id);
      return Response.json({ error: panelsError.message }, { status: 500 });
    }

    return Response.json({ id: book.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create book failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
