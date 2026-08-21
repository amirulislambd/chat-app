'use client';

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <section className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl dark:border-red-900/40 dark:bg-gray-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-900/30 dark:text-red-300" aria-hidden="true">
          !
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">ChatApp needs a refresh</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">An unexpected error interrupted this page. Try again or return to the dashboard.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Try again</button>
          <Link href="/chat" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Go to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
