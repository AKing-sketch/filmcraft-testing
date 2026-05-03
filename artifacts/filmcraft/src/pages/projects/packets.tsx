import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListProductionPackets, useCreateProductionPacket, useDeleteProductionPacket,
  getListProductionPacketsQueryKey
} from "@workspace/api-client-react";
import { FileArchive, Plus, Trash2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const PACKET_TYPES = [
  { value: "full", label: "Full Production Packet" },
  { value: "call-sheet", label: "Call Sheet" },
  { value: "script-breakdown", label: "Script Breakdown" },
  { value: "shot-list", label: "Shot List" },
  { value: "crew-list", label: "Crew List" },
  { value: "cast-list", label: "Cast List" },
  { value: "budget", label: "Budget Summary" }
];

export default function ProductionPackets() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: packets, isLoading } = useListProductionPackets(projectId, { query: { enabled: !!projectId } });
  const createPacket = useCreateProductionPacket();
  const deletePacket = useDeleteProductionPacket();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPacket, setNewPacket] = useState({ name: "", packetType: "full" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPacket.mutate({ projectId, data: newPacket }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewPacket({ name: "", packetType: "full" });
        queryClient.invalidateQueries({ queryKey: getListProductionPacketsQueryKey(projectId) });
      }
    });
  };

  const handleDelete = (packetId: number) => {
    if (confirm("Delete this packet?")) {
      deletePacket.mutate({ projectId, id: packetId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductionPacketsQueryKey(projectId) })
      });
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Production Packets</h1>
          <p className="text-muted-foreground mt-1">Generate and distribute documents.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Generate Packet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Document</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select value={newPacket.packetType} onValueChange={v => setNewPacket({...newPacket, packetType: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {PACKET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Name</label>
                <Input value={newPacket.name} onChange={e => setNewPacket({...newPacket, name: e.target.value})} required placeholder={`e.g. ${PACKET_TYPES.find(t=>t.value === newPacket.packetType)?.label || 'Document'} - ${format(new Date(), 'MMM d')}`} />
              </div>
              <Button type="submit" className="w-full" disabled={!newPacket.name || createPacket.isPending}>
                {createPacket.isPending ? "Generating..." : "Generate"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {packets?.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          <FileArchive className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-medium mb-1">No packets generated</h2>
          <p className="text-sm">Create printable documents to share with the cast and crew.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Document Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Generated On</th>
                <th className="px-6 py-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {packets?.map(packet => (
                <tr key={packet.id} className="hover:bg-accent/30 group">
                  <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded"><FileArchive className="w-4 h-4" /></div>
                    {packet.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-secondary px-2 py-1 rounded">
                      {packet.packetType.replace(/-/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(packet.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="icon" className="h-8 w-8" title="Print/View">
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(packet.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}