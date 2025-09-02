
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Send, Swords } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const words = [
    "The quick brown fox jumps over the lazy dog.",
    "Programming is the art of telling a computer what to do.",
    "Never underestimate the bandwidth of a station wagon full of tapes.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "The way to get started is to quit talking and begin doing."
];

export default function TypingBattlePage() {
  const [inputValue, setInputValue] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  const opponent = {
    name: "Bright-AI",
    avatar: "https://i.pravatar.cc/150?u=bright-ai",
  };

  const you = {
    name: "You",
    avatar: "https://i.pravatar.cc/150?u=aungaung",
  };

  useEffect(() => {
    if (!isFinished && timeLeft > 0) {
        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
        return () => clearInterval(timer);
    } else if (timeLeft === 0) {
        endGame();
    }
  }, [timeLeft, isFinished]);
  
  useEffect(() => {
    if (!isFinished) {
      setOpponentScore(prev => Math.min(score + Math.floor(Math.random() * 5), 100));
    }
  }, [score, isFinished]);
  
  useEffect(() => {
    if (!isFinished) {
      startNewRound();
    }
  }, [isFinished]);

  const startNewRound = () => {
    setCurrentWord(words[Math.floor(Math.random() * words.length)]);
    setInputValue("");
    setProgress(0);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    const value = e.target.value;
    setInputValue(value);

    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
        if (value[i] === currentWord[i]) {
            correctChars++;
        }
    }
    setProgress((correctChars / currentWord.length) * 100);

    if (value === currentWord) {
        setScore(prev => prev + 1);
        startNewRound();
    }
  };
  
  const endGame = () => {
    setIsFinished(true);
  }
  
  const resetGame = () => {
    setScore(0);
    setOpponentScore(0);
    setTimeLeft(60);
    setIsFinished(false);
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 mx-auto">
           <h1 className="text-xl font-bold">Typing Battle</h1>
           <Swords className="h-5 w-5" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-around items-center text-center">
            <div className="flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20 border-2 border-primary">
                    <AvatarImage src={you.avatar} alt={you.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{you.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{you.name}</p>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">Vs</p>
            <div className="flex flex-col items-center gap-2">
                 <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={opponent.avatar} alt={opponent.name} data-ai-hint="robot mascot" />
                    <AvatarFallback>{opponent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{opponent.name}</p>
            </div>
        </div>

        <Card>
            <CardContent className="p-4">
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Your Score</p>
                        <p className="text-3xl font-bold">{score}</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <p className="text-3xl font-bold">{timeLeft}</p>
                        <p className="text-sm text-muted-foreground">Seconds left</p>
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Enemy Score</p>
                        <p className="text-3xl font-bold">{opponentScore}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {isFinished ? (
            <Card className="bg-muted">
                <CardContent className="p-4 text-center">
                    <h3 className="text-2xl font-bold">
                        {score > opponentScore ? "You Win!" : score < opponentScore ? "You Lose!" : "It's a Tie!"}
                    </h3>
                    <p className="text-muted-foreground mt-2">Your final score is {score}.</p>
                    <Button onClick={resetGame} className="mt-4">Play Again</Button>
                </CardContent>
            </Card>
        ) : (
            <>
                <Card className="bg-muted">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Type this sentence:</p>
                        <p className="text-lg font-semibold mt-1 tracking-wider">{currentWord}</p>
                    </CardContent>
                </Card>
                <Progress value={progress} className="h-2" />
            </>
        )}

      </main>

       <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Start typing here..." 
              className="flex-1"
              value={inputValue}
              onChange={handleInputChange}
              disabled={isFinished}
            />
            <Button size="icon" disabled>
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
