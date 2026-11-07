"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Phase = "splash" | "rise" | "ready";

export default function HomeSplash() {
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("ready");
      return;
    }

    const rise = window.setTimeout(() => setPhase("rise"), 1100);
    const ready = window.setTimeout(() => setPhase("ready"), 1900);
    return () => {
      window.clearTimeout(rise);
      window.clearTimeout(ready);
    };
  }, []);

  return (
    <main className={`home-stage home-stage--${phase}`}>
      <div className="home-stage__brand">
        <h1 className="font-display home-stage__title">മുത്തശ്ശി കഥ</h1>
        <p className="home-stage__sub">Muthashi Kadha</p>
      </div>

      <div className="home-stage__actions" aria-hidden={phase !== "ready"}>
        <Link href="/create?mode=record" className="home-mic">
          കഥ പറയൂ
        </Link>
        <Link href="/create?mode=type" className="home-link">
          ടൈപ്പ് ചെയ്യുക
        </Link>
        <Link href="/library" className="home-link home-link--muted">
          കുട്ടികളുടെ ലൈബ്രറി
        </Link>
      </div>
    </main>
  );
}
