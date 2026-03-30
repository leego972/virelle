import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const REVIEW_CONFIG = {
  pending: { label: "Pending Review", icon: Clock, color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approved", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  changes_requested: { label: "Changes Requested", icon: AlertCircle, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
} as const;

type ReviewStatus = keyof typeof REVIEW_CONFIG;

interface Props {
  sceneId: number;
  projectId: number;
  sceneTitle?: string;
}

export function SceneReviewPanel({ sceneId, projectId, sceneTitle }: Props) {
  const [reviewNote, setReviewNote] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: reviews = [], refetch: refetchReviews } = trpc.reviews.getForScene.useQuery({ sceneId, projectId });
  const { data: comments = [], refetch: refetchComments } = trpc.comments.getForScene.useQuery({ sceneId });

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => { refetchReviews(); setReviewNote(""); toast.success("Review submitted"); },
    onError: (e) => toast.error(e.message),
  });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => { refetchComments(); setCommentBody(""); setReplyTo(null); setReplyBody(""); toast.success("Comment added"); },
    onError: (e) => toast.error(e.message),
  });

  const resolveComment = trpc.comments.resolve.useMutation({
    onSuccess: () => { refetchComments(); toast.success("Comment resolved"); },
    onError: (e) => toast.error(e.message),
  });

  const latestReview = reviews[0] as any;
  const topLevelComments = (comments as any[]).filter(c => !c.parentId);
  const getReplies = (parentId: number) => (comments as any[]).filter(c => c.parentId === parentId);

  function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Current Review Status */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Review Status</h3>
        {latestReview ? (
          <div className={`flex items-start gap-3 rounded-lg border p-3 ${REVIEW_CONFIG[latestReview.status as ReviewStatus]?.color}`}>
            {(() => { const cfg = REVIEW_CONFIG[latestReview.status as ReviewStatus]; const Icon = cfg.icon; return <Icon className="h-4 w-4 mt-0.5 shrink-0" />; })()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{REVIEW_CONFIG[latestReview.status as ReviewStatus]?.label}</span>
                <span className="text-xs opacity-70">{formatDistanceToNow(new Date(latestReview.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">by {latestReview.reviewerName}</p>
              {latestReview.note && <p className="text-xs mt-1 italic">"{latestReview.note}"</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border border-dashed p-3">
            <Clock className="h-4 w-4" />
            <span>No review yet</span>
          </div>
        )}
      </div>

      {/* Submit Review */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Submit Review</h3>
        <Textarea
          placeholder="Optional note for this review..."
          value={reviewNote}
          onChange={e => setReviewNote(e.target.value)}
          rows={2}
          className="mb-3 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["approved", "changes_requested", "rejected"] as ReviewStatus[]).map(status => {
            const cfg = REVIEW_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                className={`text-xs gap-1.5 ${cfg.color}`}
                disabled={submitReview.isPending}
                onClick={() => submitReview.mutate({ sceneId, projectId, status, note: reviewNote || undefined })}
              >
                {submitReview.isPending && submitReview.variables?.status === status
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Icon className="h-3 w-3" />}
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Comments Thread */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments.length > 0 && <Badge variant="secondary" className="text-xs">{comments.length}</Badge>}
        </h3>

        <ScrollArea className="max-h-80 pr-2">
          <div className="space-y-4">
            {topLevelComments.map((comment: any) => {
              const replies = getReplies(comment.id);
              return (
                <div key={comment.id} className="space-y-2">
                  <div className={`flex gap-2.5 ${comment.resolved ? "opacity-50" : ""}`}>
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-xs">{initials(comment.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                        {comment.resolved && <Badge variant="outline" className="text-xs py-0">Resolved</Badge>}
                      </div>
                      <p className="text-sm leading-relaxed">{comment.body}</p>
                      <div className="flex gap-3 mt-1">
                        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                          Reply
                        </button>
                        {!comment.resolved && (
                          <button className="text-xs text-muted-foreground hover:text-green-600" onClick={() => resolveComment.mutate({ commentId: comment.id, projectId })}>
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
                      {replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-xs">{initials(reply.authorName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium">{reply.authorName}</span>
                              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                            </div>
                            <p className="text-sm">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyTo === comment.id && (
                    <div className="ml-9 flex gap-2">
                      <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        rows={2}
                        className="text-sm flex-1"
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 self-end"
                        disabled={!replyBody.trim() || addComment.isPending}
                        onClick={() => addComment.mutate({ sceneId, projectId, body: replyBody, parentId: comment.id })}
                      >
                        {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {topLevelComments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Start the conversation.</p>
            )}
          </div>
        </ScrollArea>

        {/* New comment input */}
        <div className="flex gap-2 mt-3">
          <Textarea
            placeholder="Add a comment..."
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            rows={2}
            className="text-sm flex-1"
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 self-end"
            disabled={!commentBody.trim() || addComment.isPending}
            onClick={() => addComment.mutate({ sceneId, projectId, body: commentBody })}
          >
            {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
