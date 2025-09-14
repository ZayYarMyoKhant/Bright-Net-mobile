
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap } from "lucide-react";
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
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold">Class</h1>
          <Link href="/class/create">
            <Button>Create Class</Button>
          </Link>
        </header>

        <div className="flex-shrink-0 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search Class" className="pl-10" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <div className="relative h-40 w-full">
                <Image
                  src={cls.thumbnail}
                  alt={cls.name}
                  fill
                  className="object-cover"
                  data-ai-hint="class course"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-primary">{cls.name}</CardTitle>
                <div className="flex items-center gap-2 pt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={cls.teacher.avatar} />
                    <AvatarFallback>
                      {cls.teacher.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {cls.teacher.name}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="secondary">{cls.studentCount} Students</Badge>
                  <p className="font-bold">{cls.price.toLocaleString()} MMK</p>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                {cls.isJoined ? (
                    <Link href={`/class/${cls.id}/info`} className="flex-1">
                        <Button variant="outline" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                            View
                        </Button>
                  </Link>
                ) : (
                  <>
                    <Link href={`/class/${cls.id}/info`} className="flex-1">
                        <Button variant="outline" className="w-full">
                            Info
                        </Button>
                    </Link>
                    <Button className="flex-1">Join</Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
           {classes.length === 0 && (
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
