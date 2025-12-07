
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
import { CoupleRequestBanner } from '@/components/couple-request-banner';
import { OfflineProvider, OfflineContext } from '@/context/offline-context';
import OfflinePage from '@/app/offline/page';
import { PushNotifications, Token, PermissionState } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const isOffline = useContext(OfflineContext);
  const { toast } = useToast();

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

  // Push Notification Registration
  useEffect(() => {
    if (Capacitor.isNativePlatform() && currentUser) {
      
      const registerForPushNotifications = async () => {
        try {
          let permStatus: PermissionState = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== 'granted') {
            console.warn('User denied push notification permissions.');
            return; // Stop if permission is not granted
          }
          
          await PushNotifications.register();

        } catch (error) {
          console.error('Error during push notification registration process:', error);
        }
      };

      const addListeners = () => {
         PushNotifications.addListener('registration', async (token: Token) => {
          console.info('Push registration success, token: ', token.value);
          if (currentUser) {
            const { error } = await supabase.from('push_notification_tokens').upsert({
              user_id: currentUser.id,
              token: token.value,
              device_type: Capacitor.getPlatform(),
            }, { onConflict: 'user_id, token' });

            if (error) {
              console.error('Failed to save push token:', error);
            }
          }
        });

        PushNotifications.addListener('registrationError', (err: any) => {
          console.error('Push registration error: ', err.error);
        });
      };
      
      registerForPushNotifications();
      addListeners();
      
      return () => {
        PushNotifications.removeAllListeners();
      }
    }
  }, [currentUser, supabase]);


  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <div className="relative h-dvh w-full md:h-screen overflow-hidden">
        {currentUser && <TypingBattleRequestBanner userId={currentUser.id} />}
        {currentUser && <CoupleRequestBanner userId={currentUser.id} />}
        {children}
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

    