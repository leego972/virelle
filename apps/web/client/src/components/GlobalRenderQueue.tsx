/**
 * GlobalRenderQueue
 * 
 * A persistent, always-visible render queue indicator in the app shell header.
 * Shows active generation jobs across all projects with progress, status, and
 * quick navigation to the relevant project.
 * 
 * Phase 4: Global Render Queue
 */
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Film,
  Clapperboard,
  Play,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface RenderJob {
  id: number;
  projectId: number;
  projectTitle?: string;
  sceneId?: number | null;
  type: "full-film" | "scene" | "preview";
  status: "queued" | "processing" | "paused" | "completed" | "failed";
  progress: number;
  estimatedSeconds?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

function JobStatusIcon({ status }: { status: RenderJob["status"] }) {
  switch (status) {
    case "processing":
      return <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />;
    case "queued":
      return <Clock className="h-3.5 w-3.5 text-blue-400" />;
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
    case "paused":
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function JobTypeIcon({ type }: { type: RenderJob["type"] }) {
  switch (type) {
    case "full-film":
      return <Film className="h-3 w-3 text-muted-foreground" />;
    case "scene":
      return <Clapperboard className="h-3 w-3 text-muted-foreground" />;
    case "preview":
      return <Play className="h-3 w-3 text-muted-foreground" />;
    default:
      return <Activity className="h-3 w-3 text-muted-foreground" />;
  }
}

function formatEta(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  if (seconds < 60) return `~${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `~${mins}m`;
}

function JobRow({ job, onNavigate }: { job: RenderJob; onNavigate: () => void }) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/projects/${job.projectId}`);
    onNavigate();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left group"
    >
      <div className="mt-0.5 shrink-0">
        <JobStatusIcon status={job.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <JobTypeIcon type={job.type} />
          <span className="text-xs font-medium truncate">
            {job.projectTitle ?? `Project #${job.projectId}`}
          </span>
          {job.type === "scene" && job.sceneId && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              Scene #{job.sceneId}
            </span>
          )}
        </div>
        {(job.status === "processing" || job.status === "queued") && (
          <div className="flex items-center gap-2">
            <Progress
              value={job.progress ?? 0}
              className="h-1 flex-1"
            />
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
              {job.progress ?? 0}%
              {job.estimatedSeconds && (
                <span className="ml-1 text-muted-foreground/60">
                  {formatEta(job.estimatedSeconds)}
                </span>
              )}
            </span>
          </div>
        )}
        {job.status === "failed" && job.errorMessage && (
          <p className="text-[10px] text-rose-400 truncate mt-0.5">
            {job.errorMessage}
          </p>
        )}
        {job.status === "completed" && (
          <p className="text-[10px] text-emerald-400 mt-0.5">Complete</p>
        )}
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

export default function GlobalRenderQueue() {
  const [open, setOpen] = useState(false);
  const [hasNewCompletion, setHasNewCompletion] = useState(false);

  // Poll active jobs every 8 seconds
  const { data: activeJobs = [], dataUpdatedAt: activeUpdated } =
    trpc.generation.listActiveJobs.useQuery(undefined, {
      refetchInterval: 8_000,
      staleTime: 5_000,
    });

  // Poll recent jobs every 15 seconds (for completion notifications)
  const { data: recentJobs = [] } = trpc.generation.listRecentJobs.useQuery(
    undefined,
    {
      refetchInterval: 15_000,
      staleTime: 10_000,
    }
  );

  const totalActive = (activeJobs as RenderJob[]).length;
  const processingJobs = (activeJobs as RenderJob[]).filter(
    (j) => j.status === "processing"
  );
  const queuedJobs = (activeJobs as RenderJob[]).filter(
    (j) => j.status === "queued"
  );

  // Flash indicator when jobs complete
  useEffect(() => {
    if (activeUpdated && totalActive === 0 && (recentJobs as RenderJob[]).length > 0) {
      const latestJob = (recentJobs as RenderJob[])[0];
      if (latestJob?.status === "completed") {
        setHasNewCompletion(true);
        const t = setTimeout(() => setHasNewCompletion(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, [activeUpdated, totalActive, recentJobs]);

  if (totalActive === 0 && (recentJobs as RenderJob[]).length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-accent ${
            totalActive > 0
              ? "text-amber-400 hover:text-amber-300"
              : hasNewCompletion
              ? "text-emerald-400 hover:text-emerald-300"
              : "text-muted-foreground"
          }`}
          title={
            totalActive > 0
              ? `${totalActive} job${totalActive !== 1 ? "s" : ""} rendering`
              : "Render queue"
          }
        >
          {totalActive > 0 ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : hasNewCompletion ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Activity className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {totalActive > 0
              ? `${processingJobs.length} rendering${
                  queuedJobs.length > 0 ? `, ${queuedJobs.length} queued` : ""
                }`
              : hasNewCompletion
              ? "Done"
              : "Queue"}
          </span>
          {totalActive > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
              {totalActive}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-xl"
        sideOffset={8}
      >
        <div className="px-3 py-2.5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Render Queue</h3>
            {totalActive > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/20"
              >
                {totalActive} active
              </Badge>
            )}
          </div>
          {processingJobs.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {processingJobs.length} job{processingJobs.length !== 1 ? "s" : ""} rendering
              {queuedJobs.length > 0 && `, ${queuedJobs.length} in queue`}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-72">
          {totalActive > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Active
                </span>
              </div>
              {(activeJobs as RenderJob[]).map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}

          {(recentJobs as RenderJob[]).length > 0 && (
            <div>
              {totalActive > 0 && <Separator className="my-1" />}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Recent
                </span>
              </div>
              {(recentJobs as RenderJob[]).map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}

          {totalActive === 0 && (recentJobs as RenderJob[]).length === 0 && (
            <div className="px-3 py-6 text-center">
              <Activity className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No active renders</p>
            </div>
          )}
        </ScrollArea>

        <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
          <p className="text-[10px] text-muted-foreground">
            Auto-refreshes every 8 seconds
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
