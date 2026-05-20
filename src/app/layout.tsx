import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import QueryProvider from "@/providers/query-provider";

export const metadata: Metadata = {
  title: 'CafeQR - Modern Menu Ordering',
  description: 'Full-stack QR based ordering system for cafes.',
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
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
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
