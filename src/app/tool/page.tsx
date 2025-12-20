
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Heart, Calculator, Image as ImageIcon, Bot } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/ad-banner";
import { Button } from "@/components/ui/button";

export default function ToolPage() {
    
    const features = [
        {
            title: "Loving Couple",
            description: "Keep track of your special anniversary.",
            icon: <Heart className="h-8 w-8 text-pink-500" />,
            href: "/tool/anniversary",
            color: "bg-pink-500/10 border-pink-500/20",
            disabled: false,
        },
        {
            title: "Scientific Calculator",
            description: "Solve complex math problems with ease.",
            icon: <Calculator className="h-8 w-8 text-green-500" />,
            href: "/tool/scientific-calculator",
            color: "bg-green-500/10 border-green-500/20",
            disabled: false,
        },
    ];
    
    return (
        <>
            <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
                <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
                    <h1 className="text-xl font-bold">Bright-Net Tools</h1>
                </header>

                <main className="flex-1 overflow-y-auto p-4 flex flex-col">
                    <div className="space-y-4">
                        <Card className="bg-primary/10 border-primary/20">
                             <CardHeader>
                                <CardTitle>Welcome to Bright-Net Tools</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Explore tools to enhance your experience.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            {features.map((feature) => (
                                 <Link key={feature.title} href={feature.disabled ? "#" : feature.href} className={feature.disabled ? "pointer-events-none" : ""}>
                                    <Card className={`hover:bg-muted/50 aspect-square flex flex-col items-center justify-center text-center p-4 ${feature.disabled && "opacity-50"} ${feature.color}`}>
                                        <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                            {feature.icon}
                                            <CardTitle className="text-base">{feature.title}</CardTitle>
                                        </div>
                                        <CardDescription className="text-xs">{feature.description}</CardDescription>
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
