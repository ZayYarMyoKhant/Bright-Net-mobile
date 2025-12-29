
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
import { ArrowLeft, User, Shield, Globe, Ban, ChevronRight, LogOut, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/language-context";
import { createClient } from "@/lib/supabase/client";
import { useContext, useState } from "react";
import { MultiAccountContext } from "@/hooks/use-multi-account";
import { AdBanner } from "@/components/ad-banner";


export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const multiAccount = useContext(MultiAccountContext);
    const supabase = createClient();
    const [isDeleting, setIsDeleting] = useState(false);

    const settingsItems = [
        { icon: User, label: t('settings.account'), href: "/profile/settings/account" },
        { icon: Shield, label: t('settings.privacy'), href: "/profile/settings/privacy" },
        { icon: Globe, label: t('settings.language'), href: "/profile/settings/language" },
        { icon: Ban, label: t('settings.blocked'), href: "/profile/settings/blocked" },
    ];


    const handleLogout = async () => {
       if (multiAccount && multiAccount.currentAccount) {
           await multiAccount.removeAccount(multiAccount.currentAccount.id);
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out from this account.",
           });
           router.push('/home'); // Go to home, it will pick the next available account
           router.refresh();
       }
    };
    
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        const { error } = await supabase.rpc('delete_user_account');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setIsDeleting(false);
        } else {
             if (multiAccount && multiAccount.currentAccount) {
                await multiAccount.removeAccount(multiAccount.currentAccount.id);
             }
             toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
             router.push('/signup');
             router.refresh();
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
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <div
                                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50 text-destructive"
                                >
                                    <div className="flex items-center gap-4">
                                        <Trash2 className="h-6 w-6" />
                                        <span className="font-medium">Delete Account</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/80">
                                        {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Deleting...</> : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <AdBanner />
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
                                    This will remove this account from this device. You can log in again later.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout}>{t('settings.confirmLogout')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </main>
        </div>
    );
}
