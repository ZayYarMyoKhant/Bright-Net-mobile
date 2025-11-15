
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Couple } from '@/lib/data';

type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
};

// This function is required for static export
export async function generateStaticParams() {
  return [];
}

export default function AnniversaryRequestingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const coupleId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [honey, setHoney] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchCoupleData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/signup');
                return;
            }
            setCurrentUser(user);

            const { data, error } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', coupleId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'Request not found' });
                router.push('/bliss-zone/anniversary');
                return;
            }
            
            const partnerId = data.user1_id === user.id ? data.user2_id : data.user1_id;
            
            const { data: partnerProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', partnerId)
                .single();

            if(profileError || !partnerProfile) {
                 toast({ variant: 'destructive', title: 'Partner not found' });
                 router.push('/bliss-zone/anniversary');
                 return;
            }

            setHoney(partnerProfile);
            setLoading(false);
        };
        fetchCoupleData();

    }, [coupleId, router, supabase, toast]);

    useEffect(() => {
        if(!coupleId) return;

        const channel = supabase
            .channel(`couple-request-${coupleId}`)
            .on<Couple>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
                (payload) => {
                    const couple = payload.new;
                    if (couple.status === 'accepted') {
                        router.push(`/bliss-zone/anniversary`);
                    } else if (couple.status === 'declined' || couple.status === 'broken_up') {
                        toast({ variant: 'destructive', title: 'Request Declined', description: `${honey?.full_name} declined your couple request.` });
                        router.push('/bliss-zone/anniversary');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [coupleId, router, supabase, toast, honey?.full_name]);

    const handleCancel = async () => {
        const { error } = await supabase
            .from('couples')
            .delete()
            .eq('id', coupleId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to cancel' });
        } else {
            router.push('/bliss-zone/anniversary');
        }
    };

    if (loading || !honey) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col items-center justify-center bg-pink-50 text-foreground text-center p-4">
            <Heart className="h-16 w-16 text-pink-400 animate-pulse" />
            <Avatar className="h-32 w-32 border-4 border-pink-300 mt-4" profile={honey} />
            <h2 className="mt-4 text-2xl font-bold">Requesting to be a couple with</h2>
            <h3 className="text-xl text-primary">{honey.full_name}</h3>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for response...
            </p>
            <Button variant="outline" className="mt-8" onClick={handleCancel}>
                Cancel Request
            </Button>
        </div>
    );
}
