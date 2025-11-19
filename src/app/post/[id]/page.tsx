
// /src/app/post/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PostViewerContent from "./PostViewerContent";


// This function is required for static export with dynamic routes.
// Returning an empty array means no pages will be pre-rendered at build time.
// They will be generated on-demand on the client-side.
export function generateStaticParams() {
  return [];
}

// This is the Server Page component that handles the route.
export default function FullScreenPostPage({ params }: { params: { id: string } }) {
  // Pass the params to the Client Component as props.
  return (
    <Suspense fallback={
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    }>
      <PostViewerContent params={params} />
    </Suspense>
  );
}
