'use client';

const SERVICE_AREAS = [
  { name: 'Cartersville', lat: 34.1651, lng: -84.7999 },
  { name: 'Euharlee', lat: 34.1451, lng: -84.9330 },
  { name: 'Emerson', lat: 34.1262, lng: -84.7527 },
  { name: 'Kingston', lat: 34.2365, lng: -84.9444 },
  { name: 'Adairsville', lat: 34.3687, lng: -84.9341 },
  { name: 'White', lat: 34.2751, lng: -84.7302 },
  { name: 'Taylorsville', lat: 34.0815, lng: -84.9808 },
  { name: 'Acworth', lat: 34.0654, lng: -84.6768 },
  { name: 'Calhoun', lat: 34.5026, lng: -84.9510 },
  { name: 'Rome', lat: 34.2570, lng: -85.1647 },
];

export default function ServiceArea() {
  const centerLat = 34.22;
  const centerLng = -84.88;

  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d200000!2d${centerLng}!3d${centerLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus`;

  return (
    <section className="bg-brand-green/80">
      <div className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <p className="font-heading text-sm uppercase tracking-widest text-green-300 mb-3">Service Area</p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-3">
              Serving Northwest Georgia
            </h2>
            <p className="text-lg text-green-100">
              Proudly scooping yards across Bartow County and beyond.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <iframe
                src={mapSrc}
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Red Top Scoopers Service Area"
                className="w-full"
              />
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_AREAS.map((area) => (
                  <div
                    key={area.name}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white
                               font-semibold text-sm px-4 py-3 rounded-xl border border-white/20
                               hover:bg-white/25 transition-colors"
                  >
                    <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {area.name}
                  </div>
                ))}
              </div>

              <p className="text-sm text-green-00 mt-6">
                Don&apos;t see your area?{' '}
                <a href="#quote" className="text-white font-bold underline hover:no-underline">Contact us</a>
                {' '}— we may still be able to help.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
