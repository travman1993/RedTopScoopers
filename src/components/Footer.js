'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-narrow section-padding py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <Image src="/logo.png" alt="Red Top Scoopers" width={100} height={100} className="w-20 h-20 mb-3" />
            <p className="font-heading text-xl font-bold text-brand-red tracking-wide">Red Top Scoopers</p>
            <p className="text-gray-400 text-sm mt-1">We Handle the Dirty Work</p>
          </div>

          <div>
            <h4 className="font-heading text-sm uppercase tracking-widest text-gray-400 mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <a href="tel:4046494654" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                404-649-4654
              </a>
              <a href="mailto:redtopscoopers@gmail.com" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                redtopscoopers@gmail.com
              </a>
              <a href="https://redtopscoopers.com" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                RedTopScoopers.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm uppercase tracking-widest text-gray-400 mb-4">Service Areas</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Cartersville &bull; Euharlee &bull; Emerson &bull; Kingston &bull; Adairsville &bull; White &bull; Taylorsville &bull; Acworth &bull; Calhoun &bull; Rome
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Red Top Scoopers LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sanitized Equipment</span>
            <span className="text-gray-700">&bull;</span>
            <span className="text-xs text-gray-500">Gate Secured</span>
            <span className="text-gray-700">&bull;</span>
            <span className="text-xs text-gray-500">Pet-Safe Deodorizing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}