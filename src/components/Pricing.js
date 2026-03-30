'use client';

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            One flat rate — no matter how many dogs you have.
            Most homes pay <span className="text-brand-red font-bold">$24/week</span> or less.
          </p>
          <p className="text-sm text-gray-400 mt-2">Billed monthly for convenience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          {/* Weekly - Featured */}
          <div className="relative border-2 border-brand-green rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-brand-green text-white text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest">Most Popular</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Weekly Service</h3>
              <p className="text-sm text-gray-500 mb-4">Same day every week</p>
              <p className="font-heading text-4xl font-bold text-brand-red mb-1">$24<span className="text-lg text-gray-400">/wk</span></p>
              <p className="text-sm text-gray-500">$95/month</p>
              <p className="text-xs text-gray-400 mt-3">Flat rate — any number of dogs</p>
            </div>
          </div>

          {/* Bi-Weekly */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">Every Other Week</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Bi-Weekly</h3>
              <p className="text-sm text-gray-500 mb-4">Every other week</p>
              <p className="font-heading text-4xl font-bold text-brand-red mb-1">$71<span className="text-lg text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-500">&nbsp;</p>
              <p className="text-xs text-gray-400 mt-3">Flat rate — any number of dogs</p>
            </div>
          </div>

          {/* One-Time */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">Quick Clean</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">One-Time</h3>
              <p className="text-sm text-gray-500 mb-4">Single visit cleanup</p>
              <p className="font-heading text-4xl font-bold text-brand-red mb-1">$52</p>
              <p className="text-sm text-gray-500">One-time fee</p>
              <p className="text-xs text-gray-400 mt-3">Flat rate — any number of dogs</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Yard size and deodorizing add-ons may apply.
            <a href="#quote" className="text-brand-green font-semibold hover:underline ml-1">
              Get your exact price →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}