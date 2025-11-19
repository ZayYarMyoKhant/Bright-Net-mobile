
import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";
import { Loader2 } from "lucide-react";

// This function is required for static export with dynamic routes.
// Returning an empty array means no pages will be pre-rendered at build time.
// They will be generated on-demand on the client-side.
export function generateStaticParams() {
  return [];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
