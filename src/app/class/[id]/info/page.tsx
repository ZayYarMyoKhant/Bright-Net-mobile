
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ClassInfoPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch class info based on params.id
  const classInfo = {
    id: params.id,
    name: "Advanced Graphic Design",
    description: "Take your design skills to the next level. Join us for weekly workshops and critiques.",
    coverPhoto: "https://picsum.photos/800/400?random=50",
    memberCount: 32,
    createdBy: {
      name: "Aung Aung",
      avatar: "https://i.pravatar.cc/150?u=aungaung",
    },
    avatarFallback: "A",
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
        <Link href={`/class/${classInfo.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="mx-auto text-xl font-bold">Info</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="relative h-48 w-full">
          <Image
            src={classInfo.coverPhoto}
            alt={classInfo.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="abstract design"
          />
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{classInfo.name}</h2>
            <p className="mt-2 text-muted-foreground">{classInfo.description}</p>
          </div>

          <div className="border-t border-b divide-y">
             <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Class Members</span>
                </div>
                <span className="text-muted-foreground">{classInfo.memberCount}</span>
            </div>
             <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Created by</span>
                </div>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={classInfo.createdBy.avatar} alt={classInfo.createdBy.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{classInfo.createdBy.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{classInfo.createdBy.name}</span>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
