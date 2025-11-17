
import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";
import { Loader2 } from "lucide-react";

// This function is required for static export with dynamic routes
export async function generateStaticParams() {
  // In a real app, you might fetch popular user IDs to pre-render.
  // For `output: 'export'`, returning an empty array tells Next.js
  // not to pre-render any specific pages at build time.
  // The pages will be generated on the client-side on first visit.
  return [];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
