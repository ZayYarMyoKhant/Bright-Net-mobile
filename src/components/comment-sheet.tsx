
"use client";

import type { Post, Comment, Profile } from "@/lib/data";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquareReply, MoreVertical, Send, Trash2, X, Loader2, Users } from "lucide-react";
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

type CommentWithProfile = Comment & { profiles: Profile, replies: CommentWithProfile[] };

const CommentItem = ({ comment, isReply = false, onReply, onDelete, currentUser }: { comment: CommentWithProfile, isReply?: boolean, onReply: (comment: CommentWithProfile) => void, onDelete: (commentId: string) => void, currentUser: User | null }) => {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleReplyClick = () => {
    onReply(comment);
  }

  return (
    <div className={cn("flex items-start gap-3", isReply && "ml-8")}>
        <Link href={`/profile/${comment.profiles.id}`}>
            <Avatar className="h-8 w-8" profile={comment.profiles}>
            </Avatar>
        </Link>
        <div className="flex-1">
            <Link href={`/profile/${comment.profiles.id}`} className={cn("text-xs font-semibold hover:underline", comment.profiles.is_verified && "text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-1.5 py-0.5 inline-block")}>{comment.profiles.username}</Link>
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
                    {currentUser?.id === comment.user_id ? (
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
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);


  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
        if(currentUser) {
            const {data} = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            setCurrentUserProfile(data);
        }
    }
    fetchCurrentUserProfile();
  }, [currentUser, supabase]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles(*), replies:post_comments(*, profiles(*))')
      .eq('post_id', post.id)
      .is('parent_comment_id', null) // Fetch only top-level comments
      .order('created_at', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching comments', description: error.message });
      setComments([]);
    } else {
      setComments(data as unknown as CommentWithProfile[]);
    }
    setLoading(false);
  }, [post.id, supabase, toast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (newComment.trim() === "" || !currentUser) return;
    setSending(true);

    const { data, error } = await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: newComment,
      parent_comment_id: replyingTo?.id || null
    }).select('*, profiles(*)').single();

    if (error) {
        toast({ variant: 'destructive', title: 'Failed to post comment', description: error.message });
    } else {
        // Optimistically update UI
        if (replyingTo) {
             setComments(prev => prev.map(c => {
                if (c.id === replyingTo.parent_comment_id || c.id === replyingTo.id) {
                    const newReplies = [...(c.replies || []), data as CommentWithProfile];
                    return {...c, replies: newReplies};
                }
                return c;
             }));
        } else {
            setComments(prev => [...prev, data as CommentWithProfile]);
        }
        setNewComment("");
        setReplyingTo(null);
    }
    
    setSending(false);
  };
  
  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== commentId)
    })));

    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) {
        toast({ variant: 'destructive', title: 'Failed to delete comment', description: error.message });
        fetchComments(); // Re-fetch to correct state
    }
  };

  const handleReply = (comment: CommentWithProfile) => {
    setReplyingTo(comment);
  }

  return (
    <>
      <SheetHeader className="h-14 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>{loading ? 'Loading...' : `${post.comments} Comments`}</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
            <Users className="h-12 w-12 mb-4" />
            <p className="font-bold">No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your thoughts!</p>
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
                    Replying to <span className="font-semibold text-foreground">@{replyingTo.profiles.username}</span>
                </p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2 pt-1">
            {currentUserProfile ? (
              <Avatar className="h-8 w-8" profile={currentUserProfile}>
              </Avatar>
            ) : (
               <Avatar className="h-8 w-8 bg-muted" />
            )}
            <Input 
                placeholder={replyingTo ? `Reply to @${replyingTo.profiles.username}` : "Add a comment..."} 
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
