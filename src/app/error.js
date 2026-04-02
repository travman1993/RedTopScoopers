'use client';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-bold text-brand-red mb-4">500</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-2">An unexpected error occurred.</p>
        {error?.message && (
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-100 rounded px-3 py-2">{error.message}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-brand-green text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/"
            className="bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
