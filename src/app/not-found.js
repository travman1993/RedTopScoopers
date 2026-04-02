import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-3">🐾</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="flex gap-3 justify-center mb-6">
          <Link
            href="/"
            className="inline-block bg-brand-green text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
          <Link
            href="/#quote"
            className="inline-block bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Get a Quote
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          Need help?{' '}
          <a href="tel:4046494654" className="text-brand-green font-semibold hover:underline">
            404-649-4654
          </a>
        </p>
      </div>
    </div>
  );
}
