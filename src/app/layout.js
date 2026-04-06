import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Pet Waste Removal Cartersville GA | Red Top Scoopers',
  description:
    'Professional pet waste removal in Cartersville, Acworth, Rome, Calhoun & Bartow County. Weekly service starting at $20/week. We handle the dirty work.',
  keywords:
    'pet waste removal, dog poop cleanup, yard cleaning service, Cartersville GA, Bartow County, pooper scooper service',
  openGraph: {
    title: 'Red Top Scoopers — Pet Waste Removal',
    description:
      'Pet waste removal in Cartersville, Acworth, Rome, Calhoun & Bartow County. Weekly service starting at $20/week.',
    url: 'https://redtopscoopers.com',
    siteName: 'Red Top Scoopers',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Red Top Scoopers - We Handle the Dirty Work',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Red Top Scoopers — Pet Waste Removal',
    description:
      'Pet waste removal in Cartersville & Northwest Georgia. Starting at $20/week.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'apple-domain-verification': 'D0N1gRpO0rlq4to8gDEqlUDXVj0ztJolbM_MghcdLp8',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1b5e20" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Red Top Scoopers" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WDX10BYQMS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WDX10BYQMS');
          `}
        </Script>
      </body>
    </html>
  );
}