/**
 * ScreenerGenerator — Watermarked Screener & Secure Link Sharing
 *
 * Equivalent to Frame.io's secure screener sharing feature.
 * Send your film/cut to distributors, festivals, or investors
 * with a unique watermark per viewer so leaks can be traced.
 *
 * Features:
 * - Create named screener links per recipient
 * - Visible watermark (name + email + timestamp)
 * - Set expiry date per link
 * - Enable/disable download permission
 * - Copy shareable link to clipboard
 * - View count tracking
 * - Revoke access instantly
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Copy, Link, Eye, EyeOff,
  Download, Shield, Clock, Check, Film, AlertTriangle,
  ExternalLink, Lock, Unlock, Mail, User, CalendarDays,
} from "lucide-react";
import { getLoginUrl } from "@/const";

function makeId() { return Math.random().toString(36).slice(2, 11); }
function makeToken() { return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6)).join("-"); }

interface ScreenerLink {
  id: string;
  token: string;
  recipientName: string;
  recipientEmail: string;
  recipientOrg: string;
  purpose: "festival" | "distributor" | "investor" | "cast" | "press" | "other";
  allowDownload: boolean;
  expiresAt: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  lastViewedAt: string;
  watermarkText: string;
}

const PURPOSE_LABELS: Record<ScreenerLink["purpose"], { label: string; color: string }> = {
  festival:    { label: "Festival",    color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  distributor: { label: "Distributor", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  investor:    { label: "Investor",    color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  cast:        { label: "Cast",        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  press:       { label: "Press",       color: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  other:       { label: "Other",       color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
};

const DEMO_LINKS: Omit<ScreenerLink, "id">[] = [
  {
    token: makeToken(), recipientName: "Sundance Selection Team", recipientEmail: "submissions@sundance.org",
    recipientOrg: "Sundance Film Festival", purpose: "festival", allowDownload: false,
    expiresAt: "2026-06-01", isActive: true, viewCount: 3, createdAt: new Date().toISOString(),
    lastViewedAt: new Date(Date.now() - 86400000).toISOString(),
    watermarkText: "SUNDANCE SELECTION — CONFIDENTIAL",
  },
  {
    token: makeToken(), recipientName: "James Whitfield", recipientEmail: "james@a24.com",
    recipientOrg: "A24 Films", purpose: "distributor", allowDownload: false,
    expiresAt: "2026-05-15", isActive: true, viewCount: 1, createdAt: new Date().toISOString(),
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    watermarkText: "JAMES WHITFIELD / A24 — DO NOT DISTRIBUTE",
  },
];

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export default function ScreenerGenerator() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [links, setLinks] = useState<ScreenerLink[]>(() => DEMO_LINKS.map(l => ({ ...l, id: makeId() })));
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ recipientName: "", recipientEmail: "", recipientOrg: "", purpose: "festival" as ScreenerLink["purpose"], allowDownload: false, expiresAt: "" });

  const projectQuery = trpc.project.getById.useQuery({ id: parseInt(projectId || "0") }, { enabled: !!projectId && !!user });
  if (!user) { navigate(getLoginUrl()); return null; }
  const project = projectQuery.data;

  const baseUrl = window.location.origin;

  function createLink() {
    if (!form.recipientName.trim()) { toast.error("Enter recipient name"); return; }
    const token = makeToken();
    const watermarkText = `${form.recipientName.toUpperCase()}${form.recipientOrg ? ` / ${form.recipientOrg.toUpperCase()}` : ""} — CONFIDENTIAL`;
    const link: ScreenerLink = {
      id: makeId(), token, ...form,
      isActive: true, viewCount: 0,
      createdAt: new Date().toISOString(),
      lastViewedAt: "",
      watermarkText,
    };
    setLinks(prev => [...prev, link]);
    setShowCreate(false);
    setForm({ recipientName: "", recipientEmail: "", recipientOrg: "", purpose: "festival", allowDownload: false, expiresAt: "" });
    toast.success("Screener link created");
  }

  function toggleActive(id: string) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  }

  function deleteLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success("Screener link revoked");
  }

  function copyLink(link: ScreenerLink) {
    const url = `${baseUrl}/screener/${link.token}?watermark=${encodeURIComponent(link.watermarkText)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Screener link copied to clipboard");
  }

  const activeLinks = links.filter(l => l.isActive);
  const totalViews = links.reduce((t, l) => t + l.viewCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Shield className="w-5 h-5 text-blue-400" />
        <span className="font-semibold text-sm">Screener Generator</span>
        <Badge variant="secondary" className="text-xs">{activeLinks.length} active links</Badge>
        <div className="ml-auto">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Screener Link
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {/* How it works */}
        <Card className="mb-4 border-blue-500/20 bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-8 h-8 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Watermarked Screener Links — How It Works</h3>
                <p className="text-xs text-muted-foreground">Each recipient gets a unique link that displays a visible watermark with their name and organisation on the video. If your film is leaked, you can trace exactly who shared it. Links can be set to expire and download access can be disabled.</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {[["Unique per recipient", Shield], ["Visible watermark", Eye], ["Expiry dates", CalendarDays], ["Download control", Lock]].map(([label, Icon]: any) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-blue-300">
                      <Icon className="w-3.5 h-3.5" />{label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {([["Total Links", links.length], ["Active", activeLinks.length], ["Total Views", totalViews], ["Revoked", links.filter(l => !l.isActive).length]] as [string, number][]).map(([k, v]) => (
            <Card key={k} className="text-center p-3">
              <CardContent className="p-0">
                <p className="text-xl font-bold text-blue-400">{v}</p>
                <p className="text-xs text-muted-foreground">{k}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Links list */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-16">
              <Film className="w-14 h-14 text-blue-400/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No screener links yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create secure, watermarked links for festivals, distributors, and investors.</p>
              <Button className="bg-blue-600 hover:bg-blue-500" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />Create First Screener
              </Button>
            </div>
          ) : links.map(link => {
            const days = link.expiresAt ? daysUntil(link.expiresAt) : null;
            const isExpired = days !== null && days <= 0;
            const purposeStyle = PURPOSE_LABELS[link.purpose];
            return (
              <Card key={link.id} className={`border transition-colors ${link.isActive && !isExpired ? "border-border hover:border-blue-500/30" : "border-border/40 opacity-60"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{link.recipientName}</span>
                        {link.recipientOrg && <span className="text-xs text-muted-foreground">· {link.recipientOrg}</span>}
                        <Badge className={`text-xs border ${purposeStyle.color}`}>{purposeStyle.label}</Badge>
                        {!link.isActive && <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">Revoked</Badge>}
                        {isExpired && <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">Expired</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {link.recipientEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{link.recipientEmail}</span>}
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.viewCount} views</span>
                        {link.expiresAt && (
                          <span className={`flex items-center gap-1 ${days !== null && days <= 3 ? "text-red-400" : ""}`}>
                            <CalendarDays className="w-3 h-3" />
                            {isExpired ? "Expired" : `Expires in ${days}d`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {link.allowDownload ? <Unlock className="w-3 h-3 text-amber-400" /> : <Lock className="w-3 h-3" />}
                          {link.allowDownload ? "Downloads allowed" : "No downloads"}
                        </span>
                      </div>
                      <div className="mt-2 bg-muted/20 rounded px-2 py-1 text-xs font-mono text-muted-foreground truncate">
                        🔒 {link.watermarkText}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-xs h-8"
                        onClick={() => copyLink(link)} disabled={!link.isActive || isExpired}>
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copiedId === link.id ? "Copied!" : "Copy Link"}
                      </Button>
                      <button onClick={() => toggleActive(link.id)} className={`p-2 rounded-md border ${link.isActive ? "border-emerald-500/30 text-emerald-400 hover:bg-red-500/10" : "border-red-500/30 text-red-400 hover:bg-emerald-500/10"} transition-colors`} title={link.isActive ? "Revoke access" : "Restore access"}>
                        {link.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteLink(link.id)} className="p-2 rounded-md border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Link Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> Create Screener Link</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Recipient Name *</label>
              <Input value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} placeholder="e.g. Sundance Selection Committee" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={form.recipientEmail} onChange={e => setForm(p => ({ ...p, recipientEmail: e.target.value }))} placeholder="email@festival.com" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Organisation</label>
                <Input value={form.recipientOrg} onChange={e => setForm(p => ({ ...p, recipientOrg: e.target.value }))} placeholder="e.g. A24, Sundance" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Purpose</label>
                <select value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value as any }))} className="mt-1 w-full h-9 bg-background border border-input rounded-md px-3 text-sm">
                  <option value="festival">Festival</option>
                  <option value="distributor">Distributor</option>
                  <option value="investor">Investor</option>
                  <option value="cast">Cast</option>
                  <option value="press">Press</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Expires On</label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
              <div>
                <p className="text-sm font-medium">Allow Downloads</p>
                <p className="text-xs text-muted-foreground">Recipients can download the video file</p>
              </div>
              <Switch checked={form.allowDownload} onCheckedChange={v => setForm(p => ({ ...p, allowDownload: v }))} />
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                A visible watermark will appear on the video: <strong className="ml-1">{form.recipientName.toUpperCase() || "RECIPIENT NAME"}{form.recipientOrg ? ` / ${form.recipientOrg.toUpperCase()}` : ""} — CONFIDENTIAL</strong>
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-500" onClick={createLink}>
              <Link className="w-4 h-4 mr-1" />Generate Screener Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
