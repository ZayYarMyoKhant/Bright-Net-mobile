
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
            // If the request we are showing is deleted (cancelled by caller), hide banner
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
    }, [userId, supabase, request]); // Added 'request' dependency

    // Timeout for the banner itself
    useEffect(() => {
        if (request) {
            const timer = setTimeout(() => {
                if (request) { // Check if request still exists before declining
                    handleDecline();
                }
            }, 30000); // 30 seconds
            return () => clearTimeout(timer);
        }
    }, [request]);

    const handleAccept = async () => {
        if (!request) return;

        const currentRequest = request; // Capture request object
        setRequest(null); // Hide banner immediately

        // Call the RPC function to create the active call record.
        const { data: newCallId, error } = await supabase.rpc('accept_call', { request_id_param: currentRequest.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to accept call', description: error.message });
        } else {
            // Navigate to the call room, now with the active call ID
            router.push(`/chat/${currentRequest.caller_id}/voice-call/${newCallId}`);
        }
    };
    
    const handleDecline = async () => {
        if (!request) return;
        
        const requestId = request.id;
        setRequest(null); // Hide banner immediately
        
        // Decline by deleting the request record.
        await supabase.from('call_requests').delete().eq('id', requestId);
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
                    <Button variant="destructive" size="sm" onClick={handleDecline}>Decline</Button>
                    <Button variant="secondary" size="sm" onClick={handleAccept}>Accept</Button>
                </div>
            </div>
        </div>
    );
}
