import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import QueryProvider from '@/providers/query-provider';

const SITE_URL = 'https://www.cafe-qr.com';
const OG_IMAGE = 'https://storage.googleapis.com/ard3/CafeQR/erasebg-transformed.png';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CafeQR — QR Ordering System for Cafes in Oman',
    template: '%s | CafeQR',
  },
  description:
    'Customers scan, order, and pay from the table or car. Live data, no waiting, no app downloads. Trusted by 50+ cafes in Oman. Start free in 5 minutes.',
  keywords: [
    'QR menu Oman',
    'cafe ordering system',
    'restaurant QR code',
    'kitchen display Oman',
    'drive-thru ordering',
    'menu QR Oman',
    'CafeQR',
  ],
  authors: [{ name: 'CafeQR' }],
  creator: 'CafeQR',
  publisher: 'CafeQR',
  alternates: {
    canonical: '/',
    languages: { 'en-US': '/?lang=en', 'ar-OM': '/?lang=ar' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_OM'],
    url: SITE_URL,
    siteName: 'CafeQR',
    title: 'CafeQR — Stop a 28 OMR/day leak with smart QR ordering',
    description:
      '50+ cafes in Oman boosted revenue 30% in 30 days. QR menus, kitchen display, drive-thru ordering. Free 5-minute setup.',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'CafeQR — modern QR ordering for cafes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CafeQR — QR ordering for cafes in Oman',
    description:
      'Customers scan, order, pay — you run the cafe. 50+ Omani cafes inside. Free trial in 5 min.',
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout applies to every page, so the rule's "single-page" premise doesn't hold; migrate to next/font/google when tailwind config moves to CSS variables. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Inter:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
