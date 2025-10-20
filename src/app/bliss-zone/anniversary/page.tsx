
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, Heart, Calendar as CalendarIcon, Users, ArrowLeft } from 'lucide-react';
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
}

export default function AnniversaryPage() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [couple, setCouple] = useState<CoupleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [isRequesting, setIsRequesting] = useState<string | null>(null);

    const fetchCoupleData = useCallback(async (user: User) => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_couple_details', { user_id_param: user.id });

        if (error || !data || data.length === 0) {
             if (error && error.code !== 'PGRST116') { 
                console.error("Error fetching couple data:", error);
             }
            
            const { data: followingData, error: followingError } = await supabase
                .from('followers')
                .select('profiles!followers_user_id_fkey(*, couples!couples_user1_id_fkey(status), couples_user2:couples!couples_user2_id_fkey(status))')
                .eq('follower_id', user.id);

            if (followingError) {
                console.error("Error fetching following list:", followingError);
                toast({ variant: 'destructive', title: 'Error fetching friends' });
            } else if (followingData) {
                const friendProfiles = followingData.map((f: any) => {
                    const profile = f.profiles;
                    if (!profile) return null;
                    
                    const isTaken = profile.is_in_relationship || 
                                    profile.couples?.some((c: any) => c.status === 'requesting' || c.status === 'accepted') ||
                                    profile.couples_user2?.some((c: any) => c.status === 'requesting' || c.status === 'accepted');

                    return { ...profile, is_in_relationship: !!isTaken };
                }).filter(Boolean);
                
                setFriends(friendProfiles as Profile[]);
            }
             setCouple(null);

        } else if (data && data.length > 0) {
            setCouple(data[0]);
            if (data[0].first_loving_day) {
                setDate(new Date(data[0].first_loving_day));
            }
        }
        setLoading(false);
    }, [supabase, toast]);


    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user }}) => {
            if (!user) {
                router.push('/signup');
            } else {
                setCurrentUser(user);
                fetchCoupleData(user);
            }
        });
    }, [supabase, router, fetchCoupleData]);
    
    const handleRequest = async (partnerId: string) => {
        if (!currentUser) return;
        setIsRequesting(partnerId);

        const { data, error } = await supabase
            .from('couples')
            .insert({
                user1_id: currentUser.id,
                user2_id: partnerId,
                status: 'requesting'
            })
            .select('id')
            .single();
        
        setIsRequesting(null);

        if (error) {
             if (error.code === '23505') { 
                toast({ variant: 'destructive', title: 'Request already exists', description: 'You may have already sent or received a request from this person.' });
             } else {
                toast({ variant: 'destructive', title: 'Could not send request', description: error.message });
             }
        } else {
            router.push(`/bliss-zone/anniversary/requesting/${data.id}`);
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
            if (currentUser) fetchCoupleData(currentUser);
        }
    };

    const handleBreakUp = async () => {
        if (!couple) return;

        const { error } = await supabase.rpc('break_up_couple', { couple_id_param: couple.id });
        if (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not process break up." });
        } else {
            toast({ title: "Relationship ended" });
            setCouple(null);
            setDate(undefined);
            if (currentUser) fetchCoupleData(currentUser); 
        }
    };
    
    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // If user has a couple, show anniversary page
    if (couple) {
        const partner = couple.user1.id === currentUser?.id ? couple.user2 : couple.user1;
        const you = couple.user1.id === currentUser?.id ? couple.user1 : couple.user2;
        const daysTogether = couple.first_loving_day ? differenceInDays(new Date(), new Date(couple.first_loving_day)) + 1 : null;

        return (
             <div className="flex h-dvh flex-col items-center justify-center bg-pink-50 text-foreground p-4">
                <Card className="w-full max-w-sm shadow-2xl rounded-3xl">
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
    
    // If no couple, show "Choose your honey" page
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

            <ScrollArea className="flex-1">
                {friends.length > 0 ? (
                    <div className="divide-y">
                        {friends.map(friend => (
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
                        <p className="font-bold">No friends found</p>
                        <p className="text-sm mt-1">Follow some people to find your honey!</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
