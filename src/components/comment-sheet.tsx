
"use client";

import type { Post, Comment } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Heart, MessageSquareReply, MoreVertical, Send, Trash2, X, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type CommentSheetProps = {
  post: Post;
  currentUser: User | null;
};

const CommentItem = ({ comment, isReply = false, onReply, onDelete, currentUser }: { comment: Comment, isReply?: boolean, onReply: (comment: Comment) => void, onDelete: (commentId: string) => void, currentUser: User | null }) => {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleReplyClick = () => {
    onReply(comment);
  }

  return (
    <div className={cn("flex items-start gap-3", isReply && "ml-8")}>
        <Link href={`/profile/${comment.user.username}`}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatar_url} data-ai-hint="person portrait" />
                <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        </Link>
        <div className="flex-1">
            <Link href={`/profile/${comment.user.username}`} className="text-xs font-semibold hover:underline">{comment.user.username}</Link>
            <p className="text-sm">{comment.content}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>{timeAgo}</span>
                <button onClick={handleReplyClick} className="font-semibold hover:underline">Reply</button>
            </div>
             {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-4">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply onReply={onReply} onDelete={onDelete} currentUser={currentUser}/>
                    ))}
                </div>
            )}
        </div>
        <div className="flex flex-col items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {currentUser?.id === comment.user.id ? (
                         <DropdownMenuItem className="text-destructive" onClick={() => onDelete(comment.id)}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             <span>Delete</span>
                         </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={handleReplyClick}>
                            <MessageSquareReply className="mr-2 h-4 w-4"/>
                            <span>Reply</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
  )
}

export function CommentSheet({ post, currentUser }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    // Mocking comments for now
    await new Promise(resolve => setTimeout(resolve, 500));
    setComments([]); // Start with no comments
    setLoading(false);
  }, [post.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (newComment.trim() === "" || !currentUser) return;
    setSending(true);

    // In a real app, this would be a Supabase insert
    await new Promise(resolve => setTimeout(resolve, 500));

    toast({ title: "Comment posted (mock)" });
    
    setNewComment("");
    setReplyingTo(null);
    setSending(false);
  };
  
  const handleDeleteComment = async (commentId: string) => {
    toast({ title: "Comment deleted (mock)" });
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  }

  return (
    <>
      <SheetHeader className="h-14 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>{loading ? 'Loading...' : `${comments.length} Comments`}</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={handleReply} onDelete={handleDeleteComment} currentUser={currentUser} />
            ))}
          </div>
        )}
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
            {currentUser ? (
              <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.user_metadata.avatar_url} data-ai-hint="person portrait" />
                  <AvatarFallback>{currentUser.user_metadata.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            ) : (
               <Avatar className="h-8 w-8 bg-muted" />
            )}
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
                disabled={!currentUser || sending}
            />
            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim() || !currentUser || sending}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
      </footer>
    </>
  );
}
