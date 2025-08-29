import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, UserPlus, Clapperboard } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const user = {
    name: "Aung Aung",
    username: "aungaung",
    avatar: "https://i.pravatar.cc/150?u=aungaung",
    bio: "Digital Creator | Love to share my life.",
    following: 124,
    followers: 46,
    postsCount: 1,
    classCount: 1,
  };

  const posts = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    imageUrl: `https://picsum.photos/400/600?random=${i + 10}`,
  }));

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <Button variant="ghost" size="icon">
          <UserPlus className="h-5 w-5" />
          <span className="sr-only">Add Friend</span>
        </Button>
        <h1 className="font-bold">{user.username}</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={user.avatar} alt={user.username} data-ai-hint="person portrait" />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="mt-3 text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-2 text-center text-sm">{user.bio}</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="font-bold">{user.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
            </div>
            <div>
                <p className="font-bold">{user.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
            </div>
             <div>
                <p className="font-bold">{user.postsCount}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
            </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
            <Button className="flex-1">Edit Profile</Button>
        </div>


        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">
              <Grid3x3 className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="class">
              <Clapperboard className="mr-2 h-4 w-4" />
              Class
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square w-full">
                  <Image
                    src={post.imageUrl}
                    alt={`Post ${post.id}`}
                    width={400}
                    height={600}
                    className="h-full w-full object-cover"
                    data-ai-hint="lifestyle content"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="class">
             <div className="flex flex-col items-center justify-center pt-10">
                <Clapperboard className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No classes yet.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
