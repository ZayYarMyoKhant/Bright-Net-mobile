
"use client";

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords, Check, X, Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { XOGame, Profile, XOState } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';


const XoCell = ({ value, onCellClick }: { value: 'X' | 'O' | null, onCellClick: () => void }) => {
    return (
        <button 
            onClick={onCellClick}
            className="flex items-center justify-center w-24 h-24 bg-muted rounded-lg disabled:opacity-50"
            disabled={!!value}
        >
            {value === 'X' && <X className="h-16 w-16 text-blue-500" />}
            {value === 'O' && <div className="h-16 w-16 rounded-full border-8 border-red-500" />}
        </button>
    );
};

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];


export default function XOGamePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const gameId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [game, setGame] = useState<XOGame | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [player1, setPlayer1] = useState<Profile | null>(null);
    const [player2, setPlayer2] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRoundResult, setShowRoundResult] = useState<string | null>(null);
    const [showMatchResult, setShowMatchResult] = useState<string | null>(null);

    const isMyTurn = game?.current_turn === currentUser?.id;
    const meAsPlayer = game?.player1_id === currentUser?.id ? 'X' : 'O';

    const me = currentUser?.id === game?.player1_id ? player1 : player2;
    const opponent = currentUser?.id === game?.player1_id ? player2 : player1;

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/signup'); return; }
            setCurrentUser(user);

            const { data: gameData, error } = await supabase
                .from('xo_games')
                .select('*, player1:player1_id(*), player2:player2_id(*)')
                .eq('id', gameId)
                .single();

            if (error || !gameData) {
                toast({ variant: 'destructive', title: 'Game not found' });
                router.push('/bliss-zone');
                return;
            }
            
            setGame(gameData as XOGame);
            setPlayer1(gameData.player1 as Profile);
            setPlayer2(gameData.player2 as Profile);
            
            if (gameData.status === 'completed') {
                const winnerName = gameData.match_winner_id === user.id ? 'You' : (gameData.match_winner_id === null ? 'Nobody' : 'Opponent');
                setShowMatchResult(`${winnerName} won the match!`);
            } else if (gameData.winner) {
                 const winnerSymbol = gameData.player1_id === user.id ? 'X' : 'O';
                 const winnerText = gameData.winner === 'draw' ? 'It\'s a Draw!' : gameData.winner === winnerSymbol ? 'You Won This Round!' : 'You Lost This Round.';
                 setShowRoundResult(winnerText);
            }
            
            setLoading(false);
        };
        init();
    }, [gameId, router, supabase, toast]);

    useEffect(() => {
        const channel = supabase
            .channel(`xo-game-${gameId}`)
            .on<XOGame>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'xo_games', filter: `id=eq.${gameId}` },
                (payload) => {
                    const newGame = payload.new;
                    setGame(newGame);

                     if (newGame.status === 'completed') {
                        const winnerName = newGame.match_winner_id === currentUser?.id ? 'You' : (newGame.match_winner_id === null ? 'Nobody' : (player1?.id === newGame.match_winner_id ? player1.full_name : player2?.full_name));
                        setShowMatchResult(`${winnerName} won the match!`);
                    } else if (newGame.winner) {
                         const mySymbol = player1?.id === currentUser?.id ? 'X' : 'O';
                         const winnerText = newGame.winner === 'draw' ? 'It\'s a Draw!' : newGame.winner === mySymbol ? 'You Won This Round!' : 'You Lost This Round.';
                         setShowRoundResult(winnerText);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId, supabase, currentUser?.id, player1, player2]);

    const handleCellClick = async (index: number) => {
        if (!game || !isMyTurn || game.board_state[index] !== null || game.winner) return;

        const newBoard = [...game.board_state];
        newBoard[index] = meAsPlayer;
        
        let newWinner = null;
        for (const combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
                newWinner = newBoard[a];
                break;
            }
        }
        if (!newWinner && !newBoard.includes(null)) {
            newWinner = 'draw';
        }

        const nextTurn = game.player1_id === currentUser?.id ? game.player2_id : game.player1_id;

        const { error } = await supabase.from('xo_games')
            .update({ board_state: newBoard, current_turn: nextTurn, winner: newWinner })
            .eq('id', gameId);

        if (error) { toast({ variant: 'destructive', title: 'Error making move' }); }
    };

    const handleNextRound = async () => {
        if (!game) return;

        let { player1_score, player2_score } = game;
        
        if (game.winner === 'X') player1_score++;
        if (game.winner === 'O') player2_score++;

        setShowRoundResult(null);

        // Check for match winner (best of 3)
        if (player1_score >= 2 || player2_score >= 2) {
             const match_winner_id = player1_score >= 2 ? game.player1_id : game.player2_id;
             await supabase.from('xo_games').update({ status: 'completed', match_winner_id, player1_score, player2_score }).eq('id', gameId);
        } else {
            // Start next round
            await supabase.from('xo_games').update({
                board_state: Array(9).fill(null),
                winner: null,
                player1_score,
                player2_score,
                // Loser of the round starts next
                current_turn: game.winner === 'X' ? game.player2_id : game.winner === 'O' ? game.player1_id : game.current_turn,
            }).eq('id', gameId);
        }
    };
    
    if (loading || !game || !player1 || !player2 || !me || !opponent) {
        return <div className="flex h-dvh w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
             <AlertDialog open={!!showMatchResult} onOpenChange={() => router.push('/bliss-zone')}>
                <AlertDialogContent>
                    <AlertDialogHeader className="items-center">
                        <Trophy className="h-16 w-16 text-yellow-500" />
                        <AlertDialogTitle className="text-center text-3xl">{showMatchResult}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => router.push('/bliss-zone')}>Back to Bliss Zone</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!showRoundResult}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-2xl">{showRoundResult}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleNextRound}>Next Round</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <header className="flex-shrink-0 text-center p-4">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <div className="h-8 w-8 flex items-center justify-center gap-0.5"><X className="h-6 w-6 text-primary" /><CheckSquare className="h-6 w-6 text-primary" /></div>
                    XO Game
                </h1>
                <p className="text-muted-foreground">{isMyTurn ? "Your Turn" : `Waiting for ${opponent.full_name}...`}</p>
            </header>

            <main className="flex-1 flex flex-col justify-around items-center px-4">
                <div className="grid grid-cols-3 items-center gap-4 w-full max-w-md">
                     <div className="flex flex-col items-center gap-2">
                        <Badge variant={game.current_turn === me.id ? "default" : "secondary"}>YOU</Badge>
                        <Avatar className="h-16 w-16 md:h-20 md:w-20" profile={me} />
                        <p className="font-bold text-sm md:text-base">{me.full_name}</p>
                        <p className="text-2xl font-bold">{game.player1_id === me.id ? game.player1_score : game.player2_score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-bold text-muted-foreground">VS</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Badge variant={game.current_turn === opponent.id ? "default" : "secondary"}>OPPONENT</Badge>
                        <Avatar className="h-16 w-16 md:h-20 md:w-20" profile={opponent} />
                        <p className="font-bold text-sm md:text-base">{opponent.full_name}</p>
                         <p className="text-2xl font-bold">{game.player1_id === opponent.id ? game.player1_score : game.player2_score}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {game.board_state.map((cell, index) => (
                        <XoCell key={index} value={cell} onCellClick={() => handleCellClick(index)} />
                    ))}
                </div>
            </main>
        </div>
    );
}
