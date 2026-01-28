
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceCenterPage() {
    const [feedback, setFeedback] = useState("");
    const { toast } = useToast();
    const supportEmail = "zeyarzeyarmyokhant@gmail.com";
    const emailSubject = "Feedback for Bright-Net App";

    const handleSubmit = () => {
        if (feedback.trim() === "") {
            toast({
                variant: 'destructive',
                title: 'Feedback is empty',
                description: 'Please write your feedback before sending.',
            });
            return;
        }

        const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(feedback)}`;
        
        // This will attempt to open the default mail client.
        window.location.href = mailtoLink;
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/profile/settings" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Service Center</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Submit Feedback</CardTitle>
                        <CardDescription>
                            We value your feedback! Please let us know your thoughts, suggestions, or any issues you've encountered. Your feedback will be sent via your default email application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="feedback" className="sr-only">Feedback</label>
                                <Textarea
                                    id="feedback"
                                    placeholder="Tell us what you think..."
                                    className="min-h-[200px]"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleSubmit}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Feedback via Email
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
