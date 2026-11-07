"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UILang } from "@/lib/types";

type Phase = "splash" | "rise" | "lang" | "ready";

export default function HomeSplash() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [lang, setLang] = useState<UILang | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const immediate = window.setTimeout(() => setPhase("lang"), 0);
      return () => window.clearTimeout(immediate);
    }

    const rise = window.setTimeout(() => setPhase("rise"), 900);
    const langPhase = window.setTimeout(() => setPhase("lang"), 1750);
    return () => {
      window.clearTimeout(rise);
      window.clearTimeout(langPhase);
    };
  }, []);

  function pickLang(next: UILang) {
    setLang(next);
    setPhase("ready");
  }

  const showLang = phase === "lang" || phase === "ready";
  const showActions = phase === "ready" && Boolean(lang);

  return (
    <main className={`home-stage home-stage--${phase}`}>
      <div className="home-stage__fireflies" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="home-stage__brand">
        <h1 className="font-display home-stage__title">മുത്തശ്ശി കഥ</h1>
      </div>

      <div className="home-stage__below">
        <div
          className={`home-stage__lang ${showLang ? "is-in" : ""}`}
          aria-hidden={!showLang}
        >
          <p className="home-stage__lang-label">Language / ഭാഷ</p>
          <div className="home-stage__lang-row">
            <button
              type="button"
              onClick={() => pickLang("ml")}
              tabIndex={showLang ? 0 : -1}
              className={`home-lang-btn ${lang === "ml" ? "home-lang-btn--on" : ""}`}
            >
              മലയാളം
            </button>
            <button
              type="button"
              onClick={() => pickLang("en")}
              tabIndex={showLang ? 0 : -1}
              className={`home-lang-btn ${lang === "en" ? "home-lang-btn--on" : ""}`}
            >
              English
            </button>
          </div>
        </div>

        <div
          className={`home-stage__actions ${showActions ? "is-in" : ""}`}
          aria-hidden={!showActions}
        >
          <Link
            href={`/create?mode=record&lang=${lang ?? "ml"}`}
            tabIndex={showActions ? 0 : -1}
            className="home-mic"
          >
            {lang === "en" ? "Tell a story" : "കഥ പറയൂ"}
          </Link>
          <Link
            href={`/create?mode=type&lang=${lang ?? "ml"}`}
            tabIndex={showActions ? 0 : -1}
            className="home-link"
          >
            {lang === "en" ? "Type instead" : "ടൈപ്പ് ചെയ്യുക"}
          </Link>
          <Link
            href="/library"
            tabIndex={showActions ? 0 : -1}
            className="home-link home-link--muted"
          >
            {lang === "en" ? "Children's library" : "കുട്ടികളുടെ ലൈബ്രറി"}
          </Link>
        </div>
      </div>
    </main>
  );
}
