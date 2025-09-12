
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProblemSolverPage() {

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">AI Problem Solver</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <Card className="bg-blue-100/10">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <BrainCircuit className="h-10 w-10 text-primary" />
                        <CardTitle>Describe your problem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Provide a detailed description of the problem you're facing, and our AI will generate a step-by-step solution for you.
                        </p>
                    </CardContent>
                </Card>

                <Textarea
                    placeholder="For example: How do I fix a leaky faucet?"
                    className="flex-1 min-h-[150px] text-base"
                />

                <Button size="lg" className="w-full">
                    Get Solution
                </Button>
            </main>
        </div>
    );
}
