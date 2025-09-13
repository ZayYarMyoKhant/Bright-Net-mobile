
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { TypingBattle } from '@/lib/data';

type PlayerProfile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
}

const TypingTextDisplay = ({ text, typed }: { text: string; typed: string }) => {
    return (
        <div className="text-2xl font-mono tracking-wider p-4 bg-muted rounded-md text-left">
            {text.split('').map((char, index) => {
                let className = "text-muted-foreground";
                if (index < typed.length) {
                    className = typed[index] === char ? "text-foreground" : "text-destructive underline";
                }
                return <span key={index} className={className}>{char}</span>;
            })}
        </div>
    );
};

export default function TypingBattleGamePage({ params }: { params: { id: string } }) {
    const battleId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [battle, setBattle] = useState<TypingBattle | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [player1, setPlayer1] = useState<PlayerProfile | null>(null);
    const [player2, setPlayer2] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [myInput, setMyInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const isPlayer1 = currentUser?.id === battle?.player1_id;

    const me = isPlayer1 ? player1 : player2;
    const opponent = isPlayer1 ? player2 : player1;
    const myScore = isPlayer1 ? battle?.player1_score : battle?.player2_score;
    const opponentScore = isPlayer1 ? battle?.player2_score : battle?.player1_score;
    const myProgress = isPlayer1 ? battle?.player1_progress : battle?.player2_progress;
    
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/signup');
                return;
            }
            setCurrentUser(user);

            const { data: battleData, error } = await supabase
                .from('typing_battles')
                .select('*, player1:profiles!typing_battles_player1_id_fkey(*), player2:profiles!typing_battles_player2_id_fkey(*)')
                .eq('id', battleId)
                .single();

            if (error || !battleData) {
                toast({ variant: 'destructive', title: 'Battle not found' });
                router.push('/ai-tool');
                return;
            }
            
            // @ts-ignore
            setBattle(battleData);
            // @ts-ignore
            setPlayer1(battleData.player1);
            // @ts-ignore
            setPlayer2(battleData.player2);
            setLoading(false);
            inputRef.current?.focus();
        };
        init();
    }, [battleId, router, supabase, toast]);

    useEffect(() => {
        const channel = supabase
            .channel(`game-${battleId}`)
            .on<TypingBattle>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'typing_battles', filter: `id=eq.${battleId}` },
                (payload) => {
                    const newBattle = payload.new;
                    setBattle(newBattle);
                    
                    if (newBattle.status === 'completed') {
                        if (newBattle.winner_id === currentUser?.id) {
                            // This logic is complex and should be handled by a server function ideally
                            // For now, we show a toast and redirect.
                             toast({ title: 'Congratulations!', description: 'You won the battle!', duration: 5000 });
                        } else {
                             toast({ variant: 'destructive', title: 'You Lose!', description: 'Better luck next time.', duration: 5000 });
                        }
                         setTimeout(() => router.push('/ai-tool'), 3000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [battleId, supabase, currentUser?.id, router, toast]);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!battle || battle.status === 'completed') return;

        const value = e.target.value;
        setMyInput(value);
        
        const progressField = isPlayer1 ? 'player1_progress' : 'player2_progress';
        await supabase.from('typing_battles').update({ [progressField]: value }).eq('id', battleId);

        if (value === battle.current_text) {
            // This update should be handled by a database function for atomicity
            // This client-side logic is prone to race conditions
            console.log("Round finished by me!");
        }
    };

    if (loading || !battle || !player1 || !player2) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const renderPlayer = (player: PlayerProfile, score: number, isMe: boolean) => (
        <div className="flex flex-col items-center gap-2">
            <Avatar className={cn("h-20 w-20 border-4", isMe ? "border-primary" : "border-muted")}>
                <AvatarImage src={player.avatar_url} />
                <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-bold">{player.full_name}</p>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${score * 10}%` }}></div>
            </div>
            <p className="font-semibold text-lg">{score}/10</p>
        </div>
    );
    

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground p-4">
            <header className="flex-shrink-0 text-center mb-4">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Swords className="h-8 w-8 text-primary" />
                    Typing Battle
                </h1>
            </header>

            <main className="flex-1 flex flex-col justify-around">
                <div className="grid grid-cols-3 items-center gap-4">
                    {me && renderPlayer(me, myScore || 10, true)}
                    <div className="text-center">
                        <p className="text-5xl font-bold text-muted-foreground">VS</p>
                    </div>
                    {opponent && renderPlayer(opponent, opponentScore || 10, false)}
                </div>

                <div className="space-y-4">
                    <TypingTextDisplay text={battle.current_text} typed={myInput} />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={myInput}
                        onChange={handleInputChange}
                        placeholder="Start typing here..."
                        className="w-full text-center text-xl h-12"
                        autoFocus
                        disabled={battle.status === 'completed'}
                    />
                </div>
            </main>
        </div>
    );
}
