
// /src/app/class/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import IndividualClassPageContent from "./IndividualClassPageContent";

// ဤသည်မှာ အမှန်တကယ် Route ကို ဖော်ပြသော Server Page component ဖြစ်သည်။
export default function IndividualClassPage({ params }: { params: { id:string } }) {
  // params ကို Client Component သို့ props အဖြစ် ပို့ပေးပါ
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <IndividualClassPageContent params={params} />
    </Suspense>
  );
}
