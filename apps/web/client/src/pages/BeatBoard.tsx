/**
 * BeatBoard — Story Outline & Index Cards
 *
 * Visual story planning tool used before writing a screenplay.
 * Equivalent to Celtx's Index Cards and Final Draft's Beat Board.
 * Used by: Writers, Directors, Story Producers.
 *
 * Features:
 * - Index cards in three-act structure columns
 * - Board view (cards) and List view (ordered outline)
 * - Each card: title, description, act, color, characters, major beat flag
 * - Reorder beats within each act
 * - Export story outline as .txt
 */
import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Download, Edit2,
  ChevronLeft, ChevronRight, BookOpen, LayoutGrid, List,
} from "lucide-react";
import { getLoginUrl } from "@/const";

function makeId() { return Math.random().toString(36).slice(2, 9); }

type Act = "Act 1" | "Act 2A" | "Act 2B" | "Act 3";
type BeatColor = "zinc" | "blue" | "amber" | "emerald" | "red" | "purple" | "pink";

interface Beat {
  id: string;
  title: string;
  description: string;
  act: Act;
  color: BeatColor;
  characters: string;
  orderIndex: number;
  isMajor: boolean;
}

const ACT_CONFIG: Record<Act, { label: string; description: string; border: string; bg: string }> = {
  "Act 1":  { label: "Act 1 — Setup",         description: "Establish world, protagonist, inciting incident (~25%)", border: "border-blue-500/60",   bg: "bg-blue-900/10" },
  "Act 2A": { label: "Act 2A — Rising Action", description: "Protagonist pursues goal, obstacles mount (~25%)",      border: "border-amber-500/60",  bg: "bg-amber-900/10" },
  "Act 2B": { label: "Act 2B — Confrontation", description: "Midpoint twist, all-is-lost moment (~25%)",            border: "border-red-500/60",    bg: "bg-red-900/10" },
  "Act 3":  { label: "Act 3 — Resolution",     description: "Climax, final battle, resolution (~25%)",              border: "border-emerald-500/60", bg: "bg-emerald-900/10" },
};

const BEAT_COLORS: Record<BeatColor, string> = {
  zinc:    "bg-zinc-800/80 border-zinc-600",
  blue:    "bg-blue-900/60 border-blue-500/60",
  amber:   "bg-amber-900/60 border-amber-500/60",
  emerald: "bg-emerald-900/60 border-emerald-500/60",
  red:     "bg-red-900/60 border-red-500/60",
  purple:  "bg-purple-900/60 border-purple-500/60",
  pink:    "bg-pink-900/60 border-pink-500/60",
};

const DEFAULT_BEATS: Omit<Beat, "id">[] = [
  { title: "Opening Image",        description: "The first image of the film — establishes tone, world, and theme visually.",      act: "Act 1",  color: "blue",    characters: "", orderIndex: 0, isMajor: true },
  { title: "Inciting Incident",    description: "The event that disrupts the protagonist's ordinary world and sets the story in motion.", act: "Act 1", color: "blue", characters: "", orderIndex: 1, isMajor: true },
  { title: "End of Act 1",         description: "The protagonist commits to the journey. No turning back.",                         act: "Act 1",  color: "amber",   characters: "", orderIndex: 2, isMajor: true },
  { title: "Fun & Games",          description: "The 'promise of the premise' — the reason audiences came to see the film.",        act: "Act 2A", color: "zinc",    characters: "", orderIndex: 3, isMajor: false },
  { title: "Midpoint",             description: "A major plot point that shifts the story direction. False victory or defeat.",     act: "Act 2A", color: "amber",   characters: "", orderIndex: 4, isMajor: true },
  { title: "All Is Lost",          description: "The lowest point. Everything the protagonist worked for seems to be gone.",        act: "Act 2B", color: "red",     characters: "", orderIndex: 5, isMajor: true },
  { title: "Dark Night of the Soul", description: "The protagonist reflects on their failure and finds new resolve.",               act: "Act 2B", color: "red",     characters: "", orderIndex: 6, isMajor: false },
  { title: "Climax",               description: "The final confrontation. The protagonist faces the main conflict head-on.",        act: "Act 3",  color: "emerald", characters: "", orderIndex: 7, isMajor: true },
  { title: "Final Image",          description: "The last image of the film — shows how the world/protagonist has changed.",       act: "Act 3",  color: "emerald", characters: "", orderIndex: 8, isMajor: true },
];

