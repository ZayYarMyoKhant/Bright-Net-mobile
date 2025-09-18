
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Search, MoreHorizontal, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";


// Mock data for now, will be replaced with real data from Supabase
const users: any[] = [];

export default function FollowersPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("followers");

    const onTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'following') {
            router.push(`/profile/${params.id}/following`);
        }
    };
    
    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-lg">@{params.id}</h1>
                <Button variant="ghost" size="icon">
                    <UserPlus className="h-5 w-5" />
                </Button>
            </header>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
                    <TabsTrigger value="following" className="text-base">Following</TabsTrigger>
                    <TabsTrigger value="followers" className="text-base">Followers</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="flex-shrink-0 p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-10" />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {users.length > 0 ? (
                    <div className="divide-y">
                        {users.map(user => (
                            <div key={user.id} className="p-4 flex items-center gap-4">
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                                <Button>Follow</Button>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                        <UserX className="h-12 w-12 mb-4" />
                        <p className="font-bold">No followers yet</p>
                        <p className="text-sm mt-1">When someone follows them, they'll appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

    