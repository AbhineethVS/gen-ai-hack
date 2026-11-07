import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="home-glow" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="home-fade text-sm font-medium tracking-[0.2em] text-[var(--teal)] uppercase">
          Muthashi Kadha
        </p>
        <h1 className="home-fade home-fade--delay font-display mt-4 text-5xl leading-[1.1] font-semibold tracking-tight text-[var(--ink)] sm:text-7xl">
          മുത്തശ്ശി കഥ
        </h1>
        <p className="home-fade home-fade--delay-2 mx-auto mt-5 max-w-md text-lg leading-relaxed text-[var(--ink-soft)] sm:text-xl">
          നിങ്ങളുടെ കഥ — കുട്ടികളുടെ പുസ്തകം.
        </p>

        <div className="home-fade home-fade--delay-3 mt-12 flex w-full flex-col items-center gap-5">
          <Link
            href="/create?mode=record"
            className="mic-btn flex min-h-36 min-w-36 flex-col items-center justify-center rounded-full bg-[var(--teal)] text-xl font-semibold text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.02] sm:min-h-44 sm:min-w-44 sm:text-2xl"
          >
            കഥ പറയൂ
          </Link>
          <Link
            href="/create?mode=type"
            className="min-h-12 text-lg text-[var(--teal)] underline underline-offset-4"
          >
            ടൈപ്പ് ചെയ്യുക
          </Link>
        </div>

        <Link
          href="/library"
          className="home-fade home-fade--delay-3 mt-16 text-sm text-[var(--ink-soft)] underline-offset-4 hover:underline"
        >
          കുട്ടികളുടെ ലൈബ്രറി
        </Link>
      </div>
    </main>
  );
}
