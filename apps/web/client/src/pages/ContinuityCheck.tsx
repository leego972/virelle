/**
 * ContinuityCheck
 *
 * Production-grade persistent continuity issue tracker backed by the
 * `continuity_issues` DB table. Replaces the old ephemeral useState pattern.
 *
 * Features:
 * - AI scan that persists issues to the DB
 * - Filter by severity, category, status, and scene
 * - Assign issues to collaborators
 * - Mark as resolved or dismissed with a resolution note
 * - Issues survive page refreshes and are shared with collaborators
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Filter,
  Plus,
  Pencil,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type IssueSeverity = "high" | "medium" | "low";
type IssueStatus = "open" | "resolved" | "dismissed";

interface ContinuityIssue {
  id: number;
  projectId: number;
  sceneAId?: number | null;
  sceneBId?: number | null;
  severity: IssueSeverity;
  category?: string | null;
  description: string;
  suggestion?: string | null;
  status: IssueStatus;
  assignedTo?: number | null;
  resolvedBy?: number | null;
  resolution?: string | null;
  resolvedAt?: string | Date | null;
  source: "ai" | "manual";
  createdAt: string | Date;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<IssueSeverity, { icon: typeof AlertCircle; color: string; bg: string; label: string }> = {
  high: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", label: "High" },
  medium: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Medium" },
  low: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", label: "Low" },
};

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  dismissed: { label: "Dismissed", color: "bg-zinc-500/10 text-zinc-300/50 border-zinc-500/10" },
};

const CATEGORIES = [
  "wardrobe", "props", "lighting", "character", "location", "timeline",
  "continuity", "dialogue", "visual", "audio",
];

// ─── Issue card ───────────────────────────────────────────────────────────────
function IssueCard({
  issue,
  onResolve,
  onDismiss,
}: {
  issue: ContinuityIssue;
  onResolve: (issue: ContinuityIssue) => void;
  onDismiss: (id: number) => void;
}) {
  const cfg = SEVERITY_CONFIG[issue.severity];
  const statusCfg = STATUS_CONFIG[issue.status];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg border p-4 ${cfg.bg} ${
        issue.status !== "open" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={`text-xs h-5 px-1.5 ${cfg.bg} ${cfg.color} border-current/30`}>
              {cfg.label}
            </Badge>
            {issue.category && (
              <Badge variant="outline" className="text-xs h-5 px-1.5 capitalize">
                {issue.category}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs h-5 px-1.5 ${statusCfg.color}`}>
              {statusCfg.label}
            </Badge>
            {issue.source === "ai" && (
              <Badge variant="outline" className="text-xs h-5 px-1.5 text-violet-400 border-violet-500/30">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                AI
              </Badge>
            )}
            {(issue.sceneAId || issue.sceneBId) && (
              <span className="text-xs text-muted-foreground">
                Scene{issue.sceneAId && issue.sceneBId ? "s" : ""}{" "}
                {[issue.sceneAId, issue.sceneBId].filter(Boolean).join(" → ")}
              </span>
            )}
          </div>
          <p className="text-sm">{issue.description}</p>
          {issue.suggestion && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Suggestion: {issue.suggestion}
            </p>
          )}
          {issue.resolution && (
            <p className="text-xs text-emerald-400/80 mt-1">
              Resolution: {issue.resolution}
            </p>
          )}
        </div>
        {issue.status === "open" && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => onResolve(issue)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Resolve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => onDismiss(issue.id)}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ContinuityCheck() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(params.projectId);

  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [resolveDialog, setResolveDialog] = useState<ContinuityIssue | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIssue, setNewIssue] = useState({
    severity: "medium" as IssueSeverity,
    category: "",
    description: "",
    suggestion: "",
  });

  const { data: project } = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: !!user && !!projectId }
  );

  const {
    data: issues = [],
    isLoading,
    refetch,
  } = trpc.continuityIssues.getForProject.useQuery(
    { projectId },
    { enabled: !!user && !!projectId }
  );

  const utils = trpc.useUtils();

  // AI scan — persists results to DB
  const runAIScan = trpc.continuityIssues.runAndPersist.useMutation({
    onSuccess: (data) => {
      toast.success(`Found ${data.persisted} issue${data.persisted !== 1 ? "s" : ""} — saved to project`);
      utils.continuityIssues.getForProject.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message || "AI scan failed"),
  });

  const createIssue = trpc.continuityIssues.create.useMutation({
    onSuccess: () => {
      toast.success("Issue added");
      utils.continuityIssues.getForProject.invalidate({ projectId });
      setShowAddDialog(false);
      setNewIssue({ severity: "medium", category: "", description: "", suggestion: "" });
    },
    onError: (err) => toast.error(err.message || "Failed to add issue"),
  });

  const resolveIssue = trpc.continuityIssues.resolve.useMutation({
    onSuccess: () => {
      utils.continuityIssues.getForProject.invalidate({ projectId });
      setResolveDialog(null);
      setResolutionText("");
    },
    onError: (err) => toast.error(err.message || "Failed to resolve issue"),
  });

  const dismissIssue = trpc.continuityIssues.dismiss.useMutation({
    onSuccess: () => {
      utils.continuityIssues.getForProject.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message || "Failed to dismiss issue"),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // ─── Filtered issues ──────────────────────────────────────────────────────
  const filtered = (issues as ContinuityIssue[]).filter((issue) => {
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && issue.status !== filterStatus) return false;
    if (filterCategory !== "all" && issue.category !== filterCategory) return false;
    return true;
  });

  const openCount = (issues as ContinuityIssue[]).filter((i) => i.status === "open").length;
  const highCount = (issues as ContinuityIssue[]).filter(
    (i) => i.severity === "high" && i.status === "open"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                {project?.title || "Project"} — Continuity Check
              </h1>
              <p className="text-xs text-muted-foreground">
                {openCount} open issue{openCount !== 1 ? "s" : ""}
                {highCount > 0 ? ` · ${highCount} high severity` : ""}
                {" · "}{(issues as ContinuityIssue[]).length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Issue
            </Button>
            <Button
              size="sm"
              onClick={() => runAIScan.mutate({ projectId })}
              disabled={runAIScan.isPending}
            >
              {runAIScan.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {runAIScan.isPending ? "Scanning…" : "AI Scan"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-sm w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="h-8 text-sm w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 text-sm w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Issue list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium">
              {(issues as ContinuityIssue[]).length === 0
                ? "No continuity issues found yet."
                : "No issues match the current filters."}
            </p>
            {(issues as ContinuityIssue[]).length === 0 && (
              <p className="text-xs mt-1">
                Run an AI scan to automatically detect continuity problems across your scenes.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onResolve={(i) => {
                  setResolveDialog(i);
                  setResolutionText("");
                }}
                onDismiss={(id) => dismissIssue.mutate({ id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resolve dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
          </DialogHeader>
          {resolveDialog && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{resolveDialog.description}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Resolution note (optional)</Label>
                <Textarea
                  placeholder="How was this resolved?"
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!resolveDialog) return;
                resolveIssue.mutate({
                  id: resolveDialog.id,
                  resolution: resolutionText || "Resolved",
                });
              }}
              disabled={resolveIssue.isPending}>
              {resolveIssue.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add manual issue dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Continuity Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select
                  value={newIssue.severity}
                  onValueChange={(v) =>
                    setNewIssue((p) => ({ ...p, severity: v as IssueSeverity }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={newIssue.category}
                  onValueChange={(v) => setNewIssue((p) => ({ ...p, category: v }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea
                placeholder="Describe the continuity issue…"
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suggestion (optional)</Label>
              <Input
                placeholder="How to fix it?"
                value={newIssue.suggestion}
                onChange={(e) =>
                  setNewIssue((p) => ({ ...p, suggestion: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createIssue.mutate({
                  projectId,
                  severity: newIssue.severity,
                  category: newIssue.category || undefined,
                  description: newIssue.description,
                  suggestion: newIssue.suggestion || undefined,
                  source: "manual",
                })
              }
              disabled={!newIssue.description.trim() || createIssue.isPending}
            >
              {createIssue.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1.5" />
              )}
              Add Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
