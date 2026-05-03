import { useState } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useListBeats, useCreateBeat, useUpdateBeat, useDeleteBeat,
  useGetMindMap, useCreateMindMapNode, useUpdateMindMapNode, useDeleteMindMapNode,
  getListBeatsQueryKey, getGetMindMapQueryKey
} from "@workspace/api-client-react";
import { Plus, ListTodo, Network, Trash2 } from "lucide-react";
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
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Development Workspace</h1>
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
  const updateBeat = useUpdateBeat();
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
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBeatsQueryKey(projectId) });
        }
      });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading beats...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4"/> Add Beat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Story Beat</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={newBeat.title} onChange={e => setNewBeat({...newBeat, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={newBeat.beatType} onValueChange={v => setNewBeat({...newBeat, beatType: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
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
                  <Input type="number" value={newBeat.orderIndex} onChange={e => setNewBeat({...newBeat, orderIndex: parseInt(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Page</label>
                  <Input type="number" value={newBeat.pageTarget} onChange={e => setNewBeat({...newBeat, pageTarget: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newBeat.description} onChange={e => setNewBeat({...newBeat, description: e.target.value})} />
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
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-lg">{beat.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded border border-border">
                    {beat.beatType}
                  </span>
                  {beat.pageTarget && (
                    <span className="text-xs text-muted-foreground">pg. {beat.pageTarget}</span>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(beat.id)}>
                    <Trash2 className="w-3 h-3" />
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

function MindMap({ projectId }: { projectId: number }) {
  const { data: nodes, isLoading } = useGetMindMap(projectId, { query: { enabled: !!projectId } });
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading mind map...</div>;
  
  return (
    <div className="h-full w-full relative flex items-center justify-center bg-background/50">
      <div className="text-muted-foreground flex flex-col items-center gap-4">
        <Network className="w-12 h-12 opacity-20" />
        <p>Interactive mind map canvas</p>
        <span className="text-xs px-2 py-1 bg-secondary rounded border border-border">Coming soon to FilmCraft</span>
      </div>
    </div>
  );
}