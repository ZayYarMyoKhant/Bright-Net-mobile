
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Heart, CheckSquare, X, Swords } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/ad-banner";

export default function BlissZonePage() {
    
    const features = [
        {
            title: "Loving Couple",
            description: "Keep track of your special anniversary.",
            icon: <Heart className="h-8 w-8 text-red-500" />,
            href: "/bliss-zone/anniversary",
            color: "border-red-500/20 bg-red-500/10",
            disabled: false,
        },
        {
            title: "Checker Game",
            description: "Challenge your friends to a game of checkers.",
            icon: <Swords className="h-8 w-8 text-blue-500" />,
            href: "/bliss-zone/checker-game/choose-opponent",
            color: "border-blue-500/20 bg-blue-500/10",
            disabled: false
        },
        {
            title: "XO Game",
            description: "Play a classic game of Tic-Tac-Toe.",
            icon: <div className="h-8 w-8 flex items-center justify-center gap-0.5"><X className="h-6 w-6 text-green-500" /><CheckSquare className="h-6 w-6 text-green-500" /></div>,
            href: "/bliss-zone/xo-game/choose-opponent",
             color: "border-green-500/20 bg-green-500/10"
        },
    ]

    return (
        <>
            <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
                <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
                    <h1 className="text-xl font-bold text-primary">Bliss Zone</h1>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Card className="bg-primary/10 border-primary/20">
                         <CardHeader>
                            <CardTitle>Welcome to Your Happy Place</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Connect with your loved ones and play fun games together.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {features.map((feature) => (
                             <Link key={feature.title} href={feature.disabled ? "#" : feature.href} className={feature.disabled ? "pointer-events-none" : ""}>
                                <Card className={`hover:bg-muted/50 ${feature.disabled && "opacity-50"}`}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                        {feature.icon}
                                        <CardTitle>{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <div className="pt-4">
                        <AdBanner />
                    </div>
                </main>
            </div>
            <BottomNav />
        </>
    );
}
