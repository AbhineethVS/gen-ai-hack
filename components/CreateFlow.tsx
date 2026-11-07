"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import SpeechBubble from "@/components/SpeechBubble";
import { formatTimer } from "@/lib/format";
import { sampleStoryForLang } from "@/lib/sample-story";
import type { DialogueLine, StoryPanel, UILang } from "@/lib/types";

type Step = "record" | "type" | "review" | "generating" | "preview";

type LivePanel = StoryPanel & {
  image_url?: string;
  error?: string;
};

function characterDescriptionFrom(sheet: unknown): string {
  if (!sheet) return "";
  if (typeof sheet === "string") return sheet;
  if (typeof sheet === "object") {
    const o = sheet as Record<string, unknown>;
    return String(o.description || o.visual || "");
  }
  return "";
}

export default function CreateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "type" ? "type" : "record";

  const [lang, setLang] = useState<UILang>("ml");
  const [step, setStep] = useState<Step>(initialMode);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);
  const [panels, setPanels] = useState<LivePanel[]>([]);
  const [page, setPage] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pollStartedAtRef = useRef(0);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (initialMode === "record" && !autoStartedRef.current && step === "record") {
      autoStartedRef.current = true;
      // Soft start: wait a tick so the page paints first
      const t = window.setTimeout(() => {
        void startRecording();
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, [initialMode, step]);

  function showTypedFallback(reason: string) {
    setStep("type");
    setTranscript((prev) => prev || sampleStoryForLang(lang));
    setError(reason);
    setStatus("");
    setBusy(false);
  }

  async function pollJob(jobId: string) {
    pollStartedAtRef.current = Date.now();
    setStatus(lang === "en" ? "Listening carefully…" : "ശ്രദ്ധിച്ച് കേൾക്കുന്നു…");

    while (true) {
      if (Date.now() - pollStartedAtRef.current > 60_000) {
        showTypedFallback(
          lang === "en"
            ? "That took too long. You can type the story instead."
            : "കൂടുതൽ സമയമെടുത്തു. ടൈപ്പ് ചെയ്ത് നോക്കൂ.",
        );
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
        setStep("review");
        setStatus("");
        return;
      }
      if (data.status === "failed") {
        showTypedFallback(data.error || "Transcription failed");
        return;
      }
      setStatus(
        lang === "en"
          ? "Still writing down your story…"
          : "കഥ എഴുതി വയ്ക്കുന്നു…",
      );
    }
  }

  async function uploadAudio(blob: Blob, durationSeconds: number) {
    setBusy(true);
    setError("");
    setStatus(lang === "en" ? "Listening carefully…" : "ശ്രദ്ധിച്ച് കേൾക്കുന്നു…");
    try {
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
        setStep("review");
        setStatus("");
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
      setStep("record");

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
      showTypedFallback(
        lang === "en"
          ? "Microphone unavailable. Type your story instead."
          : "മൈക്ക് ലഭ്യമല്ല. ടൈപ്പ് ചെയ്ത് നോക്കൂ.",
      );
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setRecording(false);
    recorder.stop();
  }

  async function makeBook() {
    const text = transcript.trim();
    if (!text) {
      setError(lang === "en" ? "Type a story first" : "ആദ്യം ഒരു കഥ എഴുതൂ");
      return;
    }

    setBusy(true);
    setError("");
    setPanels([]);
    setPage(0);
    setBookId(null);
    setStep("generating");
    setStatus(
      lang === "en" ? "Understanding your story…" : "കഥ മനസ്സിലാക്കുന്നു…",
    );

    try {
      const storyRes = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const storyData = await storyRes.json();
      if (!storyRes.ok || storyData.error) {
        setError(storyData.error || "Could not build story");
        setStep("review");
        return;
      }

      const story = storyData.story;
      if (!story?.panels?.length) {
        setError("Could not build story");
        setStep("review");
        return;
      }

      const characterDescription = characterDescriptionFrom(story.character_sheet);
      const storyPanels: LivePanel[] = story.panels.slice(0, 4).map(
        (p: StoryPanel, i: number) => ({
          idx: Number(p.idx ?? i + 1) || i + 1,
          scene_description: p.scene_description,
          caption_ml: p.caption_ml,
          caption_en: p.caption_en,
          dialogue: Array.isArray(p.dialogue) ? p.dialogue : [],
        }),
      );

      setTitle(story.title_ml || story.title_en || "");
      setPanels(storyPanels);

      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_ml: story.title_ml,
          title_en: story.title_en,
          original_text: text,
          character_sheet: story.character_sheet,
          panels: storyPanels,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.id) {
        setError(bookData.error || "Could not save book");
        setStep("review");
        return;
      }
      setBookId(bookData.id);

      await Promise.all(
        storyPanels.map(async (panel) => {
          setStatus(
            lang === "en"
              ? `Drawing page ${panel.idx}/4…`
              : `പേജ് ${panel.idx}/4 വരയ്ക്കുന്നു…`,
          );
          try {
            const res = await fetch("/api/panel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                book_id: bookData.id,
                idx: panel.idx,
                character_description: characterDescription,
                scene_description: panel.scene_description,
                use_style_refs: true,
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

      setStatus("");
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setStep("review");
    } finally {
      setBusy(false);
    }
  }

  const current = panels[page];
  const caption =
    lang === "en"
      ? current?.caption_en || current?.caption_ml
      : current?.caption_ml || current?.caption_en;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 sm:py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--teal)] sm:text-3xl"
          >
            മുത്തശ്ശി കഥ
          </Link>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Muthashi Kadha</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLang("ml")}
            className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
              lang === "ml"
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)]"
            }`}
          >
            മലയാളം
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`min-h-11 rounded-xl px-3 text-sm font-medium ${
              lang === "en"
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)]"
            }`}
          >
            English
          </button>
        </div>
      </header>

      {(step === "record" || (step === "type" && !transcript && busy)) && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <MicButton
            recording={recording}
            disabled={busy && !recording}
            label={lang === "en" ? "Tell a story" : "കഥ പറയൂ"}
            stopLabel={lang === "en" ? "Done" : "കഴിഞ്ഞു"}
            onClick={() => (recording ? stopRecording() : startRecording())}
          />
          <p className="font-display text-4xl tabular-nums text-[var(--ink)]">
            {formatTimer(elapsed)}
          </p>
          {status ? (
            <p className="text-base text-[var(--ink-soft)]">{status}</p>
          ) : (
            <p className="max-w-sm text-base text-[var(--ink-soft)]">
              {lang === "en"
                ? "Tap Done when your story is finished. Up to 2 minutes."
                : "കഥ കഴിഞ്ഞാൽ «കഴിഞ്ഞു» അമർത്തൂ. രണ്ട് മിനിറ്റ് വരെ."}
            </p>
          )}
          <button
            type="button"
            className="min-h-11 text-base text-[var(--teal)] underline underline-offset-4"
            onClick={() => {
              if (recording) stopRecording();
              setStep("type");
              setTranscript(sampleStoryForLang(lang));
            }}
          >
            {lang === "en" ? "Type instead" : "ടൈപ്പ് ചെയ്യുക"}
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </section>
      )}

      {(step === "type" || step === "review") && !(busy && step === "type" && !transcript) && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
              {lang === "en" ? "Your story" : "നിങ്ങളുടെ കഥ"}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)]">
              {lang === "en"
                ? "Fix any words, then make your book."
                : "വാക്കുകൾ ശരിയാക്കി പുസ്തകമാക്കൂ."}
            </p>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={9}
            className="w-full flex-1 rounded-2xl border border-[var(--line)] bg-white/80 p-5 text-xl leading-relaxed text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none focus:border-[var(--teal)]"
          />

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="min-h-11 text-base text-[var(--teal)] underline underline-offset-4"
              onClick={() => setTranscript(sampleStoryForLang(lang))}
            >
              {lang === "en" ? "Try a sample story" : "മാതൃക കഥ"}
            </button>
            <button
              type="button"
              className="min-h-11 text-base text-[var(--ink-soft)] underline underline-offset-4"
              onClick={() => {
                setTranscript("");
                setStep("record");
                void startRecording();
              }}
            >
              {lang === "en" ? "Use mic" : "മൈക്ക് ഉപയോഗിക്കുക"}
            </button>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void makeBook()}
            className="mt-2 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--teal)] px-8 text-xl font-semibold text-white disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {lang === "en" ? "Make my book" : "എന്റെ പുസ്തകം ഉണ്ടാക്കൂ"}
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </section>
      )}

      {step === "generating" && (
        <section className="flex flex-1 flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              {title || (lang === "en" ? "Making your book" : "പുസ്തകം ഉണ്ടാക്കുന്നു")}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)]">
              {status ||
                (lang === "en" ? "Drawing your pages…" : "പേജുകൾ വരയ്ക്കുന്നു…")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((idx) => {
              const panel = panels.find((p) => p.idx === idx);
              return (
                <figure
                  key={idx}
                  className={`panel-reveal overflow-hidden rounded-2xl bg-white/80 shadow-[var(--shadow-soft)] ${
                    panel?.image_url ? "panel-reveal--in" : ""
                  }`}
                >
                  {panel?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={panel.image_url}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-[var(--wash)] text-[var(--ink-soft)]">
                      {panel?.error || `… ${idx}`}
                    </div>
                  )}
                </figure>
              );
            })}
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </section>
      )}

      {step === "preview" && current && (
        <section className="flex flex-1 flex-col gap-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-0 bg-transparent font-display text-3xl font-semibold text-[var(--ink)] outline-none sm:text-4xl"
            aria-label={lang === "en" ? "Book title" : "പുസ്തകത്തിന്റെ പേര്"}
          />

          <div className="relative overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-soft)]">
            <div className="relative aspect-square w-full bg-[var(--wash)]">
              {current.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--ink-soft)]">
                  {current.error || "…"}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col gap-2 sm:inset-x-5 sm:top-5">
                {(current.dialogue as DialogueLine[] | undefined)?.map((line, i) => (
                  <SpeechBubble
                    key={`${line.speaker}-${i}`}
                    speaker={line.speaker}
                    text={line.text_ml}
                    side={i % 2 === 0 ? "left" : "right"}
                  />
                ))}
              </div>
            </div>
            <p className="border-t border-[var(--line)] p-5 text-lg leading-relaxed text-[var(--ink)] sm:text-xl">
              {caption}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="min-h-14 min-w-28 rounded-2xl bg-white px-5 text-lg font-medium text-[var(--ink)] ring-1 ring-[var(--line)] disabled:opacity-40"
            >
              {lang === "en" ? "Back" : "പിന്നോട്ട്"}
            </button>
            <p className="text-base text-[var(--ink-soft)]">
              {page + 1} / {panels.length}
            </p>
            <button
              type="button"
              disabled={page >= panels.length - 1}
              onClick={() => setPage((p) => Math.min(panels.length - 1, p + 1))}
              className="min-h-14 min-w-28 rounded-2xl bg-[var(--teal)] px-5 text-lg font-medium text-white disabled:opacity-40"
            >
              {lang === "en" ? "Next" : "അടുത്തത്"}
            </button>
          </div>

          <p className="text-center text-sm text-[var(--ink-soft)]">
            {lang === "en"
              ? "Edit & share come next. Your book is saved."
              : "തിരുത്തലും പങ്കിടലും അടുത്തതാണ്. പുസ്തകം സേവ് ചെയ്തു."}
            {bookId ? (
              <>
                {" "}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => router.push(`/book/${bookId}`)}
                >
                  {lang === "en" ? "Open book link" : "പുസ്തക ലിങ്ക്"}
                </button>
              </>
            ) : null}
          </p>
        </section>
      )}
    </div>
  );
}
