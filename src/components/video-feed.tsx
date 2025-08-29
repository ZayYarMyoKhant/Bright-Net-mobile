import { getVideoPosts } from "@/lib/data";
import { VideoPlayer } from "@/components/video-player";

export function VideoFeed() {
  const posts = getVideoPosts();

  return (
    <div className="relative h-full w-full snap-y snap-mandatory overflow-y-auto bg-black">
      {posts.map((post) => (
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
