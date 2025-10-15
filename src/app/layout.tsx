
"use client";

import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { useEffect, useState, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { TypingBattleRequestBanner } from '@/components/typing-battle-request-banner';
import { VideoCallRequestBanner } from '@/components/video-call-request-banner';
import { CoupleRequestBanner } from '@/components/couple-request-banner';
import { XORequestBanner } from '@/components/xo-game-request-banner';
import { CheckerGameRequestBanner } from '@/components/checker-game-request-banner';
import { OfflineProvider, OfflineContext } from '@/context/offline-context';
import OfflinePage from '@/app/offline/page';
import Script from 'next/script';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const isOffline = useContext(OfflineContext);

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

  // Real-time user presence heartbeat
  useEffect(() => {
    let presenceInterval: NodeJS.Timeout | undefined;

    const updatePresence = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.rpc('update_user_presence');
        }
    };

    if (currentUser) {
        updatePresence(); // Initial update
        presenceInterval = setInterval(updatePresence, 30000); // Update every 30 seconds
    }

    return () => {
        if (presenceInterval) {
            clearInterval(presenceInterval);
        }
    };
}, [currentUser, supabase]);


  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <div className="relative h-dvh w-full md:h-screen overflow-hidden">
        {currentUser && <TypingBattleRequestBanner userId={currentUser.id} />}
        {currentUser && <VideoCallRequestBanner userId={currentUser.id} />}
        {currentUser && <CoupleRequestBanner userId={currentUser.id} />}
        {currentUser && <XORequestBanner userId={currentUser.id} />}
        {currentUser && <CheckerGameRequestBanner userId={currentUser.id} />}
        {children}
        <Script 
          id="social-bar-ad" 
          strategy="lazyOnload"
          src="//pl27728140.revenuecpmgate.com/e0/3d/7f/e03d7fc4f51d09c85868dcd3b21365bc.js"
        />
    </div>
  );
}


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
        <OfflineProvider>
          <LanguageProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </LanguageProvider>
        </OfflineProvider>
      </body>
    </html>
  );
}
