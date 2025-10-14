
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Couple } from '@/lib/data';

type CoupleRequest = Couple & {
    user1: {
        id: string;
        username: string;
        avatar_url: string;
        full_name: string;
    }
}

export function CoupleRequestBanner({ userId }: { userId: string }) {
    const [request, setRequest] = useState<CoupleRequest | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel(`couple-requests-for-${userId}`)
            .on<Couple>(
                'postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'couples',
                    filter: `user2_id=eq.${userId}`
                },
                async (payload) => {
                    if (payload.new.status === 'requesting') {
                        const { data: requesterProfile, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', payload.new.user1_id)
                            .single();
                        
                        if (!error && requesterProfile) {
                            setRequest({ ...payload.new, user1: requesterProfile } as CoupleRequest);
                        }
                    }
                }
            )
            .on<Couple>(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'couples',
                    filter: `user2_id=eq.${userId}`
                },
                (payload) => {
                    if (request && payload.old.id === request.id) {
                        setRequest(null);
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

        setRequest(null); // Hide banner immediately

        if (accept) {
             const { error } = await supabase.rpc('accept_couple_request', { couple_id_param: request.id });
             if (error) {
                toast({ variant: 'destructive', title: 'Failed to accept request' });
             } else {
                toast({ title: 'Congratulations!', description: 'You are now a couple.'});
                router.push('/bliss-zone/anniversary');
                router.refresh();
             }
        } else {
            const { error } = await supabase
                .from('couples')
                .delete()
                .eq('id', request.id);
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to decline request' });
            }
        }
    };

    if (!request) {
        return null;
    }

    return (
        <div className="fixed top-16 left-0 right-0 z-50 bg-pink-500/90 backdrop-blur-sm p-2 text-white animate-in slide-in-from-top-full duration-500">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white" profile={request.user1} />
                    <div>
                        <p className="font-bold">{request.user1.full_name}</p>
                        <p className="text-sm flex items-center gap-1"><Heart className="h-4 w-4" /> wants to be a couple with you!</p>
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
