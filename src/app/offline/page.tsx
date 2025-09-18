
"use client";

import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
    
    const handleRefresh = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-4">
            <WifiOff className="h-20 w-20 text-destructive" />
            <h1 className="text-2xl font-bold mt-4">You are offline</h1>
            <p className="text-muted-foreground">Please check your network connection.</p>
            <Button onClick={handleRefresh} className="mt-6">
                Refresh
            </Button>
        </div>
    );
}
