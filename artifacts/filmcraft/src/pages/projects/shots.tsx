import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListShots, useCreateShot, useDeleteShot,
  getListShotsQueryKey
} from "@workspace/api-client-react";
import { Plus, Video, Trash2, Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

const SHOT_TYPES = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "AERIAL", "INSERT"];
const CAMERA_MOVEMENTS = ["static", "pan", "tilt", "dolly", "crane", "handheld", "steadicam", "zoom"];

export default function ShotList() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: shots, isLoading } = useListShots(projectId, { query: { enabled: !!projectId } });
  const createShot = useCreateShot();
  const deleteShot = useDeleteShot();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newShot, setNewShot] = useState({
    shotNumber: "", description: "", shotType: "MS", cameraMovement: "static", lens: "", status: "planned"
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createShot.mutate({ projectId, data: newShot }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListShotsQueryKey(projectId) });
        setNewShot({ shotNumber: "", description: "", shotType: "MS", cameraMovement: "static", lens: "", status: "planned" });
      }
    });
  };

  const handleDelete = (shotId: number) => {
    if (confirm("Delete this shot?")) {
      deleteShot.mutate({ projectId, id: shotId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShotsQueryKey(projectId) })
      });
    }
  };

  const statusColors: Record<string, string> = {
    'planned': 'bg-secondary text-secondary-foreground border-border',
    'shot': 'bg-primary/20 text-primary border-primary/30',
    'approved': 'bg-green-500/20 text-green-500 border-green-500/30',
    'cut': 'bg-destructive/20 text-destructive-foreground border-destructive/30',
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shot List</h1>
          <p className="text-muted-foreground mt-1">Plan and track your camera setups.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Shot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Shot</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shot #</label>
                  <Input value={newShot.shotNumber} onChange={e => setNewShot({...newShot, shotNumber: e.target.value})} required placeholder="e.g. 1A" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newShot.status} onValueChange={v => setNewShot({...newShot, status: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="shot">Shot</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="cut">Cut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={newShot.description} onChange={e => setNewShot({...newShot, description: e.target.value})} required placeholder="Action taking place..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shot Type</label>
                  <Select value={newShot.shotType} onValueChange={v => setNewShot({...newShot, shotType: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {SHOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Movement</label>
                  <Select value={newShot.cameraMovement} onValueChange={v => setNewShot({...newShot, cameraMovement: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {CAMERA_MOVEMENTS.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lens</label>
                  <Input value={newShot.lens} onChange={e => setNewShot({...newShot, lens: e.target.value})} placeholder="e.g. 35mm" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!newShot.shotNumber || createShot.isPending}>Save Shot</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto border border-border rounded-xl bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium w-20">Shot</th>
              <th className="px-4 py-3 font-medium w-24">Type</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium w-32">Movement</th>
              <th className="px-4 py-3 font-medium w-24">Lens</th>
              <th className="px-4 py-3 font-medium w-24">Status</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shots?.map(shot => (
              <tr key={shot.id} className="hover:bg-accent/30 group">
                <td className="px-4 py-3 font-mono font-bold text-foreground">{shot.shotNumber}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {shot.shotType}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{shot.description}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize flex items-center gap-1.5 mt-1">
                  <Camera className="w-3.5 h-3.5" />
                  {shot.cameraMovement}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{shot.lens || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusColors[shot.status || 'planned']}`}>
                    {shot.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(shot.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {shots?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  No shots planned yet. Create your first shot setup.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}