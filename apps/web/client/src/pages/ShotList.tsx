/**
 * ShotList
 *
 * Production-grade persistent shot list backed by the `shots` DB table.
 * Replaces the old ephemeral useState pattern — shot data survives page
 * refreshes, is shared with collaborators in real time, and can be
 * exported as a proper 1st AD document.
 *
 * Features:
 * - Per-scene grouping with scene metadata header
 * - AI generation of shots for individual scenes
 * - Inline status updates (pending / completed / needs_retake / cut)
 * - CSV export (1st AD format)
 * - Persistent across refreshes and collaborators
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ListOrdered,
  Sparkles,
  Download,
  CheckCircle2,
  Clock,
  Scissors,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Camera,
  Film,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ShotStatus = "pending" | "completed" | "cut" | "needs_retake";

interface Shot {
  id: number;
  sceneId: number;
  orderIndex: number;
  shotNumber?: string | null;
  shotType?: string | null;
  cameraMovement?: string | null;
  lens?: string | null;
  framing?: string | null;
  action?: string | null;
  dialogue?: string | null;
  props?: string | null;
  wardrobe?: string | null;
  vfxNotes?: string | null;
  lightingNotes?: string | null;
  soundNotes?: string | null;
  estimatedDuration?: number | null;
  unit?: string | null;
  status: ShotStatus;
  notes?: string | null;
}

interface Scene {
  id: number;
  title?: string | null;
  description?: string | null;
  orderIndex: number;
  locationType?: string | null;
  locationDetail?: string | null;
  timeOfDay?: string | null;
  actNumber?: number | null;
  sequenceTitle?: string | null;
  status: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ShotStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  needs_retake: {
    label: "Retake",
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  cut: {
    label: "Cut",
    icon: <Scissors className="h-3 w-3" />,
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(sec?: number | null): string {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function exportCSV(scenes: Scene[], allShots: Shot[], projectTitle: string) {
  const rows: string[][] = [
    [
      "Scene #", "Scene Title", "Location", "Time of Day",
      "Shot #", "Shot Type", "Camera Movement", "Lens", "Framing",
      "Action", "Dialogue", "Props", "Wardrobe", "VFX Notes",
      "Lighting", "Sound", "Duration (s)", "Unit", "Status", "Notes",
    ],
  ];
  for (const scene of scenes) {
    const shots = allShots.filter((s) => s.sceneId === scene.id);
    if (shots.length === 0) {
      rows.push([
        String(scene.orderIndex + 1),
        scene.title || "Untitled",
        [scene.locationType, scene.locationDetail].filter(Boolean).join(" — "),
        scene.timeOfDay || "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
      ]);
    } else {
      for (const shot of shots) {
        rows.push([
          String(scene.orderIndex + 1),
          scene.title || "Untitled",
          [scene.locationType, scene.locationDetail].filter(Boolean).join(" — "),
          scene.timeOfDay || "",
          shot.shotNumber || "",
          shot.shotType || "",
          shot.cameraMovement || "",
          shot.lens || "",
          shot.framing || "",
          shot.action || "",
          shot.dialogue || "",
          shot.props || "",
          shot.wardrobe || "",
          shot.vfxNotes || "",
          shot.lightingNotes || "",
          shot.soundNotes || "",
          String(shot.estimatedDuration || ""),
          shot.unit || "",
          shot.status,
          shot.notes || "",
        ]);
      }
    }
  }
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectTitle.replace(/[^a-z0-9]/gi, "_")}_shot_list.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Scene group ──────────────────────────────────────────────────────────────
function SceneGroup({
  scene,
  shots,
  onGenerate,
  onStatusChange,
  onDelete,
  generating,
}: {
  scene: Scene;
  shots: Shot[];
  onGenerate: (sceneId: number) => void;
  onStatusChange: (shotId: number, status: ShotStatus) => void;
  onDelete: (shotId: number) => void;
  generating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = shots.filter((s) => s.status === "completed").length;
  const totalDuration = shots.reduce((acc, s) => acc + (s.estimatedDuration || 0), 0);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden mb-4">
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Film className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                Scene {scene.orderIndex + 1}
                {scene.title ? ` — ${scene.title}` : ""}
              </span>
              {scene.actNumber && (
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  Act {scene.actNumber}
                </Badge>
              )}
              {scene.sequenceTitle && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 text-violet-400 border-violet-500/30">
                  {scene.sequenceTitle}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[scene.locationType, scene.locationDetail].filter(Boolean).join(" — ")}
              {scene.timeOfDay ? ` · ${scene.timeOfDay}` : ""}
              {shots.length > 0
                ? ` · ${shots.length} shot${shots.length !== 1 ? "s" : ""} · ${completedCount}/${shots.length} done · ${formatDuration(totalDuration)}`
                : " · No shots yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onGenerate(scene.id);
            }}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {shots.length > 0 ? "Regenerate" : "Generate Shots"}
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && shots.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableHead className="text-xs w-12">#</TableHead>
                <TableHead className="text-xs w-20">Type</TableHead>
                <TableHead className="text-xs w-24">Movement</TableHead>
                <TableHead className="text-xs w-20">Lens</TableHead>
                <TableHead className="text-xs">Framing / Action</TableHead>
                <TableHead className="text-xs w-16">Dur.</TableHead>
                <TableHead className="text-xs w-20">Unit</TableHead>
                <TableHead className="text-xs w-28">Status</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shots.map((shot) => {
                const cfg = STATUS_CONFIG[shot.status];
                return (
                  <TableRow key={shot.id} className={shot.status === "cut" ? "opacity-40" : ""}>
                    <TableCell className="text-xs font-mono font-medium">
                      {shot.shotNumber || shot.orderIndex + 1}
                    </TableCell>
                    <TableCell className="text-xs">{shot.shotType || "—"}</TableCell>
                    <TableCell className="text-xs">{shot.cameraMovement || "—"}</TableCell>
                    <TableCell className="text-xs">{shot.lens || "—"}</TableCell>
                    <TableCell className="text-xs max-w-xs">
                      {shot.framing && (
                        <p className="text-muted-foreground truncate">{shot.framing}</p>
                      )}
                      {shot.action && <p className="truncate">{shot.action}</p>}
                      {shot.dialogue && (
                        <p className="text-violet-400/80 italic truncate text-[11px]">
                          "{shot.dialogue}"
                        </p>
                      )}
                      {shot.vfxNotes && (
                        <p className="text-amber-400/80 text-[11px] truncate">
                          VFX: {shot.vfxNotes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{formatDuration(shot.estimatedDuration)}</TableCell>
                    <TableCell className="text-xs">{shot.unit || "A Cam"}</TableCell>
                    <TableCell>
                      <Select
                        value={shot.status}
                        onValueChange={(v) => onStatusChange(shot.id, v as ShotStatus)}
                      >
                        <SelectTrigger className={`h-6 text-xs border px-2 ${cfg.color}`}>
                          <div className="flex items-center gap-1">
                            {cfg.icon}
                            <span>{cfg.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                            <SelectItem key={val} value={val} className="text-xs">
                              <div className="flex items-center gap-1.5">
                                {c.icon}
                                {c.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-400"
                              onClick={() => onDelete(shot.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete shot</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {expanded && shots.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No shots yet. Click "Generate Shots" to create an AI-generated shot list for this scene.
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShotList() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(params.projectId);
  const [generatingSceneId, setGeneratingSceneId] = useState<number | null>(null);

  const { data: project, isLoading: projectLoading } = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: !!user && !!projectId }
  );

  const { data: scenes = [], isLoading: scenesLoading } = trpc.scene.listByProject.useQuery(
    { projectId },
    { enabled: !!user && !!projectId }
  );

  const {
    data: allShots = [],
    isLoading: shotsLoading,
    refetch: refetchShots,
  } = trpc.shots.getForProject.useQuery(
    { projectId },
    { enabled: !!user && !!projectId }
  );

  const utils = trpc.useUtils();

  const generateForScene = trpc.shots.generateForScene.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} shot${data.count !== 1 ? "s" : ""}`);
      utils.shots.getForProject.invalidate({ projectId });
      setGeneratingSceneId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate shots");
      setGeneratingSceneId(null);
    },
  });

  const updateStatus = trpc.shots.updateStatus.useMutation({
    onSuccess: () => {
      utils.shots.getForProject.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message || "Failed to update status"),
  });

  const deleteShot = trpc.shots.delete.useMutation({
    onSuccess: () => {
      toast.success("Shot deleted");
      utils.shots.getForProject.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message || "Failed to delete shot"),
  });

  const isLoading = authLoading || projectLoading || scenesLoading || shotsLoading;

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

  const totalShots = (allShots as Shot[]).length;
  const completedShots = (allShots as Shot[]).filter((s) => s.status === "completed").length;
  const retakeShots = (allShots as Shot[]).filter((s) => s.status === "needs_retake").length;
  const totalDuration = (allShots as Shot[]).reduce(
    (acc, s) => acc + (s.estimatedDuration || 0),
    0
  );
  const sortedScenes = [...(scenes as Scene[])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
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
                <ListOrdered className="h-4 w-4 text-primary shrink-0" />
                {project?.title || "Project"} — Shot List
              </h1>
              <p className="text-xs text-muted-foreground">
                {totalShots} shot{totalShots !== 1 ? "s" : ""} ·{" "}
                {completedShots}/{totalShots} completed
                {retakeShots > 0 ? ` · ${retakeShots} need retake` : ""}
                {totalDuration > 0 ? ` · ~${formatDuration(totalDuration)} total` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchShots()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportCSV(
                  sortedScenes,
                  allShots as Shot[],
                  project?.title || "project"
                )
              }
              disabled={totalShots === 0}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : sortedScenes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No scenes in this project yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate(`/projects/${projectId}/scenes`)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Scenes
            </Button>
          </div>
        ) : (
          <div>
            {sortedScenes.map((scene) => {
              const sceneShots = (allShots as Shot[])
                .filter((s) => s.sceneId === scene.id)
                .sort((a, b) => a.orderIndex - b.orderIndex);
              return (
                <SceneGroup
                  key={scene.id}
                  scene={scene as Scene}
                  shots={sceneShots}
                  generating={generatingSceneId === scene.id}
                  onGenerate={(sceneId) => {
                    setGeneratingSceneId(sceneId);
                    generateForScene.mutate({ sceneId, projectId });
                  }}
                  onStatusChange={(shotId, status) =>
                    updateStatus.mutate({ id: shotId, status })
                  }
                  onDelete={(shotId) => deleteShot.mutate({ id: shotId })}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
