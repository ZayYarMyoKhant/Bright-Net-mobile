
import { PostCard } from "./post-card";
import { getNewsPosts } from "@/lib/data";
import type { Post } from "@/lib/data";

export function PostFeed() {
  const posts = getNewsPosts();

  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
