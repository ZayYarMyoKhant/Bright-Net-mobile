
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
import { SheetHeader, SheetTitle } from "./ui/sheet";

type CommentSheetProps = {
  post: Post;
};

const currentUser = "aungaung"; // In a real app, this would come from auth

const CommentItem = ({ comment, isReply = false, onReply }: { comment: Comment, isReply?: boolean, onReply: (comment: Comment) => void }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleReplyClick = () => {
    onReply(comment);
  }

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
                <button onClick={handleReplyClick}>Reply</button>
            </div>
             {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply onReply={onReply}/>
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
                    <DropdownMenuItem onClick={handleReplyClick}>
                        <MessageSquareReply className="mr-2 h-4 w-4"/>
                        <span>Reply</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}

export function CommentSheet({ post }: CommentSheetProps) {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    // Logic to add a reply or a new comment
    console.log(`Replying to ${replyingTo?.user.username}: ${newComment}`);

    setNewComment("");
    setReplyingTo(null);
  };
  
  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  }

  return (
    <>
      <SheetHeader className="h-12 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>{comments.length} Comments</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
          ))}
        </div>
      </ScrollArea>
      <footer className="flex-shrink-0 border-t p-2">
        {replyingTo && (
            <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs">
                <p className="truncate text-muted-foreground">
                    Replying to <span className="font-semibold text-foreground">@{replyingTo.user.username}</span>
                </p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=aungaung" data-ai-hint="person portrait" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Input 
                placeholder={replyingTo ? `Reply to @${replyingTo.user.username}` : "Add a comment..."} 
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
