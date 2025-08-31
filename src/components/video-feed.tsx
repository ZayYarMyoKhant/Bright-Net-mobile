
import { createClient } from "@/lib/supabase/server";
import { VideoPlayer } from "@/components/video-player";
import type { Post } from "@/lib/data";

export async function VideoFeed() {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      media_url,
      media_type,
      caption,
      created_at,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return <div className="text-white flex items-center justify-center h-full">Error loading feed.</div>;
  }
  
  if (!posts || posts.length === 0) {
    return <div className="text-white flex items-center justify-center h-full">No posts yet. Be the first one!</div>
  }

  const formattedPosts: Post[] = posts.map((post: any) => ({
    id: post.id,
    media_url: post.media_url,
    media_type: post.media_type,
    caption: post.caption,
    user: {
      id: post.profiles.id,
      username: post.profiles.username,
      avatar: post.profiles.avatar_url,
    },
    // These are placeholders for now
    likes: 0,
    comments: [],
    shares: 0,
    created_at: post.created_at,
  }));


  return (
    <div className="relative h-full w-full snap-y snap-mandatory overflow-y-auto bg-black">
      {formattedPosts.map((post) => (
        <div
          key={post.id}
          className="h-full w-full snap-start relative flex items-center justify-center"
        >
          <VideoPlayer post={post} />
        </div>
      ))}
    </div>
  );
}
