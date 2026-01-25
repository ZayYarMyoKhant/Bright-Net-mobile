
// /src/app/profile/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import UserProfilePageContent from "./UserProfilePageContent";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function generateStaticParams() {
  return []
}

// This is the Server Page component that handles the route.
export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());
  const profileId = params.id;

  const { data: { user: authUser } } = await supabase.auth.getUser();

  const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', profileId).single();

  if (profileError || !profileData) {
    const initialData = { profile: null, posts: [], error: profileError?.message || 'User not found.' };
    return <UserProfilePageContent initialData={initialData} params={params} />;
  }

  const isOwnProfile = authUser?.id === profileData.id;

  const [followersRes, followingRes, postsRes, followStatusRes] = await Promise.all([
      supabase.from('followers').select('follower_id', { count: 'exact' }).eq('user_id', profileId),
      supabase.from('followers').select('user_id', { count: 'exact' }).eq('follower_id', profileId),
      supabase.from('posts').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
      authUser && !isOwnProfile
          ? supabase.from('followers').select('*').eq('user_id', profileId).eq('follower_id', authUser.id).maybeSingle()
          : Promise.resolve({ data: null })
  ]);
  
  const isFollowingUser = !!followStatusRes?.data;
  
  const initialData = {
    profile: {
      ...profileData,
      bio: profileData.bio || "Another digital creator's bio.",
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
      is_following: isFollowingUser,
      is_private: profileData.is_private || false,
      last_seen: profileData.last_seen,
      show_active_status: profileData.show_active_status,
      is_in_relationship: profileData.is_in_relationship,
      is_verified: profileData.is_verified,
      profile_design: profileData.profile_design,
    },
    posts: postsRes.data || [],
    error: null,
  };


  return (
    <Suspense fallback={
        <>
            <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
            </div>
            <BottomNav />
        </>
    }>
        <UserProfilePageContent initialData={initialData} params={params} />
    </Suspense>
  );
}
