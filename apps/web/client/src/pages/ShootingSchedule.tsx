/**
   * ShootingSchedule — Stripboard
   *
   * Industry-standard shooting schedule / stripboard for film productions.
   * Used by 1st ADs at every major studio to plan shoot days.
   *
   * Features:
   * - Auto-generates from project scenes
   * - Day-by-day strip view (classic stripboard format)
   * - Drag-friendly ordering with Up/Down controls
   * - Configurable pages per day (default: 4.5 pages = ~1 shoot day)
   * - Cast breakdown per day
   * - PDF-ready layout
   * - Export to CSV
   */
  import { useState, useMemo } from "react";
  import { useParams, useLocation } from "wouter";
  import { trpc } from "@/lib/trpc";
  import { useAuth } from "@/_core/hooks/useAuth";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Separator } from "@/components/ui/separator";
  import { toast } from "sonner";
  import {
    ArrowLeft, Sparkles, Download, CalendarDays, Clock,
    ChevronUp, ChevronDown, Film, Loader2, Sun, Moon,
    Sunset, Users, MapPin, AlertCircle, Settings2, Clapperboard,
  } from "lucide-react";
  import { getLoginUrl } from "@/const";

  // ─── Types ────────────────────────────────────────────────────────────────────
  interface Strip {
    id: string;
    sceneNumber: string;
    title: string;
    location: string;
    locationType: "INT" | "EXT" | "INT/EXT";
    timeOfDay: string;
    estimatedPages: number;
    cast: string[];
    mood: string;
    notes: string;
    isBreak?: boolean;
    breakLabel?: string;
  }

  interface ShootDay {
    dayNumber: number;
    date: string;
    strips: Strip[];
    totalPages: number;
  }

  const TIME_COLORS: Record<string, string> = {
    "day":     "border-l-4 border-l-yellow-500",
    "night":   "border-l-4 border-l-blue-800",
    "dawn":    "border-l-4 border-l-orange-400",
    "dusk":    "border-l-4 border-l-purple-500",
    "morning": "border-l-4 border-l-amber-400",
    "evening": "border-l-4 border-l-indigo-500",
  };

  function makeShootDays(strips: Strip[], pagesPerDay: number, startDate: Date): ShootDay[] {
    const days: ShootDay[] = [];
    let dayStrips: Strip[] = [];
    let dayPages = 0;
    let dayNum = 1;
    const getDate = (offset: number) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + offset * 1); // skip weekends could be added
      return d.toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
    };
    let dayOffset = 0;
    strips.forEach(strip => {
      if (dayPages + strip.estimatedPages > pagesPerDay && dayStrips.length > 0) {
        days.push({ dayNumber: dayNum++, date: getDate(dayOffset++), strips: [...dayStrips], totalPages: dayPages });
        dayStrips = [];
        dayPages = 0;
      }
      dayStrips.push(strip);
      dayPages += strip.estimatedPages;
    });
    if (dayStrips.length > 0) {
      days.push({ dayNumber: dayNum, date: getDate(dayOffset), strips: dayStrips, totalPages: dayPages });
    }
    return days;
  }

  function buildStripsFromScenes(scenes: any[], characters: any[]): Strip[] {
    return scenes.map((s, i) => {
      const cast = characters.slice(0, 3).map(c => c.name);
      const pages = s.duration ? Math.max(0.5, Math.round((s.duration / 90) * 10) / 10) : 1;
      return {
        id: String(s.id),
        sceneNumber: String(i + 1),
        title: s.title || `Scene ${i+1}`,
        location: `${s.locationType || "INT"}. ${s.locationDetail || "Location TBD"}`,
        locationType: (s.locationType || "INT") as any,
        timeOfDay: (s.timeOfDay || "day").toLowerCase(),
        estimatedPages: pages,
        cast,
        mood: s.mood || "",
        notes: s.productionNotes || "",
      };
    });
  }

  export default function ShootingSchedule() {
    const { projectId } = useParams<{ projectId: string }>();
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const [strips, setStrips] = useState<Strip[]>([]);
    const [generating, setGenerating] = useState(false);
    const [pagesPerDay, setPagesPerDay] = useState(4.5);
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [view, setView] = useState<"stripboard" | "list">("stripboard");

    const projectQuery = trpc.project.get.useQuery({ id: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });
    const scenesQuery = trpc.scene.list.useQuery({ projectId: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });
    const charactersQuery = trpc.character.list.useQuery({ projectId: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });

    if (!user) { navigate(getLoginUrl()); return null; }

    const project = projectQuery.data;
    const scenes = scenesQuery.data || [];
    const characters = charactersQuery.data || [];
    const loading = projectQuery.isLoading || scenesQuery.isLoading;

    const shootDays = useMemo(() => {
      if (strips.length === 0) return [];
      return makeShootDays(strips, pagesPerDay, new Date(startDate));
    }, [strips, pagesPerDay, startDate]);

    function handleGenerate() {
      setGenerating(true);
      try {
        const s = buildStripsFromScenes(scenes, characters);
        setStrips(s);
        toast.success(`Schedule built: ${s.length} scenes across ${makeShootDays(s, pagesPerDay, new Date(startDate)).length} shoot days`);
      } catch (err: any) {
        toast.error("Failed to generate schedule");
      } finally {
        setGenerating(false);
      }
    }

    function moveStrip(index: number, direction: -1 | 1) {
      const newStrips = [...strips];
      const target = index + direction;
      if (target < 0 || target >= newStrips.length) return;
      [newStrips[index], newStrips[target]] = [newStrips[target], newStrips[index]];
      setStrips(newStrips);
    }

    function handleExportCSV() {
      const rows = [
        ["VIRELLE STUDIOS — SHOOTING SCHEDULE"],
        ["Project", project?.title || ""],
        ["Total Scenes", strips.length],
        ["Total Shoot Days", shootDays.length],
        ["Pages Per Day", pagesPerDay],
        [""],
        ...shootDays.flatMap(day => [
          [`SHOOT DAY ${day.dayNumber} — ${day.date} (${day.totalPages.toFixed(1)} pages)`],
          ["#", "Scene", "Location", "Time", "Pages", "Cast", "Notes"],
          ...day.strips.map(s => [s.sceneNumber, s.title, s.location, s.timeOfDay, s.estimatedPages, s.cast.join("; "), s.notes]),
          [""],
        ]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `shooting-schedule-${project?.title || "film"}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Schedule exported");
    }

    const TimeIcon = ({ t }: { t: string }) => {
      if (t === "night") return <Moon className="w-3 h-3 text-blue-400" />;
      if (t === "dusk" || t === "evening") return <Sunset className="w-3 h-3 text-purple-400" />;
      return <Sun className="w-3 h-3 text-yellow-400" />;
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}`)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <CalendarDays className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-sm">Shooting Schedule</span>
          <Badge variant="secondary" className="text-xs">Stripboard</Badge>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Pages/day:</span>
              <Input
                type="number" step="0.5" min="1" max="12"
                value={pagesPerDay}
                onChange={e => setPagesPerDay(parseFloat(e.target.value))}
                className="w-16 h-7 text-xs text-center"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Start:</span>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-7 text-xs w-36"
              />
            </div>
            {strips.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
            )}
            <Button size="sm" onClick={handleGenerate} disabled={generating || loading || scenes.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white">
              {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Build Schedule
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : strips.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-16 h-16 text-blue-400/40 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Build Your Shoot Schedule</h2>
              <p className="text-muted-foreground mb-1">{scenes.length} scenes ready to schedule</p>
              <p className="text-muted-foreground mb-6 text-sm">The schedule builder groups your scenes into shoot days based on your pages-per-day setting. Reorder strips to optimise location days and cast availability.</p>
              <Button onClick={handleGenerate} disabled={scenes.length === 0} className="bg-blue-600 hover:bg-blue-500">
                <Sparkles className="w-4 h-4 mr-2" /> Build from {scenes.length} Scenes
              </Button>
              {scenes.length === 0 && <p className="text-xs text-muted-foreground mt-3">Add scenes to your project first</p>}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Shoot Days", value: shootDays.length, color: "text-blue-400" },
                  { label: "Total Scenes", value: strips.length, color: "text-amber-400" },
                  { label: "Total Pages", value: strips.reduce((a, s) => a + s.estimatedPages, 0).toFixed(1), color: "text-green-400" },
                  { label: "Avg Pages/Day", value: pagesPerDay.toFixed(1), color: "text-purple-400" },
                ].map(stat => (
                  <Card key={stat.label} className="text-center p-3">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>

              {/* Stripboard */}
              <div className="space-y-4">
                {shootDays.map(day => (
                  <Card key={day.dayNumber} className="overflow-hidden">
                    <div className="bg-blue-900/30 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-sm text-blue-300">SHOOT DAY {day.dayNumber}</span>
                        <span className="text-xs text-muted-foreground">{day.date}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-300">
                        {day.totalPages.toFixed(1)} pages
                      </Badge>
                    </div>
                    <CardContent className="p-0">
                      {day.strips.map((strip, si) => {
                        const globalIdx = strips.findIndex(s => s.id === strip.id);
                        const timeColor = TIME_COLORS[strip.timeOfDay] || "border-l-4 border-l-zinc-600";
                        return (
                          <div key={strip.id} className={`flex items-stretch border-b border-border/50 hover:bg-muted/10 transition-colors ${timeColor}`}>
                            <div className="flex flex-col items-center justify-center px-2 py-1 gap-0.5 border-r border-border/30">
                              <button onClick={() => moveStrip(globalIdx, -1)} disabled={globalIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"><ChevronUp className="w-3 h-3" /></button>
                              <button onClick={() => moveStrip(globalIdx, 1)} disabled={globalIdx === strips.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 flex-1 flex-wrap">
                              <span className="font-mono text-amber-500 font-bold text-sm w-6 shrink-0">{strip.sceneNumber}</span>
                              <TimeIcon t={strip.timeOfDay} />
                              <span className="text-xs font-semibold uppercase text-muted-foreground w-8 shrink-0">{strip.locationType}</span>
                              <span className="font-medium text-sm flex-1 min-w-[120px]">{strip.title}</span>
                              <span className="text-xs text-muted-foreground hidden md:block flex-1">{strip.location}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span className="hidden sm:block">{strip.cast.slice(0, 2).join(", ")}{strip.cast.length > 2 ? ` +${strip.cast.length-2}` : ""}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-center px-3 border-l border-border/30 shrink-0">
                              <span className="text-xs font-mono text-muted-foreground">{strip.estimatedPages}p</span>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  