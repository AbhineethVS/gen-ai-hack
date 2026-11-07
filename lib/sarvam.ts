const SARVAM_BASE = "https://api.sarvam.ai";

export type SarvamLang = "ml-IN" | "en-IN";

function apiKey() {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY is missing");
  return key;
}

/** Sarvam rejects types like audio/webm;codecs=opus — strip parameters. */
export function sanitizeAudioFile(file: Blob, filename: string): File {
  const raw = (file.type || "audio/webm").split(";")[0].trim().toLowerCase();
  const type =
    raw === "audio/webm" ||
    raw === "video/webm" ||
    raw === "audio/ogg" ||
    raw === "audio/opus" ||
    raw === "audio/wav" ||
    raw === "audio/mpeg" ||
    raw === "audio/mp4" ||
    raw === "audio/x-m4a"
      ? raw === "video/webm"
        ? "audio/webm"
        : raw
      : "audio/webm";

  const safeName = filename.replace(/\.[^.]+$/, "") + ".webm";
  return new File([file], safeName, { type });
}

export async function transcribeSync(
  file: Blob,
  filename: string,
  languageCode: SarvamLang = "ml-IN",
) {
  const clean = sanitizeAudioFile(file, filename);
  const form = new FormData();
  form.append("file", clean, clean.name);
  form.append("model", "saaras:v3");
  form.append("mode", "transcribe");
  form.append("language_code", languageCode);

  const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: "POST",
    headers: { "api-subscription-key": apiKey() },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.message || `Sarvam sync failed (${res.status})`,
    );
  }

  return String(data.transcript ?? "");
}

export async function startBatchJob(
  file: Blob,
  filename: string,
  languageCode: SarvamLang = "ml-IN",
) {
  const clean = sanitizeAudioFile(file, filename);

  const initRes = await fetch(`${SARVAM_BASE}/speech-to-text/job/v1`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job_parameters: {
        model: "saaras:v3",
        mode: "transcribe",
        language_code: languageCode,
      },
    }),
  });
  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    throw new Error(
      initData?.error?.message ||
        initData?.message ||
        `Sarvam batch init failed (${initRes.status})`,
    );
  }

  const jobId = String(initData.job_id);
  const uploadName = clean.name;

  const uploadRes = await fetch(`${SARVAM_BASE}/speech-to-text/job/v1/upload-files`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_id: jobId, files: [uploadName] }),
  });
  const uploadData = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(
      uploadData?.error?.message ||
        uploadData?.message ||
        `Sarvam upload-url failed (${uploadRes.status})`,
    );
  }

  const signed = uploadData.upload_urls?.[uploadName];
  const fileUrl = signed?.file_url as string | undefined;
  if (!fileUrl) throw new Error("Sarvam did not return an upload URL");

  const putHeaders: Record<string, string> = {
    "Content-Type": clean.type,
  };
  if (signed.file_metadata && typeof signed.file_metadata === "object") {
    for (const [k, v] of Object.entries(signed.file_metadata)) {
      if (typeof v === "string") putHeaders[k] = v;
    }
  }

  const putRes = await fetch(fileUrl, {
    method: "PUT",
    headers: putHeaders,
    body: clean,
  });
  if (!putRes.ok) {
    throw new Error(`Sarvam file upload failed (${putRes.status})`);
  }

  const startRes = await fetch(
    `${SARVAM_BASE}/speech-to-text/job/v1/${encodeURIComponent(jobId)}/start`,
    {
      method: "POST",
      headers: { "api-subscription-key": apiKey() },
    },
  );
  const startData = await startRes.json().catch(() => ({}));
  if (!startRes.ok) {
    throw new Error(
      startData?.error?.message ||
        startData?.message ||
        `Sarvam batch start failed (${startRes.status})`,
    );
  }

  return jobId;
}

export async function getBatchStatus(jobId: string) {
  const res = await fetch(
    `${SARVAM_BASE}/speech-to-text/job/v1/${encodeURIComponent(jobId)}/status`,
    { headers: { "api-subscription-key": apiKey() } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.message || `Sarvam status failed (${res.status})`,
    );
  }
  return data as {
    job_state: string;
    error_message?: string;
    job_details?: Array<{
      outputs?: Array<{ file_name: string }>;
      state?: string;
      error_message?: string | null;
    }>;
  };
}

export async function downloadBatchTranscript(jobId: string, fileNames: string[]) {
  const res = await fetch(`${SARVAM_BASE}/speech-to-text/job/v1/download-files`, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_id: jobId, files: fileNames }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `Sarvam download failed (${res.status})`,
    );
  }

  const urls = data.download_urls as Record<string, { file_url: string }>;
  const parts: string[] = [];
  for (const name of fileNames) {
    const url = urls?.[name]?.file_url;
    if (!url) continue;
    const fileRes = await fetch(url);
    const json = await fileRes.json().catch(() => ({}));
    if (typeof json.transcript === "string") parts.push(json.transcript);
  }
  return parts.join("\n").trim();
}
