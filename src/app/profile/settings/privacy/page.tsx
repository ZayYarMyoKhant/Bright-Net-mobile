
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacySettingsPage() {
    const [showActive, setShowActive] = useState(true);
    const [isPrivateAccount, setIsPrivateAccount] = useState(false);
    const [isPrivatePost, setIsPrivatePost] = useState(false);

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/profile/settings" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Privacy</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="divide-y">
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <Label htmlFor="active-status" className="font-semibold text-base">Show your active status</Label>
                            <p className="text-sm text-muted-foreground">Let others see when you're active.</p>
                        </div>
                        <Switch id="active-status" checked={showActive} onCheckedChange={setShowActive} />
                    </div>
                    <div className="flex items-center justify-between py-4">
                         <div>
                            <Label htmlFor="private-account" className="font-semibold text-base">Private account</Label>
                            <p className="text-sm text-muted-foreground">Only approved followers can see your content.</p>
                        </div>
                        <Switch id="private-account" checked={isPrivateAccount} onCheckedChange={setIsPrivateAccount} />
                    </div>
                     <div className="flex items-center justify-between py-4">
                         <div>
                            <Label htmlFor="private-post" className="font-semibold text-base">Private post</Label>
                             <p className="text-sm text-muted-foreground">Make all your past and future posts private.</p>
                        </div>
                        <Switch id="private-post" checked={isPrivatePost} onCheckedChange={setIsPrivatePost} />
                    </div>
                </div>
            </main>
        </div>
    );
}
