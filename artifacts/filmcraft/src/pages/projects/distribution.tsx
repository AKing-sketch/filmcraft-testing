import { useState, useEffect } from "react";
import { useParams } from "wouter";
import {
  useListDistributionEntries, useCreateDistributionEntry,
  useUpdateDistributionEntry, useDeleteDistributionEntry,
  getListDistributionEntriesQueryKey,
  useGetDistributionStrategy, useUpsertDistributionStrategy,
} from "@workspace/api-client-react";
import { Plus, Trash2, ExternalLink, Globe, Award, Tv, Building, Users, MoreHorizontal, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTRY_TYPES = [
  { value: "festival",     label: "Film Festival",     icon: Award },
  { value: "distributor",  label: "Distributor",        icon: Building },
  { value: "platform",     label: "Streaming Platform", icon: Tv },
  { value: "broadcaster",  label: "Broadcaster",        icon: Globe },
  { value: "sales-agent",  label: "Sales Agent",        icon: Users },
  { value: "other",        label: "Other",              icon: MoreHorizontal },
];

const STATUSES = [
  { value: "considering", label: "Considering",  color: "bg-secondary text-secondary-foreground border-border" },
  { value: "submitted",   label: "Submitted",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "screened",    label: "Screened",     color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "accepted",    label: "Accepted",     color: "bg-green-500/20 text-green-500 border-green-500/30" },
  { value: "deal-made",   label: "Deal Made",    color: "bg-primary/20 text-primary border-primary/30" },
  { value: "rejected",    label: "Rejected",     color: "bg-destructive/20 text-destructive border-destructive/30" },
  { value: "withdrawn",   label: "Withdrawn",    color: "bg-muted text-muted-foreground border-border" },
];

function statusStyle(status: string) {
  return STATUSES.find(s => s.value === status)?.color ?? "bg-secondary text-secondary-foreground border-border";
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DistributionTracker() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const [tab, setTab] = useState<"tracker" | "presskit">("tracker");

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Distribution</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track festivals, deals, and build your distribution strategy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("tracker")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "tracker"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Submissions Tracker
        </button>
        <button
          onClick={() => setTab("presskit")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "presskit"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Press Kit / Strategy
        </button>
      </div>

      {tab === "tracker" ? (
        <TrackerTab projectId={projectId} />
      ) : (
        <PressKitTab projectId={projectId} />
      )}
    </div>
  );
}

// ── Tracker Tab ───────────────────────────────────────────────────────────────

function TrackerTab({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useListDistributionEntries(projectId, {
    query: { enabled: !!projectId }
  });
  const createEntry = useCreateDistributionEntry();
  const updateEntry = useUpdateDistributionEntry();
  const deleteEntry = useDeleteDistributionEntry();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "festival", name: "", status: "considering",
    submissionDate: "", responseDate: "", notes: "", url: "",
    fee: "" as string | number,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate(
      { projectId, data: { ...newEntry, fee: newEntry.fee ? Number(newEntry.fee) : null } },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) });
          setNewEntry({ type: "festival", name: "", status: "considering", submissionDate: "", responseDate: "", notes: "", url: "", fee: "" });
        }
      }
    );
  };

  const handleStatusChange = (entryId: number, status: string) => {
    updateEntry.mutate(
      { projectId, id: entryId, data: { status } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) }) }
    );
  };

  const handleDelete = (entryId: number) => {
    if (confirm("Remove this entry?")) {
      deleteEntry.mutate(
        { projectId, id: entryId },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) }) }
      );
    }
  };

  const grouped = ENTRY_TYPES.map(t => ({
    ...t,
    items: entries?.filter(e => e.type === t.value) ?? [],
  })).filter(g => g.items.length > 0);

  const total     = entries?.length ?? 0;
  const submitted = entries?.filter(e => ["submitted","screened","accepted","deal-made"].includes(e.status)).length ?? 0;
  const accepted  = entries?.filter(e => ["accepted","deal-made"].includes(e.status)).length ?? 0;

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>New Distribution Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newEntry.type} onValueChange={v => setNewEntry({ ...newEntry, type: v })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newEntry.status} onValueChange={v => setNewEntry({ ...newEntry, status: v })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
                <Input value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} required placeholder="e.g. Sundance Film Festival" className="bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Submission Date</label>
                  <Input type="date" value={newEntry.submissionDate} onChange={e => setNewEntry({ ...newEntry, submissionDate: e.target.value })} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Date</label>
                  <Input type="date" value={newEntry.responseDate} onChange={e => setNewEntry({ ...newEntry, responseDate: e.target.value })} className="bg-background border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL</label>
                  <Input value={newEntry.url} onChange={e => setNewEntry({ ...newEntry, url: e.target.value })} placeholder="https://..." className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Submission Fee ($)</label>
                  <Input type="number" value={newEntry.fee} onChange={e => setNewEntry({ ...newEntry, fee: e.target.value })} className="bg-background border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} className="h-20 bg-background border-border" />
              </div>
              <Button type="submit" className="w-full" disabled={!newEntry.name || createEntry.isPending}>Save Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{submitted}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Submitted</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{accepted}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Accepted</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-medium mb-1">No distribution entries yet</h2>
          <p className="text-sm max-w-sm mx-auto">Track festival submissions, distribution deals, streaming platforms, and broadcasters.</p>
        </div>
      )}

      {/* Grouped cards */}
      <div className="space-y-8">
        {grouped.map(group => (
          <div key={group.value}>
            <div className="flex items-center gap-2 mb-3">
              <group.icon className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-foreground/70">{group.label}</h2>
              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded border border-border">{group.items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.items.map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">{entry.name}</h3>
                      {entry.submissionDate && <p className="text-xs text-muted-foreground mt-1">Submitted: {entry.submissionDate}</p>}
                      {entry.responseDate  && <p className="text-xs text-muted-foreground">Response: {entry.responseDate}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {entry.notes && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.notes}</p>}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <Select value={entry.status} onValueChange={v => handleStatusChange(entry.id, v)}>
                      <SelectTrigger className={`h-7 text-[10px] uppercase tracking-wider font-bold border px-2 w-auto min-w-[110px] ${statusStyle(entry.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {STATUSES.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {entry.fee ? <span className="text-xs font-mono text-muted-foreground">${entry.fee} fee</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Press Kit / Strategy Tab ──────────────────────────────────────────────────

type StrategyForm = {
  tagline: string;
  shortSynopsis: string;
  longSynopsis: string;
  directorStatement: string;
  directorBio: string;
  producerBio: string;
  runtimeMinutes: string;
  aspectRatio: string;
  soundFormat: string;
  language: string;
  countryOfOrigin: string;
  subtitles: string;
  targetAudience: string;
  festivalStrategy: string;
  releaseStrategy: string;
  socialLinks: string;
  pressContact: string;
};

const EMPTY_FORM: StrategyForm = {
  tagline: "", shortSynopsis: "", longSynopsis: "",
  directorStatement: "", directorBio: "", producerBio: "",
  runtimeMinutes: "", aspectRatio: "", soundFormat: "",
  language: "", countryOfOrigin: "", subtitles: "",
  targetAudience: "", festivalStrategy: "", releaseStrategy: "",
  socialLinks: "", pressContact: "",
};

function PressKitTab({ projectId }: { projectId: number }) {
  const { data: strategy, isLoading } = useGetDistributionStrategy(projectId, {
    query: { enabled: !!projectId, retry: false },
  });
  const upsert = useUpsertDistributionStrategy();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<StrategyForm>(EMPTY_FORM);

  // Populate form once data loads
  useEffect(() => {
    if (strategy) {
      setForm({
        tagline: strategy.tagline ?? "",
        shortSynopsis: strategy.shortSynopsis ?? "",
        longSynopsis: strategy.longSynopsis ?? "",
        directorStatement: strategy.directorStatement ?? "",
        directorBio: strategy.directorBio ?? "",
        producerBio: strategy.producerBio ?? "",
        runtimeMinutes: strategy.runtimeMinutes != null ? String(strategy.runtimeMinutes) : "",
        aspectRatio: strategy.aspectRatio ?? "",
        soundFormat: strategy.soundFormat ?? "",
        language: strategy.language ?? "",
        countryOfOrigin: strategy.countryOfOrigin ?? "",
        subtitles: strategy.subtitles ?? "",
        targetAudience: strategy.targetAudience ?? "",
        festivalStrategy: strategy.festivalStrategy ?? "",
        releaseStrategy: strategy.releaseStrategy ?? "",
        socialLinks: strategy.socialLinks ?? "",
        pressContact: strategy.pressContact ?? "",
      });
    }
  }, [strategy]);

  const set = (key: keyof StrategyForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    upsert.mutate(
      {
        params: { projectId },
        data: {
          ...form,
          runtimeMinutes: form.runtimeMinutes ? Number(form.runtimeMinutes) : null,
        },
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Section: Story */}
      <Section title="Story & Logline">
        <Field label="Tagline">
          <Input placeholder="One punchy line that sells the film…" value={form.tagline} onChange={e => set("tagline", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Short Synopsis (100 words)">
          <Textarea rows={3} placeholder="A concise paragraph for press releases and listings…" value={form.shortSynopsis} onChange={e => set("shortSynopsis", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Long Synopsis">
          <Textarea rows={6} placeholder="Full narrative synopsis for distributors and programmers…" value={form.longSynopsis} onChange={e => set("longSynopsis", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Director's Statement">
          <Textarea rows={4} placeholder="Personal statement about the film's intent and vision…" value={form.directorStatement} onChange={e => set("directorStatement", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Target Audience">
          <Input placeholder="e.g. Adult drama fans, festival circuit, arthouse" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} className="bg-background border-border" />
        </Field>
      </Section>

      {/* Section: Technical Specs */}
      <Section title="Technical Specifications">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Runtime (minutes)">
            <Input type="number" placeholder="90" value={form.runtimeMinutes} onChange={e => set("runtimeMinutes", e.target.value)} className="bg-background border-border" />
          </Field>
          <Field label="Aspect Ratio">
            <Input placeholder="2.39:1 / 1.85:1 / 1.33:1" value={form.aspectRatio} onChange={e => set("aspectRatio", e.target.value)} className="bg-background border-border" />
          </Field>
          <Field label="Sound Format">
            <Input placeholder="5.1 Surround / Stereo / Dolby Atmos" value={form.soundFormat} onChange={e => set("soundFormat", e.target.value)} className="bg-background border-border" />
          </Field>
          <Field label="Primary Language">
            <Input placeholder="English" value={form.language} onChange={e => set("language", e.target.value)} className="bg-background border-border" />
          </Field>
          <Field label="Country of Origin">
            <Input placeholder="United States" value={form.countryOfOrigin} onChange={e => set("countryOfOrigin", e.target.value)} className="bg-background border-border" />
          </Field>
          <Field label="Subtitles / Captions">
            <Input placeholder="English SDH, French, Spanish" value={form.subtitles} onChange={e => set("subtitles", e.target.value)} className="bg-background border-border" />
          </Field>
        </div>
      </Section>

      {/* Section: Bios */}
      <Section title="Key Talent Bios">
        <Field label="Director Bio">
          <Textarea rows={4} placeholder="Third-person professional biography…" value={form.directorBio} onChange={e => set("directorBio", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Producer Bio">
          <Textarea rows={3} placeholder="Third-person professional biography…" value={form.producerBio} onChange={e => set("producerBio", e.target.value)} className="bg-background border-border" />
        </Field>
      </Section>

      {/* Section: Strategy */}
      <Section title="Distribution Strategy">
        <Field label="Festival Strategy">
          <Textarea rows={3} placeholder="Primary targets, submission timeline, Tier A/B/C breakdown…" value={form.festivalStrategy} onChange={e => set("festivalStrategy", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Release Strategy">
          <Textarea rows={3} placeholder="Theatrical, VOD, streaming, day-and-date, educational…" value={form.releaseStrategy} onChange={e => set("releaseStrategy", e.target.value)} className="bg-background border-border" />
        </Field>
      </Section>

      {/* Section: Contacts */}
      <Section title="Press & Social">
        <Field label="Press Contact">
          <Input placeholder="Name, email, phone" value={form.pressContact} onChange={e => set("pressContact", e.target.value)} className="bg-background border-border" />
        </Field>
        <Field label="Social Media Links">
          <Textarea rows={2} placeholder="Instagram: @handle&#10;Twitter/X: @handle&#10;Website: https://…" value={form.socialLinks} onChange={e => set("socialLinks", e.target.value)} className="bg-background border-border" />
        </Field>
      </Section>

      {/* Save button */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSave} disabled={upsert.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Save className="w-4 h-4" />
          {upsert.isPending ? "Saving…" : "Save Press Kit"}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-400">Saved!</span>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {children}
    </div>
  );
}
