

"use client";

import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { TypingBattleRequestBanner } from '@/components/typing-battle-request-banner';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

// export const metadata: Metadata = {
//   title: 'Myanmar TikTok Lite',
//   description:
//     'A social mobile app for sharing short videos, inspired by TikTok.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <html lang="en" className="dark">
      <body
        className={cn('font-headline antialiased bg-background', ptSans.variable)}
      >
        <LanguageProvider>
          <div className="relative h-dvh w-full md:h-screen overflow-hidden">
              {currentUser && <TypingBattleRequestBanner userId={currentUser.id} />}
              {children}
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
