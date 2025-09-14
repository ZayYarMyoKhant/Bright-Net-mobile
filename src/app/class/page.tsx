
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock data
const classes = [
  {
    id: 1,
    name: "Digital Marketing Masterclass",
    teacher: {
      name: "Aung Aung",
      avatar: "https://i.pravatar.cc/150?u=aungaung",
    },
    thumbnail: "https://picsum.photos/seed/1/600/400",
    studentCount: 120,
    price: 35000,
    isJoined: false,
  },
  {
    id: 2,
    name: "Advanced Graphic Design",
    teacher: {
      name: "Su Su",
      avatar: "https://i.pravatar.cc/150?u=susu",
    },
    thumbnail: "https://picsum.photos/seed/2/600/400",
    studentCount: 88,
    price: 40000,
    isJoined: true,
  },
  {
    id: 3,
    name: "Web Development Bootcamp",
    teacher: {
      name: "Myo Myint",
      avatar: "https://i.pravatar.cc/150?u=myomyint",
    },
    thumbnail: "https://picsum.photos/seed/3/600/400",
    studentCount: 250,
    price: 150000,
    isJoined: false,
  },
];

export default function ClassPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold">Class</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
           {classes.length > 0 ? (
             <div className="divide-y">
                {classes.map((cls) => (
                    <Link href={cls.isJoined ? `/class/${cls.id}` : `/class/${cls.id}/info`} key={cls.id}>
                        <div className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-14 w-14 rounded-md">
                                <AvatarImage src={cls.thumbnail} />
                                <AvatarFallback>
                                    <GraduationCap/>
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold text-primary">{cls.name}</p>
                                <p className="text-sm text-muted-foreground">{cls.teacher.name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {cls.isJoined ? (
                                    <Button variant="outline" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black border-none pointer-events-none">
                                        View
                                    </Button>
                                ) : (
                                     <Button variant="default" size="sm" className="pointer-events-none">
                                        Join
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
             </div>
           ) : (
             <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                <GraduationCap className="h-12 w-12 mb-4" />
                <p className="font-bold">No Classes Available</p>
                <p className="text-sm mt-1">Check back later for new classes!</p>
            </div>
           )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
