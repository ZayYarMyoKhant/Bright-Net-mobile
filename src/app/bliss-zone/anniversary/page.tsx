
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, Heart, Calendar as CalendarIcon, Users, ArrowLeft, ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CoupleData = {
    id: string;
    first_loving_day: string | null;
    user1: { id: string; full_name: string; avatar_url: string; };
    user2: { id: string; full_name: string; avatar_url: string; };
};

type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
    is_in_relationship: boolean;
};

type CoupleRequest = {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
    profiles: Profile;
};

export default function AnniversaryPage() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [couple, setCouple] = useState<CoupleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | undefined>(undefined);
    
    // For "Choose Honey" UI
    const [following, setFollowing] = useState<Profile[]>([]);
    const [isRequesting, setIsRequesting] = useState<string | null>(null);
    const [incomingRequests, setIncomingRequests] = useState<CoupleRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<CoupleRequest[]>([]);
    const [handlingRequest, setHandlingRequest] = useState<string | null>(null);


    const fetchPageData = useCallback(async (user: User) => {
        setLoading(true);

        // 1. Check if user is in an accepted couple relationship
        const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select(`
                id,
                first_loving_day,
                user1:user1_id(id, full_name, avatar_url),
                user2:user2_id(id, full_name, avatar_url)
            `)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .eq('status', 'accepted')
            .single();

        if (coupleData) {
            setCouple(coupleData as unknown as CoupleData);
            if (coupleData.first_loving_day) {
                setDate(new Date(coupleData.first_loving_day));
            }
            setLoading(false);
            return; // Stop execution if couple found
        }
        
        // 2. If not in a couple, fetch data for "Choose Honey" UI
        setCouple(null);

        // Fetch following list
        const { data: followingData, error: followingError } = await supabase
            .from('followers')
            .select('profiles!followers_user_id_fkey(*)')
            .eq('follower_id', user.id);

        if (followingError) {
            console.error("Error fetching following list:", followingError);
            toast({ variant: 'destructive', title: 'Error fetching your followings' });
        } else if (followingData) {
            const friendProfiles = followingData.map((f: any) => f.profiles).filter(Boolean);
            setFollowing(friendProfiles as Profile[]);
        }

        // Fetch incoming couple requests
        const { data: incomingData, error: incomingError } = await supabase
            .from('couples')
            .select('*, profiles:user1_id(*)')
            .eq('user2_id', user.id)
            .eq('status', 'requesting');
        
        if (incomingError) console.error("Error fetching incoming requests:", incomingError);
        else setIncomingRequests(incomingData as unknown as CoupleRequest[]);

        // Fetch outgoing couple requests
        const { data: outgoingData, error: outgoingError } = await supabase
            .from('couples')
            .select('*, profiles:user2_id(*)')
            .eq('user1_id', user.id)
            .eq('status', 'requesting');

        if (outgoingError) console.error("Error fetching outgoing requests:", outgoingError);
        else setOutgoingRequests(outgoingData as unknown as CoupleRequest[]);

        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user }}) => {
            if (!user) {
                router.push('/signup');
            } else {
                setCurrentUser(user);
                fetchPageData(user);
            }
        });
    }, [supabase, router, fetchPageData]);

    // Realtime listener for couple requests
    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('public:couples')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'couples' }, (payload) => {
                // Re-fetch all data on any change in the couples table for simplicity
                fetchPageData(currentUser);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, supabase, fetchPageData]);
    
    
    const handleRequest = async (partnerId: string) => {
        if (!currentUser) return;
        setIsRequesting(partnerId);

        const { error } = await supabase.from('couples').insert({
            user1_id: currentUser.id,
            user2_id: partnerId,
            status: 'requesting'
        });
        
        setIsRequesting(null);

        if (error) {
             if (error.code === '23505') { 
                toast({ variant: 'destructive', title: 'Request already exists', description: 'You may have already sent or received a request from this person.' });
             } else {
                toast({ variant: 'destructive', title: 'Could not send request', description: error.message });
             }
        } else {
            toast({ title: "Request sent!", description: "Waiting for them to accept." });
        }
    };
    
    const handleCancelRequest = async (requestId: string) => {
        setHandlingRequest(requestId);
        const { error } = await supabase.from('couples').delete().eq('id', requestId);
        setHandlingRequest(null);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel request.' });
        } else {
            toast({ title: 'Request cancelled.' });
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        setHandlingRequest(requestId);
        const { error } = await supabase.rpc('accept_couple_request', { request_id: requestId });
        setHandlingRequest(null);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to accept.', description: error.message });
        } else {
            toast({ title: 'Congratulations!', description: 'You are now a couple.'});
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        setHandlingRequest(requestId);
        const { error } = await supabase.from('couples').delete().eq('id', requestId);
        setHandlingRequest(null);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to decline.' });
        } else {
            toast({ title: 'Request declined.' });
        }
    };

    const handleDateSave = async () => {
        if (!date || !couple) return;

        const { error } = await supabase
            .from('couples')
            .update({ first_loving_day: date.toISOString() })
            .eq('id', couple.id);

        if (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not save the date." });
        } else {
            toast({ title: "Success!", description: "Your special day has been saved." });
            if (currentUser) fetchPageData(currentUser);
        }
    };

    const handleBreakUp = async () => {
        if (!couple) return;

        const { error } = await supabase.rpc('break_up', { p_couple_id: couple.id });
        if (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not process break up." });
        } else {
            toast({ title: "Relationship ended" });
            setCouple(null);
            setDate(undefined);
            if (currentUser) fetchPageData(currentUser); 
        }
    };
    
    if (loading && !couple) { // Only show full-page loader on initial load
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (couple) {
        const partner = couple.user1.id === currentUser?.id ? couple.user2 : couple.user1;
        const you = couple.user1.id === currentUser?.id ? couple.user1 : couple.user2;
        const daysTogether = couple.first_loving_day ? differenceInDays(new Date(), new Date(couple.first_loving_day)) + 1 : null;

        return (
             <div className="flex h-dvh flex-col items-center justify-center bg-sky-100 text-foreground p-4">
                <Card className="w-full max-w-sm shadow-2xl rounded-3xl bg-ivory-50">
                    <CardContent className="p-6 text-center">
                        <p className="font-bold text-lg text-pink-500">Loving Couple</p>
                        <div className="flex justify-around items-center mt-4">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="h-20 w-20 border-4 border-pink-200" profile={you} />
                                <p className="font-semibold">{you.full_name}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Heart className="h-10 w-10 text-red-500 fill-red-500" />
                                {daysTogether !== null && <p className="font-bold text-xl text-red-500 mt-1">{daysTogether} Days</p>}
                                <p className="text-xs text-muted-foreground">loving</p>
                            </div>
                             <div className="flex flex-col items-center gap-2">
                                <Avatar className="h-20 w-20 border-4 border-pink-200" profile={partner} />
                                <p className="font-semibold">{partner.full_name}</p>
                            </div>
                        </div>
                        
                        <div className="text-left mt-8 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">First Loving Day</label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className="w-full justify-start text-left font-normal mt-1"
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Today</label>
                                <p className="font-semibold text-lg">{format(new Date(), "PPP")}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            <Button onClick={handleDateSave} className="bg-pink-500 hover:bg-pink-600" disabled={!date}>Save Date</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Break Up</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will end your relationship with {partner.full_name}. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBreakUp} className="bg-destructive hover:bg-destructive/90">Confirm Break Up</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                    </CardContent>
                </Card>
             </div>
        );
    }
    
    // "Choose your honey" UI
    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/bliss-zone" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 mx-auto">
                    <Heart className="h-6 w-6 text-pink-500" />
                    <h1 className="text-xl font-bold">Choose your honey</h1>
                </div>
            </header>
            
            <Tabs defaultValue="browse" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 rounded-none">
                    <TabsTrigger value="browse">Browse</TabsTrigger>
                    <TabsTrigger value="requests_to_you">
                        Requests to you <span className="ml-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{incomingRequests.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="your_requests">Your Requests</TabsTrigger>
                </TabsList>
                
                <TabsContent value="browse" className="flex-1 mt-0">
                    <ScrollArea className="h-full">
                        {following.length > 0 ? (
                            <div className="divide-y">
                                {following.map(friend => (
                                    <div key={friend.id} className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12" profile={friend} />
                                        <div className="flex-1">
                                            <p className="font-semibold">{friend.full_name}</p>
                                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleRequest(friend.id)} 
                                            disabled={!!isRequesting || friend.is_in_relationship}
                                        >
                                            {isRequesting === friend.id ? <Loader2 className="h-4 w-4 animate-spin" /> : friend.is_in_relationship ? 'Taken' : 'Invite'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="font-bold">No one to invite</p>
                                <p className="text-sm mt-1">Follow some people to find your honey!</p>
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
                
                <TabsContent value="requests_to_you" className="flex-1 mt-0">
                    <ScrollArea className="h-full">
                       {incomingRequests.length > 0 ? (
                           <div className="divide-y">
                               {incomingRequests.map(req => (
                                   <div key={req.id} className="p-4 flex items-center gap-4">
                                       <Avatar className="h-12 w-12" profile={req.profiles} />
                                       <div className="flex-1">
                                           <p className="font-semibold">{req.profiles.full_name}</p>
                                           <p className="text-sm text-muted-foreground">@{req.profiles.username}</p>
                                       </div>
                                       <div className="flex gap-2">
                                            <Button size="icon" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleDeclineRequest(req.id)} disabled={handlingRequest === req.id}>
                                                {handlingRequest === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="outline" className="border-green-500 text-green-500 hover:bg-green-50" onClick={() => handleAcceptRequest(req.id)} disabled={handlingRequest === req.id}>
                                                {handlingRequest === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                            </Button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                               <Users className="h-12 w-12 mb-4" />
                               <p className="font-bold">No incoming requests</p>
                           </div>
                       )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="your_requests" className="flex-1 mt-0">
                     <ScrollArea className="h-full">
                       {outgoingRequests.length > 0 ? (
                           <div className="divide-y">
                               {outgoingRequests.map(req => (
                                   <div key={req.id} className="p-4 flex items-center gap-4">
                                       <Avatar className="h-12 w-12" profile={req.profiles} />
                                       <div className="flex-1">
                                           <p className="font-semibold">{req.profiles.full_name}</p>
                                           <p className="text-sm text-muted-foreground">@{req.profiles.username}</p>
                                       </div>
                                       <Button variant="destructive" onClick={() => handleCancelRequest(req.id)} disabled={handlingRequest === req.id}>
                                            {handlingRequest === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Cancel'}
                                       </Button>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                               <Users className="h-12 w-12 mb-4" />
                               <p className="font-bold">No outgoing requests</p>
                           </div>
                       )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
