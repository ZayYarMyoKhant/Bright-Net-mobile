
import { PostCard } from "./post-card";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/data";

export async function PostFeed() {
  const supabase = createClient();
  
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return <div className="text-destructive-foreground bg-destructive p-4 rounded-md text-center">Error loading posts. Please try again later.</div>
  }
  
  if (!posts || posts.length === 0) {
    return <div className="text-muted-foreground flex items-center justify-center h-full p-10 text-center">No posts yet. Be the first one to share something!</div>
  }

  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {posts.map((post) => (
        // The data from Supabase doesn't perfectly match the PostCard's expected props.
        // We need to adapt it here.
        <PostCard key={post.id} post={{
          id: post.id,
          caption: post.caption,
          media_url: post.media_url,
          created_at: post.created_at,
          user: {
            // @ts-ignore because profiles can be an array
            username: post.profiles.username,
            // @ts-ignore
            avatar: post.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`,
          },
          likes: 0, // Placeholder
          comments: [], // Placeholder
          shares: 0, // Placeholder
        }} />
      ))}
    </div>
  );
}
