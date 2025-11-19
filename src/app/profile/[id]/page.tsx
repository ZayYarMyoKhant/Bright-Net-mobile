
// /src/app/profile/[id]/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import UserProfilePageContent from "./UserProfilePageContent";
import { BottomNav } from "@/components/bottom-nav";


// This is the Server Page component that handles the route.
export default function UserProfilePage({ params }: { params: { id: string } }) {
  // Pass the params to the Client Component as props.
  return (
    <Suspense fallback={
        <>
            <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
            </div>
            <BottomNav />
        </>
    }>
        <UserProfilePageContent params={params} />
    </Suspense>
  );
}
