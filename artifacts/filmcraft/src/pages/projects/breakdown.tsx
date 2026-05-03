import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListScenes, useGetScriptBreakdown, useCreateScene, useDeleteScene,
  getListScenesQueryKey, getGetScriptBreakdownQueryKey
} from "@workspace/api-client-react";
import { Plus, List, Trash2, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function ScriptBreakdown() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: scenes, isLoading: scenesLoading } = useListScenes(projectId, { query: { enabled: !!projectId } });
  const { data: summary, isLoading: summaryLoading } = useGetScriptBreakdown(projectId, { query: { enabled: !!projectId } });
  
  const createScene = useCreateScene();
  const deleteScene = useDeleteScene();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newScene, setNewScene] = useState({
    sceneNumber: (scenes?.length || 0) + 1,
    heading: "",
    intExt: "INT",
    location: "",
    timeOfDay: "DAY",
    pages: "" as string | number
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createScene.mutate({ 
      projectId, 
      data: {
        ...newScene,
        heading: `${newScene.intExt}. ${newScene.location} - ${newScene.timeOfDay}`,
        pages: newScene.pages ? Number(newScene.pages) : null
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListScenesQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetScriptBreakdownQueryKey(projectId) });
        setNewScene({ 
          sceneNumber: (scenes?.length || 0) + 2, 
          heading: "", intExt: "INT", location: "", timeOfDay: "DAY", pages: "" 
        });
      }
    });
  };

  const handleDelete = (sceneId: number) => {
    if (confirm("Delete this scene?")) {
      deleteScene.mutate({ projectId, id: sceneId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScenesQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetScriptBreakdownQueryKey(projectId) });
        }
      });
    }
  };

  const getTimeIcon = (time: string) => {
    if (time === 'DAY') return <Sun className="w-3 h-3 text-amber-500" />;
    if (time === 'NIGHT') return <Moon className="w-3 h-3 text-blue-400" />;
    if (time === 'DAWN') return <Sunrise className="w-3 h-3 text-orange-400" />;
    if (time === 'DUSK') return <Sunset className="w-3 h-3 text-red-400" />;
    return null;
  };

  if (scenesLoading || summaryLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Script Breakdown</h1>
          <p className="text-muted-foreground mt-1">Organize scenes, locations, and requirements.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Scene</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Scene Breakdown</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scene #</label>
                  <Input type="number" value={newScene.sceneNumber} onChange={e => setNewScene({...newScene, sceneNumber: parseInt(e.target.value)})} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Pages (e.g. 1.125 for 1 1/8)</label>
                  <Input type="number" step="0.125" value={newScene.pages} onChange={e => setNewScene({...newScene, pages: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">INT/EXT</label>
                  <Select value={newScene.intExt} onValueChange={v => setNewScene({...newScene, intExt: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INT">INT</SelectItem>
                      <SelectItem value="EXT">EXT</SelectItem>
                      <SelectItem value="INT/EXT">INT/EXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={newScene.location} onChange={e => setNewScene({...newScene, location: e.target.value})} required placeholder="e.g. COFFEE SHOP" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time of Day</label>
                <Select value={newScene.timeOfDay} onValueChange={v => setNewScene({...newScene, timeOfDay: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">DAY</SelectItem>
                    <SelectItem value="NIGHT">NIGHT</SelectItem>
                    <SelectItem value="DAWN">DAWN</SelectItem>
                    <SelectItem value="DUSK">DUSK</SelectItem>
                    <SelectItem value="CONTINUOUS">CONTINUOUS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={!newScene.location || createScene.isPending}>Save Scene</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Bar */}
      {summary && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-6 bg-card border border-border rounded-lg p-2 text-center text-sm shadow-sm">
          <div className="p-2 bg-background rounded border border-border/50">
            <div className="font-bold text-primary">{summary.totalScenes}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Scenes</div>
          </div>
          <div className="p-2 bg-background rounded border border-border/50">
            <div className="font-bold text-foreground">{summary.totalPages}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Pages</div>
          </div>
          <div className="p-2 bg-background rounded border border-border/50">
            <div className="font-bold text-foreground">{summary.intCount} / {summary.extCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">INT / EXT</div>
          </div>
          <div className="p-2 bg-background rounded border border-border/50">
            <div className="font-bold text-foreground">{summary.dayCount} / {summary.nightCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">DAY / NIGHT</div>
          </div>
          <div className="p-2 bg-background rounded border border-border/50 hidden md:block">
            <div className="font-bold text-foreground">{summary.uniqueLocations.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Locations</div>
          </div>
          <div className="p-2 bg-background rounded border border-border/50 hidden md:block">
            <div className="font-bold text-foreground">{summary.uniqueCharacters.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Characters</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-16">Sc #</th>
                <th className="px-4 py-3 font-medium w-24">I/E</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium w-32">Time</th>
                <th className="px-4 py-3 font-medium w-24 text-right">Pgs</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scenes?.sort((a, b) => a.sceneNumber - b.sceneNumber).map((scene) => (
                <tr key={scene.id} className="hover:bg-accent/30 group">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{scene.sceneNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${scene.intExt === 'EXT' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                      {scene.intExt}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{scene.location?.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {getTimeIcon(scene.timeOfDay || '')}
                      <span>{scene.timeOfDay}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{scene.pages}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(scene.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {scenes?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <List className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No scenes added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}