"use client";

import { PostCard } from "./post-card";
import type { Post } from "@/lib/data";
import { CameraOff, Loader2 } from "lucide-react";
import React from "react";
import { AdsterraNative } from "./adsterra-native";

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

  // Insert Adsterra Native Ad every 3 posts
  const feedItems = posts.flatMap((post, index) => {
    const isThirdPost = (index + 1) % 3 === 0;
    return isThirdPost ? [post, <AdsterraNative key={`ad-${index}`} />] : [post];
  });

  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-4">
      {feedItems.map((item, index) => (
        <React.Fragment key={index}>
          {React.isValidElement(item) ? item : <PostCard post={item as Post} />}
        </React.Fragment>
      ))}
    </div>
  );
}
