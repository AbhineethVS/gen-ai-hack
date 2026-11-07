const SARVAM_BASE = "https://api.sarvam.ai";

function apiKey() {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY is missing");
  return key;
}

export async function transcribeSync(file: Blob, filename: string) {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", "saaras:v3");
  form.append("mode", "transcribe");
  form.append("language_code", "ml-IN");

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

export async function startBatchJob(file: Blob, filename: string) {
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
        language_code: "ml-IN",
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
  const uploadName = filename || "audio.webm";

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

  const putRes = await fetch(fileUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "audio/webm",
      ...(signed.file_metadata || {}),
    },
    body: file,
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
