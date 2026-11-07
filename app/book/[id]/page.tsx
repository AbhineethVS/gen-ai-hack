import { Suspense } from "react";
import Link from "next/link";
import BookReader from "@/components/BookReader";

type Props = {
  params: Promise<{ id: string }>;
};

async function BookBody({ params }: Props) {
  const { id } = await params;
  return <BookReader bookId={id} />;
}

export default function BookPage({ params }: Props) {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-5 pt-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-[var(--teal)]"
        >
          മുത്തശ്ശി കഥ
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl px-5 py-16 text-[var(--ink-soft)]">
            …
          </div>
        }
      >
        <BookBody params={params} />
      </Suspense>
    </main>
  );
}
