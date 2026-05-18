import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectId } from "@/context/pod-project";
import { Package, Plus, Trash2, ExternalLink, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Asset = {
  id: number;
  projectId: number;
  name: string;
  category: string;
  assetType?: string | null;
  description?: string | null;
  status?: string | null;
  url?: string | null;
  notes?: string | null;
  createdAt: string;
};

const CATEGORIES = ["video", "photo", "audio", "social", "press", "other"];
const STATUSES = [
  { value: "available", label: "Available", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "pending", label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "licensed", label: "Licensed", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { value: "restricted", label: "Restricted", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { value: "clearance-needed", label: "Clearance Needed", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
];

function getStatus(val?: string | null) {
  return STATUSES.find((s) => s.value === val) ?? STATUSES[0];
}

const BLANK_FORM = { name: "", category: "video", assetType: "", description: "", status: "available", url: "", notes: "" };

export default function PodAssets() {
  const projectId = useProjectId();
  const qc = useQueryClient();

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["pod-assets", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/pod-assets`);
      return r.json();
    },
    enabled: !!projectId,
  });

  const createAsset = useMutation({
    mutationFn: async (body: typeof BLANK_FORM) => {
      const r = await fetch(`/api/projects/${projectId}/pod-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-assets", projectId] }),
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & typeof BLANK_FORM) => {
      const r = await fetch(`/api/projects/${projectId}/pod-assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-assets", projectId] }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/projects/${projectId}/pod-assets/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-assets", projectId] }),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  function openCreate() { setEditing(null); setForm(BLANK_FORM); setOpen(true); }
  function openEdit(a: Asset) {
    setEditing(a);
    setForm({ name: a.name, category: a.category, assetType: a.assetType ?? "", description: a.description ?? "", status: a.status ?? "available", url: a.url ?? "", notes: a.notes ?? "" });
    setOpen(true);
  }
  function handleSubmit() {
    if (!form.name.trim()) return;
    if (editing) { updateAsset.mutate({ id: editing.id, ...form }); }
    else { createAsset.mutate(form); }
    setOpen(false);
  }

  const filtered = assets.filter((a) => {
    if (filterCat !== "all" && a.category !== filterCat) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Assets</h1>
          <p className="text-muted-foreground mt-1">Fake celebrity media tracker — video, photo, audio, press</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Asset</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" variant={filterCat === "all" ? "default" : "outline"} onClick={() => setFilterCat("all")}>All</Button>
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={filterCat === c ? "default" : "outline"} onClick={() => setFilterCat(c)} className="capitalize">{c}</Button>
        ))}
        <div className="w-px bg-border mx-1" />
        <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>All Status</Button>
        {STATUSES.map((s) => (
          <Button key={s.value} size="sm" variant={filterStatus === s.value ? "default" : "outline"} onClick={() => setFilterStatus(s.value)}>{s.label}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No assets yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Track fake celebrity video, photo, audio, and press materials here.
          </p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Asset</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, i) => {
                const status = getStatus(asset.status);
                return (
                  <tr key={asset.id} className={`border-b border-border last:border-0 hover:bg-accent/20 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{asset.name}</p>
                      {asset.description && <p className="text-xs text-muted-foreground line-clamp-1">{asset.description}</p>}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{asset.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.assetType || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {asset.url ? (
                        <a href={asset.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-xs truncate max-w-32"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          Link
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(asset)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteAsset.mutate(asset.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Asset name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            <Input placeholder="Asset type (e.g. interview clip, paparazzi photo)" value={form.assetType} onChange={(e) => setForm(f => ({ ...f, assetType: e.target.value }))} />
            <Input placeholder="URL" value={form.url} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            <Button className="w-full" onClick={handleSubmit} disabled={!form.name.trim()}>
              {editing ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
