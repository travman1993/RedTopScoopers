import Link from 'next/link';

export const metadata = {
  title: 'Billing Set Up — Red Top Scoopers',
  robots: { index: false, follow: false },
};

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full overflow-hidden">
        <div className="bg-brand-green text-white text-center py-8 px-6">
          <p className="text-5xl mb-3">🐾</p>
          <h1 className="font-heading text-3xl font-bold mb-1">You&apos;re all set!</h1>
          <p className="text-green-100 text-lg">Billing confirmed — Red Top Scoopers</p>
        </div>
        <div className="p-6 space-y-4 text-center">
          <p className="text-gray-700">
            Your payment info has been securely saved. We&apos;ll reach out shortly to confirm your service schedule.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p>Questions? We&apos;re easy to reach:</p>
            <p>
              <a href="tel:4046494654" className="font-bold text-brand-green hover:underline">
                404-649-4654
              </a>
              {' · '}
              <a href="mailto:redtopscoopers@gmail.com" className="font-bold text-brand-green hover:underline">
                redtopscoopers@gmail.com
              </a>
            </p>
          </div>
          <Link
            href="/"
            className="inline-block font-heading font-bold text-sm uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors mt-2"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
