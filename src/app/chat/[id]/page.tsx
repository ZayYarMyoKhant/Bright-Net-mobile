
import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";
import { Loader2 } from "lucide-react";

// This function is required for static export with 'output: export'
export async function generateStaticParams() {
  // We don't want to generate any pages at build time, so we return an empty array.
  // The pages will be generated on-demand at request time.
  return [];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
