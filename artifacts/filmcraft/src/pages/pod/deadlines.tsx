import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectId } from "@/context/pod-project";
import { CheckSquare, Plus, Trash2, Edit2, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Deadline = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string | null;
  assignee?: string | null;
  priority?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt: string;
};

const STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "in-progress", label: "In Progress", icon: AlertCircle, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { value: "done", label: "Done", icon: Check, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-slate-400" },
  { value: "normal", label: "Normal", color: "text-amber-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "critical", label: "Critical", color: "text-red-400" },
];

function getStatus(val?: string | null) {
  return STATUSES.find(s => s.value === val) ?? STATUSES[0];
}
function getPriority(val?: string | null) {
  return PRIORITIES.find(p => p.value === val) ?? PRIORITIES[1];
}
function nextStatus(val?: string | null) {
  const idx = STATUSES.findIndex(s => s.value === val);
  return STATUSES[(idx + 1) % STATUSES.length].value;
}
function isDue(dueDate?: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const BLANK = { title: "", dueDate: "", assignee: "", priority: "normal", status: "pending", notes: "" };

export default function PodDeadlines() {
  const projectId = useProjectId();
  const qc = useQueryClient();

  const { data: deadlines = [], isLoading } = useQuery<Deadline[]>({
    queryKey: ["pod-deadlines", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/pod-deadlines`);
      return r.json();
    },
    enabled: !!projectId,
  });

  const createDeadline = useMutation({
    mutationFn: async (body: typeof BLANK) => {
      const r = await fetch(`/api/projects/${projectId}/pod-deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-deadlines", projectId] }),
  });

  const updateDeadline = useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & Partial<typeof BLANK>) => {
      const r = await fetch(`/api/projects/${projectId}/pod-deadlines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-deadlines", projectId] }),
  });

  const deleteDeadline = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/projects/${projectId}/pod-deadlines/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-deadlines", projectId] }),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deadline | null>(null);
  const [form, setForm] = useState(BLANK);
  const [filterStatus, setFilterStatus] = useState("all");

  function openCreate() { setEditing(null); setForm(BLANK); setOpen(true); }
  function openEdit(d: Deadline) {
    setEditing(d);
    setForm({ title: d.title, dueDate: d.dueDate ?? "", assignee: d.assignee ?? "", priority: d.priority ?? "normal", status: d.status ?? "pending", notes: d.notes ?? "" });
    setOpen(true);
  }
  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editing) { updateDeadline.mutate({ id: editing.id, ...form }); }
    else { createDeadline.mutate(form); }
    setOpen(false);
  }

  const sorted = [...deadlines].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const filtered = filterStatus === "all" ? sorted : sorted.filter(d => d.status === filterStatus);

  const doneCount = deadlines.filter(d => d.status === "done").length;
  const progress = deadlines.length > 0 ? Math.round((doneCount / deadlines.length) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deadlines</h1>
          <p className="text-muted-foreground mt-1">Class deadline checklist and production milestones</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Deadline</Button>
      </div>

      {deadlines.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{doneCount} of {deadlines.length} complete</span>
            <span className="text-sm text-primary font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>All</Button>
        {STATUSES.map(s => (
          <Button key={s.value} size="sm" variant={filterStatus === s.value ? "default" : "outline"} onClick={() => setFilterStatus(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No deadlines yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Add class deadlines, submission dates, and production checkpoints here.
          </p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Deadline</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const status = getStatus(d.status);
            const priority = getPriority(d.priority);
            const overdue = isDue(d.dueDate) && d.status !== "done";
            const StatusIcon = status.icon;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                  d.status === "done"
                    ? "bg-card/40 border-border/50 opacity-60"
                    : overdue
                    ? "bg-card border-red-500/30"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                {/* Status toggle */}
                <button
                  onClick={() => updateDeadline.mutate({ id: d.id, status: nextStatus(d.status) })}
                  className={`flex-shrink-0 p-1.5 rounded-md border transition-colors ${status.color}`}
                  title={`Mark as ${nextStatus(d.status)}`}
                >
                  <StatusIcon className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium ${d.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {d.title}
                    </p>
                    <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                    {overdue && <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30 bg-red-500/10">Overdue</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {d.dueDate && (
                      <span className={overdue ? "text-red-400" : ""}>
                        Due: {formatDate(d.dueDate)}
                      </span>
                    )}
                    {d.assignee && <span>→ {d.assignee}</span>}
                    {d.notes && <span className="line-clamp-1">{d.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(d)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteDeadline.mutate(d.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Deadline" : "Add Deadline"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Deadline title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
                <Input placeholder="Name or role" value={form.assignee} onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            <Button className="w-full" onClick={handleSubmit} disabled={!form.title.trim()}>
              {editing ? "Save Changes" : "Add Deadline"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
