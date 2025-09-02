
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'model';
}

const ChatMessage = ({ message, sender }: { message: string, sender: 'user' | 'model' }) => {
    const isUser = sender === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-xs rounded-lg px-4 py-2 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message}
            </div>
             {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            )}
        </div>
    )
};


export default function AiProblemSolverPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you today?", sender: 'model' },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isPending) {
      const newUserMessage: Message = { id: Date.now(), text: inputValue, sender: 'user' };
      setMessages(prev => [...prev, newUserMessage]);
      const currentInput = inputValue;
      setInputValue("");
      setIsPending(true);

      // Mock AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiResponse: Message = { id: Date.now() + 1, text: `This is a mocked response for: "${currentInput}"`, sender: 'model' };
      setMessages(prev => [...prev, aiResponse]);
      setIsPending(false);
    }
  };


  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold mx-auto">AI Problem solver</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg.text} sender={msg.sender} />
        ))}
         {isPending && (
          <div className="flex items-start gap-3 justify-start">
            <Avatar className="h-8 w-8">
              <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
            </Avatar>
            <div className="max-w-xs rounded-lg px-4 py-2 bg-muted flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Type a message..." 
              className="flex-1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isPending}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={isPending || !inputValue.trim()}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
