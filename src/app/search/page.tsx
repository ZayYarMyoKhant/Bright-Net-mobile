
"use client"

import { BottomNav } from "@/components/bottom-nav";
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Bot, BookOpen, User } from "lucide-react"

export default function SearchPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">Search anything</h1>
        </header>
        
        <div className="flex-shrink-0 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search bar" className="pl-10" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4">
          <Tabs defaultValue="bot" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bot">
                <Bot className="mr-2 h-4 w-4" />
                Bot
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
            <TabsContent value="bot">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Search for bots and AI tools.</p>
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
