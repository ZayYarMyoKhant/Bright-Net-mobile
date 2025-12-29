
import { PostCard } from "./post-card";
import type { Post } from "@/lib/data";
import { CameraOff, Loader2 } from "lucide-react";
import React from "react";
import { AdBanner } from "./ad-banner";

export function PostFeed({ posts, loading }: { posts: Post[], loading: boolean }) {

  if (loading) {
     return (
        <div className="flex h-full w-full items-center justify-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
     )
  }

  if (posts.length === 0) {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center pt-20 text-center text-muted-foreground">
            <CameraOff className="h-12 w-12" />
            <p className="mt-4 font-semibold">No News Posts Yet</p>
            <p className="text-sm">Be the first to create a post!</p>
        </div>
    )
  }

  const itemsWithAds: React.ReactNode[] = [];
  posts.forEach((post, index) => {
    itemsWithAds.push(<PostCard key={post.id} post={post} />);
    // Insert an Ad Banner after every 3 posts
    if ((index + 1) % 3 === 0) {
      itemsWithAds.push(<div key={`ad-wrapper-${index}`} className="my-4"><AdBanner key={`ad-${index}`} /></div>);
    }
  });


  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {itemsWithAds.map((item, index) => (
        <React.Fragment key={index}>{item}</React.Fragment>
      ))}
    </div>
  );
}
