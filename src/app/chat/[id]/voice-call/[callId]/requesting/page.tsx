
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/data';

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

    useEffect(() => {
        const fetchCalleeData = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'User not found' });
                router.push('/chat');
                return;
            }
            setCallee(data);
            setLoading(false);
        };
        fetchCalleeData();

        // Listen for the request to be accepted (i.e., a new video_call session is created)
        const callSessionChannel = supabase
            .channel(`active-call-for-${otherUserId}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'video_calls', filter: `caller_id=eq.${otherUserId}` },
                (payload) => {
                     router.push(`/chat/${otherUserId}/voice-call/${payload.new.id}`);
                }
            )
            .subscribe();

        // Listen for the request to be deleted (declined or cancelled)
        const requestChannel = supabase
            .channel(`call-request-status-${callRequestId}`)
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'call_requests', filter: `id=eq.${callRequestId}` },
                (payload) => {
                    toast({ variant: 'destructive', title: 'Call Declined', description: `${callee?.full_name} is unavailable.` });
                    router.push(`/chat/${otherUserId}`);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(callSessionChannel);
            supabase.removeChannel(requestChannel);
        };
    }, [callRequestId, router, supabase, toast, otherUserId, callee?.full_name]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('call_requests')
            .delete()
            .eq('id', callRequestId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel call' });
        } else {
            router.push(`/chat/${otherUserId}`);
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
        <div className="flex h-dvh flex-col items-center justify-center bg-gray-900 text-white text-center p-4">
            <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={callee.avatar_url} alt={callee.username} />
                <AvatarFallback>{callee.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-2xl font-bold">Calling</h2>
            <h3 className="text-xl text-primary">{callee.full_name}</h3>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ringing...
            </p>
            <Button variant="destructive" size="icon" className="mt-12 h-16 w-16 rounded-full" onClick={handleCancel}>
                <PhoneOff className="h-8 w-8" />
            </Button>
        </div>
    );
}
