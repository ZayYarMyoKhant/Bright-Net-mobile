
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/data';
import { User } from '@supabase/supabase-js';

type CallRequest = {
    id: string;
    caller_id: string;
    callee_id: string;
}

export default function VideoCallRequestingPage({ params: paramsPromise }: { params: Promise<{ id: string, callId: string }> }) {
    const params = use(paramsPromise);
    const otherUserId = params.id;
    const callRequestId = params.callId;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [callee, setCallee] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/signup'); return; }
            setCurrentUser(user);
            
            const { data: calleeData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single();

            if (error || !calleeData) {
                toast({ variant: 'destructive', title: 'User not found' });
                router.push('/chat');
                return;
            }
            setCallee(calleeData);
            setLoading(false);
        };
        fetchInitialData();
    }, [otherUserId, router, supabase, toast]);

    useEffect(() => {
        if (!currentUser) return;

        // --- Subscription 1: Listen for the call being ACCEPTED ---
        // This happens when a new row is created in `video_calls` for this caller.
        const acceptedCallChannel = supabase
            .channel(`accepted-call-for-${currentUser.id}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'video_calls', filter: `caller_id=eq.${currentUser.id}` },
                (payload) => {
                    const { id: newCallId } = payload.new as { id: string };
                    // The call was accepted, navigate to the active call page.
                    router.push(`/chat/${otherUserId}/voice-call/${newCallId}`);
                }
            )
            .subscribe();

        // --- Subscription 2: Listen for the call being DECLINED or CANCELLED ---
        // This happens when the original request is deleted from `call_requests`.
        const requestStatusChannel = supabase
            .channel(`call-request-status-${callRequestId}`)
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'call_requests', filter: `id=eq.${callRequestId}` },
                (payload) => {
                    // Since this channel only fires on DELETE, and we already handle the ACCEPT case above,
                    // any deletion here means it was declined or cancelled.
                    toast({ variant: 'destructive', title: 'Call Declined', description: `${callee?.full_name} is unavailable.` });
                    router.push(`/chat/${otherUserId}`);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(acceptedCallChannel);
            supabase.removeChannel(requestStatusChannel);
        };
    }, [callRequestId, router, supabase, toast, otherUserId, callee?.full_name, currentUser]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('call_requests')
            .delete()
            .eq('id', callRequestId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel call' });
        } else {
            // The subscription will catch the delete and redirect.
            // router.push(`/chat/${otherUserId}`); 
        }
    };

    if (loading || !callee) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-gray-900 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-sky-400 text-foreground text-center p-4">
            <Avatar className="h-32 w-32 border-4 border-white" profile={callee}>
            </Avatar>
            <h2 className="mt-4 text-2xl font-bold text-white">Calling</h2>
            <h3 className="text-xl text-primary-foreground">{callee.full_name}</h3>
            <p className="text-white/80 mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ringing...
            </p>
            <Button variant="destructive" size="icon" className="mt-12 h-16 w-16 rounded-full" onClick={handleCancel}>
                <PhoneOff className="h-8 w-8" />
            </Button>
        </div>
    );
}
