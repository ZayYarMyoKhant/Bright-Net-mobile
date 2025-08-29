
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield, Globe, Ban, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

const settingsItems = [
    { icon: User, label: "Account" },
    { icon: Shield, label: "Privacy" },
    { icon: Globe, label: "Language" },
    { icon: Ban, label: "Block account" },
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
                            <div
                                key={item.label}
                                className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="h-6 w-6 text-muted-foreground" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    <Button variant="outline" className="w-full justify-between">
                       <span>Log out</span>
                       <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </main>
        </div>
    );
}
