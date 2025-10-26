
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/data';

type CallRequest = {
    id: string;
    caller_id: string;
    callee_id: string;
    caller: Profile;
};

export function VideoCallRequestBanner({ userId }: { userId: string }) {
    const [request, setRequest] = useState<CallRequest | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!userId) return;

        const handleInsert = async (payload: any) => {
            const { data: callerProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.caller_id)
                .single();
            
            if (!error && callerProfile) {
                setRequest({ ...payload.new, caller: callerProfile } as CallRequest);
            }
        };

        const handleDelete = (payload: any) => {
            if (request && payload.old.id === request.id) {
                setRequest(null);
            }
        };

        const channel = supabase.channel(`call-requests-for-${userId}`);

        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_requests', filter: `callee_id=eq.${userId}` }, handleInsert);
        channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'call_requests', filter: `callee_id=eq.${userId}` }, handleDelete);
        
        channel.subscribe();


        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, toast, router, request]);

    // Timeout for the banner itself
    useEffect(() => {
        if (request) {
            const timer = setTimeout(() => {
                setRequest(null); // Hide banner after 30s if not answered
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [request]);

    const handleAccept = async () => {
        if (!request) return;

        const currentRequest = request;
        setRequest(null);

        const { data: newCallId, error } = await supabase.rpc('accept_call', { request_id_param: currentRequest.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to accept call', description: error.message });
        } else {
            router.push(`/chat/${currentRequest.caller_id}/voice-call/${newCallId}`);
        }
    };


    if (!request) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm p-2 text-primary-foreground animate-in slide-in-from-top-full duration-500">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary-foreground" profile={request.caller}>
                    </Avatar>
                    <div>
                        <p className="font-bold">{request.caller.full_name}</p>
                        <p className="text-sm flex items-center gap-1"><Phone className="h-4 w-4" /> Incoming video call...</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleAccept}>Accept</Button>
                </div>
            </div>
        </div>
    );
}
