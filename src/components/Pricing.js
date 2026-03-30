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
            Weekly service starts at just <span className="text-brand-red font-bold">$20–$25 per week</span>. 
            Most homes fall between $20–$35/week depending on yard size and number of dogs.
          </p>
          <p className="text-sm text-gray-400 mt-2">Billed monthly for convenience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          <div className="relative border-2 border-brand-green rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-brand-green text-white text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest">Most Popular</span>
            </div>
            <div className="p-6">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Weekly Service</h3>
              <p className="text-sm text-gray-500 mb-4">Same day every week</p>
              <PriceRow dogs={1} price="$23" />
              <PriceRow dogs={2} price="$25" />
              <PriceRow dogs={3} price="$28" />
              <PriceRow dogs={4} price="$30" />
              <p className="text-xs text-gray-400 mt-3 text-center">per week, billed monthly</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">Save Time</span>
            </div>
            <div className="p-6">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">Bi-Weekly</h3>
              <p className="text-sm text-gray-500 mb-4">Every other week</p>
              <PriceRow dogs={1} price="$70" unit="/mo" />
              <PriceRow dogs={2} price="$75" unit="/mo" />
              <PriceRow dogs={3} price="$85" unit="/mo" />
              <PriceRow dogs={4} price="$90" unit="/mo" />
              <p className="text-xs text-gray-400 mt-3 text-center">per month</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gray-50 text-center py-3">
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">Quick Clean</span>
            </div>
            <div className="p-6">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">One-Time</h3>
              <p className="text-sm text-gray-500 mb-4">Single visit cleanup</p>
              <PriceRow dogs={1} price="$45" unit="" />
              <PriceRow dogs={2} price="$50" unit="" />
              <PriceRow dogs={3} price="$55" unit="" />
              <PriceRow dogs={4} price="$60" unit="" />
              <p className="text-xs text-gray-400 mt-3 text-center">one-time fee</p>
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

function PriceRow({ dogs, price, unit = '/wk' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">
        {dogs} Dog{dogs > 1 ? 's' : ''}
      </span>
      <span className="font-heading font-bold text-brand-red text-lg">
        {price}<span className="text-sm text-gray-400 font-body font-normal">{unit}</span>
      </span>
    </div>
  );
}