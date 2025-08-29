
"use client"

import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Grid3x3, BookOpen, User } from "lucide-react"

export default function SearchPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">Search anything</h1>
        </header>
        
        <div className="flex-shrink-0 p-4">
          <div className="relative flex items-center">
            <Input placeholder="Search bar" className="pr-10" />
            <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8">
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4">
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="post">
                <Grid3x3 className="mr-2 h-4 w-4" />
                Post
              </TabsTrigger>
              <TabsTrigger value="class">
                <BookOpen className="mr-2 h-4 w-4" />
                Class
              </TabsTrigger>
              <TabsTrigger value="user">
                <User className="mr-2 h-4 w-4" />
                User
              </TabsTrigger>
            </TabsList>
            <TabsContent value="post">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <Grid3x3 className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Search for posts.</p>
              </div>
            </TabsContent>
            <TabsContent value="class">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Search for classes and courses.</p>
              </div>
            </TabsContent>
            <TabsContent value="user">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Search for users and creators.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  )
}
