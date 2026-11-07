import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("books")
      .select(
        "id, title_ml, title_en, narrator_label, cover_url, cover_direction, is_demo, created_at, panels(idx, image_url)",
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const books = (data || []).map((book) => {
      const panels = Array.isArray(book.panels)
        ? [...book.panels].sort(
            (a: { idx: number }, b: { idx: number }) => a.idx - b.idx,
          )
        : [];
      return {
        ...book,
        is_new:
          !book.is_demo &&
          Date.now() - new Date(book.created_at).getTime() <
            24 * 60 * 60 * 1000,
        cover_url:
          book.cover_url ||
          panels.find((panel) => panel.image_url)?.image_url ||
          null,
        panels: undefined,
      };
    });

    return Response.json({ books });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Library failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
