
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/data";
import { PostCard } from "./post-card";

export async function PostFeed() {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles (*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return <div className="text-white flex items-center justify-center h-full p-4">Error loading feed. Please try again.</div>;
  }
  
  if (!posts || posts.length === 0) {
    return <div className="text-muted-foreground flex items-center justify-center h-full p-10 text-center">No posts yet. Be the first one to share something!</div>
  }

  const formattedPosts: Post[] = posts.map((post: any) => ({
    id: post.id,
    media_url: post.media_url,
    media_type: post.media_type,
    caption: post.caption,
    created_at: post.created_at,
    user: {
      id: post.profiles.id,
      username: post.profiles.username,
      avatar: post.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.profiles.id}`,
    },
    // These are placeholders for now
    likes: 0,
    comments: [],
    shares: 0,
  }));


  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {formattedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
