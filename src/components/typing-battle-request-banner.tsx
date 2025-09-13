
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { TypingBattle } from '@/lib/data';

type BattleRequest = TypingBattle & {
    player1: {
        id: string;
        username: string;
        avatar_url: string;
        full_name: string;
    }
}

export function TypingBattleRequestBanner({ userId }: { userId: string }) {
    const [request, setRequest] = useState<BattleRequest | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel(`battle-requests-for-${userId}`)
            .on<BattleRequest>(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'typing_battles',
                    filter: `player2_id=eq.${userId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const { data: requesterProfile, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', payload.new.player1_id)
                            .single();
                        
                        if (!error && requesterProfile) {
                            // @ts-ignore
                            setRequest({ ...payload.new, player1: requesterProfile });
                        }
                    } else if (payload.eventType === 'UPDATE' && (payload.new.status === 'cancelled' || payload.new.status === 'declined')) {
                        setRequest(null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const handleResponse = async (accept: boolean) => {
        if (!request) return;

        const newStatus = accept ? 'accepted' : 'declined';
        const { error } = await supabase
            .from('typing_battles')
            .update({ status: newStatus })
            .eq('id', request.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to respond' });
        } else {
            setRequest(null);
            if (accept) {
                router.push(`/ai-tool/typing-battle/game/${request.id}`);
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
                        <AvatarImage src={request.player1.avatar_url} />
                        <AvatarFallback>{request.player1.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{request.player1.full_name}</p>
                        <p className="text-sm flex items-center gap-1"><Swords className="h-4 w-4" /> challenges you to a Typing Battle!</p>
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

