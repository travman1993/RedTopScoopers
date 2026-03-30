'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-green-pale via-white to-white">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231b5e20' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container-narrow section-padding pt-8 pb-12 md:pt-12 md:pb-20">
        <nav className="flex items-center justify-between mb-10 md:mb-16">
          <Image
            src="/logo.png"
            alt="Red Top Scoopers"
            width={180}
            height={180}
            className="w-20 h-20 md:w-28 md:h-28"
            priority
          />
          <div className="flex items-center gap-3">
            <a href="tel:4046494654" className="hidden md:flex items-center gap-2 text-brand-green font-heading font-bold text-lg tracking-wide">
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

        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[0.95] mb-4 animate-fade-in-up">
            Pet Waste Removal
            <br />
            <span className="text-brand-red">
              Starting at Just $20/Week
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-100 opacity-0 font-body">
            We handle the dirty work so you don&apos;t have to.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-10 animate-fade-in-up animation-delay-200 opacity-0">
            <TrustPoint text="Sanitized equipment between every visit" />
            <TrustPoint text="Gate secured after every service" />
            <TrustPoint text="Pet-safe deodorizing available" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300 opacity-0">
            <a href="#quote" className="btn-primary w-full sm:w-auto text-center">
              Get Instant Quote
            </a>
            <a href="sms:4046494654" className="btn-outline w-full sm:w-auto text-center">
              Text 404-649-4654
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60V20C240 0 480 40 720 30C960 20 1200 0 1440 20V60H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}

function TrustPoint({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm md:text-base text-brand-green font-semibold">
      <svg className="w-5 h-5 flex-shrink-0 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {text}
    </div>
  );
}