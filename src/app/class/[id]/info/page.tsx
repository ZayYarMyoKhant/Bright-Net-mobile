
"use client";

import { use, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Clock, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

// Mock data, in a real app you'd fetch this based on params.id
const classDetails = {
    id: 1,
    name: "Digital Marketing Masterclass",
    teacher: {
      name: "Aung Aung",
      avatar: "https://i.pravatar.cc/150?u=aungaung",
    },
    thumbnail: "https://picsum.photos/seed/1/800/450",
    description: "Learn the ins and outs of digital marketing, from SEO and content marketing to social media advertising and analytics. This course is designed for beginners and intermediates looking to level up their skills.",
    level: "Beginner",
    duration: "8 Weeks",
    schedule: "Mon, Wed, Fri",
    price: 35000,
    isJoined: false,
};


function ClassInfoContent({ params }: { params: { id: string } }) {
    const router = useRouter();

    return (
         <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center bg-gradient-to-b from-black/60 to-transparent p-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="relative h-60 w-full">
                    <Image src={classDetails.thumbnail} alt={classDetails.name} fill className="object-cover" data-ai-hint="class course"/>
                    <div className="absolute inset-0 bg-black/50 flex items-end p-4">
                         <h1 className="text-2xl font-bold text-white shadow-lg">{classDetails.name}</h1>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={classDetails.teacher.avatar}/>
                            <AvatarFallback>{classDetails.teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">Instructor</p>
                            <p className="text-muted-foreground">{classDetails.teacher.name}</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-semibold text-lg mb-2">About this class</h2>
                        <p className="text-muted-foreground text-sm">{classDetails.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <BarChart className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                                <p className="font-semibold">Level</p>
                                <p className="text-muted-foreground">{classDetails.level}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                                <p className="font-semibold">Duration</p>
                                <p className="text-muted-foreground">{classDetails.duration}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 col-span-2">
                            <Calendar className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                                <p className="font-semibold">Schedule</p>
                                <p className="text-muted-foreground">{classDetails.schedule}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
             <footer className="flex-shrink-0 border-t p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-bold text-xl">{classDetails.price.toLocaleString()} MMK</p>
                </div>
                <Button size="lg">{classDetails.isJoined ? "Go to Class" : "Join Class"}</Button>
            </footer>
        </div>
    );
}


export default function ClassInfoPage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassInfoContent params={params} />
    </Suspense>
  );
}
