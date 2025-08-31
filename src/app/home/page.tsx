
import { BottomNav } from "@/components/bottom-nav";
import { VideoFeed } from "@/components/video-feed";
import { createClient } from "@/lib/supabase/server";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function VideoFeedFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <Suspense fallback={<VideoFeedFallback />}>
        <VideoFeed />
      </Suspense>
      <BottomNav />
    </>
  );
}
