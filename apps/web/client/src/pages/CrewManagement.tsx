/**
 * CrewManagement — Real production crew database
 *
 * Manages the REAL people on your production (not fictional characters).
 * DOP, 1st AD, Gaffers, Grips, Wardrobe, Sound, etc.
 * Equivalent to StudioBinder's Contact management feature.
 *
 * Features:
 * - Add/edit crew members by department
 * - Phone, email, rate/day, IMDb link
 * - Department filter and search
 * - Export crew list to CSV
 * - Print-ready crew directory
 */
import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Download, Search, Phone, Mail,
  ExternalLink, Users, Printer, Camera, Music, Palette,
  Shield, Mic, Car, Clapperboard, Wand2, Film,
} from "lucide-react";
import { getLoginUrl } from "@/const";

function makeId() { return Math.random().toString(36).slice(2, 9); }

interface CrewMember {
  id: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  email: string;
  ratePerDay: string;
  imdbUrl: string;
  notes: string;
  availability: "available" | "booked" | "hold" | "confirmed";
}

const DEPARTMENTS = [
  { label: "Direction", icon: Film, color: "text-amber-400" },
  { label: "Camera", icon: Camera, color: "text-blue-400" },
  { label: "Lighting/Electric", icon: Wand2, color: "text-yellow-400" },
  { label: "Grip", icon: Clapperboard, color: "text-zinc-400" },
  { label: "Sound", icon: Mic, color: "text-green-400" },
  { label: "Art Dept", icon: Palette, color: "text-purple-400" },
  { label: "Wardrobe", icon: Shield, color: "text-pink-400" },
  { label: "Hair & Makeup", icon: Wand2, color: "text-rose-400" },
  { label: "VFX", icon: Wand2, color: "text-cyan-400" },
  { label: "Production", icon: Film, color: "text-orange-400" },
  { label: "Locations", icon: Car, color: "text-teal-400" },
  { label: "Post-Production", icon: Music, color: "text-indigo-400" },
  { label: "Other", icon: Users, color: "text-zinc-300" },
];

const AVAILABILITY_STYLES: Record<string, string> = {
  available: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
  hold: "bg-amber-600/20 text-amber-300 border-amber-600/40",
  booked: "bg-blue-600/20 text-blue-300 border-blue-600/40",
  confirmed: "bg-green-600/20 text-green-300 border-green-600/40",
};

const DEFAULT_CREW: Omit<CrewMember, "id">[] = [
  { name: "", department: "Direction", role: "Director", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "confirmed" },
  { name: "", department: "Direction", role: "1st Assistant Director", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "confirmed" },
  { name: "", department: "Camera", role: "Director of Photography", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "confirmed" },
  { name: "", department: "Camera", role: "1st AC / Focus Puller", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "available" },
  { name: "", department: "Lighting/Electric", role: "Gaffer", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "available" },
  { name: "", department: "Sound", role: "Production Sound Mixer", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "available" },
];

