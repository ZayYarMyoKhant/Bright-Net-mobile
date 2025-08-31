
"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield, Globe, Ban, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/language-context";


export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

    const settingsItems = [
        { icon: User, label: t('settings.account'), href: "/profile/settings/account" },
        { icon: Shield, label: t('settings.privacy'), href: "/profile/settings/privacy" },
        { icon: Globe, label: t('settings.language'), href: "/profile/settings/language" },
        { icon: Ban, label: t('settings.blocked'), href: "/profile/settings/blocked" },
    ];


    const handleLogout = async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({
                title: "Logout Failed",
                description: error.message,
                variant: "destructive",
            });
        } else {
            router.push('/login');
        }
    };


    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
                <Link href="/profile" className="p-2 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="mx-auto text-xl font-bold">{t('settings.title')}</h1>
                {/* Spacer to balance the header */}
                <div className="w-5 h-5"></div>
            </header>

            <main className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex-1">
                    <div className="divide-y">
                        {settingsItems.map((item) => (
                            <Link key={item.label} href={item.href} className="block">
                                <div
                                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className="h-6 w-6 text-muted-foreground" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" className="w-full justify-between">
                               <span>{t('settings.logout')}</span>
                               <LogOut className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('settings.logoutConfirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('settings.logoutConfirmDesc')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout}>{t('settings.confirmLogout')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </main>
        </div>
    );
}
