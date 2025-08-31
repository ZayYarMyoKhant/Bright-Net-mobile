
import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Myanmar TikTok Lite',
  description:
    'A social mobile app for sharing short videos, inspired by TikTok.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn('font-headline antialiased bg-background', ptSans.variable)}
      >
        <LanguageProvider>
          <div className="relative h-dvh w-full md:h-screen overflow-hidden">
              {children}
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
