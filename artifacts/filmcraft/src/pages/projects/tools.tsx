import { useState } from "react";
import { useParams } from "wouter";
import {
  useListTools, useCreateTool, useUpdateTool, useDeleteTool,
  getListToolsQueryKey,
} from "@workspace/api-client-react";
import type { ProductionTool } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = [
  "Camera",
  "Sound",
  "Editorial / Post",
  "File / Storage",
  "Communication + Scheduling",
  "Locations",
  "Legal",
  "Funding / Submissions",
  "Other",
];

const STATUSES = ["active", "testing", "planned", "archived"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  testing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  planned: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

const BLANK: Omit<ProductionTool, "id" | "projectId" | "createdAt"> = {
  name: "",
  category: CATEGORIES[0],
  purpose: "",
  externalLink: "",
  projectNotes: "",
  workflowNotes: "",
  assignedUser: "",
  status: "active",
};

export default function ProductionTools() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const qc = useQueryClient();

  const { data: tools = [], isLoading } = useListTools(projectId, {
    query: { enabled: !!projectId },
  });

  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionTool | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListToolsQueryKey(projectId) });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK });
    setModalOpen(true);
  };

  const openEdit = (t: ProductionTool) => {
    setEditing(t);
    setForm({
      name: t.name,
      category: t.category,
      purpose: t.purpose ?? "",
      externalLink: t.externalLink ?? "",
      projectNotes: t.projectNotes ?? "",
      workflowNotes: t.workflowNotes ?? "",
      assignedUser: t.assignedUser ?? "",
      status: t.status ?? "active",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      purpose: form.purpose || null,
      externalLink: form.externalLink || null,
      projectNotes: form.projectNotes || null,
      workflowNotes: form.workflowNotes || null,
      assignedUser: form.assignedUser || null,
    };
    if (editing) {
      updateTool.mutate(
        { projectId, id: editing.id, data },
        { onSuccess: () => { invalidate(); setModalOpen(false); } }
      );
    } else {
      createTool.mutate(
        { projectId, data },
        { onSuccess: () => { invalidate(); setModalOpen(false); } }
      );
    }
  };

  const handleDelete = (t: ProductionTool) => {
    if (confirm(`Delete "${t.name}"?`)) {
      deleteTool.mutate({ projectId, id: t.id }, { onSuccess: invalidate });
    }
  };

  const field = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Group tools by category
  const categories = Array.from(new Set(tools.map((t) => t.category))).sort();
  const activeCats = filterCat === "All" ? categories : [filterCat];

  const filtered = tools.filter((t) => {
    if (filterCat !== "All" && t.category !== filterCat) return false;
    if (filterStatus !== "All" && (t.status ?? "active") !== filterStatus) return false;
    return true;
  });

  const byCategory = activeCats.reduce<Record<string, ProductionTool[]>>((acc, cat) => {
    acc[cat] = filtered.filter((t) => t.category === cat);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" /> Tools
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Production toolchain — what you use, why, and where it fits.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Tool
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterCat === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 opacity-60">
                {tools.filter((t) => t.category === cat).length}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {["All", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <Wrench className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No tools yet. Add your first tool to document your production toolchain.</p>
          <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
            <Plus className="w-4 h-4" /> Add Tool
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCats.map((cat) => {
            const catTools = byCategory[cat] ?? [];
            if (catTools.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  {cat}
                  <span className="text-primary/60">{catTools.length}</span>
                  <span className="h-px flex-1 bg-border" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onEdit={() => openEdit(tool)}
                      onDelete={() => handleDelete(tool)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tool" : "Add Tool"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Tool name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="e.g. DaVinci Resolve"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => field("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status ?? "active"} onValueChange={(v) => field("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Purpose</Label>
                <Input
                  value={form.purpose ?? ""}
                  onChange={(e) => field("purpose", e.target.value)}
                  placeholder="What this tool does in your workflow"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>External link</Label>
                <Input
                  value={form.externalLink ?? ""}
                  onChange={(e) => field("externalLink", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Assigned to</Label>
                <Input
                  value={form.assignedUser ?? ""}
                  onChange={(e) => field("assignedUser", e.target.value)}
                  placeholder="Who owns or operates this tool"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Project notes</Label>
                <Textarea
                  value={form.projectNotes ?? ""}
                  onChange={(e) => field("projectNotes", e.target.value)}
                  placeholder="Project-specific usage, settings, context…"
                  rows={3}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Workflow notes</Label>
                <Textarea
                  value={form.workflowNotes ?? ""}
                  onChange={(e) => field("workflowNotes", e.target.value)}
                  placeholder="How this tool connects to the rest of the system…"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!form.name || !form.category || createTool.isPending || updateTool.isPending}
                className="flex-1"
              >
                {editing ? "Save Changes" : "Add Tool"}
              </Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolCard({
  tool,
  onEdit,
  onDelete,
}: {
  tool: ProductionTool;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColor = STATUS_COLORS[tool.status ?? "active"] ?? STATUS_COLORS.active;

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground truncate">{tool.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${statusColor}`}>
              {tool.status ?? "active"}
            </span>
          </div>
          {tool.purpose && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.purpose}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(tool.projectNotes || tool.workflowNotes) && (
        <div className="space-y-2 border-t border-border pt-3">
          {tool.projectNotes && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Project notes</span>
              <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{tool.projectNotes}</p>
            </div>
          )}
          {tool.workflowNotes && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Workflow</span>
              <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{tool.workflowNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {tool.assignedUser && (
          <span className="text-[10px] text-muted-foreground">{tool.assignedUser}</span>
        )}
        {tool.externalLink && (
          <a
            href={tool.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            Open <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
