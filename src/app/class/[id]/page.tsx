
import { Suspense } from "react";
import IndividualClassPageContent from "./IndividualClassPageContent";

export async function generateStaticParams() {
  return [];
}

export default function IndividualClassPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IndividualClassPageContent params={params} />
    </Suspense>
  );
}
