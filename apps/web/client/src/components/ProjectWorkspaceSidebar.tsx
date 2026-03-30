/**
 * ProjectWorkspaceSidebar
 * 
 * A context-aware sidebar panel that morphs when the user is inside a project.
 * Renders the full production pipeline (Development → Pre-Production → Production → Post → Delivery)
 * with per-stage navigation links and live progress indicators.
 * 
 * Designed to be embedded inside DashboardLayout's SidebarContent when on /projects/:id routes.
 */
import { trpc } from "@/lib/trpc";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Film,
  Clapperboard,
  Users,
  FileText,
  Music,
  Palette,
  Video,
  Download,
  ChevronLeft,
  Layers,
  Sparkles,
  MapPin,
  BookOpen,
  DollarSign,
  Scissors,
  Wand2,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Brain,
  Activity,
  ListOrdered,
  Layers2,
  Camera,
} from "lucide-react";
import { useLocation } from "wouter";

interface ProjectWorkspaceSidebarProps {
  projectId: number;
  isCollapsed: boolean;
}

// Production pipeline stages — each maps to a section of the project workspace
const PIPELINE_STAGES = [
  {
    id: "development",
    label: "Development",
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    items: [
      { label: "Overview", path: "", icon: Film },
      { label: "Story & Script", path: "/script", icon: FileText },
      { label: "Characters", path: "/characters", icon: Users },
      { label: "Production Memory", path: "/memory", icon: Brain },
    ],
  },
  {
    id: "pre-production",
    label: "Pre-Production",
    icon: Layers,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    items: [
      { label: "Production Board", path: "/board", icon: Clapperboard },
      { label: "Storyboard", path: "/storyboard", icon: Layers },
      { label: "Shot List", path: "/shot-list", icon: ListOrdered },
      { label: "Locations", path: "/locations", icon: MapPin },
      { label: "Mood Board", path: "/mood-board", icon: Palette },
      { label: "Budget", path: "/budget", icon: DollarSign },
    ],
  },
  {
    id: "production",
    label: "Production",
    icon: Clapperboard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    items: [
      { label: "Scenes", path: "/scenes", icon: Clapperboard },
      { label: "Multi-Shot", path: "/multi-shot", icon: Layers2 },
      { label: "AI Casting", path: "/ai-casting", icon: Sparkles },
      { label: "Live Action Plate", path: "/live-action-plate", icon: Camera },
      { label: "Dialogue Editor", path: "/dialogue", icon: FileText },
      { label: "Sound Effects", path: "/sound-effects", icon: Music },
    ],
  },
  {
    id: "post-production",
    label: "Post-Production",
    icon: Scissors,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    items: [
      { label: "Director's Cut", path: "/director-cut", icon: Scissors },
      { label: "Color Grading", path: "/color-grading", icon: Palette },
      { label: "VFX Suite", path: "/vfx-suite", icon: Wand2 },
      { label: "Continuity Check", path: "/continuity", icon: CheckCircle2 },
      { label: "Subtitles", path: "/subtitles", icon: FileText },
      { label: "Activity Log", path: "/activity", icon: Activity },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Download,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    items: [
      { label: "Trailer Studio", path: "/trailer-studio", icon: Video },
      { label: "Credits Editor", path: "/credits", icon: Film },
      { label: "NLE Export", path: "/nle-export", icon: Download },
    ],
  },
] as const;

export default function ProjectWorkspaceSidebar({
  projectId,
  isCollapsed,
}: ProjectWorkspaceSidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: project } = trpc.project.get.useQuery(
    { id: projectId },
    { staleTime: 30_000 }
  );
  const { data: scenes } = trpc.scene.listByProject.useQuery(
    { projectId },
    { staleTime: 30_000 }
  );

  const baseProjectPath = `/projects/${projectId}`;

  // Compute overall progress from scenes
  const totalScenes = scenes?.length ?? 0;
  const completedScenes =
    scenes?.filter((s: any) => s.status === "completed" || s.videoUrl).length ?? 0;
  const progressPct =
    totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  const isActive = (itemPath: string) => {
    const fullPath = `${baseProjectPath}${itemPath}`;
    if (itemPath === "") {
      // Overview: exact match on /projects/:id
      return location === baseProjectPath || location === `${baseProjectPath}/`;
    }
    return location.startsWith(fullPath);
  };

  if (isCollapsed) {
    // Collapsed: show only stage icons as tooltips
    return (
      <SidebarMenu className="px-1 py-1">
        {PIPELINE_STAGES.map((stage) => (
          <SidebarMenuItem key={stage.id}>
            <SidebarMenuButton
              tooltip={stage.label}
              className="h-9 justify-center"
              onClick={() => {
                const firstItem = stage.items[0];
                setLocation(`${baseProjectPath}${firstItem.path}`);
              }}
            >
              <stage.icon className={`h-4 w-4 ${stage.color}`} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto">
      {/* Project context header */}
      <div className="px-3 pt-2 pb-3 border-b border-border/50">
        <button
          onClick={() => setLocation("/projects")}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="h-3 w-3" />
          <span>All Projects</span>
        </button>
        <div className="flex items-start gap-2">
          {project?.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="h-9 w-9 rounded object-cover shrink-0 border border-border/50"
            />
          ) : (
            <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
              <Film className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">
              {project?.title ?? "Loading…"}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                {project?.genre ?? "—"}
              </span>
              {project?.status && (
                <span
                  className={`text-[9px] uppercase tracking-wider font-bold px-1 rounded ${
                    project.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : project.status === "generating"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {project.status}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Scene progress bar */}
        {totalScenes > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground">
                {completedScenes}/{totalScenes} scenes rendered
              </span>
              <span className="text-[9px] font-semibold text-primary">
                {progressPct}%
              </span>
            </div>
            <Progress value={progressPct} className="h-1" />
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage.id} className="px-2 py-1">
          {/* Stage label */}
          <div className="flex items-center gap-1.5 px-2 mb-1 mt-2">
            <stage.icon className={`h-3 w-3 ${stage.color}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {stage.label}
            </span>
          </div>
          <SidebarMenu>
            {stage.items.map((item) => {
              const active = isActive(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={() =>
                      setLocation(`${baseProjectPath}${item.path}`)
                    }
                    tooltip={item.label}
                    className="h-8 transition-all font-normal text-xs"
                  >
                    <item.icon
                      className={`h-3.5 w-3.5 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      ))}
    </div>
  );
}
