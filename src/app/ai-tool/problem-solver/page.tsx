
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Bot } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ChatMessage = ({ message, isSender }: { message: string, isSender: boolean }) => {
    return (
        <div className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-xs rounded-lg px-4 py-2 ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message}
            </div>
        </div>
    )
};


export default function AiProblemSolverPage() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Ask me anything", sender: false },
    { id: 2, text: "1+1=?", sender: true },
    { id: 3, text: "the answer is 2", sender: false },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { id: Date.now(), text: inputValue, sender: true }]);
      setInputValue("");
      // Add AI response logic here
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
            <ChatMessage key={msg.id} message={msg.text} isSender={msg.sender} />
        ))}
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Type a message..." 
              className="flex-1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
