
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Video } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

type ClassState = "joined" | "not_joined";

type ClassItem = {
  id: number;
  name: string;
  description: string;
  link: string;
  initialState: ClassState;
};

const initialClasses: ClassItem[] = [
  {
    id: 1,
    name: "Digital Marketing Masterclass",
    description: "Learn the fundamentals of digital marketing.",
    link: "https://example.com/class1",
    initialState: "not_joined",
  },
  {
    id: 2,
    name: "Advanced Graphic Design",
    description: "Take your design skills to the next level.",
    link: "https://example.com/class2",
    initialState: "joined",
  },
  {
    id: 3,
    name: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps.",
    link: "https://example.com/class3",
    initialState: "not_joined",
  },
    {
    id: 4,
    name: "Content Creation & Strategy",
    description: "Master the art of creating engaging content.",
    link: "https://example.com/class4",
    initialState: "not_joined",
  },
];

export default function ClassPage() {
  const [classes, setClasses] = useState(initialClasses);

  const handleJoinToggle = (id: number) => {
    setClasses((prevClasses) =>
      prevClasses.map((c) =>
        c.id === id
          ? {
              ...c,
              initialState:
                c.initialState === "joined" ? "not_joined" : "joined",
            }
          : c
      )
    );
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold">Class</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                  <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border">
                          <AvatarFallback className="font-bold text-xl">{classItem.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <CardTitle>{classItem.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{classItem.description}</p>
                          <a href={classItem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                              <ExternalLink className="h-3 w-3" />
                              {classItem.link}
                          </a>
                      </div>
                  </div>
              </CardHeader>
              <CardFooter>
                   {classItem.initialState === "not_joined" ? (
                      <Button className="w-full" onClick={() => handleJoinToggle(classItem.id)}>Join</Button>
                  ) : (
                    <Link href={`/class/${classItem.id}`} className="w-full">
                      <Button variant="secondary" className="w-full">
                          <Video className="mr-2 h-4 w-4"/>
                          View Channel
                      </Button>
                    </Link>
                  )}
              </CardFooter>
            </Card>
          ))}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
