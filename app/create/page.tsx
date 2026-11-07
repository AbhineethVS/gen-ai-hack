import { Suspense } from "react";
import CreateFlow from "@/components/CreateFlow";

export default function CreatePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8 text-[var(--ink-soft)]">
            …
          </div>
        }
      >
        <CreateFlow />
      </Suspense>
    </main>
  );
}
