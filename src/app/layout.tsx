"use client";

import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { MultiAccountProvider } from '@/hooks/use-multi-account';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative h-dvh w-full md:h-screen overflow-hidden font-body">
      <AnimatePresence mode="wait">
        <motion.div 
          key={pathname} 
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <meta name="theme-color" content="#020617" />
        </head>
      <body
        className={cn('antialiased bg-background', ptSans.variable)}
      >
        <LanguageProvider>
          <MultiAccountProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </MultiAccountProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}