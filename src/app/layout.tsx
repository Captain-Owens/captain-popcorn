import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Captain Popcorn',
  description: 'What should we watch tonight?',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
  metadataBase: new URL('https://captainpopcorn.com'),
  openGraph: {
    title: 'Captain Popcorn',
    description: 'What should we watch tonight?',
    url: 'https://captainpopcorn.com',
    siteName: 'Captain Popcorn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Captain Popcorn',
    description: 'What should we watch tonight?',
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
