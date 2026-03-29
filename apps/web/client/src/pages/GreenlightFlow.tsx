/**
 * GreenlightFlow
 *
 * A multi-step project creation wizard that replaces the flat NewProject form.
 * Guides users through:
 *   Step 1 — Concept (title, logline, genre, tone, rating)
 *   Step 2 — Story (plot summary, act structure, themes, setting)
 *   Step 3 — Visual DNA (cinematic style, color palette, reference films, lookbook)
 *   Step 4 — Production (duration, quality, cinema industry, target audience)
 *   Step 5 — Greenlight (review + launch)
 *
 * Phase 3: Greenlight Flow
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  Palette,
  Film,
  Settings,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Plus,
  X,
  Sparkles,
  Clapperboard,
  Globe,
  Target,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import {
  GENRE_OPTIONS,
  ACT_STRUCTURE_OPTIONS,
  ACT_STRUCTURE_LABELS,
  TONE_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  CINEMA_INDUSTRY_OPTIONS,
} from "@shared/types";

// ─── Step definitions ───────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Concept", icon: BookOpen, description: "Title, logline & genre" },
  { id: 2, label: "Story", icon: Film, description: "Plot, structure & themes" },
  { id: 3, label: "Visual DNA", icon: Palette, description: "Look, feel & references" },
  { id: 4, label: "Production", icon: Settings, description: "Format & audience" },
  { id: 5, label: "Greenlight", icon: Rocket, description: "Review & launch" },
] as const;

const CINEMATIC_STYLE_PRESETS = [
  "Neo-noir, high contrast, anamorphic lens",
  "Epic widescreen, golden hour, cinematic",
  "Gritty handheld, documentary realism",
  "Dreamlike, soft focus, pastel tones",
  "Hyper-stylized, neon-lit, cyberpunk",
  "Classic Hollywood, warm tones, 35mm grain",
  "Minimalist, clean lines, Scandinavian",
  "Dark fantasy, desaturated, moody",
];

const COLOR_PALETTE_PRESETS = [
  "Warm amber, deep shadow, golden highlights",
  "Cool teal, steel blue, silver tones",
  "Earthy browns, forest green, warm ochre",
  "Neon pink, electric blue, deep black",
  "Muted pastels, cream, soft lavender",
  "Blood red, charcoal, harsh white",
  "Sunset orange, coral, warm sand",
  "Monochromatic grey, stark contrast",
];

const REFERENCE_FILM_SUGGESTIONS = [
  "Blade Runner 2049",
  "Dune",
  "The Godfather",
  "Parasite",
  "Mad Max: Fury Road",
  "Moonlight",
  "Interstellar",
  "No Country for Old Men",
  "The Grand Budapest Hotel",
  "Apocalypse Now",
];

// ─── Step 1: Concept ─────────────────────────────────────────────────────────
function StepConcept({
  data,
  onChange,
}: {
  data: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title" className="text-sm font-semibold">
          Project Title <span className="text-rose-400">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. The Last Signal"
          className="mt-1.5 text-base"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="logline" className="text-sm font-semibold">
          Logline
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            One sentence that captures your film's essence
          </span>
        </Label>
        <Textarea
          id="logline"
          value={data.logline}
          onChange={(e) => onChange({ logline: e.target.value })}
          placeholder="e.g. A lone astronaut discovers a distress signal from a ship that vanished 30 years ago — and realizes she's the only one who can prevent history from repeating itself."
          className="mt-1.5 resize-none"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Genre</Label>
          <Select
            value={data.genre}
            onValueChange={(v) => onChange({ genre: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRE_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold">Tone</Label>
          <Select
            value={data.tone}
            onValueChange={(v) => onChange({ tone: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Rating</Label>
        <div className="flex gap-2 mt-1.5">
          {(["G", "PG", "PG-13", "R"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ rating: r })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                data.rating === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Story ────────────────────────────────────────────────────────────
function StepStory({
  data,
  onChange,
}: {
  data: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="plotSummary" className="text-sm font-semibold">
          Plot Summary
        </Label>
        <Textarea
          id="plotSummary"
          value={data.plotSummary}
          onChange={(e) => onChange({ plotSummary: e.target.value })}
          placeholder="Describe the full story arc — what happens, who's involved, and how it ends."
          className="mt-1.5 resize-none"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Act Structure</Label>
          <Select
            value={data.actStructure}
            onValueChange={(v) => onChange({ actStructure: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select structure" />
            </SelectTrigger>
            <SelectContent>
              {ACT_STRUCTURE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {(ACT_STRUCTURE_LABELS as any)[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold">Setting</Label>
          <Input
            value={data.setting}
            onChange={(e) => onChange({ setting: e.target.value })}
            placeholder="e.g. Near-future Tokyo, 2087"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="themes" className="text-sm font-semibold">
          Central Themes
        </Label>
        <Input
          id="themes"
          value={data.themes}
          onChange={(e) => onChange({ themes: e.target.value })}
          placeholder="e.g. Redemption, identity, the cost of ambition"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="mainPlot" className="text-sm font-semibold">
          Main Plot
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Optional — for detailed story development
          </span>
        </Label>
        <Textarea
          id="mainPlot"
          value={data.mainPlot}
          onChange={(e) => onChange({ mainPlot: e.target.value })}
          placeholder="Detailed main storyline..."
          className="mt-1.5 resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Step 3: Visual DNA ───────────────────────────────────────────────────────
function StepVisualDNA({
  data,
  onChange,
}: {
  data: any;
  onChange: (updates: any) => void;
}) {
  const [newFilm, setNewFilm] = useState("");

  const addReferenceFilm = (film: string) => {
    if (!film.trim()) return;
    const existing = data.referenceFilms || [];
    if (existing.includes(film.trim())) return;
    onChange({ referenceFilms: [...existing, film.trim()] });
    setNewFilm("");
  };

  const removeReferenceFilm = (film: string) => {
    onChange({
      referenceFilms: (data.referenceFilms || []).filter((f: string) => f !== film),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">
          Cinematic Style
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Defines the visual language of every generated scene
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
          {CINEMATIC_STYLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ cinematicStyle: preset })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                data.cinematicStyle === preset
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          value={data.cinematicStyle}
          onChange={(e) => onChange({ cinematicStyle: e.target.value })}
          placeholder="Or describe your own cinematic style..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Color Palette
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            The dominant colors that define your film's mood
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
          {COLOR_PALETTE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ colorPalette: preset })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                data.colorPalette === preset
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          value={data.colorPalette}
          onChange={(e) => onChange({ colorPalette: e.target.value })}
          placeholder="Or describe your own color palette..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Reference Films
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Films whose visual style should influence your project
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(data.referenceFilms || []).map((film: string) => (
            <Badge
              key={film}
              variant="secondary"
              className="gap-1 text-xs pr-1"
            >
              {film}
              <button
                type="button"
                onClick={() => removeReferenceFilm(film)}
                className="ml-0.5 hover:text-rose-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newFilm}
            onChange={(e) => setNewFilm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addReferenceFilm(newFilm);
              }
            }}
            placeholder="Add a reference film..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addReferenceFilm(newFilm)}
            disabled={!newFilm.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {REFERENCE_FILM_SUGGESTIONS.filter(
            (f) => !(data.referenceFilms || []).includes(f)
          ).map((film) => (
            <button
              key={film}
              type="button"
              onClick={() => addReferenceFilm(film)}
              className="text-[11px] px-2 py-0.5 rounded border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
            >
              + {film}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Production Style
        </Label>
        <div className="flex gap-2 mt-1.5">
          {["indie", "blockbuster", "arthouse", "documentary", "experimental"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ productionStyle: s })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                data.productionStyle === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Production ───────────────────────────────────────────────────────
function StepProduction({
  data,
  onChange,
  maxDuration,
}: {
  data: any;
  onChange: (updates: any) => void;
  maxDuration: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm font-semibold">Duration</Label>
          <span className="text-sm font-bold text-primary">
            {data.duration} min
          </span>
        </div>
        <Slider
          value={[data.duration]}
          onValueChange={([v]) => onChange({ duration: v })}
          min={1}
          max={maxDuration}
          step={1}
          className="mt-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>1 min</span>
          <span>{maxDuration} min max</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Quality</Label>
          <Select
            value={data.quality}
            onValueChange={(v) => onChange({ quality: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="ultra">Ultra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold">Resolution</Label>
          <Select
            value={data.resolution}
            onValueChange={(v) => onChange({ resolution: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1280x720">1280×720 (HD)</SelectItem>
              <SelectItem value="1920x1080">1920×1080 (FHD)</SelectItem>
              <SelectItem value="2560x1440">2560×1440 (QHD)</SelectItem>
              <SelectItem value="3840x2160">3840×2160 (4K)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Cinema Industry</Label>
        <Select
          value={data.cinemaIndustry}
          onValueChange={(v) => onChange({ cinemaIndustry: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CINEMA_INDUSTRY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-semibold">Target Audience</Label>
        <Select
          value={data.targetAudience}
          onValueChange={(v) => onChange({ targetAudience: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_AUDIENCE_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-semibold">Launch Mode</Label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {[
            { value: "quick", label: "Quick Start", icon: Zap, desc: "AI generates scenes automatically" },
            { value: "manual", label: "Manual Build", icon: Clapperboard, desc: "Build scenes one by one" },
            { value: "trailer", label: "Trailer First", icon: Film, desc: "Generate a 90-second trailer" },
          ].map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ mode: m.value })}
              className={`p-3 rounded-xl border text-left transition-all ${
                data.mode === m.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              <m.icon
                className={`h-4 w-4 mb-1.5 ${
                  data.mode === m.value ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <p className="text-xs font-semibold">{m.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Greenlight ───────────────────────────────────────────────────────
function StepGreenlight({ data }: { data: any }) {
  const sections = [
    {
      label: "Concept",
      icon: BookOpen,
      items: [
        { label: "Title", value: data.title },
        { label: "Logline", value: data.logline },
        { label: "Genre", value: data.genre },
        { label: "Tone", value: data.tone },
        { label: "Rating", value: data.rating },
      ],
    },
    {
      label: "Story",
      icon: Film,
      items: [
        { label: "Act Structure", value: (ACT_STRUCTURE_LABELS as any)[data.actStructure] ?? data.actStructure },
        { label: "Setting", value: data.setting },
        { label: "Themes", value: data.themes },
      ],
    },
    {
      label: "Visual DNA",
      icon: Palette,
      items: [
        { label: "Cinematic Style", value: data.cinematicStyle },
        { label: "Color Palette", value: data.colorPalette },
        { label: "Production Style", value: data.productionStyle },
        {
          label: "Reference Films",
          value: (data.referenceFilms || []).join(", ") || undefined,
        },
      ],
    },
    {
      label: "Production",
      icon: Settings,
      items: [
        { label: "Duration", value: data.duration ? `${data.duration} min` : undefined },
        { label: "Quality", value: data.quality },
        { label: "Resolution", value: data.resolution },
        { label: "Cinema Industry", value: data.cinemaIndustry },
        { label: "Launch Mode", value: data.mode },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">
            Ready to Greenlight
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Review your project below. Once greenlighted, your Visual DNA will be
          locked into every scene generation.
        </p>
      </div>

      {sections.map((section) => {
        const filledItems = section.items.filter((i) => i.value);
        if (filledItems.length === 0) return null;
        return (
          <div key={section.label} className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </span>
            </div>
            <div className="space-y-1">
              {filledItems.map((item) => (
                <div key={item.label} className="flex gap-2">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main GreenlightFlow component ────────────────────────────────────────────
export default function GreenlightFlow() {
  const [, setLocation] = useLocation();
  const { limits } = useSubscription();
  const maxDuration = (limits as any)?.maxDurationMinutes || 180;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Concept
    title: "",
    logline: "",
    genre: "",
    tone: "",
    rating: "PG-13",
    // Story
    plotSummary: "",
    actStructure: "three-act",
    themes: "",
    setting: "",
    mainPlot: "",
    // Visual DNA
    cinematicStyle: "",
    colorPalette: "",
    referenceFilms: [] as string[],
    productionStyle: "",
    // Production
    duration: Math.min(90, maxDuration),
    quality: "high",
    resolution: "1920x1080",
    cinemaIndustry: "Hollywood",
    targetAudience: "",
    mode: "quick",
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const createMutation = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success("Project greenlighted!");
      if (formData.mode === "manual") {
        setLocation(`/projects/${project.id}/scenes`);
      } else {
        setLocation(`/projects/${project.id}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGreenlight = () => {
    if (!formData.title.trim()) {
      toast.error("Project title is required");
      setStep(1);
      return;
    }
    createMutation.mutate({
      title: formData.title.trim(),
      mode: formData.mode as any,
      genre: formData.genre || undefined,
      tone: formData.tone || undefined,
      rating: formData.rating as any,
      logline: formData.logline.trim() || undefined,
      plotSummary: formData.plotSummary.trim() || undefined,
      actStructure: formData.actStructure || undefined,
      themes: formData.themes.trim() || undefined,
      setting: formData.setting.trim() || undefined,
      mainPlot: formData.mainPlot.trim() || undefined,
      cinematicStyle: formData.cinematicStyle.trim() || undefined,
      colorPalette: formData.colorPalette.trim() || undefined,
      referenceFilms: formData.referenceFilms.length > 0 ? formData.referenceFilms : undefined,
      productionStyle: formData.productionStyle || undefined,
      duration: formData.duration,
      quality: formData.quality as any,
      resolution: formData.resolution,
      cinemaIndustry: formData.cinemaIndustry || undefined,
      targetAudience: formData.targetAudience || undefined,
    });
  };

  const canAdvance = () => {
    if (step === 1) return formData.title.trim().length > 0;
    return true;
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => setLocation("/projects")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Projects
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Greenlight a New Project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your Visual DNA once — it locks into every generated scene.
        </p>
      </div>

      {/* Step progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                }}
                disabled={s.id > step}
                className={`flex flex-col items-center gap-1 transition-all ${
                  s.id > step ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold hidden sm:block ${
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            {STEPS[step - 1].label}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {STEPS[step - 1].description}
          </p>
        </div>

        {step === 1 && (
          <StepConcept data={formData} onChange={updateFormData} />
        )}
        {step === 2 && (
          <StepStory data={formData} onChange={updateFormData} />
        )}
        {step === 3 && (
          <StepVisualDNA data={formData} onChange={updateFormData} />
        )}
        {step === 4 && (
          <StepProduction
            data={formData}
            onChange={updateFormData}
            maxDuration={maxDuration}
          />
        )}
        {step === 5 && <StepGreenlight data={formData} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <span className="text-xs text-muted-foreground">
          Step {step} of {STEPS.length}
        </span>

        {step < STEPS.length ? (
          <Button
            onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
            disabled={!canAdvance()}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleGreenlight}
            disabled={createMutation.isPending || !formData.title.trim()}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Greenlighting…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Greenlight Project
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
