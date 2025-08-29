
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

const settingsItems = [
    { icon: User, label: "Account", href: "/profile/settings/account" },
    { icon: Shield, label: "Privacy", href: "/profile/settings/privacy" },
    { icon: Globe, label: "Language", href: "/profile/settings/language" },
    { icon: Ban, label: "Block account", href: "/profile/settings/blocked" },
];

export default function SettingsPage() {
    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
                <Link href="/profile" className="p-2 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="mx-auto text-xl font-bold">Setting</h1>
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
                               <span>Log out</span>
                               <LogOut className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure to log out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will sign you out of your account on this device.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction>Yes, log out</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </main>
        </div>
    );
}
