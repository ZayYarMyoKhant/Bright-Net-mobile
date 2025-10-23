
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/data';

type VideoCall = {
    id: string;
    caller_id: string;
    callee_id: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type CallRequest = VideoCall & {
    caller: Profile
}

export function VideoCallRequestBanner({ userId }: { userId: string }) {
    const [request, setRequest] = useState<CallRequest | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel(`video-calls-for-${userId}`)
            .on<VideoCall>(
                'postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'video_calls',
                    filter: `callee_id=eq.${userId}`
                },
                async (payload) => {
                    // Only show banner for new requests
                    if (payload.new.status === 'requesting') {
                         const { data: callerProfile, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', payload.new.caller_id)
                            .single();
                        
                        if (!error && callerProfile) {
                            setRequest({ ...payload.new, caller: callerProfile });
                        }
                    }
                }
            )
            .on<VideoCall>(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'video_calls',
                    filter: `callee_id=eq.${userId}`
                },
                (payload) => {
                    // Hide banner if call is cancelled or missed
                    if (payload.new.status === 'cancelled' || payload.new.status === 'ended') {
                         if (request && payload.new.id === request.id) {
                            setRequest(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, request]);

    const handleResponse = async (accept: boolean) => {
        if (!request) return;

        const newStatus = accept ? 'accepted' : 'declined';
        
        const currentRequest = request;
        setRequest(null); // Hide banner immediately

        const { error } = await supabase
            .from('video_calls')
            .update({ status: newStatus })
            .eq('id', currentRequest.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to respond to call' });
        } else {
            if (accept) {
                router.push(`/chat/${currentRequest.caller_id}/voice-call`);
            }
        }
    };

    if (!request) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm p-2 text-primary-foreground animate-in slide-in-from-top-full duration-500">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary-foreground">
                        <AvatarImage src={request.caller.avatar_url} />
                        <AvatarFallback>{request.caller.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{request.caller.full_name}</p>
                        <p className="text-sm flex items-center gap-1"><Phone className="h-4 w-4" /> Incoming video call...</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => handleResponse(false)}>Decline</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleResponse(true)}>Accept</Button>
                </div>
            </div>
        </div>
    );
}
