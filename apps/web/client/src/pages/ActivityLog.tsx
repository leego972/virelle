/**
 * ActivityLog
 *
 * Displays the persistent project activity log — every scene mutation,
 * collaborator role change, generation event, and continuity resolution
 * recorded in the project_activity_log table.
 *
 * Provides filtering by action type and user, and links back to the
 * relevant scene or tool where the action occurred.
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Activity,
  User,
  Clapperboard,
  Users,
  Lock,
  Unlock,
  Sparkles,
  Trash2,
  Pencil,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityEntry {
  id: number;
  userId: number;
  userName?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  meta?: Record<string, unknown> | null;
  createdAt: string | Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function actionIcon(action: string) {
  if (action.includes("create")) return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
  if (action.includes("delete")) return <Trash2 className="h-3.5 w-3.5 text-red-400" />;
  if (action.includes("update") || action.includes("edit")) return <Pencil className="h-3.5 w-3.5 text-blue-400" />;
  if (action.includes("lock")) return <Lock className="h-3.5 w-3.5 text-amber-400" />;
  if (action.includes("unlock")) return <Unlock className="h-3.5 w-3.5 text-amber-300" />;
  if (action.includes("generate") || action.includes("ai")) return <Sparkles className="h-3.5 w-3.5 text-violet-400" />;
  if (action.includes("resolve") || action.includes("complete")) return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;
  if (action.includes("fail") || action.includes("error")) return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  if (action.includes("collab") || action.includes("invite") || action.includes("role")) return <Users className="h-3.5 w-3.5 text-sky-400" />;
  if (action.includes("scene")) return <Clapperboard className="h-3.5 w-3.5 text-orange-400" />;
  return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
}

function actionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function targetLabel(targetType?: string | null, targetId?: number | null): string | null {
  if (!targetType) return null;
  const label = targetType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return targetId ? `${label} #${targetId}` : label;
}

function relativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(params.projectId);

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  const { data: project } = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: !!user && !!projectId }
  );

  const { data: log = [], isLoading, refetch } = trpc.activityLog.getForProject.useQuery(
    { projectId, limit: 200 },
    { enabled: !!user && !!projectId, refetchInterval: 30_000 }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // ─── Derived filter options ───────────────────────────────────────────────
  const actionTypes = Array.from(new Set((log as ActivityEntry[]).map((e) => e.action))).sort();
  const userNames = Array.from(
    new Set((log as ActivityEntry[]).map((e) => e.userName || `User #${e.userId}`))
  ).sort();

  // ─── Filtered entries ─────────────────────────────────────────────────────
  const filtered = (log as ActivityEntry[]).filter((entry) => {
    if (filterAction !== "all" && entry.action !== filterAction) return false;
    if (filterUser !== "all") {
      const name = entry.userName || `User #${entry.userId}`;
      if (name !== filterUser) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        entry.action,
        entry.userName,
        entry.targetType,
        JSON.stringify(entry.meta),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
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
                <Activity className="h-4 w-4 text-primary shrink-0" />
                {project?.title || "Project"} — Activity Log
              </h1>
              <p className="text-xs text-muted-foreground">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                {filtered.length !== log.length ? ` (filtered from ${log.length})` : ""}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search events…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="h-8 text-sm w-[160px]">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map((a) => (
                    <SelectItem key={a} value={a}>
                      {actionLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-8 text-sm w-[160px]">
                  <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {userNames.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Log entries */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {log.length === 0
                    ? "No activity recorded yet. Events will appear here as the project is worked on."
                    : "No events match the current filters."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filtered.map((entry, idx) => {
                  const tgt = targetLabel(entry.targetType, entry.targetId);
                  return (
                    <div
                      key={entry.id ?? idx}
                      className="flex items-start gap-3 py-3 group hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                        {actionIcon(entry.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {actionLabel(entry.action)}
                          </span>
                          {tgt && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                              {tgt}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{entry.userName || `User #${entry.userId}`}</span>
                          <span>·</span>
                          <span>{relativeTime(entry.createdAt)}</span>
                        </div>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                            {Object.entries(entry.meta)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
