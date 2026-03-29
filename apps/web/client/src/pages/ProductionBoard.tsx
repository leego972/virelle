/**
 * ProductionBoard
 *
 * A Kanban-style scene board organized by Act and Production Stage.
 * Replaces the 8-tab ProjectDetail layout with a single, scannable board
 * that shows all scenes grouped by act, with per-scene status, quick actions,
 * and drag-to-reorder within each act.
 *
 * Phase 5: Production Board
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clapperboard,
  Plus,
  MoreHorizontal,
  Play,
  Edit,
  Trash2,
  Video,
  Image,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Film,
  Layers,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scene {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  orderIndex: number;
  status?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  generatedUrl?: string;
  actNumber?: number;
  sequenceTitle?: string;
  productionStage?: string;
  duration?: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function SceneStatusBadge({ scene }: { scene: Scene }) {
  if (scene.videoUrl) {
    return (
      <Badge className="text-[10px] gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/20 h-5">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Video
      </Badge>
    );
  }
  if (scene.generatedUrl || scene.thumbnailUrl) {
    return (
      <Badge className="text-[10px] gap-1 bg-blue-500/15 text-blue-400 border-blue-500/20 h-5">
        <Image className="h-2.5 w-2.5" />
        Image
      </Badge>
    );
  }
  if (scene.status === "generating") {
    return (
      <Badge className="text-[10px] gap-1 bg-amber-500/15 text-amber-400 border-amber-500/20 h-5">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Rendering
      </Badge>
    );
  }
  if (scene.status === "failed") {
    return (
      <Badge className="text-[10px] gap-1 bg-rose-500/15 text-rose-400 border-rose-500/20 h-5">
        <XCircle className="h-2.5 w-2.5" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] gap-1 bg-muted text-muted-foreground border-border h-5">
      <Clock className="h-2.5 w-2.5" />
      Draft
    </Badge>
  );
}

// ─── Scene Card ───────────────────────────────────────────────────────────────
function SceneCard({
  scene,
  projectId,
  onEdit,
  onDelete,
  onGenerate,
}: {
  scene: Scene;
  projectId: number;
  onEdit: (scene: Scene) => void;
  onDelete: (sceneId: number) => void;
  onGenerate: (sceneId: number) => void;
}) {
  const [, setLocation] = useLocation();
  const hasMedia = !!(scene.videoUrl || scene.generatedUrl || scene.thumbnailUrl);
  const mediaUrl = scene.videoUrl || scene.generatedUrl || scene.thumbnailUrl;

  return (
    <div className="group relative rounded-lg border border-border/60 bg-card hover:border-border transition-all shadow-sm hover:shadow-md">
      {/* Media preview */}
      {hasMedia ? (
        <div className="relative rounded-t-lg overflow-hidden aspect-video bg-muted">
          {scene.videoUrl ? (
            <video
              src={scene.videoUrl}
              className="w-full h-full object-cover"
              muted
              onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
              onMouseLeave={(e) => {
                const v = e.currentTarget as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
          ) : (
            <img
              src={mediaUrl!}
              alt={scene.title}
              className="w-full h-full object-cover"
            />
          )}
          {scene.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <Play className="h-8 w-8 text-white drop-shadow" />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-t-lg aspect-video bg-muted/50 flex items-center justify-center border-b border-border/40">
          <Clapperboard className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">
              {scene.title || `Scene ${scene.orderIndex + 1}`}
            </p>
            {scene.sequenceTitle && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {scene.sequenceTitle}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(scene)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit Scene
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setLocation(`/projects/${projectId}/scenes?scene=${scene.id}`)
                }
              >
                <Layers className="h-3.5 w-3.5 mr-2" />
                Open in Editor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onGenerate(scene.id)}>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(scene.id)}
                className="text-rose-400 focus:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {scene.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
            {scene.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <SceneStatusBadge scene={scene} />
          {scene.duration && (
            <span className="text-[10px] text-muted-foreground">
              {scene.duration}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Act Column ───────────────────────────────────────────────────────────────
function ActColumn({
  actNumber,
  scenes,
  projectId,
  onEdit,
  onDelete,
  onGenerate,
  onAddScene,
}: {
  actNumber: number;
  scenes: Scene[];
  projectId: number;
  onEdit: (scene: Scene) => void;
  onDelete: (sceneId: number) => void;
  onGenerate: (sceneId: number) => void;
  onAddScene: (actNumber: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const completedScenes = scenes.filter(
    (s) => s.videoUrl || s.generatedUrl
  ).length;
  const progressPct =
    scenes.length > 0
      ? Math.round((completedScenes / scenes.length) * 100)
      : 0;

  const actLabels: Record<number, string> = {
    1: "Act I — Setup",
    2: "Act II — Confrontation",
    3: "Act III — Resolution",
    4: "Act IV",
    5: "Act V",
  };

  return (
    <div className="flex-1 min-w-[280px] max-w-[340px]">
      {/* Act header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 group"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
          <span className="text-sm font-semibold">
            {actLabels[actNumber] ?? `Act ${actNumber}`}
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {scenes.length}
          </Badge>
        </button>
        <button
          onClick={() => onAddScene(actNumber)}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent transition-colors"
          title="Add scene to this act"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Progress bar */}
      {scenes.length > 0 && (
        <div className="mb-3">
          <Progress value={progressPct} className="h-0.5" />
          <p className="text-[10px] text-muted-foreground mt-1">
            {completedScenes}/{scenes.length} rendered
          </p>
        </div>
      )}

      {/* Scenes */}
      {!collapsed && (
        <div className="space-y-3">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              projectId={projectId}
              onEdit={onEdit}
              onDelete={onDelete}
              onGenerate={onGenerate}
            />
          ))}
          {scenes.length === 0 && (
            <button
              onClick={() => onAddScene(actNumber)}
              className="w-full rounded-lg border-2 border-dashed border-border/50 hover:border-primary/40 p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Add first scene</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Scene Dialog ────────────────────────────────────────────────────────
function EditSceneDialog({
  scene,
  open,
  onClose,
  onSave,
}: {
  scene: Scene | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Scene>) => void;
}) {
  const [title, setTitle] = useState(scene?.title ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [sequenceTitle, setSequenceTitle] = useState(scene?.sequenceTitle ?? "");
  const [actNumber, setActNumber] = useState(scene?.actNumber ?? 1);

  // Sync when scene changes
  useState(() => {
    setTitle(scene?.title ?? "");
    setDescription(scene?.description ?? "");
    setSequenceTitle(scene?.sequenceTitle ?? "");
    setActNumber(scene?.actNumber ?? 1);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Scene</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm">Scene Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              placeholder="Scene title..."
            />
          </div>
          <div>
            <Label className="text-sm">Sequence / Sub-title</Label>
            <Input
              value={sequenceTitle}
              onChange={(e) => setSequenceTitle(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. The Chase Begins"
            />
          </div>
          <div>
            <Label className="text-sm">Act</Label>
            <div className="flex gap-2 mt-1.5">
              {[1, 2, 3].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setActNumber(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    actNumber === a
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  Act {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 resize-none"
              rows={3}
              placeholder="Scene description..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({ title, description, sequenceTitle, actNumber })
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ProductionBoard ─────────────────────────────────────────────────────
export default function ProductionBoard() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();

  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [addingToAct, setAddingToAct] = useState<number | null>(null);
  const [newSceneTitle, setNewSceneTitle] = useState("");

  const { data: project } = trpc.project.get.useQuery(
    { id: projectId },
    { staleTime: 30_000 }
  );
  const { data: rawScenes = [], refetch: refetchScenes } =
    trpc.scene.listByProject.useQuery(
      { projectId },
      { staleTime: 10_000, refetchInterval: 15_000 }
    );

  const scenes = rawScenes as Scene[];

  const createScene = trpc.scene.create.useMutation({
    onSuccess: () => {
      toast.success("Scene added");
      setAddingToAct(null);
      setNewSceneTitle("");
      refetchScenes();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateScene = trpc.scene.update.useMutation({
    onSuccess: () => {
      toast.success("Scene updated");
      setEditingScene(null);
      refetchScenes();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteScene = trpc.scene.delete.useMutation({
    onSuccess: () => {
      toast.success("Scene deleted");
      refetchScenes();
    },
    onError: (err) => toast.error(err.message),
  });

  const generatePreview = trpc.scene.generatePreview.useMutation({
    onSuccess: () => {
      toast.success("Generation started");
      refetchScenes();
    },
    onError: (err) => toast.error(err.message),
  });

  // Group scenes by act number (default act 1 for scenes without actNumber)
  const scenesByAct: Record<number, Scene[]> = {};
  for (const scene of scenes) {
    const act = scene.actNumber ?? 1;
    if (!scenesByAct[act]) scenesByAct[act] = [];
    scenesByAct[act].push(scene);
  }
  // Sort scenes within each act by orderIndex
  for (const act of Object.keys(scenesByAct)) {
    scenesByAct[Number(act)].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Determine acts to show (at least 3 for new projects)
  const existingActs = Object.keys(scenesByAct).map(Number);
  const actsToShow = Array.from(
    new Set([1, 2, 3, ...existingActs])
  ).sort((a, b) => a - b);

  const totalScenes = scenes.length;
  const completedScenes = scenes.filter((s) => s.videoUrl || s.generatedUrl).length;
  const overallProgress =
    totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  const handleAddScene = (actNumber: number) => {
    setAddingToAct(actNumber);
    setNewSceneTitle("");
  };

  const handleConfirmAddScene = () => {
    if (!newSceneTitle.trim()) return;
    createScene.mutate({
      projectId,
      title: newSceneTitle.trim(),
      actNumber: addingToAct ?? 1,
      orderIndex: (scenesByAct[addingToAct ?? 1] ?? []).length,
    } as any);
  };

  const handleEditSave = (data: Partial<Scene>) => {
    if (!editingScene) return;
    updateScene.mutate({ id: editingScene.id, ...data } as any);
  };

  const handleDelete = (sceneId: number) => {
    if (!confirm("Delete this scene? This cannot be undone.")) return;
    deleteScene.mutate({ id: sceneId });
  };

  const handleGenerate = (sceneId: number) => {
    generatePreview.mutate({ sceneId, projectId } as any);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Board header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Production Board</h1>
            {project?.title && (
              <span className="text-sm text-muted-foreground">
                — {project.title}
              </span>
            )}
          </div>
          {totalScenes > 0 && (
            <div className="flex items-center gap-3 mt-1.5">
              <Progress value={overallProgress} className="h-1.5 w-32" />
              <span className="text-xs text-muted-foreground">
                {completedScenes}/{totalScenes} scenes rendered ({overallProgress}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/projects/${projectId}/scenes`)}
            className="gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            Scene Editor
          </Button>
          <Button
            size="sm"
            onClick={() => handleAddScene(1)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Scene
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {actsToShow.map((actNumber) => (
          <ActColumn
            key={actNumber}
            actNumber={actNumber}
            scenes={scenesByAct[actNumber] ?? []}
            projectId={projectId}
            onEdit={setEditingScene}
            onDelete={handleDelete}
            onGenerate={handleGenerate}
            onAddScene={handleAddScene}
          />
        ))}
      </div>

      {/* Add scene dialog */}
      <Dialog
        open={addingToAct !== null}
        onOpenChange={(o) => !o && setAddingToAct(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Scene to Act {addingToAct}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm">Scene Title</Label>
            <Input
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAddScene();
              }}
              placeholder="e.g. The Confrontation"
              className="mt-1.5"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingToAct(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAddScene}
              disabled={!newSceneTitle.trim() || createScene.isPending}
            >
              {createScene.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Scene"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit scene dialog */}
      <EditSceneDialog
        scene={editingScene}
        open={editingScene !== null}
        onClose={() => setEditingScene(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
