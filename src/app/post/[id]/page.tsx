
// /src/app/post/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PostViewerContent from "./PostViewerContent";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Post } from "@/lib/data";

// This is the Server Page component that handles the route.
export default async function FullScreenPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());

  const { data: { user } } = await supabase.auth.getUser();

  const { data: postData, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
    .eq('id', params.id)
    .single();

  let post: Post | null = null;
  let pageError: string | null = null;

  if (error || !postData) {
    pageError = error?.message || "Post not found";
  } else {
    const { data: userLike } = user ? await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', postData.id)
      .single() : { data: null };

    post = {
      id: postData.id,
      // @ts-ignore
      user: postData.profiles,
      media_url: postData.media_url,
      media_type: postData.media_type,
      caption: postData.caption,
      created_at: postData.created_at,
      // @ts-ignore
      likes: postData.likes[0]?.count || 0,
      // @ts-ignore
      comments: postData.comments[0]?.count || 0,
      isLiked: !!userLike,
    };
  }
  
  return (
    <Suspense fallback={
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    }>
      <PostViewerContent post={post} error={pageError} currentUser={user} />
    </Suspense>
  );
}

    