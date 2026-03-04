import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = 'https://captainpopcorn.com';

export const metadata: Metadata = {
  title: 'Captain Popcorn',
  description: 'What should we watch tonight?',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Captain Popcorn',
    description: 'What should we watch tonight?',
    url: siteUrl,
    siteName: 'Captain Popcorn',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Captain Popcorn',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Captain Popcorn',
    description: 'What should we watch tonight?',
    images: ['/api/og'],
  },
};

export const viewport: Viewport = {
  themeColor: '#1C1410',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-[480px] mx-auto min-h-dvh relative">
          {children}
        </div>
      </body>
    </html>
  );
}
