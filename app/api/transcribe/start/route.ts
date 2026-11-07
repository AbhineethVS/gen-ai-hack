import { startBatchJob, transcribeSync, type SarvamLang } from "@/lib/sarvam";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const fileEntry = form.get("file");
    const durationRaw = form.get("duration_seconds");
    const langRaw = String(form.get("language") ?? "ml");

    if (!(fileEntry instanceof Blob)) {
      return Response.json({ error: "Audio file is required" }, { status: 400 });
    }
    const file = fileEntry;

    const durationSeconds = Number(durationRaw ?? 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return Response.json(
        { error: "duration_seconds is required" },
        { status: 400 },
      );
    }

    const languageCode: SarvamLang = langRaw === "en" ? "en-IN" : "ml-IN";
    const filename =
      "name" in file && typeof file.name === "string" && file.name
        ? file.name
        : "recording.webm";

    if (durationSeconds <= 30) {
      const text = await transcribeSync(file, filename, languageCode);
      return Response.json({ text, path: "sync" });
    }

    const job_id = await startBatchJob(file, filename, languageCode);
    return Response.json({ job_id, path: "batch" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
