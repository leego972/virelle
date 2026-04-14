/**
   * ProductionReports — Daily Production Report (DPR)
   *
   * Industry-standard DPR used by every major studio.
   * Records what happened on set each day — scenes shot,
   * pages completed, timing, cast attendance, and issues.
   *
   * Used by: 1st AD, Producer, Production Company, Studio.
   * Required for: SAG/AFTRA compliance, insurance, completion bonds.
   *
   * Features:
   * - Create/edit daily reports for any shoot day
   * - Track scenes shot, time in/out, pages completed
   * - Cast and crew attendance log
   * - Camera reports (rolls, slates)
   * - Issues / safety incidents log
   * - Weather and conditions
   * - Print-ready layout
   * - CSV export for production accounting
   */
  import { useState } from "react";
  import { useParams, useLocation } from "wouter";
  import { trpc } from "@/lib/trpc";
  import { useAuth } from "@/_core/hooks/useAuth";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Separator } from "@/components/ui/separator";
  import { toast } from "sonner";
  import {
    ArrowLeft, Plus, Trash2, Download, Printer, Clock,
    Users, Film, Camera, AlertTriangle, CheckCircle2,
    CloudSun, ChevronDown, ChevronUp, Loader2, FileText,
    Edit2, Check, X, CalendarDays, Sun, Clapperboard,
  } from "lucide-react";
  import { getLoginUrl } from "@/const";

  function makeId() { return Math.random().toString(36).slice(2, 9); }

  interface SceneShot { id: string; sceneNumber: string; description: string; setups: number; takes: number; printed: number; status: "complete" | "partial" | "no_good"; }
  interface AttendanceEntry { id: string; name: string; role: string; callTime: string; wrapTime: string; status: "present" | "late" | "absent"; }
  interface Incident { id: string; time: string; description: string; severity: "low" | "medium" | "high"; }
  interface DPR {
    date: string; reportNumber: string; director: string; producer: string; dp: string; adName: string;
    callTime: string; firstShot: string; lunch: string; afterLunch: string; wrapTime: string;
    totalPages: string; totalSetups: number; totalTakes: number; totalPrinted: number;
    weather: string; location: string; nextDayLocation: string; nextDayCall: string;
    scenesShot: SceneShot[];
    attendance: AttendanceEntry[];
    incidents: Incident[];
    cameraRolls: string; lightingNotes: string; soundNotes: string;
    additionalNotes: string;
  }

  function defaultDPR(projectTitle: string, reportNum: number): DPR {
    return {
      date: new Date().toISOString().split("T")[0],
      reportNumber: String(reportNum).padStart(3, "0"),
      director: "", producer: "", dp: "", adName: "",
      callTime: "07:00", firstShot: "08:30", lunch: "13:00", afterLunch: "14:00", wrapTime: "18:30",
      totalPages: "4-3/8", totalSetups: 0, totalTakes: 0, totalPrinted: 0,
      weather: "Clear, 22°C", location: "", nextDayLocation: "", nextDayCall: "07:00",
      scenesShot: [],
      attendance: [],
      incidents: [],
      cameraRolls: "", lightingNotes: "", soundNotes: "",
      additionalNotes: "",
    };
  }

  function EditCell({ value, onChange, placeholder = "" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    if (!editing) return (
      <button className="text-left w-full hover:bg-muted/20 rounded px-1 py-0.5 text-sm transition-colors min-h-[24px]" onClick={() => { setDraft(value); setEditing(true); }}>
        {value || <span className="text-muted-foreground italic text-xs">{placeholder}</span>}
      </button>
    );
    return (
      <div className="flex items-center gap-1">
        <Input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          className="h-7 text-xs" />
        <button onClick={() => { onChange(draft); setEditing(false); }}><Check className="w-3.5 h-3.5 text-emerald-500" /></button>
        <button onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 text-red-400" /></button>
      </div>
    );
  }

  export default function ProductionReports() {
    const { projectId } = useParams<{ projectId: string }>();
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const [reports, setReports] = useState<DPR[]>([]);
    const [activeReport, setActiveReport] = useState<number | null>(null);

    const projectQuery = trpc.project.get.useQuery({ id: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });

    if (!user) { navigate(getLoginUrl()); return null; }

    const project = projectQuery.data;
    const report = activeReport !== null ? reports[activeReport] : null;

    function createReport() {
      const newReport = defaultDPR(project?.title || "Film", reports.length + 1);
      setReports(prev => [...prev, newReport]);
      setActiveReport(reports.length);
    }

    function updateReport(key: keyof DPR, value: any) {
      if (activeReport === null) return;
      setReports(prev => prev.map((r, i) => i === activeReport ? { ...r, [key]: value } : r));
    }

    function addScene() {
      if (activeReport === null) return;
      const s: SceneShot = { id: makeId(), sceneNumber: "", description: "", setups: 0, takes: 0, printed: 0, status: "complete" };
      updateReport("scenesShot", [...(report?.scenesShot || []), s]);
    }

    function updateScene(id: string, key: keyof SceneShot, value: any) {
      if (!report) return;
      updateReport("scenesShot", report.scenesShot.map(s => s.id === id ? { ...s, [key]: value } : s));
    }

    function addAttendance() {
      if (activeReport === null) return;
      const a: AttendanceEntry = { id: makeId(), name: "", role: "", callTime: "07:00", wrapTime: "18:30", status: "present" };
      updateReport("attendance", [...(report?.attendance || []), a]);
    }

    function updateAttendance(id: string, key: keyof AttendanceEntry, value: any) {
      if (!report) return;
      updateReport("attendance", report.attendance.map(a => a.id === id ? { ...a, [key]: value } : a));
    }

    function addIncident() {
      if (activeReport === null) return;
      const i: Incident = { id: makeId(), time: "", description: "", severity: "low" };
      updateReport("incidents", [...(report?.incidents || []), i]);
    }

    function handleExportCSV() {
      if (!report) return;
      const rows = [
        ["VIRELLE STUDIOS — DAILY PRODUCTION REPORT"],
        ["Project", project?.title || ""], ["Date", report.date], ["Report #", report.reportNumber],
        ["Director", report.director], ["Producer", report.producer], ["DP", report.dp],
        [""], ["TIMING"], ["Call Time", report.callTime], ["First Shot", report.firstShot],
        ["Lunch", report.lunch], ["After Lunch", report.afterLunch], ["Wrap", report.wrapTime],
        [""], ["STATS"], ["Pages", report.totalPages], ["Setups", report.totalSetups], ["Takes", report.totalTakes], ["Printed", report.totalPrinted],
        [""], ["SCENES SHOT"], ["Scene #", "Description", "Setups", "Takes", "Printed", "Status"],
        ...report.scenesShot.map(s => [s.sceneNumber, s.description, s.setups, s.takes, s.printed, s.status]),
        [""], ["ATTENDANCE"], ["Name", "Role", "Call", "Wrap", "Status"],
        ...report.attendance.map(a => [a.name, a.role, a.callTime, a.wrapTime, a.status]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `dpr-${report.date}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Daily Production Report exported");
    }

    const STATUS_COLORS: Record<string, string> = {
      complete: "text-emerald-400", partial: "text-amber-400", no_good: "text-red-400",
      present: "text-emerald-400", late: "text-amber-400", absent: "text-red-400",
    };

    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar — report list */}
        <div className="w-52 shrink-0 border-r border-border bg-muted/10 flex flex-col print:hidden">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Daily Reports</p>
            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs" onClick={createReport}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Report
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center italic">No reports yet</p>
            ) : reports.map((r, i) => (
              <button key={i} onClick={() => setActiveReport(i)}
                className={`w-full text-left px-3 py-2.5 text-xs border-b border-border/50 transition-colors ${activeReport === i ? "bg-amber-500/10 text-amber-400 font-semibold" : "hover:bg-muted/30 text-muted-foreground"}`}>
                <div className="font-medium">Day {r.reportNumber}</div>
                <div className="text-xs opacity-70">{r.date}</div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {!report ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <FileText className="w-16 h-16 text-amber-500/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Daily Production Reports</h2>
              <p className="text-muted-foreground mb-2 text-sm text-center max-w-md">Track every shoot day — scenes completed, time stats, cast attendance, and incidents. Required by SAG/AFTRA and most completion bonds.</p>
              <Button className="bg-amber-600 hover:bg-amber-500 mt-4" onClick={createReport}>
                <Plus className="w-4 h-4 mr-2" /> Create First Report
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-3 flex-wrap print:hidden">
                <Clapperboard className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Daily Production Report</span>
                <Badge variant="secondary">Day {report.reportNumber}</Badge>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                </div>
              </div>

              {/* Header Info */}
              <Card className="border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold">Virelle Studios</p>
                      <h2 className="text-xl font-bold">DAILY PRODUCTION REPORT</h2>
                      <p className="text-sm text-muted-foreground">{project?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-500">#{report.reportNumber}</p>
                      <Input type="date" value={report.date} onChange={e => updateReport("date", e.target.value)} className="h-7 text-xs mt-1 w-36" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[["Director", "director", "Name"], ["Producer", "producer", "Name"], ["DP", "dp", "Director of Photography"], ["1st AD", "adName", "Name"]].map(([label, key, ph]) => (
                      <div key={key}><label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</label>
                      <EditCell value={(report as any)[key]} onChange={v => updateReport(key as any, v)} placeholder={ph} /></div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timing */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Timing</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    {[["General Call", "callTime"], ["First Shot", "firstShot"], ["Lunch", "lunch"], ["After Lunch", "afterLunch"], ["Wrap", "wrapTime"]].map(([label, key]) => (
                      <div key={key}><label className="text-xs text-muted-foreground">{label}</label><EditCell value={(report as any)[key]} onChange={v => updateReport(key as any, v)} /></div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    <div><label className="text-xs text-muted-foreground">Pages Shot</label><EditCell value={report.totalPages} onChange={v => updateReport("totalPages", v)} placeholder="4-3/8" /></div>
                    {[["Setups", "totalSetups"], ["Takes", "totalTakes"], ["Printed", "totalPrinted"]].map(([label, key]) => (
                      <div key={key}><label className="text-xs text-muted-foreground">{label}</label>
                        <Input type="number" value={(report as any)[key]} onChange={e => updateReport(key as any, parseInt(e.target.value) || 0)} className="h-7 text-xs mt-0.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scenes Shot */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Film className="w-4 h-4 text-purple-400" /> Scenes Shot</CardTitle>
                    <Button size="sm" variant="ghost" onClick={addScene} className="text-xs h-7 print:hidden"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      <th className="text-left px-2 py-1 text-muted-foreground">Scene #</th>
                      <th className="text-left px-2 py-1 text-muted-foreground">Description</th>
                      <th className="text-left px-2 py-1 text-muted-foreground w-16">Setups</th>
                      <th className="text-left px-2 py-1 text-muted-foreground w-14">Takes</th>
                      <th className="text-left px-2 py-1 text-muted-foreground w-16">Printed</th>
                      <th className="text-left px-2 py-1 text-muted-foreground">Status</th>
                      <th className="w-8 print:hidden"></th>
                    </tr></thead>
                    <tbody>
                      {report.scenesShot.length === 0 ? (
                        <tr><td colSpan={7} className="py-4 text-center text-muted-foreground italic text-xs">No scenes recorded yet</td></tr>
                      ) : report.scenesShot.map(s => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10">
                          <td className="px-2 py-1"><EditCell value={s.sceneNumber} onChange={v => updateScene(s.id, "sceneNumber", v)} placeholder="#" /></td>
                          <td className="px-2 py-1"><EditCell value={s.description} onChange={v => updateScene(s.id, "description", v)} placeholder="Scene description" /></td>
                          <td className="px-2 py-1"><Input type="number" value={s.setups} onChange={e => updateScene(s.id, "setups", parseInt(e.target.value)||0)} className="h-6 text-xs" /></td>
                          <td className="px-2 py-1"><Input type="number" value={s.takes} onChange={e => updateScene(s.id, "takes", parseInt(e.target.value)||0)} className="h-6 text-xs" /></td>
                          <td className="px-2 py-1"><Input type="number" value={s.printed} onChange={e => updateScene(s.id, "printed", parseInt(e.target.value)||0)} className="h-6 text-xs" /></td>
                          <td className="px-2 py-1">
                            <select value={s.status} onChange={e => updateScene(s.id, "status", e.target.value)} className={`bg-transparent text-xs border-0 outline-none font-medium ${STATUS_COLORS[s.status]}`}>
                              <option value="complete">Complete</option><option value="partial">Partial</option><option value="no_good">No Good</option>
                            </select>
                          </td>
                          <td className="px-2 py-1 print:hidden"><button onClick={() => updateReport("scenesShot", report.scenesShot.filter(x => x.id !== s.id))} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Cast & Crew Attendance</CardTitle>
                    <Button size="sm" variant="ghost" onClick={addAttendance} className="text-xs h-7 print:hidden"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      <th className="text-left px-2 py-1 text-muted-foreground">Name</th>
                      <th className="text-left px-2 py-1 text-muted-foreground">Role</th>
                      <th className="text-left px-2 py-1 text-muted-foreground w-20">Call</th>
                      <th className="text-left px-2 py-1 text-muted-foreground w-20">Wrap</th>
                      <th className="text-left px-2 py-1 text-muted-foreground">Status</th>
                      <th className="w-8 print:hidden"></th>
                    </tr></thead>
                    <tbody>
                      {report.attendance.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground italic text-xs">No attendance recorded</td></tr>
                      ) : report.attendance.map(a => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/10">
                          <td className="px-2 py-1"><EditCell value={a.name} onChange={v => updateAttendance(a.id, "name", v)} placeholder="Full name" /></td>
                          <td className="px-2 py-1"><EditCell value={a.role} onChange={v => updateAttendance(a.id, "role", v)} placeholder="Role/Dept" /></td>
                          <td className="px-2 py-1"><EditCell value={a.callTime} onChange={v => updateAttendance(a.id, "callTime", v)} placeholder="07:00" /></td>
                          <td className="px-2 py-1"><EditCell value={a.wrapTime} onChange={v => updateAttendance(a.id, "wrapTime", v)} placeholder="18:00" /></td>
                          <td className="px-2 py-1">
                            <select value={a.status} onChange={e => updateAttendance(a.id, "status", e.target.value as any)} className={`bg-transparent text-xs border-0 outline-none font-medium ${STATUS_COLORS[a.status]}`}>
                              <option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option>
                            </select>
                          </td>
                          <td className="px-2 py-1 print:hidden"><button onClick={() => updateReport("attendance", report.attendance.filter(x => x.id !== a.id))} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" /> Production Notes</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[["Camera", "cameraRolls", "Roll numbers, formats..."], ["Lighting", "lightingNotes", "Lighting setup notes..."], ["Sound", "soundNotes", "Sound report notes..."]].map(([label, key, ph]) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</label>
                      <Textarea value={(report as any)[key]} onChange={e => updateReport(key as any, e.target.value)} rows={3} className="text-xs mt-1 resize-none" placeholder={ph} />
                    </div>
                  ))}
                </CardContent>
                <CardContent className="pt-0">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Additional Notes / Issues</label>
                  <Textarea value={report.additionalNotes} onChange={e => updateReport("additionalNotes", e.target.value)} rows={3} className="text-xs mt-1 resize-none" placeholder="Any issues, delays, notable events..." />
                </CardContent>
              </Card>

              {/* Next Day */}
              <Card className="bg-blue-900/10 border-blue-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-400" /> Next Shoot Day</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><label className="text-xs text-muted-foreground">Next Location</label><EditCell value={report.nextDayLocation} onChange={v => updateReport("nextDayLocation", v)} placeholder="Location name" /></div>
                  <div><label className="text-xs text-muted-foreground">Call Time</label><EditCell value={report.nextDayCall} onChange={v => updateReport("nextDayCall", v)} placeholder="07:00" /></div>
                  <div><label className="text-xs text-muted-foreground">Weather Forecast</label><EditCell value={report.weather} onChange={v => updateReport("weather", v)} placeholder="Sunny, 24°C" /></div>
                </CardContent>
              </Card>

              <div className="text-center text-xs text-muted-foreground pb-8 print:pb-2 border-t border-border pt-4">
                <p className="font-semibold">VIRELLE STUDIOS — DAILY PRODUCTION REPORT — CONFIDENTIAL</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  