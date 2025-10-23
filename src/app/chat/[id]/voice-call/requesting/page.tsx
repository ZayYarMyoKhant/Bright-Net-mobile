
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/data';

type VideoCall = {
    id: string;
    caller_id: string;
    callee_id: string;
    status: string;
}

export default function VideoCallRequestingPage({ params: paramsPromise }: { params: Promise<{ id: string, callId: string }> }) {
    const params = use(paramsPromise);
    const otherUserId = params.id;
    const callId = params.callId;
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

        const channel = supabase
            .channel(`video-call-${callId}`)
            .on<VideoCall>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'video_calls', filter: `id=eq.${callId}` },
                (payload) => {
                    const call = payload.new;
                    if (call.status === 'accepted') {
                        // Navigate to the correct call page
                        router.push(`/chat/${otherUserId}/voice-call`);
                    } else if (call.status === 'declined' || call.status === 'cancelled') {
                        toast({ variant: 'destructive', title: call.status === 'declined' ? 'Call Declined' : 'Call Cancelled', description: `${callee?.full_name} is unavailable.` });
                        router.push(`/chat/${otherUserId}`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [callId, router, supabase, toast, otherUserId, callee?.full_name]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('video_calls')
            .update({ status: 'cancelled' })
            .eq('id', callId);
        
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
                Requesting...
            </p>
            <Button variant="destructive" size="icon" className="mt-12 h-16 w-16 rounded-full" onClick={handleCancel}>
                <PhoneOff className="h-8 w-8" />
            </Button>
        </div>
    );
}
