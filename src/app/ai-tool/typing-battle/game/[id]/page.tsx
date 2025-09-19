
"use client";

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TypingBattle } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PlayerProfile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
}

const TypingTextDisplay = ({ text, typed, opponentTyped }: { text: string; typed: string, opponentTyped: string }) => {
    return (
        <div className="text-xl md:text-2xl font-mono tracking-wider p-4 bg-muted rounded-md text-left relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full bg-primary/10" style={{ width: `${(opponentTyped.length / text.length) * 100}%` }} />
            <div className="relative">
                {text.split('').map((char, index) => {
                    let className = "text-muted-foreground";
                    if (index < typed.length) {
                        className = typed[index] === char ? "text-foreground" : "text-destructive underline";
                    }
                    return <span key={index} className={cn(className, "transition-colors duration-150")}>{char === ' ' ? '\u00A0' : char}</span>;
                })}
            </div>
        </div>
    );
};

export default function TypingBattleGamePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isPlayer1 = currentUser?.id === battle?.player1_id;

    const me = isPlayer1 ? player1 : player2;
    const opponent = isPlayer1 ? player2 : player1;
    const myScore = isPlayer1 ? battle?.player1_score : battle?.player2_score;
    const opponentScore = isPlayer1 ? battle?.player2_score : battle?.player1_score;
    const myProgress = isPlayer1 ? battle?.player1_progress : battle?.player2_progress;
    const opponentProgress = isPlayer1 ? battle?.player2_progress : battle?.player1_progress;
    
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
                    
                    // Reset input for new round
                    if (newBattle.current_text !== battle?.current_text) {
                        setMyInput("");
                        setIsSubmitting(false);
                    }

                    if (newBattle.status === 'completed') {
                        if (newBattle.winner_id === currentUser?.id) {
                            setGameResult('win');
                        } else {
                            setGameResult('lose');
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [battleId, supabase, currentUser?.id, battle?.current_text]);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!battle || battle.status === 'completed') return;

        const value = e.target.value;
        setMyInput(value);
        
        const progressField = isPlayer1 ? 'player1_progress' : 'player2_progress';
        await supabase.from('typing_battles').update({ [progressField]: value }).eq('id', battleId);
    };

    const handleSendAttack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!battle || battle.status === 'completed' || myInput !== battle.current_text || isSubmitting) return;

        setIsSubmitting(true);
        const { error } = await supabase.rpc('finish_typing_round', { battle_id_param: battle.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Error finishing round', description: error.message });
            setIsSubmitting(false);
        }
        // UI reset is handled by the realtime subscription
    };

    const handleEndGame = () => {
        setGameResult(null);
        router.push('/ai-tool/typing-battle');
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
            <Avatar className={cn("h-16 w-16 md:h-20 md:w-20 border-4", isMe ? "border-primary" : "border-muted")}>
                <AvatarImage src={player.avatar_url} />
                <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-bold text-sm md:text-base">{player.full_name}</p>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(score / 10) * 100}%` }}></div>
            </div>
            <p className="font-semibold text-base md:text-lg">{score}/10</p>
        </div>
    );
    
    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
             <AlertDialog open={!!gameResult} onOpenChange={() => gameResult && handleEndGame()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-3xl">
                            {gameResult === 'win' ? '🎉 You Won! 🎉' : '😥 You Lose 😥'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            {gameResult === 'win' ? 'Congratulations on your victory!' : 'Better luck next time!'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleEndGame}>Back to Lobby</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <header className="flex-shrink-0 text-center p-4">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Swords className="h-8 w-8 text-primary" />
                    Typing Battle
                </h1>
            </header>

            <main className="flex-1 flex flex-col justify-around px-4">
                <div className="grid grid-cols-3 items-center gap-4">
                    {me && renderPlayer(me, myScore ?? 0, true)}
                    <div className="text-center">
                        <p className="text-5xl font-bold text-muted-foreground">VS</p>
                    </div>
                    {opponent && renderPlayer(opponent, opponentScore ?? 0, false)}
                </div>

                <div className="space-y-4">
                    <TypingTextDisplay text={battle.current_text} typed={myProgress || ''} opponentTyped={opponentProgress || ''} />
                </div>
            </main>
             <footer className="sticky bottom-0 bg-background border-t p-2">
                <form onSubmit={handleSendAttack} className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={myInput}
                        onChange={handleInputChange}
                        placeholder="Start typing here..."
                        className="flex-1 text-base md:text-xl h-12"
                        autoFocus
                        disabled={battle.status === 'completed' || isSubmitting}
                    />
                    <Button 
                        size="icon" 
                        type="submit" 
                        disabled={myInput !== battle.current_text || battle.status === 'completed' || isSubmitting}
                        className="h-12 w-12"
                    >
                       {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}

    