export default function BeatBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [beats, setBeats] = useState<Beat[]>(() => DEFAULT_BEATS.map(b => ({ ...b, id: makeId() })));
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [showAdd, setShowAdd] = useState<{ act: Act } | null>(null);
  const [newBeat, setNewBeat] = useState<Omit<Beat, "id">>({ title: "", description: "", act: "Act 1", color: "zinc", characters: "", orderIndex: 0, isMajor: false });
  const [view, setView] = useState<"board" | "list">("board");

  const projectQuery = trpc.project.get.useQuery({ id: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });
  if (!user) { navigate(getLoginUrl()); return null; }
  const project = projectQuery.data;

  const beatsByAct = useMemo(() => {
    const groups: Record<Act, Beat[]> = { "Act 1": [], "Act 2A": [], "Act 2B": [], "Act 3": [] };
    [...beats].sort((a, b) => a.orderIndex - b.orderIndex).forEach(b => groups[b.act].push(b));
    return groups;
  }, [beats]);

  function addBeat(act: Act) {
    if (!newBeat.title.trim()) { toast.error("Enter a beat title"); return; }
    const maxOrder = beats.filter(b => b.act === act).reduce((m, b) => Math.max(m, b.orderIndex), -1);
    const beat: Beat = { ...newBeat, id: makeId(), act, orderIndex: maxOrder + 1 };
    setBeats(prev => [...prev, beat]);
    setNewBeat({ title: "", description: "", act: "Act 1", color: "zinc", characters: "", orderIndex: 0, isMajor: false });
    setShowAdd(null);
    toast.success("Beat added");
  }

  function removeBeat(id: string) { setBeats(prev => prev.filter(b => b.id !== id)); }

  function moveBeat(id: string, direction: -1 | 1) {
    const beat = beats.find(b => b.id === id);
    if (!beat) return;
    const actBeats = [...beats].filter(b => b.act === beat.act).sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = actBeats.findIndex(b => b.id === id);
    const target = idx + direction;
    if (target < 0 || target >= actBeats.length) return;
    const targetBeat = actBeats[target];
    setBeats(prev => prev.map(b => {
      if (b.id === id) return { ...b, orderIndex: targetBeat.orderIndex };
      if (b.id === targetBeat.id) return { ...b, orderIndex: beat.orderIndex };
      return b;
    }));
  }

  function saveEdit() {
    if (!editingBeat) return;
    setBeats(prev => prev.map(b => b.id === editingBeat.id ? editingBeat : b));
    setEditingBeat(null);
    toast.success("Beat updated");
  }

  function handleExport() {
    const acts: Act[] = ["Act 1", "Act 2A", "Act 2B", "Act 3"];
    const lines = acts.flatMap(act => [
      `\n=== ${ACT_CONFIG[act].label.toUpperCase()} ===`,
      ...beatsByAct[act].map((b, i) => `${i + 1}. ${b.isMajor ? "★ " : ""}${b.title}\n   ${b.description}${b.characters ? `\n   Characters: ${b.characters}` : ""}`),
    ]);
    const text = [`STORY OUTLINE — ${project?.title || "Film"}`, ...lines].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `beat-board-${project?.title || "film"}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Story outline exported");
  }

  const ACTS: Act[] = ["Act 1", "Act 2A", "Act 2B", "Act 3"];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <BookOpen className="w-5 h-5 text-amber-400" />
        <span className="font-semibold text-sm">Beat Board</span>
        <Badge variant="secondary" className="text-xs">{beats.length} beats</Badge>
        <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden ml-2">
          <button onClick={() => setView("board")} className={`px-3 py-1.5 text-xs transition-colors ${view === "board" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:bg-muted/30"}`}>
            <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Board
          </button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs transition-colors ${view === "list" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:bg-muted/30"}`}>
            <List className="w-3.5 h-3.5 inline mr-1" />List
          </button>
        </div>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export Outline</Button>
        </div>
      </div>

      <div className="p-4">
        {view === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {ACTS.map(act => {
              const cfg = ACT_CONFIG[act];
              return (
                <div key={act} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                  <div className="mb-3">
                    <h3 className="font-bold text-sm">{cfg.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">{beatsByAct[act].length} beats</Badge>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {beatsByAct[act].map((beat) => (
                      <div key={beat.id}
                        className={`border rounded-md p-2.5 cursor-pointer hover:ring-1 hover:ring-amber-500/40 transition-all ${BEAT_COLORS[beat.color]}`}
                        onClick={() => setEditingBeat({ ...beat })}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {beat.isMajor && <span className="text-amber-400 mr-1">★</span>}
                              {beat.title}
                            </p>
                            {beat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{beat.description}</p>}
                            {beat.characters && <p className="text-xs text-blue-400 mt-1 truncate">{beat.characters}</p>}
                          </div>
                          <div className="flex flex-col shrink-0">
                            <button onClick={e => { e.stopPropagation(); moveBeat(beat.id, -1); }} className="p-0.5 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-3 h-3" /></button>
                            <button onClick={e => { e.stopPropagation(); moveBeat(beat.id, 1); }} className="p-0.5 text-muted-foreground hover:text-foreground"><ChevronRight className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost"
                    className="w-full mt-2 text-xs h-7 border border-dashed border-border hover:border-amber-500/40"
                    onClick={() => { setShowAdd({ act }); setNewBeat(p => ({ ...p, act })); }}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Beat
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {ACTS.map(act => (
              <div key={act}>
                <h3 className="font-bold text-sm mb-2 text-amber-400">{ACT_CONFIG[act].label}</h3>
                {beatsByAct[act].length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-4">No beats yet</p>
                ) : beatsByAct[act].map((beat, i) => (
                  <div key={beat.id} className="flex items-start gap-3 mb-2 group">
                    <span className="text-amber-500/60 font-mono text-xs mt-1 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 cursor-pointer hover:bg-muted/20 rounded p-2 transition-colors" onClick={() => setEditingBeat({ ...beat })}>
                      <p className="font-medium text-sm">
                        {beat.isMajor && <span className="text-amber-400 mr-1">★</span>}
                        {beat.title}
                      </p>
                      {beat.description && <p className="text-xs text-muted-foreground mt-0.5">{beat.description}</p>}
                    </div>
                    <button onClick={() => removeBeat(beat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 mt-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="text-xs h-7 mt-1"
                  onClick={() => { setShowAdd({ act }); setNewBeat(p => ({ ...p, act })); }}>
                  <Plus className="w-3 h-3 mr-1" /> Add to {act}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Beat Dialog */}
      {showAdd && (
        <Dialog open={!!showAdd} onOpenChange={() => setShowAdd(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Story Beat — {showAdd.act}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs text-muted-foreground">Beat Title *</label>
                <Input value={newBeat.title} onChange={e => setNewBeat(p => ({ ...p, title: e.target.value }))} placeholder="e.g. The Inciting Incident" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea value={newBeat.description} onChange={e => setNewBeat(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1 text-sm resize-none" placeholder="What happens in this beat..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Card Color</label>
                  <Select value={newBeat.color} onValueChange={v => setNewBeat(p => ({ ...p, color: v as BeatColor }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BEAT_COLORS) as BeatColor[]).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={newBeat.isMajor} onChange={e => setNewBeat(p => ({ ...p, isMajor: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                    <span className="text-amber-400">★ Major beat</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Characters Involved</label>
                <Input value={newBeat.characters} onChange={e => setNewBeat(p => ({ ...p, characters: e.target.value }))} placeholder="John, Sarah, Detective..." className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowAdd(null)}>Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-500" onClick={() => addBeat(showAdd.act)}>
                <Plus className="w-4 h-4 mr-1" />Add Beat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Beat Dialog */}
      {editingBeat && (
        <Dialog open={!!editingBeat} onOpenChange={() => setEditingBeat(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit Beat</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs text-muted-foreground">Beat Title</label>
                <Input value={editingBeat.title} onChange={e => setEditingBeat(p => p ? ({ ...p, title: e.target.value }) : p)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea value={editingBeat.description} onChange={e => setEditingBeat(p => p ? ({ ...p, description: e.target.value }) : p)} rows={4} className="mt-1 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Move to Act</label>
                  <Select value={editingBeat.act} onValueChange={v => setEditingBeat(p => p ? ({ ...p, act: v as Act }) : p)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{ACTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Color</label>
                  <Select value={editingBeat.color} onValueChange={v => setEditingBeat(p => p ? ({ ...p, color: v as BeatColor }) : p)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(BEAT_COLORS) as BeatColor[]).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Characters</label>
                <Input value={editingBeat.characters} onChange={e => setEditingBeat(p => p ? ({ ...p, characters: e.target.value }) : p)} className="mt-1" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editingBeat.isMajor} onChange={e => setEditingBeat(p => p ? ({ ...p, isMajor: e.target.checked }) : p)} className="w-4 h-4 accent-amber-500" />
                <span className="text-amber-400">★ Major beat</span>
              </label>
            </div>
            <div className="flex justify-between mt-3">
              <Button variant="destructive" size="sm" onClick={() => { removeBeat(editingBeat.id); setEditingBeat(null); }}>Delete</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingBeat(null)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-500" onClick={saveEdit}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
