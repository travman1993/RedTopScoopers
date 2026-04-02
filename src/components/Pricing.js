'use client';

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <p className="font-heading text-sm uppercase tracking-widest text-brand-green mb-3">Transparent Pricing</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Simple, Flat-Rate Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            One flat rate — no matter how many dogs you have.
            Most homes pay <span className="text-brand-red font-bold">$20/week</span> or less.
          </p>
          <p className="text-sm text-gray-400 mt-2">Billed monthly for convenience. No contracts. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          {/* Weekly - Featured */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 2px #1b5e20, 0 20px 60px rgba(27,94,32,0.2)' }}
          >
            <div className="bg-brand-green text-white text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest">Most Popular</span>
            </div>
            <div className="p-6 text-center bg-white">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Weekly Service</h3>
              <p className="text-sm text-gray-500 mb-4">Same day, every week</p>
              <p className="font-heading text-5xl font-bold text-brand-red leading-none">$20</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">— billed as $80/mo on the 1st</p>
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-left">
                <PricingCheck text="Any number of dogs" />
                <PricingCheck text="Same day every week" />
                <PricingCheck text="No contracts, ever" />
              </div>
            </div>
          </div>

          {/* Bi-Weekly */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">Every Other Week</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Bi-Weekly</h3>
              <p className="text-sm text-gray-500 mb-4">Every other week</p>
              <p className="font-heading text-5xl font-bold text-brand-red leading-none">$37.50</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">— billed as $75/month</p>
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-left">
                <PricingCheck text="Any number of dogs" />
                <PricingCheck text="Flexible scheduling" />
                <PricingCheck text="No contracts, ever" />
              </div>
            </div>
          </div>

          {/* One-Time */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">One-Time</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Quick Clean</h3>
              <p className="text-sm text-gray-500 mb-4">Single visit, done right</p>
              <p className="font-heading text-5xl font-bold text-brand-red leading-none">$40</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">one-time fee</p>
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-left">
                <PricingCheck text="Any number of dogs" />
                <PricingCheck text="Great for move-in / out" />
                <PricingCheck text="Guests &amp; special events" />
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee bar */}
        <div className="max-w-4xl mx-auto bg-brand-green-pale border border-brand-green/20 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-brand-green text-lg">No Contracts. No Risk.</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Yard size and deodorizing add-ons may apply. Get your exact price in seconds below.
            </p>
          </div>
          <a href="#quote" className="font-heading font-bold text-sm text-brand-green uppercase tracking-wider hover:underline whitespace-nowrap flex-shrink-0">
            Get Exact Price →
          </a>
        </div>
      </div>
    </section>
  );
}

function PricingCheck({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {text}
    </div>
  );
}
