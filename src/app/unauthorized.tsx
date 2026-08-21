import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <section className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-xl dark:border-amber-900/40 dark:bg-gray-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600 dark:bg-amber-900/30 dark:text-amber-300" aria-hidden="true">
          &times;
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">Access restricted</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">You are not authorized</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">Your session does not have permission to view this page. Sign in again to continue.</p>
        <Link href="/login" className="mt-7 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Sign in</Link>
      </section>
    </main>
  );
}
