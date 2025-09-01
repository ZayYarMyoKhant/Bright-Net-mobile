
import { getNewsPosts } from "@/lib/data";
import type { Post } from "@/lib/data";
import { PostCard } from "./post-card";

export function PostFeed() {
  const posts = getNewsPosts();
  
  if (!posts || posts.length === 0) {
    return <div className="text-muted-foreground flex items-center justify-center h-full p-10 text-center">No posts yet. Be the first one to share something!</div>
  }

  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
