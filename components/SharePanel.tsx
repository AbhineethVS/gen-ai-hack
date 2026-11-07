"use client";

import Link from "next/link";
import { useState } from "react";
import BookCover from "@/components/BookCover";
import type { CoverDirection, UILang } from "@/lib/types";

type Props = {
  bookId: string;
  lang: UILang;
  onPublished?: (url: string) => void;
  coverUrl?: string | null;
  coverDirection?: CoverDirection | null;
  title?: string;
};

export default function SharePanel({
  bookId,
  lang,
  onPublished,
  coverUrl,
  coverDirection,
  title = "",
}: Props) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  async function publish() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.issues) ? ` ${data.issues.join(" ")}` : "";
        throw new Error(`${data.error || "Could not share."}${detail}`);
      }
      setUrl(data.url);
      onPublished?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share.");
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <section className="share-panel share-panel--success">
        <p className="share-panel__eyebrow">
          {lang === "en" ? "Published" : "പ്രസിദ്ധീകരിച്ചു"}
        </p>
        <h2 className="share-panel__title">
          {lang === "en"
            ? "Children can read your story now."
            : "കുട്ടികൾക്ക് ഇപ്പോൾ നിങ്ങളുടെ കഥ വായിക്കാം."}
        </h2>
        <div className="share-success">
          {coverUrl ? (
            <div className="share-success__cover">
              <BookCover
                title={title}
                imageUrl={coverUrl}
                direction={coverDirection}
                compact
              />
            </div>
          ) : null}
          <div className="share-success__qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr?url=${encodeURIComponent(url)}`}
              alt={lang === "en" ? "QR code to open this book" : "ഈ പുസ്തകത്തിലേക്കുള്ള QR കോഡ്"}
            />
          </div>
          <div>
            <p className="share-success__scan">
              {lang === "en"
                ? "Scan to read this book"
                : "പുസ്തകം വായിക്കാൻ സ്കാൻ ചെയ്യൂ"}
            </p>
            <div className="share-panel__actions">
              <a href={url} className="share-panel__primary">
                {lang === "en" ? "Open my book" : "എന്റെ പുസ്തകം തുറക്കൂ"}
              </a>
              <Link href="/library" className="share-panel__secondary">
                {lang === "en" ? "Visit library" : "ലൈബ്രറിയിലേക്ക്"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="share-panel">
      <h2 className="share-panel__title">
        {lang === "en" ? "Ready to share?" : "പങ്കിടാൻ തയ്യാറാണോ?"}
      </h2>
      <label className="share-panel__consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          {lang === "en"
            ? "I want children to read my story for free."
            : "കുട്ടികൾ എന്റെ കഥ സൗജന്യമായി വായിക്കണമെന്ന് ഞാൻ ആഗ്രഹിക്കുന്നു."}
        </span>
      </label>
      <button
        type="button"
        disabled={!consent || busy}
        onClick={() => void publish()}
        className="share-panel__primary"
      >
        {busy
          ? lang === "en"
            ? "Checking safety..."
            : "സുരക്ഷ പരിശോധിക്കുന്നു..."
          : lang === "en"
            ? "Share with children"
            : "കുട്ടികളുമായി പങ്കിടൂ"}
      </button>
      {error ? <p className="share-panel__error">{error}</p> : null}
    </section>
  );
}
