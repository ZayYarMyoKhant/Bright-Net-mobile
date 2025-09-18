
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TypingBattle } from '@/lib/data';

type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
};

export default function TypingBattleRequestingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const battleId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [opponent, setOpponent] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBattleData = async () => {
            const { data, error } = await supabase
                .from('typing_battles')
                .select('*, player2:profiles!typing_battles_player2_id_fkey(id, username, avatar_url, full_name)')
                .eq('id', battleId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'Battle not found' });
                router.push('/ai-tool/typing-battle');
                return;
            }
            // @ts-ignore
            setOpponent(data.player2);
            setLoading(false);
        };
        fetchBattleData();

        const channel = supabase
            .channel(`battle-${battleId}`)
            .on<TypingBattle>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'typing_battles', filter: `id=eq.${battleId}` },
                (payload) => {
                    const battle = payload.new;
                    if (battle.status === 'accepted') {
                        router.push(`/ai-tool/typing-battle/game/${battleId}`);
                    } else if (battle.status === 'declined') {
                        toast({ variant: 'destructive', title: 'Request Declined', description: `${opponent?.full_name} declined your battle request.` });
                        router.push('/ai-tool');
                    } else if (battle.status === 'cancelled') {
                        toast({ variant: 'destructive', title: 'Request Cancelled'});
                        router.push('/ai-tool/typing-battle');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [battleId, router, supabase, toast, opponent?.full_name]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('typing_battles')
            .update({ status: 'cancelled' })
            .eq('id', battleId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel' });
        } else {
            router.push('/ai-tool/typing-battle');
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
            <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={opponent.avatar_url} alt={opponent.username} />
                <AvatarFallback>{opponent.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-2xl font-bold">Requesting battle with</h2>
            <h3 className="text-xl text-primary">{opponent.full_name}</h3>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for response...
            </p>
            <Button variant="outline" className="mt-8" onClick={handleCancel}>
                Cancel Request
            </Button>
        </div>
    );
}

    