import { createServiceClient } from "@/lib/supabase";
import { getPublicSiteUrl } from "@/lib/site-url";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookId = String(body.book_id || "").trim();
    if (!bookId || body.consent !== true) {
      return Response.json(
        { error: "Consent is required before sharing." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select(
        "id, title_ml, title_en, panels(idx, caption_ml, caption_en, dialogue, image_url)",
      )
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return Response.json(
        { error: bookError?.message || "Book not found" },
        { status: 404 },
      );
    }

    const panels = Array.isArray(book.panels) ? book.panels : [];
    if (panels.length < 4 || panels.some((panel) => !panel.image_url)) {
      return Response.json(
        { error: "Please finish all four pages before sharing." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.LLM_MODEL;
    if (!apiKey || !model) {
      return Response.json(
        { error: "Safety check is temporarily unavailable." },
        { status: 500 },
      );
    }

    const finalWords = {
      title_ml: book.title_ml,
      title_en: book.title_en,
      panels: panels.map((panel) => ({
        caption_ml: panel.caption_ml,
        caption_en: panel.caption_en,
        dialogue: panel.dialogue,
      })),
    };
    const safetyRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Check final children's comic text for ages 4-10.
Reject violence, sexual content, self-harm, hate, graphic fear, phone numbers,
addresses, exact identifying locations, or full real names. Mild sadness and
gentle folklore are fine. Return only JSON:
{"child_safe":boolean,"issues":string[]}.`,
          },
          { role: "user", content: JSON.stringify(finalWords) },
        ],
      }),
    });
    const safetyData = await safetyRes.json().catch(() => ({}));
    if (!safetyRes.ok) {
      return Response.json(
        { error: "Safety check is temporarily unavailable. Please try again." },
        { status: 502 },
      );
    }

    let safety: { child_safe?: boolean; issues?: string[] };
    try {
      safety = JSON.parse(safetyData.choices?.[0]?.message?.content || "{}");
    } catch {
      return Response.json(
        { error: "Safety check could not finish. Please try again." },
        { status: 502 },
      );
    }
    if (safety.child_safe !== true) {
      return Response.json(
        {
          error: "This story needs a little change before children can read it.",
          issues: Array.isArray(safety.issues) ? safety.issues : [],
        },
        { status: 422 },
      );
    }

    const consentAt = new Date().toISOString();
    const { error: publishError } = await supabase
      .from("books")
      .update({ is_public: true, consent_at: consentAt })
      .eq("id", bookId);
    if (publishError) {
      return Response.json({ error: publishError.message }, { status: 500 });
    }

    const siteUrl = getPublicSiteUrl(req);
    return Response.json({
      ok: true,
      url: `${siteUrl}/book/${bookId}`,
      library_url: `${siteUrl}/library`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
