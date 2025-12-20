
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
import { useRouter } from 'next/navigation';
import { MultiAccountProvider, MultiAccountContext } from '@/hooks/use-multi-account';


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
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const backButtonPressCount = useRef(0);

  // Real-time user presence heartbeat
  useEffect(() => {
    let presenceInterval: NodeJS.Timeout | undefined;

    const updatePresence = async () => {
        if (currentUser) {
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
            console.log('Push received: ', notification);
            toast({
                title: notification.title || "New Notification",
                description: notification.body || "",
            });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            console.log('Push action performed: ', notification.notification);
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

    // Double press back to exit
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    backButtonPressCount.current += 1;

                    if (backButtonPressCount.current === 1) {
                        toast({ description: "Press back again to exit" });
                        setTimeout(() => {
                            backButtonPressCount.current = 0;
                        }, 2000); // Reset after 2 seconds
                    } else if (backButtonPressCount.current >= 2) {
                        App.exitApp();
                    }
                } else {
                    window.history.back();
                }
            });
        }
        
        return () => {
           // Clean up listener if component unmounts
           // App.removeAllListeners may be too broad if other listeners exist
        }
    }, [toast]);


  const registerPushToken = async () => {
    if (!currentUser) return;
    try {
      await PushNotifications.register();
      
      PushNotifications.addListener('registration', async (token: Token) => {
        console.info('Push registration success, token: ', token.value);
        const { error } = await supabase.from('push_notification_tokens').upsert({
            user_id: currentUser.id,
            token: token.value,
            device_type: Capacitor.getPlatform(),
        }, { onConflict: 'user_id, token' });

        if (error) {
            console.error('Failed to save push token:', error);
        }
      });

      PushNotifications.addListener('registrationError', (err: any) => {
        console.error('Push registration error: ', err.error);
        toast({ variant: 'destructive', title: 'Push Notification Error', description: 'Failed to register for push notifications.' });
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
        } else {
            toast({ variant: 'destructive', title: 'Notifications Denied', description: 'You will not receive push notifications.' });
        }
    } catch (error) {
        console.error("Error requesting push permissions", error);
        toast({ variant: 'destructive', title: 'Permission Error', description: 'Could not request push notification permissions.' });
    } finally {
        setShowNotificationDialog(false);
    }
  };


  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <>
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
          {children}
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
