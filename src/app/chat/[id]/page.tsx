// /src/app/chat/[id]/page.tsx
// (Server Component ဖြစ်သည့်အတွက် "use client" မပါပါ)

import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";
import { Loader2 } from "lucide-react";

// Build Error များကို ဖြေရှင်းရန် generateStaticParams() ကို ထည့်သွင်းခြင်း
export function generateStaticParams() {
  return []; // Static Export အတွက် Route ကို စာရင်းမသွင်းခြင်း
}

// ဤသည်မှာ အမှန်တကယ် Route ကို ဖော်ပြသော Server Page component ဖြစ်သည်။
export default function ChatPage({ params }: { params: { id: string } }) {
  // params ကို Client Component သို့ props အဖြစ် ပို့ပေးပါ
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
