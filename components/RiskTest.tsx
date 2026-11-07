"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_MALAYALAM_STORY } from "@/lib/sample-story";

type PanelResult = {
  idx: number;
  image_url?: string;
  error?: string;
  caption_ml?: string;
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RiskTest() {
  const [mode, setMode] = useState<"record" | "type">("record");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [panels, setPanels] = useState<PanelResult[]>([]);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pollStartedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function showTypedFallback(reason: string) {
    setMode("type");
    setTranscript(SAMPLE_MALAYALAM_STORY);
    setError(reason);
    setStatus("Typed fallback ready");
  }

  async function pollJob(jobId: string) {
    pollStartedAtRef.current = Date.now();
    setStatus("Transcribing…");

    while (true) {
      if (Date.now() - pollStartedAtRef.current > 60_000) {
        showTypedFallback("Transcription took too long. Try the sample story.");
        return;
      }

      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(
        `/api/transcribe/status?job_id=${encodeURIComponent(jobId)}`,
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        showTypedFallback(data.error || "Transcription failed");
        return;
      }
      if (data.status === "ready" && data.text) {
        setTranscript(data.text);
        setStatus("Transcript ready");
        return;
      }
      if (data.status === "failed") {
        showTypedFallback(data.error || "Transcription failed");
        return;
      }
      setStatus(`Transcribing… (${data.job_state || "pending"})`);
    }
  }

  async function uploadAudio(blob: Blob, durationSeconds: number) {
    setBusy(true);
    setError("");
    setStatus("Uploading…");
    try {
      const form = new FormData();
      form.append("file", blob, "recording.webm");
      form.append("duration_seconds", String(Math.max(1, Math.round(durationSeconds))));

      const res = await fetch("/api/transcribe/start", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showTypedFallback(data.error || "Could not transcribe");
        return;
      }
      if (data.text) {
        setTranscript(data.text);
        setStatus(`Transcript ready (${data.path})`);
        return;
      }
      if (data.job_id) {
        await pollJob(data.job_id);
        return;
      }
      showTypedFallback("Unexpected transcription response");
    } catch (err) {
      showTypedFallback(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setError("");
    setTranscript("");
    setPanels([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      setStatus("Recording…");

      timerRef.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= 120) stopRecording();
      }, 250);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await uploadAudio(blob, durationSeconds);
      };
      recorder.start();
    } catch {
      showTypedFallback("Microphone unavailable. Use the sample story.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setRecording(false);
    recorder.stop();
  }

  async function runPanelRiskTest() {
    setBusy(true);
    setError("");
    setPanels([]);
    setStatus("Loading sample story…");
    try {
      const storyRes = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hardcoded: true }),
      });
      const storyData = await storyRes.json();
      const story = storyData.story;
      if (!story?.panels?.length) {
        setError("Could not load sample story");
        return;
      }

      const firstThree = story.panels.slice(0, 3) as Array<{
        idx: number;
        scene_description: string;
        caption_ml: string;
      }>;

      setPanels(firstThree.map((p) => ({ idx: p.idx, caption_ml: p.caption_ml })));
      setStatus("Drawing panels…");

      await Promise.all(
        firstThree.map(async (panel) => {
          try {
            const res = await fetch("/api/panel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                book_id: "risk",
                idx: panel.idx,
                character_description: story.character_sheet.description,
                scene_description: panel.scene_description,
              }),
            });
            const data = await res.json();
            setPanels((prev) =>
              prev.map((p) =>
                p.idx === panel.idx
                  ? {
                      ...p,
                      image_url: data.image_url,
                      error: res.ok ? undefined : data.error || "Failed",
                    }
                  : p,
              ),
            );
          } catch (err) {
            setPanels((prev) =>
              prev.map((p) =>
                p.idx === panel.idx
                  ? {
                      ...p,
                      error: err instanceof Error ? err.message : "Failed",
                    }
                  : p,
              ),
            );
          }
        }),
      );
      setStatus("Panel risk test finished — check character consistency");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Panel risk test failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          മുത്തശ്ശി കഥ
        </h1>
        <p className="mt-2 text-lg text-stone-600">Muthashi Kadha</p>
      </header>

      {mode === "record" ? (
        <section className="flex flex-col items-center gap-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => (recording ? stopRecording() : startRecording())}
            className="flex min-h-14 min-w-[16rem] items-center justify-center rounded-2xl bg-amber-700 px-8 text-xl font-medium text-white disabled:opacity-60"
          >
            {recording ? "നിർത്തൂ" : "കഥ പറയൂ"}
          </button>
          <p className="text-2xl tabular-nums text-stone-800">
            {formatTimer(elapsed)}
          </p>
          <button
            type="button"
            className="text-base text-stone-600 underline underline-offset-4"
            onClick={() => {
              setMode("type");
              setTranscript(SAMPLE_MALAYALAM_STORY);
            }}
          >
            Type instead
          </button>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-stone-300 bg-white p-4 text-lg leading-relaxed text-stone-900"
          />
          <button
            type="button"
            className="self-start text-base text-stone-600 underline underline-offset-4"
            onClick={() => setMode("record")}
          >
            Use mic
          </button>
        </section>
      )}

      {transcript && mode === "record" && (
        <p className="rounded-xl bg-white p-4 text-lg leading-relaxed text-stone-800 shadow-sm">
          {transcript}
        </p>
      )}

      <section className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={runPanelRiskTest}
          className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-900 px-8 text-lg font-medium text-white disabled:opacity-60"
        >
          Draw 3 test panels
        </button>
        {status && <p className="text-sm text-stone-600">{status}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>

      {panels.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {panels.map((panel) => (
            <figure key={panel.idx} className="overflow-hidden rounded-xl bg-white">
              {panel.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={panel.image_url}
                  alt={`Panel ${panel.idx}`}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-stone-200 text-stone-500">
                  {panel.error || "…"}
                </div>
              )}
              <figcaption className="p-3 text-sm leading-relaxed text-stone-700">
                {panel.caption_ml}
              </figcaption>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}
