import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Captain Popcorn',
  description: 'What should we watch tonight?',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1A1A1A',
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
        <ToastProvider>
          <div className="max-w-[480px] mx-auto min-h-dvh relative page-enter">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
