"use client";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { MessageSquare, CornerDownRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
  replies?: Comment[];
}

interface CommentThreadProps {
  groupListingId: string;
  comments: Comment[];
  currentUserId: string;
  onComment: () => void;
}

function CommentItem({
  comment,
  groupListingId,
  currentUserId,
  onComment,
  isReply = false,
}: {
  comment: Comment;
  groupListingId: string;
  currentUserId: string;
  onComment: () => void;
  isReply?: boolean;
}) {
  const { toast } = useToast();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${groupListingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, parentId: comment.id }),
      });
      if (res.ok) {
        setReplyText("");
        setReplying(false);
        onComment();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment() {
    const res = await fetch(`/api/listings/${groupListingId}/comments?commentId=${comment.id}`, { method: "DELETE" });
    if (res.ok) {
      onComment();
      toast({ title: "Comment deleted" });
    }
  }

  return (
    <div className={isReply ? "ml-8 mt-3" : ""}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
            {getInitials(comment.user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">{comment.user.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                {comment.user.id === currentUserId && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={deleteComment}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
          {!isReply && (
            <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs text-gray-400 gap-1" onClick={() => setReplying(!replying)}>
              <CornerDownRight className="w-3 h-3" /> Reply
            </Button>
          )}
          {replying && (
            <div className="mt-2 space-y-2">
              <Textarea placeholder="Write a reply…" value={replyText} onChange={e => setReplyText(e.target.value)} className="min-h-[60px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply} disabled={submitting || !replyText.trim()}>Post</Button>
                <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyText(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} groupListingId={groupListingId} currentUserId={currentUserId} onComment={onComment} isReply />
      ))}
    </div>
  );
}

export function CommentThread({ groupListingId, comments, currentUserId, onComment }: CommentThreadProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitComment() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${groupListingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) { setText(""); onComment(); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <MessageSquare className="w-4 h-4" />
        {comments.length} comment{comments.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-4">
        {comments.map(c => (
          <CommentItem key={c.id} comment={c} groupListingId={groupListingId} currentUserId={currentUserId} onComment={onComment} />
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">Me</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[70px] text-sm"
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(); }}
          />
          <Button size="sm" onClick={submitComment} disabled={submitting || !text.trim()}>
            {submitting ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
