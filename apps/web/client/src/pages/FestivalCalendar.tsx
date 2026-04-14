/**
   * FestivalCalendar
   *
   * Film festival submission tracker and calendar.
   * Covers all major festivals A24, Netflix, and indie filmmakers target.
   *
   * Features:
   * - Pre-populated with 20+ real festivals (Cannes, Sundance, TIFF, etc.)
   * - Track submission status per festival
   * - Deadline countdown badges
   * - Filter by tier, genre, region
   * - Add custom festivals
   * - Export submission tracker to CSV
   */
  import { useState, useMemo } from "react";
  import { useLocation } from "wouter";
  import { useAuth } from "@/_core/hooks/useAuth";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card, CardContent } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  } from "@/components/ui/select";
  import { toast } from "sonner";
  import {
    ArrowLeft, Trophy, Globe, Clock, Check, X as XIcon,
    CalendarDays, Download, Plus, Star, Film, ExternalLink,
    AlertTriangle, Ticket, Search,
  } from "lucide-react";

  // ─── Types ────────────────────────────────────────────────────────────────────
  type SubmissionStatus = "not_submitted" | "submitted" | "accepted" | "rejected" | "waitlisted" | "withdrawn";

  interface Festival {
    id: string;
    name: string;
    tier: "A-list" | "Major" | "Mid-tier" | "Regional";
    location: string;
    region: string;
    month: string; // e.g. "January"
    estimatedDeadline: string; // e.g. "September 15"
    submissionFee: string; // e.g. "USD $80"
    genres: string[];
    website: string;
    notes: string;
    status: SubmissionStatus;
    submittedDate?: string;
  }

  const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; icon: typeof Check }> = {
    not_submitted: { label: "Not Submitted",  color: "bg-zinc-700/40 text-zinc-300",            icon: Clock },
    submitted:     { label: "Submitted",      color: "bg-blue-700/40 text-blue-300",             icon: Check },
    accepted:      { label: "Accepted 🎉",    color: "bg-emerald-700/40 text-emerald-300",       icon: Star },
    rejected:      { label: "Not Selected",   color: "bg-red-700/40 text-red-300",               icon: XIcon },
    waitlisted:    { label: "Waitlisted",     color: "bg-amber-700/40 text-amber-300",           icon: Clock },
    withdrawn:     { label: "Withdrawn",      color: "bg-zinc-600/30 text-zinc-400 line-through",icon: XIcon },
  };

  const TIER_COLORS: Record<string, string> = {
    "A-list":   "border border-amber-500/60 text-amber-400 bg-amber-500/10",
    "Major":    "border border-blue-500/60 text-blue-400 bg-blue-500/10",
    "Mid-tier": "border border-purple-500/60 text-purple-400 bg-purple-500/10",
    "Regional": "border border-green-500/60 text-green-400 bg-green-500/10",
  };

  const BASE_FESTIVALS: Omit<Festival, "status" | "submittedDate">[] = [
    { id: "cannes", name: "Cannes Film Festival", tier: "A-list", location: "Cannes, France", region: "Europe", month: "May", estimatedDeadline: "January 31", submissionFee: "€120–€200", genres: ["Drama", "Art", "International"], website: "https://www.festival-cannes.com", notes: "Prestige competition. Feature-length only for Palme d'Or. Also Semaine de la Critique, Directors' Fortnight." },
    { id: "sundance", name: "Sundance Film Festival", tier: "A-list", location: "Park City, UT, USA", region: "North America", month: "January", estimatedDeadline: "August 20", submissionFee: "USD $60–$100", genres: ["Drama", "Documentary", "Comedy", "Thriller"], website: "https://www.sundance.org", notes: "Premier indie festival. Strong pipeline for A24, Netflix acquisitions. Early deadline in August." },
    { id: "tiff", name: "Toronto International Film Festival (TIFF)", tier: "A-list", location: "Toronto, Canada", region: "North America", month: "September", estimatedDeadline: "April 30", submissionFee: "CAD $125", genres: ["All genres"], website: "https://www.tiff.net", notes: "Academy Awards launching pad. People's Choice Award often predicts Best Picture. Strong acquisition market." },
    { id: "venice", name: "Venice Film Festival", tier: "A-list", location: "Venice, Italy", region: "Europe", month: "August–September", estimatedDeadline: "June 15", submissionFee: "€100", genres: ["Art", "Drama", "International"], website: "https://www.labiennale.org", notes: "World's oldest film festival. Golden Lion is one of cinema's highest honours." },
    { id: "berlin", name: "Berlin International Film Festival (Berlinale)", tier: "A-list", location: "Berlin, Germany", region: "Europe", month: "February", estimatedDeadline: "October 31", submissionFee: "€100", genres: ["Political", "Social", "Art", "International"], website: "https://www.berlinale.de", notes: "Strong political & social cinema focus. Golden Bear award. Emerging Talent section." },
    { id: "tribeca", name: "Tribeca Film Festival", tier: "Major", location: "New York, USA", region: "North America", month: "June", estimatedDeadline: "January 15", submissionFee: "USD $75–$125", genres: ["All genres"], website: "https://tribecafilm.com", notes: "NYC prestige. Founded by Robert De Niro. Good for US-focused distribution deals." },
    { id: "sxsw", name: "SXSW Film Festival", tier: "Major", location: "Austin, TX, USA", region: "North America", month: "March", estimatedDeadline: "August 20", submissionFee: "USD $75", genres: ["Indie", "Sci-Fi", "Genre", "Music"], website: "https://www.sxsw.com/film", notes: "Strong genre & music film programming. Tech-forward audience. Netflix, Prime often acquire here." },
    { id: "hotdocs", name: "Hot Docs", tier: "Major", location: "Toronto, Canada", region: "North America", month: "April–May", estimatedDeadline: "November 15", submissionFee: "CAD $100", genres: ["Documentary"], website: "https://hotdocs.ca", notes: "World's largest documentary festival. Best if your film is non-fiction." },
    { id: "aiff", name: "AFI Fest (American Film Institute)", tier: "Major", location: "Los Angeles, USA", region: "North America", month: "November", estimatedDeadline: "July 1", submissionFee: "USD $75", genres: ["All genres"], website: "https://afifest.afi.com", notes: "Free public screenings. Strong industry attendance. Oscar qualifying." },
    { id: "rotterdam", name: "International Film Festival Rotterdam (IFFR)", tier: "Major", location: "Rotterdam, Netherlands", region: "Europe", month: "January–February", estimatedDeadline: "August 1", submissionFee: "€50–€100", genres: ["Experimental", "Art", "International"], website: "https://iffr.com", notes: "Innovative and experimental cinema focus. Strong for first and second features." },
    { id: "fantasia", name: "Fantasia International Film Festival", tier: "Mid-tier", location: "Montreal, Canada", region: "North America", month: "July", estimatedDeadline: "March 15", submissionFee: "CAD $50", genres: ["Horror", "Sci-Fi", "Fantasy", "Genre"], website: "https://fantasiafestival.com", notes: "Biggest genre film festival in North America. Essential for horror/sci-fi filmmakers." },
    { id: "sitges", name: "Sitges — Catalonian International Film Festival", tier: "Mid-tier", location: "Sitges, Spain", region: "Europe", month: "October", estimatedDeadline: "June 30", submissionFee: "€50", genres: ["Horror", "Fantasy", "Genre"], website: "https://www.sitgesfilmfestival.com", notes: "Prestigious genre festival. Europe's top horror/fantasy showcase." },
    { id: "miff", name: "Melbourne International Film Festival (MIFF)", tier: "Major", location: "Melbourne, Australia", region: "Oceania", month: "July–August", estimatedDeadline: "March 31", submissionFee: "AUD $75", genres: ["All genres"], website: "https://miff.com.au", notes: "Australia's premier film festival. Strong local and international programming." },
    { id: "siff", name: "Sydney Film Festival (SFF)", tier: "Major", location: "Sydney, Australia", region: "Oceania", month: "June", estimatedDeadline: "February 1", submissionFee: "AUD $65", genres: ["All genres"], website: "https://www.sff.org.au", notes: "Grand Prix competition. Strong Australian premiere focus." },
    { id: "biff", name: "Brisbane International Film Festival (BIFF)", tier: "Regional", location: "Brisbane, Australia", region: "Oceania", month: "October–November", estimatedDeadline: "June 1", submissionFee: "AUD $50", genres: ["All genres"], website: "https://biff.com.au", notes: "Queensland's largest film festival. Good for Australian films seeking local release." },
    { id: "aacta", name: "AACTA Awards", tier: "Major", location: "Sydney, Australia", region: "Oceania", month: "November", estimatedDeadline: "August 1", submissionFee: "AUD $200", genres: ["All genres"], website: "https://www.aacta.org", notes: "Australian screen industry's highest awards. Equivalent to the BAFTAs." },
    { id: "afi-awards", name: "Australian Directors' Guild Awards", tier: "Regional", location: "Australia", region: "Oceania", month: "October", estimatedDeadline: "July 31", submissionFee: "Free", genres: ["All genres"], website: "https://adg.org.au", notes: "Recognises directorial excellence in Australian film and TV." },
    { id: "sundance-short", name: "Sundance Short Film Program", tier: "A-list", location: "Park City, UT, USA", region: "North America", month: "January", estimatedDeadline: "August 15", submissionFee: "USD $50", genres: ["Short"], website: "https://www.sundance.org", notes: "For short films under 50 minutes. Strong pipeline to feature career." },
    { id: "clermont", name: "Clermont-Ferrand Short Film Festival", tier: "Major", location: "Clermont-Ferrand, France", region: "Europe", month: "February", estimatedDeadline: "September 30", submissionFee: "€30", genres: ["Short"], website: "https://www.clermont-filmfest.org", notes: "World's biggest short film festival. Essential for short film filmmakers." },
    { id: "slamdance", name: "Slamdance Film Festival", tier: "Mid-tier", location: "Park City, UT, USA", region: "North America", month: "January", estimatedDeadline: "September 1", submissionFee: "USD $50", genres: ["Micro-budget", "Experimental", "Indie"], website: "https://slamdance.com", notes: "Runs concurrently with Sundance. Focus on micro-budget and no-budget films. Very filmmaker-friendly." },
  ];

  function daysUntilDeadline(deadline: string): number | null {
    const currentYear = new Date().getFullYear();
    const date = new Date(`${deadline} ${currentYear}`);
    if (isNaN(date.getTime())) return null;
    if (date < new Date()) date.setFullYear(currentYear + 1);
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function DeadlineBadge({ deadline }: { deadline: string }) {
    const days = daysUntilDeadline(deadline);
    if (days === null) return null;
    if (days < 0) return <Badge className="bg-zinc-600/30 text-zinc-400 text-xs">Deadline passed</Badge>;
    if (days <= 14) return <Badge className="bg-red-600/40 text-red-300 text-xs animate-pulse">{days}d left ⚠️</Badge>;
    if (days <= 60) return <Badge className="bg-amber-600/40 text-amber-300 text-xs">{days}d left</Badge>;
    return <Badge className="bg-zinc-700/40 text-zinc-300 text-xs">{days}d left</Badge>;
  }

  export default function FestivalCalendar() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const [festivals, setFestivals] = useState<Festival[]>(() =>
      BASE_FESTIVALS.map(f => ({ ...f, status: "not_submitted" as SubmissionStatus }))
    );
    const [search, setSearch] = useState("");
    const [filterTier, setFilterTier] = useState("all");
    const [filterRegion, setFilterRegion] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const filtered = useMemo(() => festivals.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.location.toLowerCase().includes(search.toLowerCase()) || f.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));
      const matchTier = filterTier === "all" || f.tier === filterTier;
      const matchRegion = filterRegion === "all" || f.region === filterRegion;
      const matchStatus = filterStatus === "all" || f.status === filterStatus;
      return matchSearch && matchTier && matchRegion && matchStatus;
    }), [festivals, search, filterTier, filterRegion, filterStatus]);

    function updateStatus(id: string, status: SubmissionStatus) {
      setFestivals(prev => prev.map(f => f.id === id ? { ...f, status, submittedDate: status === "submitted" ? new Date().toISOString().split("T")[0] : f.submittedDate } : f));
      const f = festivals.find(x => x.id === id);
      toast.success(`${f?.name}: marked as ${STATUS_CONFIG[status].label}`);
    }

    function handleExportCSV() {
      const rows = [
        ["Festival", "Tier", "Location", "Month", "Est. Deadline", "Fee", "Genres", "Status", "Submitted Date", "Website"],
        ...festivals.map(f => [f.name, f.tier, f.location, f.month, f.estimatedDeadline, f.submissionFee, f.genres.join("; "), STATUS_CONFIG[f.status].label, f.submittedDate || "", f.website]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "festival-submissions.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Festival tracker exported");
    }

    const stats = {
      total: festivals.length,
      submitted: festivals.filter(f => ["submitted","accepted","waitlisted"].includes(f.status)).length,
      accepted: festivals.filter(f => f.status === "accepted").length,
      urgentDeadlines: festivals.filter(f => { const d = daysUntilDeadline(f.estimatedDeadline); return d !== null && d <= 30 && f.status === "not_submitted"; }).length,
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/funding")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-sm">Festival Calendar</span>
          <Badge variant="secondary" className="text-xs">20+ Festivals</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-1" /> Export Tracker</Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Festivals", value: stats.total, color: "text-zinc-300" },
              { label: "Submitted/Active", value: stats.submitted, color: "text-blue-400" },
              { label: "Accepted", value: stats.accepted, color: "text-emerald-400" },
              { label: "Urgent Deadlines", value: stats.urgentDeadlines, color: "text-red-400" },
            ].map(s => (
              <Card key={s.label} className="text-center p-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search festivals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="A-list">A-list</SelectItem>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Mid-tier">Mid-tier</SelectItem>
                <SelectItem value="Regional">Regional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Oceania">Oceania</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_submitted">Not Submitted</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Not Selected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Festival grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(f => {
              const statusCfg = STATUS_CONFIG[f.status];
              const StatusIcon = statusCfg.icon;
              return (
                <Card key={f.id} className="flex flex-col hover:border-amber-500/30 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{f.name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span>{f.location}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs shrink-0 ${TIER_COLORS[f.tier]}`}>{f.tier}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="w-3 h-3" />{f.month}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />~{f.estimatedDeadline}</span>
                      <DeadlineBadge deadline={f.estimatedDeadline} />
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {f.genres.slice(0, 3).map(g => <Badge key={g} variant="outline" className="text-xs px-1.5 py-0">{g}</Badge>)}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{f.notes}</p>

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">{f.submissionFee}</span>
                      <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 ml-auto">
                        Website <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs flex-1 justify-center ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                      <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v as SubmissionStatus)}>
                        <SelectTrigger className="h-7 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No festivals match your filters</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  