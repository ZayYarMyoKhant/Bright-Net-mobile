
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CheckerGame, Profile } from '@/lib/data';

export default function CheckerRequestingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const gameId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [opponent, setOpponent] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/signup'); return; }

            const { data, error } = await supabase
                .from('checker_games')
                .select('player1_id, player2_id')
                .eq('id', gameId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'Game not found' });
                router.push('/bliss-zone/checker-game/choose-opponent');
                return;
            }
            
            const opponentId = data.player1_id === user.id ? data.player2_id : data.player1_id;
            
            const { data: opponentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', opponentId)
                .single();

            if(profileError || !opponentProfile) {
                 toast({ variant: 'destructive', title: 'Opponent not found' });
                 router.push('/bliss-zone/checker-game/choose-opponent');
                 return;
            }

            setOpponent(opponentProfile);
            setLoading(false);
        };
        fetchGameData();
    }, [gameId, router, supabase, toast]);

    useEffect(() => {
        if (!gameId) return;

        const channel = supabase
            .channel(`checker-game-request-${gameId}`)
            .on<CheckerGame>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'checker_games', filter: `id=eq.${gameId}` },
                (payload) => {
                    const game = payload.new;
                    if (game.status === 'accepted') {
                        router.push(`/bliss-zone/checker-game/game/${gameId}`);
                    } else if (game.status === 'declined' || game.status === 'cancelled') {
                        toast({ variant: 'destructive', title: 'Request Declined', description: `${opponent?.full_name} is not available to play right now.` });
                        router.push('/bliss-zone/checker-game/choose-opponent');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gameId, router, supabase, toast, opponent?.full_name]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('checker_games')
            .update({ status: 'cancelled' })
            .eq('id', gameId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel' });
        } else {
            router.push('/bliss-zone/checker-game/choose-opponent');
        }
    };

    if (loading || !opponent) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col items-center justify-center bg-background text-foreground text-center p-4">
            <Swords className="h-16 w-16 text-blue-500" />
            <Avatar className="h-32 w-32 border-4 border-primary mt-4" profile={opponent} />
            <h2 className="mt-4 text-2xl font-bold">Challenging</h2>
            <h3 className="text-xl text-primary">{opponent.full_name}</h3>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for response...
            </p>
            <Button variant="outline" className="mt-8" onClick={handleCancel}>
                Cancel Challenge
            </Button>
        </div>
    );
}
