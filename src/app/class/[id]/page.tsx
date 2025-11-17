
import { Suspense } from "react";
import IndividualClassPageContent from "./IndividualClassPageContent";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

export default function IndividualClassPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <IndividualClassPageContent params={params} />
    </Suspense>
  );
}
