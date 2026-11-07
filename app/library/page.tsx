import Link from "next/link";

/** Placeholder until share + seed demo books land. */
export default function LibraryPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-[#0a0a0a]">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        <Link
          href="/"
          className="font-display text-2xl font-semibold text-[#f2f2f2]"
        >
          മുത്തശ്ശി കഥ
        </Link>
        <h1 className="font-display mt-10 text-4xl font-semibold text-[#f2f2f2]">
          കുട്ടികളുടെ ലൈബ്രറി
        </h1>
        <p className="mt-3 max-w-md text-lg text-[#9a9a9a]">
          Stories will appear here after share &amp; publish. Coming next.
        </p>
        <Link
          href="/create?mode=type"
          className="mt-10 inline-flex min-h-14 items-center justify-center self-start rounded-2xl bg-[#f2f2f2] px-6 text-lg font-semibold text-[#0a0a0a]"
        >
          ഒരു കഥ പറയൂ
        </Link>
      </div>
    </main>
  );
}
