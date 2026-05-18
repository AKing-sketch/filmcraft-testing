import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectId } from "@/context/pod-project";
import {
  LayoutGrid, Plus, Trash2, ExternalLink, Edit2, X, Check,
  Image, Film, Layers, GitBranch, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type BoardItem = { id: string; title: string; url?: string; notes?: string; tags?: string[] };
type Board = {
  id: number;
  projectId: number;
  boardType: string;
  title: string;
  description?: string | null;
  items?: string | null;
  position?: number | null;
  createdAt: string;
  updatedAt: string;
};

const BOARD_TYPES = [
  { value: "visual-direction", label: "Visual Direction", icon: Image, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  { value: "reference", label: "Reference Board", icon: BookOpen, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "mood", label: "Mood Board", icon: Layers, color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
  { value: "interaction-map", label: "Interaction Map", icon: GitBranch, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { value: "media", label: "Media Board", icon: Film, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "custom", label: "Custom", icon: LayoutGrid, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
];

function getBoardType(value: string) {
  return BOARD_TYPES.find((t) => t.value === value) ?? BOARD_TYPES[BOARD_TYPES.length - 1];
}

function parseItems(raw?: string | null): BoardItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function PodBoards() {
  const projectId = useProjectId();
  const qc = useQueryClient();

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ["pod-boards", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/pod-boards`);
      return r.json();
    },
    enabled: !!projectId,
  });

  const createBoard = useMutation({
    mutationFn: async (body: { boardType: string; title: string; description?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/pod-boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, items: "[]" }),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-boards", projectId] }),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/projects/${projectId}/pod-boards/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-boards", projectId] }),
  });

  const updateItems = useMutation({
    mutationFn: async ({ id, items }: { id: number; items: BoardItem[] }) => {
      const r = await fetch(`/api/projects/${projectId}/pod-boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: JSON.stringify(items) }),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pod-boards", projectId] }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState("visual-direction");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  function handleCreate() {
    if (!newTitle.trim()) return;
    createBoard.mutate({ boardType: newType, title: newTitle, description: newDesc });
    setNewTitle(""); setNewDesc(""); setNewType("visual-direction");
    setCreateOpen(false);
  }

  function handleAddItem() {
    if (!activeBoard || !newItemTitle.trim()) return;
    const items = parseItems(activeBoard.items);
    const newItem: BoardItem = {
      id: crypto.randomUUID(),
      title: newItemTitle,
      url: newItemUrl || undefined,
      notes: newItemNotes || undefined,
    };
    updateItems.mutate({ id: activeBoard.id, items: [...items, newItem] });
    setNewItemTitle(""); setNewItemUrl(""); setNewItemNotes("");
    setActiveBoard((prev) => prev ? { ...prev, items: JSON.stringify([...items, newItem]) } : null);
  }

  function handleRemoveItem(itemId: string) {
    if (!activeBoard) return;
    const items = parseItems(activeBoard.items).filter((i) => i.id !== itemId);
    updateItems.mutate({ id: activeBoard.id, items });
    setActiveBoard((prev) => prev ? { ...prev, items: JSON.stringify(items) } : null);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground mt-1">Visual direction, reference, and mood boards</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Board</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Board</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Board Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOARD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Y2K Texture Reference" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this board for?" rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!newTitle.trim()}>
                Create Board
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No boards yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first board — visual direction, Y2K reference, mood board, or interaction map.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => {
            const type = getBoardType(board.boardType);
            const Icon = type.icon;
            const items = parseItems(board.items);
            return (
              <div
                key={board.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all group cursor-pointer"
                onClick={() => setActiveBoard(board)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg border ${type.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBoard.mutate(board.id); }}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{board.title}</h3>
                  {board.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{board.description}</p>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${type.color}`}>{type.label}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board Detail Dialog */}
      <Dialog open={!!activeBoard} onOpenChange={(o) => !o && setActiveBoard(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          {activeBoard && (() => {
            const type = getBoardType(activeBoard.boardType);
            const Icon = type.icon;
            const items = parseItems(activeBoard.items);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${type.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <DialogTitle>{activeBoard.title}</DialogTitle>
                      {activeBoard.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{activeBoard.description}</p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No items yet — add references, links, or notes below.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              {item.url}
                            </a>
                          )}
                          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Item</p>
                  <Input
                    placeholder="Title or label"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                  />
                  <Input
                    placeholder="URL (optional)"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                  />
                  <Textarea
                    placeholder="Notes (optional)"
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleAddItem} disabled={!newItemTitle.trim()} className="w-full gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
