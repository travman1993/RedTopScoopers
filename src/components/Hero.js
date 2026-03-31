'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80')`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Green tint */}
      <div className="absolute inset-0 bg-brand-green/20" />

      <div className="relative flex-1 flex flex-col container-narrow section-padding pt-8 pb-12 md:pt-12 md:pb-20">
        <nav className="flex items-center justify-between mb-10 md:mb-16">
          <Image
            src="/logo.png"
            alt="Red Top Scoopers"
            width={180}
            height={180}
            className="w-20 h-20 md:w-28 md:h-28 rounded-2xl"
            priority
          />
          <div className="flex items-center gap-3">
            <a href="tel:4046494654" className="hidden md:flex items-center gap-2 text-white font-heading font-bold text-lg tracking-wide">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              404-649-4654
            </a>
            <a href="#quote" className="btn-primary !py-3 !px-5 !text-sm">
              Get Quote
            </a>
          </div>
        </nav>

        <div className="flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl mx-auto">
          {/* Text content */}
          <div className="text-center md:text-left flex-1">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[0.95] mb-4 animate-fade-in-up">
              Pet Waste Removal
              <br />
              <span className="text-brand-red drop-shadow-lg" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                Starting at Just $20/Week
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-100 opacity-0 font-body">
              We handle the dirty work so you don&apos;t have to.
            </p>

            <div className="flex flex-col items-center md:items-start gap-3 mb-8 animate-fade-in-up animation-delay-200 opacity-0">
              <TrustPoint text="Sanitized equipment between every visit" />
              <TrustPoint text="Gate secured after every service" />
              <TrustPoint text="Pet-safe deodorizing available" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 animate-fade-in-up animation-delay-300 opacity-0">
              <a href="#quote" className="btn-primary w-full sm:w-auto text-center">
                Get Instant Quote
              </a>
              <a href="sms:4046494654" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-brand-green w-full sm:w-auto text-center">
                Text 404-649-4654
              </a>
            </div>
          </div>

          {/* Mascot */}
          <div className="flex-shrink-0 animate-fade-in-up animation-delay-200 opacity-0">
            <Image
              src="/logo-mascot.png"
              alt="Red Top Scoopers Mascot"
              width={400}
              height={400}
              className="w-56 h-56 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="relative bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="px-5 py-3 overflow-x-auto">
          <div className="flex items-center justify-center gap-6 md:gap-10 whitespace-nowrap">
            {['No Contracts — Cancel Anytime', 'Gate Secured Every Visit', 'Sanitized Equipment', 'Serving Bartow County & Beyond'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/75 text-sm">
                <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustPoint({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm md:text-base text-white font-semibold">
      <svg className="w-5 h-5 flex-shrink-0 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {text}
    </div>
  );
}