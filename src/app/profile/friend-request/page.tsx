
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type FollowRequest = {
  profile_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  type: 'request_to_you' | 'your_request';
};

export default function FriendRequestPage() {
  const [incomingRequests, setIncomingRequests] = useState<FollowRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/signup');
      return;
    }

    const { data, error } = await supabase.rpc('get_follow_requests');
    if (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch follow requests." });
    } else {
      setIncomingRequests(data.filter(r => r.type === 'request_to_you'));
      setOutgoingRequests(data.filter(r => r.type === 'your_request'));
    }
    setLoading(false);
  }, [supabase, toast, router]);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('public:followers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followers' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, supabase]);

  const handleFollowBack = async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('followers').insert({ user_id: targetId, follower_id: user.id });
    if (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not follow back." });
    } else {
      toast({ title: "Followed back!" });
      fetchRequests(); // Re-fetch to update lists
    }
  };
  
    const handleCancelRequest = async (targetId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('followers').delete().match({ user_id: targetId, follower_id: user.id });
        if (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not cancel request." });
        } else {
            toast({ title: "Request cancelled." });
            fetchRequests();
        }
    };


  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/profile" className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold mx-auto">Follow Requests</h1>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <Tabs defaultValue="to_you" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
              <TabsTrigger value="to_you" className="rounded-none text-base">
                Request to you ({incomingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="your_request" className="rounded-none text-base">
                Your Request ({outgoingRequests.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="to_you">
              {incomingRequests.length > 0 ? (
                <div className="divide-y">
                    {incomingRequests.map((req) => (
                        <div key={req.profile_id} className="p-4 flex items-center gap-4">
                             <Link href={`/profile/${req.profile_id}`}>
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={req.avatar_url} alt={req.full_name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{req.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1">
                                <Link href={`/profile/${req.profile_id}`}>
                                    <p className="font-semibold">{req.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{req.username}</p>
                                </Link>
                            </div>
                            <Button size="sm" onClick={() => handleFollowBack(req.profile_id)}>Follow back</Button>
                        </div>
                    ))}
                </div>
              ) : (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                    <Users className="h-12 w-12 mb-4" />
                    <p className="font-bold">No new requests</p>
                    <p className="text-sm mt-1">When someone follows you, you'll see it here.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="your_request">
              {outgoingRequests.length > 0 ? (
                <div className="divide-y">
                    {outgoingRequests.map((req) => (
                        <div key={req.profile_id} className="p-4 flex items-center gap-4">
                            <Link href={`/profile/${req.profile_id}`}>
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={req.avatar_url} alt={req.full_name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{req.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1">
                                <Link href={`/profile/${req.profile_id}`}>
                                    <p className="font-semibold">{req.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{req.username}</p>
                                </Link>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleCancelRequest(req.profile_id)}>Following</Button>
                        </div>
                    ))}
                </div>
              ) : (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                    <Users className="h-12 w-12 mb-4" />
                    <p className="font-bold">You haven't requested to follow anyone.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      )}
    </div>
  );
}
