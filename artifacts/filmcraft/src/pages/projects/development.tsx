import { useState, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListBeats, useCreateBeat, useDeleteBeat,
  useGetMindMap, useCreateMindMapNode, useUpdateMindMapNode, useDeleteMindMapNode,
  getListBeatsQueryKey, getGetMindMapQueryKey
} from "@workspace/api-client-react";
import { Plus, ListTodo, Network, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function DevelopmentWorkspace() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Development Workspace</h1>
          <p className="text-muted-foreground mt-1">Structure your narrative and ideas.</p>
        </div>
      </div>

      <Tabs defaultValue="beats" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="beats" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" /> Beat Sheet
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="flex items-center gap-2">
            <Network className="w-4 h-4" /> Mind Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beats" className="flex-1 overflow-auto m-0 p-0 outline-none h-full">
          <BeatSheet projectId={projectId} />
        </TabsContent>

        <TabsContent value="mindmap" className="flex-1 m-0 p-0 outline-none h-full border border-border rounded-xl bg-card overflow-hidden">
          <MindMap projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BeatSheet({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data: beats, isLoading } = useListBeats(projectId, { query: { enabled: !!projectId } });
  const createBeat = useCreateBeat();
  const deleteBeat = useDeleteBeat();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newBeat, setNewBeat] = useState({
    title: "",
    description: "",
    beatType: "custom",
    orderIndex: (beats?.length || 0) + 1,
    pageTarget: "" as string | number,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBeat.mutate({
      projectId,
      data: {
        ...newBeat,
        pageTarget: newBeat.pageTarget ? Number(newBeat.pageTarget) : null
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListBeatsQueryKey(projectId) });
        setNewBeat({ title: "", description: "", beatType: "custom", orderIndex: (beats?.length || 0) + 2, pageTarget: "" });
      }
    });
  };

  const handleDelete = (beatId: number) => {
    if (confirm("Delete this beat?")) {
      deleteBeat.mutate({ projectId, id: beatId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBeatsQueryKey(projectId) })
      });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading beats...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Beat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Story Beat</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={newBeat.title} onChange={e => setNewBeat({ ...newBeat, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={newBeat.beatType} onValueChange={v => setNewBeat({ ...newBeat, beatType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening-image">Opening Image</SelectItem>
                    <SelectItem value="theme">Theme Stated</SelectItem>
                    <SelectItem value="catalyst">Catalyst</SelectItem>
                    <SelectItem value="midpoint">Midpoint</SelectItem>
                    <SelectItem value="all-is-lost">All is Lost</SelectItem>
                    <SelectItem value="finale">Finale</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Index</label>
                  <Input type="number" value={newBeat.orderIndex} onChange={e => setNewBeat({ ...newBeat, orderIndex: parseInt(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Page</label>
                  <Input type="number" value={newBeat.pageTarget} onChange={e => setNewBeat({ ...newBeat, pageTarget: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newBeat.description} onChange={e => setNewBeat({ ...newBeat, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createBeat.isPending}>Save Beat</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {beats?.sort((a, b) => a.orderIndex - b.orderIndex).map(beat => (
          <div key={beat.id} className="bg-card border border-border p-4 rounded-xl flex gap-4 group">
            <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-mono font-bold">
              {beat.orderIndex}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-lg">{beat.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded border border-border hidden sm:inline">
                    {beat.beatType}
                  </span>
                  {beat.pageTarget && (
                    <span className="text-xs text-muted-foreground">pg. {beat.pageTarget}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive hover:text-white flex-shrink-0"
                    onClick={() => handleDelete(beat.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {beat.description && <p className="text-muted-foreground text-sm leading-relaxed">{beat.description}</p>}
            </div>
          </div>
        ))}
        {beats?.length === 0 && (
          <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground">
            No beats yet. Map out your story structure.
          </div>
        )}
      </div>
    </div>
  );
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  theme:     { bg: "bg-primary/20",      border: "border-primary/50",      text: "text-primary" },
  character: { bg: "bg-blue-500/20",     border: "border-blue-500/50",     text: "text-blue-400" },
  location:  { bg: "bg-green-500/20",    border: "border-green-500/50",    text: "text-green-400" },
  conflict:  { bg: "bg-destructive/20",  border: "border-destructive/50",  text: "text-destructive" },
  idea:      { bg: "bg-yellow-500/20",   border: "border-yellow-500/50",   text: "text-yellow-400" },
  custom:    { bg: "bg-secondary",       border: "border-border",          text: "text-foreground" },
};

interface DragState {
  nodeId: number;
  startMouseX: number;
  startMouseY: number;
  startNodeX: number;
  startNodeY: number;
}

function MindMap({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data: nodes, isLoading } = useGetMindMap(projectId, { query: { enabled: !!projectId } });
  const createNode = useCreateMindMapNode();
  const updateNode = useUpdateMindMapNode();
  const deleteNode = useDeleteMindMapNode();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNode, setNewNode] = useState({ label: "", nodeType: "idea", notes: "" });
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const dragRef = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getPos = useCallback((node: { id: number; positionX?: number | null; positionY?: number | null }) => {
    if (positions[node.id]) return positions[node.id];
    return { x: node.positionX ?? 80, y: node.positionY ?? 80 };
  }, [positions]);

  const onPointerDown = (e: React.PointerEvent, nodeId: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const node = nodes?.find(n => n.id === nodeId);
    if (!node) return;
    const pos = getPos(node);
    dragRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: pos.x,
      startNodeY: pos.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { nodeId, startMouseX, startMouseY, startNodeX, startNodeY } = dragRef.current;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    setPositions(prev => ({ ...prev, [nodeId]: { x: Math.max(0, startNodeX + dx), y: Math.max(0, startNodeY + dy) } }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { nodeId } = dragRef.current;
    const finalPos = positions[nodeId];
    dragRef.current = null;
    if (finalPos) {
      updateNode.mutate(
        { projectId, id: nodeId, data: { positionX: Math.round(finalPos.x), positionY: Math.round(finalPos.y) } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMindMapQueryKey(projectId) }) }
      );
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const canvasW = canvasRef.current?.clientWidth ?? 500;
    const canvasH = canvasRef.current?.clientHeight ?? 400;
    createNode.mutate(
      {
        projectId,
        data: {
          ...newNode,
          positionX: Math.round(canvasW / 2 - 60 + (Math.random() - 0.5) * 200),
          positionY: Math.round(canvasH / 2 - 30 + (Math.random() - 0.5) * 150),
          connections: "[]",
        },
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetMindMapQueryKey(projectId) });
          setNewNode({ label: "", nodeType: "idea", notes: "" });
        },
      }
    );
  };

  const handleDelete = (nodeId: number) => {
    deleteNode.mutate(
      { projectId, id: nodeId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMindMapQueryKey(projectId) }) }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading mind map...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/20 flex-shrink-0">
        <p className="text-xs text-muted-foreground">Drag nodes to rearrange. Changes save automatically.</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-7 text-xs"><Plus className="w-3.5 h-3.5" /> Add Node</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Mind Map Node</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input value={newNode.label} onChange={e => setNewNode({ ...newNode, label: e.target.value })} required placeholder="e.g. The Signal" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={newNode.nodeType} onValueChange={v => setNewNode({ ...newNode, nodeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theme">Theme</SelectItem>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="conflict">Conflict</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea value={newNode.notes} onChange={e => setNewNode({ ...newNode, notes: e.target.value })} className="h-16" />
              </div>
              <Button type="submit" className="w-full" disabled={!newNode.label || createNode.isPending}>Add Node</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto select-none bg-[radial-gradient(circle,_hsl(var(--border))_1px,_transparent_1px)] bg-[size:24px_24px]"
        style={{ minHeight: 400 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {nodes?.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
            <div className="text-center">
              <Network className="w-10 h-10 opacity-20 mx-auto mb-2" />
              <p className="text-sm">Add your first node to get started</p>
            </div>
          </div>
        )}

        {nodes?.map(node => {
          const pos = getPos(node);
          const colors = NODE_COLORS[node.nodeType || "custom"] ?? NODE_COLORS.custom;
          return (
            <div
              key={node.id}
              className={`absolute cursor-grab active:cursor-grabbing rounded-xl border-2 px-3 py-2 shadow-lg ${colors.bg} ${colors.border} group`}
              style={{ left: pos.x, top: pos.y, minWidth: 120, maxWidth: 180, touchAction: "none" }}
              onPointerDown={e => onPointerDown(e, node.id)}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className={`font-semibold text-sm leading-tight ${colors.text}`}>{node.label}</p>
                  {node.nodeType && node.nodeType !== "custom" && (
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{node.nodeType}</span>
                  )}
                  {node.notes && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">{node.notes}</p>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-destructive flex-shrink-0 transition-opacity"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => handleDelete(node.id)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
