import { useState } from "react";
import { useParams } from "wouter";
import {
  useListPostMilestones, useCreatePostMilestone, useUpdatePostMilestone, useDeletePostMilestone,
  getListPostMilestonesQueryKey,
  useListDeliverables, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable,
  getListDeliverablesQueryKey,
} from "@workspace/api-client-react";
import {
  CheckCircle2, Circle, Clock, AlertCircle, Plus, Trash2,
  Film, Palette, Volume2, Music, Package, Clapperboard, Wand2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "edit",     label: "Editorial",       icon: Film },
  { value: "vfx",      label: "VFX",             icon: Wand2 },
  { value: "color",    label: "Color Grade",     icon: Palette },
  { value: "sound",    label: "Sound Design",    icon: Volume2 },
  { value: "music",    label: "Music / Score",   icon: Music },
  { value: "delivery", label: "Delivery",        icon: Package },
  { value: "other",    label: "Other",           icon: Clapperboard },
];

const MILESTONE_STATUSES = [
  { value: "pending",     label: "Pending",     color: "text-muted-foreground", bg: "bg-muted/30" },
  { value: "in-progress", label: "In Progress", color: "text-amber-400",        bg: "bg-amber-400/10" },
  { value: "complete",    label: "Complete",    color: "text-emerald-400",      bg: "bg-emerald-400/10" },
  { value: "blocked",     label: "Blocked",     color: "text-rose-400",         bg: "bg-rose-400/10" },
];

const DELIVERABLE_STATUSES = [
  { value: "pending",     label: "Pending",   color: "text-muted-foreground", bg: "bg-muted/30" },
  { value: "in-progress", label: "In Progress", color: "text-amber-400",     bg: "bg-amber-400/10" },
  { value: "delivered",   label: "Delivered", color: "text-sky-400",          bg: "bg-sky-400/10" },
  { value: "approved",    label: "Approved",  color: "text-emerald-400",      bg: "bg-emerald-400/10" },
];

const DEFAULT_MILESTONES = [
  { title: "Offline edit / rough cut",  category: "edit",     orderIndex: 0 },
  { title: "Picture lock",              category: "edit",     orderIndex: 1 },
  { title: "VFX shot list approved",    category: "vfx",      orderIndex: 2 },
  { title: "VFX finals delivered",      category: "vfx",      orderIndex: 3 },
  { title: "Color grade complete",      category: "color",    orderIndex: 4 },
  { title: "Sound design spotting",     category: "sound",    orderIndex: 5 },
  { title: "Final audio mix",           category: "sound",    orderIndex: 6 },
  { title: "Music licensing cleared",   category: "music",    orderIndex: 7 },
  { title: "DCP / master file ready",   category: "delivery", orderIndex: 8 },
  { title: "Screener sent to festival", category: "delivery", orderIndex: 9 },
];

const DEFAULT_DELIVERABLES = [
  { name: "DCP (Digital Cinema Package)", format: "DCP", specs: "2K flat, 24fps, MXF" },
  { name: "ProRes 4444 Master",           format: "ProRes 4444", specs: "4K, 24fps" },
  { name: "H.264 Screener",               format: "H.264 / MP4", specs: "1080p, 24fps" },
  { name: "Closed Captions / Subtitles",  format: "SRT / SCC" },
  { name: "EPK (Electronic Press Kit)",   format: "ZIP / PDF" },
  { name: "Stills Package",               format: "TIFF / JPEG", specs: "300 dpi" },
  { name: "Poster / Key Art",             format: "TIFF / JPEG", specs: "300 dpi, A0" },
  { name: "Trailer (2:30)",               format: "H.264 / MP4", specs: "1080p" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusIcon(status: string) {
  if (status === "complete")    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "in-progress") return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
  if (status === "blocked")     return <AlertCircle className="w-4 h-4 text-rose-400" />;
  return <Circle className="w-4 h-4 text-muted-foreground/50" />;
}

function categoryIcon(cat: string) {
  const found = CATEGORIES.find((c) => c.value === cat);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className="w-3.5 h-3.5" />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PostProduction() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const [tab, setTab] = useState<"milestones" | "deliverables">("milestones");

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Post-Production</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your edit pipeline, deliverables, and technical milestones.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["milestones", "deliverables"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "milestones" ? "Pipeline Milestones" : "Deliverables"}
          </button>
        ))}
      </div>

      {tab === "milestones" ? (
        <MilestonesTab projectId={projectId} />
      ) : (
        <DeliverablesTab projectId={projectId} />
      )}
    </div>
  );
}

// ── Milestones Tab ────────────────────────────────────────────────────────────

