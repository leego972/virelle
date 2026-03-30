import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  Package,
  Shirt,
  Palette,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const ENTITY_CONFIG = {
  character: { label: "Characters", icon: Users, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  location: { label: "Locations", icon: MapPin, color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20" },
  prop: { label: "Props", icon: Package, color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
  wardrobe: { label: "Wardrobe", icon: Shirt, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
  style_note: { label: "Style Notes", icon: Palette, color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
} as const;

type EntityType = keyof typeof ENTITY_CONFIG;

interface MemoryEntry {
  id: number;
  entityType: EntityType;
  entityName: string;
  description?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
}

export default function ProductionMemory() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(params.id || "0", 10);

  const [activeTab, setActiveTab] = useState<EntityType | "all">("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [form, setForm] = useState({
    entityType: "character" as EntityType,
    entityName: "",
    description: "",
    imageUrl: "",
    notes: "",
  });

  const { data: project } = trpc.project.get.useQuery({ id: projectId });
  const { data: memory = [], isLoading, refetch } = trpc.productionMemory.getForProject.useQuery({ projectId });

  const utils = trpc.useUtils();

  const createMutation = trpc.productionMemory.create.useMutation({
    onSuccess: () => { refetch(); toast.success("Memory entry created"); setShowDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.productionMemory.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Entry updated"); setShowDialog(false); setEditing(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.productionMemory.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Entry deleted"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ entityType: "character", entityName: "", description: "", imageUrl: "", notes: "" });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setShowDialog(true);
  }

  function openEdit(entry: MemoryEntry) {
    setEditing(entry);
    setForm({
      entityType: entry.entityType,
      entityName: entry.entityName,
      description: entry.description || "",
      imageUrl: entry.imageUrl || "",
      notes: entry.notes || "",
    });
    setShowDialog(true);
  }

  function handleSubmit() {
    if (!form.entityName.trim()) { toast.error("Name is required"); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, projectId, entityName: form.entityName, description: form.description, imageUrl: form.imageUrl, notes: form.notes });
    } else {
      createMutation.mutate({ projectId, ...form });
    }
  }

  const filtered = activeTab === "all" ? memory : memory.filter((m: any) => m.entityType === activeTab);

  const grouped = (["character", "location", "prop", "wardrobe", "style_note"] as EntityType[]).reduce((acc, type) => {
    acc[type] = memory.filter((m: any) => m.entityType === type);
    return acc;
  }, {} as Record<EntityType, any[]>);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Production Memory
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {project?.title || "Loading..."} — continuity bible for characters, locations, props, wardrobe, and style
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {(Object.entries(ENTITY_CONFIG) as [EntityType, typeof ENTITY_CONFIG[EntityType]][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const count = grouped[type]?.length || 0;
            return (
              <button
                key={type}
                onClick={() => setActiveTab(activeTab === type ? "all" : type)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${activeTab === type ? cfg.color + " ring-2 ring-primary/30" : "bg-card border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{cfg.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No entries yet</p>
            <p className="text-sm mb-6">Start building your production continuity bible</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add First Entry</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry: any) => {
              const cfg = ENTITY_CONFIG[entry.entityType as EntityType];
              const Icon = cfg.icon;
              return (
                <Card key={entry.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center rounded-lg p-1.5 ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <CardTitle className="text-base truncate">{entry.entityName}</CardTitle>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: entry.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className={`w-fit text-xs ${cfg.color}`}>{cfg.label}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {entry.imageUrl && (
                      <img src={entry.imageUrl} alt={entry.entityName} className="w-full h-32 object-cover rounded-lg" />
                    )}
                    {entry.description && <p className="text-sm text-muted-foreground line-clamp-2">{entry.description}</p>}
                    {entry.notes && (
                      <div className="text-xs bg-muted/50 rounded-md p-2 text-muted-foreground line-clamp-2">
                        <span className="font-medium text-foreground">Notes: </span>{entry.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) { setEditing(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Entry" : "New Production Memory Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.entityType} onValueChange={(v) => setForm(f => ({ ...f, entityType: v as EntityType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ENTITY_CONFIG) as [EntityType, typeof ENTITY_CONFIG[EntityType]][]).map(([type, cfg]) => (
                      <SelectItem key={type} value={type}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Sarah Chen, Rooftop Apartment, Vintage Camera..." value={form.entityName} onChange={e => setForm(f => ({ ...f, entityName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Visual description, key traits, physical details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Reference Image URL</Label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Continuity Notes</Label>
              <Textarea placeholder="Continuity rules, constraints, cross-scene notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditing(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
