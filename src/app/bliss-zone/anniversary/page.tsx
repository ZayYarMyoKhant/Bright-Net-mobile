
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, Heart, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';

type CoupleData = {
    id: string;
    first_loving_day: string | null;
    user1: { id: string; full_name: string; avatar_url: string; };
    user2: { id: string; full_name: string; avatar_url: string; };
};

export default function AnniversaryPage() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [couple, setCouple] = useState<CoupleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | undefined>(undefined);

    const fetchCoupleData = useCallback(async (user: User) => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_couple_details', { user_id_param: user.id });

        if (error) {
            console.error("Error fetching couple data:", error);
            // This error is expected if user is not in a couple, so don't toast
        } else if (data && data.length > 0) {
            setCouple(data[0]);
            if (data[0].first_loving_day) {
                setDate(new Date(data[0].first_loving_day));
            }
        }
        setLoading(false);
    }, [supabase]);

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
            router.refresh(); // To update profile avatars
        }
    };
    
    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!couple) {
        return (
             <div className="flex h-dvh flex-col items-center justify-center bg-background text-foreground text-center p-4">
                <Users className="h-20 w-20 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">You are not in a relationship yet.</h2>
                <p className="text-muted-foreground mt-2">Find your honey and start your journey!</p>
                <Link href="/bliss-zone/anniversary/choose-honey" className="mt-8">
                    <Button>Choose Your Honey</Button>
                </Link>
            </div>
        )
    }

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
