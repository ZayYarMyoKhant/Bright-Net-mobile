
"use client";

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords, Crown, Trophy, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { CheckerGame, Profile, CheckerBoardState, CheckerPiece } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from "@/components/ui/alert-dialog";

type Move = { row: number, col: number };

const CheckerCell = ({ piece, isBlack, isValidMove, onClick }: { piece: CheckerPiece | null, isBlack: boolean, isValidMove: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={cn(
            "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center",
            isBlack ? "bg-gray-700" : "bg-gray-300",
            isValidMove && "bg-green-500/50 cursor-pointer"
        )}
    >
        {piece && (
            <div className={cn("relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg", piece.player === 'red' ? 'bg-red-600' : 'bg-black')}>
                {piece.isKing && <Crown className="h-4 w-4 md:h-6 md:h-6 text-yellow-400" />}
            </div>
        )}
    </div>
);

export default function CheckerGamePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const gameId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [game, setGame] = useState<CheckerGame | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [player1, setPlayer1] = useState<Profile | null>(null);
    const [player2, setPlayer2] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState<string | null>(null);
    const [selectedPiece, setSelectedPiece] = useState<Move | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);

    const myColor = game?.player1_id === currentUser?.id ? 'red' : 'black';
    const isMyTurn = game?.current_turn === currentUser?.id;
    const me = currentUser?.id === game?.player1_id ? player1 : player2;
    const opponent = currentUser?.id === game?.player1_id ? player2 : player1;
    const opponentId = opponent?.id;

    const calculateValidMoves = useCallback((board: CheckerBoardState, piece: CheckerPiece, row: number, col: number) => {
        const moves: Move[] = [];
        const jumps: Move[] = [];
        const directions = piece.isKing
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.player === 'red'
                ? [[-1, -1], [-1, 1]]
                : [[1, -1], [1, 1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const jumpRow = row + 2 * dr;
            const jumpCol = col + 2 * dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                // Regular move
                if (board[newRow][newCol] === null) {
                    moves.push({ row: newRow, col: newCol });
                }
                // Jump move
                else if (board[newRow][newCol]?.player !== piece.player && jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && board[jumpRow][jumpCol] === null) {
                    jumps.push({ row: jumpRow, col: jumpCol });
                }
            }
        }
        // If jumps are available, only they are valid moves
        return jumps.length > 0 ? jumps : moves;
    }, []);

    const handleCellClick = (row: number, col: number) => {
        if (!isMyTurn || !game || game.winner) return;

        const piece = game.board_state[row][col];
        if (piece && piece.player === myColor) {
            const possibleMoves = calculateValidMoves(game.board_state, piece, row, col);
            setSelectedPiece({ row, col });
            setValidMoves(possibleMoves);
        } else if (selectedPiece && validMoves.some(m => m.row === row && m.col === col)) {
            // It's a valid move, so execute it.
            makeMove(selectedPiece, { row, col });
        }
    };
    
    const makeMove = async (from: Move, to: Move) => {
        if (!game || !currentUser) return;
    
        let newBoard = JSON.parse(JSON.stringify(game.board_state)); // Deep copy
        const piece = newBoard[from.row][from.col];
        newBoard[to.row][to.col] = piece;
        newBoard[from.row][from.col] = null;
    
        // Handle jump
        if (Math.abs(from.row - to.row) === 2) {
            const jumpedRow = from.row + (to.row - from.row) / 2;
            const jumpedCol = from.col + (to.col - from.col) / 2;
            newBoard[jumpedRow][jumpedCol] = null;
        }
    
        // King me
        if ((piece.player === 'red' && to.row === 0) || (piece.player === 'black' && to.row === 7)) {
            piece.isKing = true;
        }
    
        // Check for winner
        let redPieces = 0;
        let blackPieces = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (newBoard[i][j]) {
                    if (newBoard[i][j].player === 'red') redPieces++;
                    else blackPieces++;
                }
            }
        }
    
        let winnerId = null;
        if (redPieces === 0) winnerId = game.player2_id;
        if (blackPieces === 0) winnerId = game.player1_id;
    
        const { error } = await supabase.from('checker_games').update({
            board_state: newBoard,
            current_turn: opponentId,
            winner: winnerId,
            status: winnerId ? 'completed' : 'in-progress'
        }).eq('id', gameId);
    
        if (error) {
            toast({ variant: 'destructive', title: 'Error making move' });
        } else {
            setSelectedPiece(null);
            setValidMoves([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/signup'); return; }
            setCurrentUser(user);

            const { data: gameData, error } = await supabase
                .from('checker_games')
                .select('*, player1:player1_id(*), player2:player2_id(*)')
                .eq('id', gameId)
                .single();

            if (error || !gameData) {
                toast({ variant: 'destructive', title: 'Game not found' });
                router.push('/bliss-zone');
                return;
            }
            
            setGame(gameData as any);
            setPlayer1(gameData.player1 as Profile);
            setPlayer2(gameData.player2 as Profile);

            if (gameData.winner) {
                 const winnerText = gameData.winner === user.id ? 'You Won!' : 'You Lost!';
                 setShowResult(winnerText);
            }
            
            setLoading(false);
        };
        init();
    }, [gameId, router, supabase, toast]);

     useEffect(() => {
        const channel = supabase
            .channel(`checker-game-${gameId}`)
            .on<CheckerGame>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'checker_games', filter: `id=eq.${gameId}` },
                (payload) => {
                    const newGame = payload.new;
                    setGame(newGame);
                    if (newGame.winner) {
                        const winnerText = newGame.winner === currentUser?.id ? 'You Won!' : 'You Lost!';
                        setShowResult(winnerText);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId, supabase, currentUser?.id]);


    if (loading || !game || !player1 || !player2 || !me || !opponent) {
        return <div className="flex h-dvh w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-dvh flex-col bg-gray-800 text-foreground">
             <AlertDialog open={!!showResult} onOpenChange={() => router.push('/bliss-zone')}>
                <AlertDialogContent>
                    <AlertDialogHeader className="items-center">
                        <Trophy className="h-16 w-16 text-yellow-500" />
                        <AlertDialogTitle className="text-center text-3xl">{showResult}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => router.push('/bliss-zone')}>Back to Bliss Zone</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <header className="flex-shrink-0 text-center p-4 flex items-center justify-between">
                 <button onClick={() => router.back()} className="p-2 text-white"><ArrowLeft /></button>
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-white">
                    <Swords className="h-6 w-6" />
                    Checker
                </h1>
                <div className="w-9"></div>
            </header>

            <main className="flex-1 flex flex-col justify-around items-center px-2">
                 <div className="flex items-center justify-between w-full max-w-md">
                    <div className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", game.current_turn === me.id && "bg-green-500/20")}>
                        <Avatar className="h-16 w-16 border-2" profile={me} />
                        <p className="font-bold text-sm text-white">{me.full_name}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-4xl font-bold text-white">VS</p>
                    </div>
                     <div className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", game.current_turn === opponent.id && "bg-green-500/20")}>
                        <Avatar className="h-16 w-16 border-2" profile={opponent} />
                        <p className="font-bold text-sm text-white">{opponent.full_name}</p>
                    </div>
                </div>

                <div className="p-1 bg-gray-900 rounded-lg shadow-2xl">
                    {game.board_state.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex">
                            {row.map((piece, colIndex) => {
                                const isBlackCell = (rowIndex + colIndex) % 2 === 1;
                                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                                const isValid = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
                                return (
                                    <div key={colIndex} className={cn(isSelected && "outline-2 outline-yellow-400 outline")}>
                                       <CheckerCell 
                                            piece={piece}
                                            isBlack={isBlackCell}
                                            isValidMove={isValid}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                 <p className="text-white font-semibold mt-2">{game.winner ? 'Game Over' : isMyTurn ? "Your Turn" : `Waiting for ${opponent.full_name}...`}</p>
            </main>
        </div>
    );
}
