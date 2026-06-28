import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sorelia App',
  description: 'Your personal AI memory assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-white text-gray-900 antialiased"
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
