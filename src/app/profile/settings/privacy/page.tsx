
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function PrivacySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showActive, setShowActive] = useState(true);
    const [isPrivateAccount, setIsPrivateAccount] = useState(false);
    
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/signup');
                return;
            }
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('show_active_status, is_private')
                .eq('id', user.id)
                .single();
            
            if (error) {
                toast({ variant: 'destructive', title: 'Error loading settings' });
            } else if (profile) {
                // If the value from the DB is not null, use it. Otherwise, default to true.
                setShowActive(profile.show_active_status ?? true);
                setIsPrivateAccount(profile.is_private ?? false);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [supabase, router, toast]);


    const handleSaveChanges = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated'});
            setSaving(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ 
                show_active_status: showActive,
                is_private: isPrivateAccount
            })
            .eq('id', user.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to save settings', description: error.message });
        } else {
            toast({ title: 'Settings saved!' });
        }
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
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
                            <p className="text-sm text-muted-foreground">Let others see when you're online or last active.</p>
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
                     <Link href="/privacy" className="block">
                        <div className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-4 px-4">
                             <div>
                                <p className="font-semibold text-base">Privacy Policy for Bright-Net</p>
                                <p className="text-sm text-muted-foreground">Read our data usage and privacy information.</p>
                            </div>
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
                    <Link href="/terms" className="block">
                        <div className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-4 px-4">
                             <div>
                                <p className="font-semibold text-base">Terms of Use</p>
                                <p className="text-sm text-muted-foreground">Read our terms and conditions of use.</p>
                            </div>
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
                </div>
            </main>
            <footer className="p-4 border-t">
                <Button className="w-full" onClick={handleSaveChanges} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </footer>
        </div>
    );
}
