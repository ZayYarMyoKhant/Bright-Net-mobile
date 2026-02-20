
"use client";

import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { useEffect, useState, useContext, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { TypingBattleRequestBanner } from '@/components/typing-battle-request-banner';
import { CoupleRequestBanner } from '@/components/couple-request-banner';
import { OfflineProvider, OfflineContext } from '@/context/offline-context';
import OfflinePage from '@/app/offline/page';
import { App } from '@capacitor/app';
import { PushNotifications, Token, PermissionState, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { MultiAccountProvider, MultiAccountContext } from '@/hooks/use-multi-account';
import { AnimatePresence, motion } from 'framer-motion';
import { AdsHandler } from '@/components/ads-handler';
import Script from 'next/script';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const multiAccount = useContext(MultiAccountContext);
  const currentUser = multiAccount?.currentAccount ?? null;
  const supabase = createClient();
  const isOffline = useContext(OfflineContext);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const backButtonPressCount = useRef(0);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registered: ', registration);
            }).catch(registrationError => {
                console.error('Service Worker registration failed: ', registrationError);
            });
        });
    }
  }, []);

  useEffect(() => {
    let presenceInterval: NodeJS.Timeout | undefined;
    const updatePresence = async () => {
        if (currentUser) {
            await supabase.rpc('update_user_presence');
        }
    };
    if (currentUser) {
        updatePresence();
        presenceInterval = setInterval(updatePresence, 30000);
    }
    return () => {
        if (presenceInterval) {
            clearInterval(presenceInterval);
        }
    };
}, [currentUser, supabase]);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && currentUser) {
      const checkAndRequestPushPermissions = async () => {
        let permStatus: PermissionState = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          setShowNotificationDialog(true);
        } else if (permStatus.receive === 'granted') {
          await registerPushToken();
        }
      };
      
      const addListeners = () => {
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            toast({
                title: notification.title || "New Notification",
                description: notification.body || "",
            });
        });
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            const url = notification.notification.data?.url;
            if (url) {
                router.push(url);
            }
        });
      }
      checkAndRequestPushPermissions();
      addListeners();
    }
  }, [currentUser, router, toast]);

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const listener = App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    backButtonPressCount.current += 1;
                    if (backButtonPressCount.current === 1) {
                        toast({ description: "Press back again to exit", duration: 2000 });
                        setTimeout(() => {
                            backButtonPressCount.current = 0;
                        }, 2000);
                    } else if (backButtonPressCount.current >= 2) {
                        App.exitApp();
                    }
                } else {
                    window.history.back();
                }
            });
            return () => {
                listener.remove();
            }
        }
    }, [toast]);

  const registerPushToken = async () => {
    if (!currentUser) return;
    try {
      await PushNotifications.register();
      PushNotifications.addListener('registration', async (token: Token) => {
        const { error } = await supabase.from('push_notification_tokens').upsert({
            user_id: currentUser.id,
            token: token.value,
            device_type: Capacitor.getPlatform(),
        }, { onConflict: 'user_id, token' });
      });
    } catch (e) {
      console.error('Error in registration process', e);
    }
  };
  
  const handleNotificationPermissionRequest = async () => {
    try {
        const permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive === 'granted') {
            await registerPushToken();
        }
    } finally {
        setShowNotificationDialog(false);
    }
  };

  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <>
      <AdsHandler />
      <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Enable Push Notifications</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Stay updated with new messages, followers, and other important alerts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row-reverse gap-2 sm:gap-0">
            <AlertDialogAction onClick={handleNotificationPermissionRequest}>Allow</AlertDialogAction>
            <AlertDialogCancel>Don't Allow</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative h-dvh w-full md:h-screen overflow-hidden">
          {currentUser && <TypingBattleRequestBanner userId={currentUser.id} />}
          {currentUser && <CoupleRequestBanner userId={currentUser.id} />}
          <AnimatePresence mode="wait">
            <motion.div key={pathname} className="h-full w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {children}
                </motion.div>
            </motion.div>
          </AnimatePresence>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
        <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <meta name="theme-color" content="#3B82F6" />
            <Script
              src="//libtl.com/sdk.js"
              data-zone="10630894"
              data-sdk="show_10630894"
              strategy="beforeInteractive"
            />
        </head>
      <body
        className={cn('font-headline antialiased bg-background', ptSans.variable)}
      >
        <OfflineProvider>
          <LanguageProvider>
            <MultiAccountProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </MultiAccountProvider>
            <Toaster />
          </LanguageProvider>
        </OfflineProvider>
      </body>
    </html>
  );
}
