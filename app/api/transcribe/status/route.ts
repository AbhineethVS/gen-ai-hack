import { downloadBatchTranscript, getBatchStatus } from "@/lib/sarvam";


export async function GET(req: Request) {
  try {
    const jobId = new URL(req.url).searchParams.get("job_id");
    if (!jobId) {
      return Response.json({ error: "job_id is required" }, { status: 400 });
    }

    const status = await getBatchStatus(jobId);
    const state = status.job_state;

    if (state === "Failed") {
      return Response.json({
        status: "failed",
        error: status.error_message || "Transcription job failed",
      });
    }

    if (state !== "Completed") {
      return Response.json({ status: "pending", job_state: state });
    }

    const fileNames =
      status.job_details?.flatMap((d) =>
        (d.outputs ?? []).map((o) => o.file_name),
      ) ?? [];

    if (fileNames.length === 0) {
      return Response.json({
        status: "failed",
        error: "Job completed but no output files were returned",
      });
    }

    const text = await downloadBatchTranscript(jobId, fileNames);
    return Response.json({ status: "ready", text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