function MilestonesTab({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { data: milestones = [], isLoading } = useListPostMilestones(projectId);
  const create = useCreatePostMilestone();
  const update = useUpdatePostMilestone();
  const remove = useDeletePostMilestone();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "edit", status: "pending", dueDate: "", notes: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPostMilestonesQueryKey(projectId) });

  async function seedDefaults() {
    for (const m of DEFAULT_MILESTONES) {
      await create.mutateAsync({ params: { projectId }, data: m });
    }
    invalidate();
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    await create.mutateAsync({
      params: { projectId },
      data: {
        title: form.title,
        category: form.category,
        status: form.status,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
        orderIndex: milestones.length,
      },
    });
    invalidate();
    setForm({ title: "", category: "edit", status: "pending", dueDate: "", notes: "" });
    setOpen(false);
  }

  async function cycleStatus(m: (typeof milestones)[0]) {
    const order = ["pending", "in-progress", "complete", "blocked"];
    const next = order[(order.indexOf(m.status) + 1) % order.length];
    await update.mutateAsync({ params: { projectId, id: m.id }, data: { status: next } });
    invalidate();
  }

  async function handleDelete(id: number) {
    await remove.mutateAsync({ params: { projectId, id } });
    invalidate();
  }

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: milestones.filter((m) => m.category === cat.value),
  })).filter((g) => g.items.length > 0);

  const complete = milestones.filter((m) => m.status === "complete").length;
  const pct = milestones.length ? Math.round((complete / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{complete} / {milestones.length} complete</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" /> Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle>New Post-Production Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Milestone title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-background border-border"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {MILESTONE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="date"
                placeholder="Due date (optional)"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-background border-border"
              />
              <Textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-background border-border text-sm"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.title.trim() || create.isPending}>
                  {create.isPending ? "Saving…" : "Add Milestone"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {milestones.length === 0 && !isLoading && (
          <Button variant="outline" size="sm" onClick={seedDefaults} disabled={create.isPending} className="border-border text-muted-foreground">
            Load default pipeline
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && milestones.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground space-y-2">
          <Clapperboard className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">No milestones yet</p>
          <p className="text-sm">Add milestones manually or load the default post-production pipeline.</p>
        </div>
      )}

      {/* Grouped list */}
      {grouped.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.value} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <GroupIcon className="w-3.5 h-3.5" />
              <span>{group.label}</span>
              <span className="ml-auto font-normal normal-case tracking-normal">
                {group.items.filter(i => i.status === "complete").length}/{group.items.length}
              </span>
            </div>
            {group.items.map((m) => {
              const st = MILESTONE_STATUSES.find((s) => s.value === m.status) || MILESTONE_STATUSES[0];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border group"
                >
                  <button
                    onClick={() => cycleStatus(m)}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                    title="Click to advance status"
                  >
                    {statusIcon(m.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${m.status === "complete" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {m.title}
                    </p>
                    {m.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{m.notes}</p>}
                  </div>
                  {m.dueDate && (
                    <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{m.dueDate}</span>
                  )}
                  <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>
                    {st.label}
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Deliverables Tab ──────────────────────────────────────────────────────────

function DeliverablesTab({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { data: deliverables = [], isLoading } = useListDeliverables(projectId);
  const create = useCreateDeliverable();
  const update = useUpdateDeliverable();
  const remove = useDeleteDeliverable();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", format: "", specs: "", recipient: "", dueDate: "", status: "pending", notes: ""
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey(projectId) });

  async function seedDefaults() {
    for (const d of DEFAULT_DELIVERABLES) {
      await create.mutateAsync({ params: { projectId }, data: { ...d, status: "pending" } });
    }
    invalidate();
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    await create.mutateAsync({
      params: { projectId },
      data: {
        name: form.name,
        format: form.format || null,
        specs: form.specs || null,
        recipient: form.recipient || null,
        dueDate: form.dueDate || null,
        status: form.status,
        notes: form.notes || null,
      },
    });
    invalidate();
    setForm({ name: "", format: "", specs: "", recipient: "", dueDate: "", status: "pending", notes: "" });
    setOpen(false);
  }

  async function cycleStatus(d: (typeof deliverables)[0]) {
    const order = ["pending", "in-progress", "delivered", "approved"];
    const next = order[(order.indexOf(d.status) + 1) % order.length];
    await update.mutateAsync({ params: { projectId, id: d.id }, data: { status: next } });
    invalidate();
  }

  async function handleDelete(id: number) {
    await remove.mutateAsync({ params: { projectId, id } });
    invalidate();
  }

  const countByStatus = DELIVERABLE_STATUSES.map((s) => ({
    ...s,
    count: deliverables.filter((d) => d.status === s.value).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary pills */}
      {deliverables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {countByStatus.filter((s) => s.count > 0).map((s) => (
            <span key={s.value} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${s.bg} ${s.color} border-border`}>
              {s.count} {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" /> Add Deliverable
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle>New Deliverable</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Deliverable name (e.g. DCP, ProRes Master)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-background border-border"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Format (e.g. ProRes 4444)"
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="bg-background border-border"
                />
                <Input
                  placeholder="Technical specs"
                  value={form.specs}
                  onChange={(e) => setForm({ ...form, specs: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Recipient / Destination"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                  className="bg-background border-border"
                />
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {DELIVERABLE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-background border-border text-sm"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name.trim() || create.isPending}>
                  {create.isPending ? "Saving…" : "Add Deliverable"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {deliverables.length === 0 && !isLoading && (
          <Button variant="outline" size="sm" onClick={seedDefaults} disabled={create.isPending} className="border-border text-muted-foreground">
            Load standard deliverables
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && deliverables.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground space-y-2">
          <Package className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">No deliverables yet</p>
          <p className="text-sm">Add deliverables manually or load the standard film delivery package.</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {deliverables.map((d) => {
          const st = DELIVERABLE_STATUSES.find((s) => s.value === d.status) || DELIVERABLE_STATUSES[0];
          return (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border group">
              <button
                onClick={() => cycleStatus(d)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
                title="Click to advance status"
              >
                {d.status === "approved" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : d.status === "delivered" ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                ) : d.status === "in-progress" ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/50" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${d.status === "approved" ? "text-muted-foreground" : "text-foreground"}`}>
                  {d.name}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {[d.format, d.specs, d.recipient].filter(Boolean).join(" · ")}
                </p>
              </div>

              {d.dueDate && (
                <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{d.dueDate}</span>
              )}

              <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>
                {st.label}
              </span>

              <button
                onClick={() => handleDelete(d.id)}
                className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
