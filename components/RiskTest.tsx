"use client";

import { useEffect, useRef, useState } from "react";
import {
  sampleStoryForLang,
  type UILang,
} from "@/lib/sample-story";

type PanelResult = {
  idx: number;
  image_url?: string;
  error?: string;
  caption_ml?: string;
  caption_en?: string;
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RiskTest() {
  const [lang, setLang] = useState<UILang>("ml");
  const [mode, setMode] = useState<"record" | "type">("type");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState(() => sampleStoryForLang("ml"));
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

  function switchLang(next: UILang) {
    setLang(next);
    setTranscript(sampleStoryForLang(next));
    setPanels([]);
    setError("");
    setStatus("");
  }

  function showTypedFallback(reason: string) {
    setMode("type");
    setTranscript(sampleStoryForLang(lang));
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
      // Force clean mime — Sarvam rejects audio/webm;codecs=opus
      const clean = new Blob([blob], { type: "audio/webm" });
      const form = new FormData();
      form.append("file", clean, "recording.webm");
      form.append(
        "duration_seconds",
        String(Math.max(1, Math.round(durationSeconds))),
      );
      form.append("language", lang);

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
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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

  async function makeBookFromText() {
    const text = transcript.trim();
    if (!text) {
      setError(lang === "en" ? "Type a story first" : "ആദ്യം ഒരു കഥ എഴുതൂ");
      return;
    }

    setBusy(true);
    setError("");
    setPanels([]);
    setStatus(lang === "en" ? "Understanding your story…" : "കഥ മനസ്സിലാക്കുന്നു…");
    try {
      const storyRes = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const storyData = await storyRes.json();
      const story = storyData.story;
      if (!story?.panels?.length) {
        setError("Could not build story");
        return;
      }

      const characterDescription =
        story.character_sheet?.description ||
        story.character_sheet?.visual ||
        (typeof story.character_sheet === "string" ? story.character_sheet : "") ||
        "";

      const firstThree = story.panels.slice(0, 3).map(
        (
          p: {
            idx?: number;
            scene_description?: string;
            scene?: string;
            caption_ml?: string;
            caption_en?: string;
            caption?: string;
          },
          i: number,
        ) => ({
          idx: Number(p.idx ?? i + 1) || i + 1,
          scene_description:
            p.scene_description ||
            p.scene ||
            `Children's picture-book scene in Kerala for: ${p.caption_en || p.caption_ml || p.caption || "a warm moment"}. Empty space near the top. No text.`,
          caption_ml: p.caption_ml || p.caption || "",
          caption_en: p.caption_en || p.caption_ml || p.caption || "",
        }),
      );

      if (!characterDescription) {
        setError("Story missing character details — try again");
        return;
      }

      setPanels(
        firstThree.map((p: (typeof firstThree)[number]) => ({
          idx: p.idx,
          caption_ml: p.caption_ml,
          caption_en: p.caption_en,
        })),
      );
      setStatus(lang === "en" ? "Drawing panels…" : "ചിത്രങ്ങൾ വരയ്ക്കുന്നു…");

      await Promise.all(
        firstThree.map(async (panel: (typeof firstThree)[number]) => {
          try {
            const res = await fetch("/api/panel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                book_id: "risk",
                idx: panel.idx,
                character_description: characterDescription,
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
      setStatus(
        lang === "en"
          ? "Done — check character consistency"
          : "കഴിഞ്ഞു — കഥാപാത്രം ഒരുപോലെയാണോ നോക്കൂ",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
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

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => switchLang("ml")}
          className={`min-h-12 rounded-xl px-5 text-base font-medium ${
            lang === "ml"
              ? "bg-stone-900 text-white"
              : "bg-white text-stone-700 ring-1 ring-stone-300"
          }`}
        >
          മലയാളം
        </button>
        <button
          type="button"
          onClick={() => switchLang("en")}
          className={`min-h-12 rounded-xl px-5 text-base font-medium ${
            lang === "en"
              ? "bg-stone-900 text-white"
              : "bg-white text-stone-700 ring-1 ring-stone-300"
          }`}
        >
          English
        </button>
      </div>

      {mode === "record" ? (
        <section className="flex flex-col items-center gap-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => (recording ? stopRecording() : startRecording())}
            className="flex min-h-14 min-w-[16rem] items-center justify-center rounded-2xl bg-amber-700 px-8 text-xl font-medium text-white disabled:opacity-60"
          >
            {recording
              ? lang === "en"
                ? "Stop"
                : "നിർത്തൂ"
              : lang === "en"
                ? "Tell a story"
                : "കഥ പറയൂ"}
          </button>
          <p className="text-2xl tabular-nums text-stone-800">
            {formatTimer(elapsed)}
          </p>
          <button
            type="button"
            className="text-base text-stone-600 underline underline-offset-4"
            onClick={() => {
              setMode("type");
              setTranscript(sampleStoryForLang(lang));
            }}
          >
            {lang === "en" ? "Type instead" : "ടൈപ്പ് ചെയ്യുക"}
          </button>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-stone-300 bg-white p-4 text-lg leading-relaxed text-stone-900"
          />
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="text-base text-stone-600 underline underline-offset-4"
              onClick={() => setTranscript(sampleStoryForLang(lang))}
            >
              {lang === "en" ? "Try a sample story" : "മാതൃക കഥ"}
            </button>
            <button
              type="button"
              className="text-base text-stone-600 underline underline-offset-4"
              onClick={() => setMode("record")}
            >
              {lang === "en" ? "Use mic" : "മൈക്ക് ഉപയോഗിക്കുക"}
            </button>
          </div>
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
          onClick={makeBookFromText}
          className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-900 px-8 text-lg font-medium text-white disabled:opacity-60"
        >
          {lang === "en" ? "Make my book" : "എന്റെ പുസ്തകം ഉണ്ടാക്കൂ"}
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
                {lang === "en"
                  ? panel.caption_en || panel.caption_ml
                  : panel.caption_ml}
              </figcaption>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}
