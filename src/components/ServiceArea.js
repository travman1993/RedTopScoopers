'use client';

const SERVICE_AREAS = [
  'Cartersville',
  'Euharlee',
  'Emerson',
  'Kingston',
  'Adairsville',
  'White',
  'Taylorsville',
  'Acworth',
  'Calhoun',
  'Rome',
];

export default function ServiceArea() {
  return (
    <section className="section-padding bg-white">
      <div className="container-narrow">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Serving Northwest Georgia
          </h2>
          <p className="text-lg text-gray-600">
            Proudly scooping yards across Bartow County and beyond.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {SERVICE_AREAS.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 bg-brand-green-pale text-brand-green 
                         font-semibold text-sm px-4 py-2 rounded-full border border-brand-green/10
                         hover:bg-brand-green hover:text-white transition-colors duration-200 cursor-default"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {area}
            </span>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t see your area? <a href="#quote" className="text-brand-green font-semibold hover:underline">Contact us</a> — we may still be able to help.
        </p>
      </div>
    </section>
  );
}