export default function CrewManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>(() => DEFAULT_CREW.map(c => ({ ...c, id: makeId() })));
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Omit<CrewMember, "id">>({ name: "", department: "Direction", role: "", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "available" });

  const projectQuery = trpc.project.getById.useQuery({ id: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });
  if (!user) { navigate(getLoginUrl()); return null; }

  const filtered = useMemo(() => crew.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || c.department === deptFilter;
    return matchSearch && matchDept;
  }), [crew, search, deptFilter]);

  const byDept = useMemo(() => {
    const groups: Record<string, CrewMember[]> = {};
    filtered.forEach(c => { if (!groups[c.department]) groups[c.department] = []; groups[c.department].push(c); });
    return groups;
  }, [filtered]);

  function addMember() {
    if (!newMember.name.trim() && !newMember.role.trim()) { toast.error("Enter at least a name or role"); return; }
    setCrew(prev => [...prev, { ...newMember, id: makeId() }]);
    setNewMember({ name: "", department: "Direction", role: "", phone: "", email: "", ratePerDay: "", imdbUrl: "", notes: "", availability: "available" });
    setShowAddForm(false);
    toast.success("Crew member added");
  }

  function removeMember(id: string) { setCrew(prev => prev.filter(c => c.id !== id)); toast.success("Removed"); }

  function updateMember(id: string, key: keyof CrewMember, value: string) {
    setCrew(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c));
  }

  function handleExportCSV() {
    const rows = [
      ["VIRELLE STUDIOS — CREW DIRECTORY"],
      ["Project", projectQuery.data?.title || ""],
      [],
      ["Name", "Department", "Role", "Phone", "Email", "Rate/Day", "Availability", "Notes"],
      ...crew.map(c => [c.name, c.department, c.role, c.phone, c.email, c.ratePerDay, c.availability, c.notes]),
    ];
    const csv = rows.map(r => (r as string[]).map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `crew-${projectQuery.data?.title || "film"}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Crew directory exported");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Users className="w-5 h-5 text-emerald-400" />
        <span className="font-semibold text-sm">Crew Management</span>
        <Badge variant="secondary" className="text-xs">{crew.length} crew members</Badge>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Crew
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search crew..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d.label} value={d.label}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {([["Total Crew", crew.length], ["Confirmed", crew.filter(c=>c.availability==="confirmed").length], ["On Hold", crew.filter(c=>c.availability==="hold").length], ["Available", crew.filter(c=>c.availability==="available").length]] as [string, number][]).map(([k,v]) => (
            <Card key={k} className="text-center p-3">
              <CardContent className="p-0">
                <p className="text-xl font-bold text-emerald-400">{v}</p>
                <p className="text-xs text-muted-foreground">{k}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.entries(byDept).map(([dept, members]) => {
          const deptInfo = DEPARTMENTS.find(d => d.label === dept) || DEPARTMENTS[DEPARTMENTS.length-1];
          const Icon = deptInfo.icon;
          return (
            <div key={dept} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${deptInfo.color}`} />
                <h3 className="font-semibold text-sm">{dept}</h3>
                <Badge variant="outline" className="text-xs">{members.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {members.map(m => (
                  <Card key={m.id} className="hover:border-emerald-500/30 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{m.name || <span className="text-muted-foreground italic">No name</span>}</p>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={`text-xs border ${AVAILABILITY_STYLES[m.availability]}`}>{m.availability}</Badge>
                          <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-red-400 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {m.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><a href={`tel:${m.phone}`} className="hover:text-foreground">{m.phone}</a></div>}
                        {m.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /><a href={`mailto:${m.email}`} className="hover:text-foreground">{m.email}</a></div>}
                        {m.ratePerDay && <div className="flex items-center gap-1 text-emerald-400 font-medium">${m.ratePerDay}/day</div>}
                        {m.imdbUrl && <a href={m.imdbUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber-400"><ExternalLink className="w-3 h-3" />IMDb</a>}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <Input placeholder="Name" value={m.name} onChange={e => updateMember(m.id, "name", e.target.value)} className="h-6 text-xs" />
                        <Input placeholder="Role" value={m.role} onChange={e => updateMember(m.id, "role", e.target.value)} className="h-6 text-xs" />
                        <Input placeholder="Phone" value={m.phone} onChange={e => updateMember(m.id, "phone", e.target.value)} className="h-6 text-xs" />
                        <Input placeholder="Email" value={m.email} onChange={e => updateMember(m.id, "email", e.target.value)} className="h-6 text-xs" />
                        <Input placeholder="Rate/day" value={m.ratePerDay} onChange={e => updateMember(m.id, "ratePerDay", e.target.value)} className="h-6 text-xs" />
                        <select value={m.availability} onChange={e => updateMember(m.id, "availability", e.target.value)} className="h-6 text-xs bg-background border border-input rounded px-1">
                          <option value="available">Available</option><option value="hold">Hold</option><option value="booked">Booked</option><option value="confirmed">Confirmed</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-14 h-14 text-emerald-400/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No crew members found</p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-500" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Add First Crew Member
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Crew Member</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><label className="text-xs text-muted-foreground">Full Name</label><Input value={newMember.name} onChange={e => setNewMember(p => ({...p, name: e.target.value}))} placeholder="Full name" className="mt-1" /></div>
            <div>
              <label className="text-xs text-muted-foreground">Department</label>
              <Select value={newMember.department} onValueChange={v => setNewMember(p => ({...p, department: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d.label} value={d.label}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Role / Title</label><Input value={newMember.role} onChange={e => setNewMember(p => ({...p, role: e.target.value}))} placeholder="e.g. Director of Photography" className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Phone</label><Input value={newMember.phone} onChange={e => setNewMember(p => ({...p, phone: e.target.value}))} placeholder="+61 4xx xxx xxx" className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Email</label><Input value={newMember.email} onChange={e => setNewMember(p => ({...p, email: e.target.value}))} placeholder="email@example.com" className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Day Rate</label><Input value={newMember.ratePerDay} onChange={e => setNewMember(p => ({...p, ratePerDay: e.target.value}))} placeholder="850" className="mt-1" /></div>
            <div>
              <label className="text-xs text-muted-foreground">Availability</label>
              <Select value={newMember.availability} onValueChange={v => setNewMember(p => ({...p, availability: v as any}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="hold">Hold</SelectItem><SelectItem value="booked">Booked</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-xs text-muted-foreground">Notes</label><Textarea value={newMember.notes} onChange={e => setNewMember(p => ({...p, notes: e.target.value}))} placeholder="Notes, special requirements..." rows={2} className="mt-1 text-sm resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={addMember}><Plus className="w-4 h-4 mr-1" />Add to Crew</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
