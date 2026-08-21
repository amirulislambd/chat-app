import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <section className="w-full max-w-md text-center">
        <p className="text-7xl font-black tracking-tight text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">The page you are looking for does not exist or may have moved.</p>
        <Link href="/" className="mt-7 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Back to ChatApp</Link>
      </section>
    </main>
  );
}
