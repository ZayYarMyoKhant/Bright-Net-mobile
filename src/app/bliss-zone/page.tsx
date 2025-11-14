
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Heart, Swords } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/ad-banner";

export default function LoveZonePage() {
    
    const features = [
        {
            title: "Loving Couple",
            description: "Keep track of your special anniversary.",
            icon: <Heart className="h-8 w-8 text-pink-500" />,
            href: "/bliss-zone/anniversary",
            color: "bg-primary/10 border-primary/20",
            disabled: false,
        }
    ]

    return (
        <>
            <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
                <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
                    <h1 className="text-xl font-bold">Love Zone</h1>
                </header>

                <main className="flex-1 overflow-y-auto p-4 flex flex-col">
                    <div className="space-y-4">
                        <Card className="bg-primary/10 border-primary/20">
                             <CardHeader>
                                <CardTitle>Welcome to Your Happy Place</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Connect with your loved one and build your journey.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            {features.map((feature) => (
                                 <Link key={feature.title} href={feature.disabled ? "#" : feature.href} className={feature.disabled ? "pointer-events-none" : ""}>
                                    <Card className={`hover:bg-muted/50 ${feature.disabled && "opacity-50"} ${feature.color}`}>
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
                    </div>
                    <div className="flex-grow"></div>
                    <div className="pt-4 flex-shrink-0">
                        <AdBanner />
                    </div>
                </main>
            </div>
            <BottomNav />
        </>
    );
}
