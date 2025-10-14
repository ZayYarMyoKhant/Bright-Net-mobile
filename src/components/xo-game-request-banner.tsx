
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { CheckSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { XOGame, Profile } from '@/lib/data';

type GameRequest = XOGame & {
    player1: Profile;
}

export function XORequestBanner({ userId }: { userId: string }) {
    const [request, setRequest] = useState<GameRequest | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel(`xo-requests-for-${userId}`)
            .on<XOGame>(
                'postgres_changes',
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'xo_games',
                    filter: `player2_id=eq.${userId}`
                },
                async (payload) => {
                    if (payload.new.status === 'requesting') {
                         const { data: requesterProfile, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', payload.new.player1_id)
                            .single();
                        
                        if (!error && requesterProfile) {
                            setRequest({ ...payload.new, player1: requesterProfile } as GameRequest);
                        }
                    }
                }
            )
            .on<XOGame>(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'xo_games',
                    filter: `player2_id=eq.${userId}`
                },
                (payload) => {
                    if (request && payload.old.id === request.id && (payload.new.status === 'cancelled' || payload.new.status === 'declined')) {
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

        const newStatus = accept ? 'accepted' : 'declined';
        const { error } = await supabase
            .from('xo_games')
            .update({ status: newStatus })
            .eq('id', request.id);
        
        setRequest(null); // Hide banner immediately

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to respond to challenge' });
        } else {
            if (accept) {
                router.push(`/bliss-zone/xo-game/play/${request.id}`);
            }
        }
    };

    if (!request) {
        return null;
    }

    return (
        <div className="fixed top-16 left-0 right-0 z-50 bg-green-600/90 backdrop-blur-sm p-2 text-white animate-in slide-in-from-top-full duration-500">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white" profile={request.player1} />
                    <div>
                        <p className="font-bold">{request.player1.full_name}</p>
                        <p className="text-sm flex items-center gap-1">
                             <div className="h-4 w-4 flex items-center justify-center gap-0.5"><X className="h-3 w-3" /><CheckSquare className="h-3 w-3" /></div>
                             challenges you to an XO Game!
                        </p>
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
