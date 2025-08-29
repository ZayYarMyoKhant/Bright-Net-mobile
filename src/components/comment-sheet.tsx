
"use client";

import type { Post, Comment } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Heart, MessageSquareReply, MoreVertical, Send, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CommentSheetProps = {
  post: Post;
};

const currentUser = "aungaung"; // In a real app, this would come from auth

const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  return (
    <div className={cn("flex items-start gap-3", isReply && "ml-8")}>
        <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatar} data-ai-hint="person portrait" />
            <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
            <p className="text-sm">{comment.text}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>1d</span>
                <button>Reply</button>
            </div>
             {comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                </div>
            )}
        </div>
        <div className="flex flex-col items-center gap-1">
             <button onClick={handleLike}>
                <Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>
            <span className="text-xs text-muted-foreground">{likes > 0 ? likes : ''}</span>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {comment.user.username === currentUser ? (
                     <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                ) : (
                    <DropdownMenuItem>
                        <MessageSquareReply className="mr-2 h-4 w-4"/>
                        Reply
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}

export function CommentSheet({ post }: CommentSheetProps) {
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const newCommentData: Comment = {
      id: Date.now(),
      user: {
        username: currentUser,
        avatar: "https://i.pravatar.cc/150?u=aungaung",
      },
      text: newComment,
      likes: 0,
      replies: [],
    };
    setComments([newCommentData, ...comments]);
    setNewComment("");
  };

  return (
    <>
      <header className="flex h-12 flex-shrink-0 items-center justify-center border-b px-4 relative">
        <h2 className="font-bold">{comments.length} Comments</h2>
      </header>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      </ScrollArea>
      <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=aungaung" data-ai-hint="person portrait" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Input 
                placeholder="Add a comment..." 
                className="flex-1 bg-muted border-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                    }
                }}
            />
            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </>
  );
}
