import Link from "next/link";
import LibraryGrid from "@/components/LibraryGrid";

export default function LibraryPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-[#0a0a0a]">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-[#f2f2f2]"
          >
            മുത്തശ്ശി കഥ
          </Link>
          <Link
            href="/create?mode=type"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#f2f2f2] px-5 text-base font-semibold text-[#0a0a0a]"
          >
            ഒരു കഥ പറയൂ
          </Link>
        </header>
        <div className="mt-12">
          <h1 className="font-display text-4xl font-semibold text-[#f2f2f2] sm:text-5xl">
            കുട്ടികളുടെ ലൈബ്രറി
          </h1>
          <p className="mt-3 max-w-xl text-lg text-[#9a9a9a]">
            Grandparents’ stories, illustrated by AI and shared freely with children.
          </p>
        </div>
        <div className="mt-10">
          <LibraryGrid />
        </div>
      </div>
    </main>
  );
}
