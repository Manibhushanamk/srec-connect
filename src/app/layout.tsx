import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { GlobalNavigationLoader } from '@/components/layout/GlobalNavigationLoader';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: 'SREC Connect v3.0 | Santhiram Engineering College',
    template: '%s | SREC Connect',
  },
  description: 'SREC Connect - Empowering Multi-Disciplinary Excellence & Campus Milestones',
  keywords: ['SREC', 'Santhiram Engineering College', 'achievements', 'events', 'student portal'],
  authors: [{ name: 'SREC Connect Team' }],
  creator: 'SREC Connect',
  publisher: 'Santhiram Engineering College (Autonomous), Nandyal',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://department-connect-srec.vercel.app',
    siteName: 'SREC Connect',
    title: 'SREC Connect v3.0 | Santhiram Engineering College',
    description: 'Empowering Multi-Disciplinary Excellence & Campus Milestones',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SREC Connect',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SREC Connect v3.0',
    description: 'Empowering Multi-Disciplinary Excellence & Campus Milestones',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c1324',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Suspense fallback={null}>
            <GlobalNavigationLoader />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}