
import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";
import { Loader2 } from "lucide-react";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
