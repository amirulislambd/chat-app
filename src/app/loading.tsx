export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading ChatApp...</p>
      </div>
    </main>
  );
}
