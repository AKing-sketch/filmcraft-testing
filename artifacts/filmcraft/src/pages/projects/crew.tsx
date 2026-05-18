import { useState } from "react";
import { useParams } from "wouter";
import { useProjectId } from "@/context/pod-project";
import { 
  useListCrewMembers, useCreateCrewMember, useDeleteCrewMember,
  getListCrewMembersQueryKey
} from "@workspace/api-client-react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

const DEPARTMENTS = [
  "direction", "camera", "lighting", "sound", "art", "wardrobe", "makeup", "production", "post"
];

export default function CrewList() {
  const projectId = useProjectId();
  const queryClient = useQueryClient();
  
  const { data: crew, isLoading } = useListCrewMembers(projectId, { query: { enabled: !!projectId } });
  const createCrew = useCreateCrewMember();
  const deleteCrew = useDeleteCrewMember();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newCrew, setNewCrew] = useState({
    name: "", department: "production", title: "", contact: "", rate: "" as string | number
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCrew.mutate({ 
      projectId, 
      data: { ...newCrew, rate: newCrew.rate ? Number(newCrew.rate) : null } 
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListCrewMembersQueryKey(projectId) });
        setNewCrew({ name: "", department: "production", title: "", contact: "", rate: "" });
      }
    });
  };

  const handleDelete = (crewId: number) => {
    if (confirm("Remove crew member?")) {
      deleteCrew.mutate({ projectId, id: crewId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCrewMembersQueryKey(projectId) })
      });
    }
  };

  // Group crew by department
  const groupedCrew = crew?.reduce((acc, member) => {
    const dept = member.department || 'other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, typeof crew>);

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Crew List</h1>
          <p className="text-muted-foreground mt-1">Manage production departments and staff.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Crew Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Crew Member</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={newCrew.name} onChange={e => setNewCrew({...newCrew, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={newCrew.department} onValueChange={v => setNewCrew({...newCrew, department: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input value={newCrew.title} onChange={e => setNewCrew({...newCrew, title: e.target.value})} placeholder="e.g. Director of Photography" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Info</label>
                  <Input value={newCrew.contact} onChange={e => setNewCrew({...newCrew, contact: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day Rate ($)</label>
                  <Input type="number" value={newCrew.rate} onChange={e => setNewCrew({...newCrew, rate: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!newCrew.name || createCrew.isPending}>Save Crew Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto space-y-8">
        {!groupedCrew || Object.keys(groupedCrew).length === 0 ? (
          <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h2 className="text-lg font-medium mb-1">No crew added</h2>
            <p className="text-sm">Start building your production team.</p>
          </div>
        ) : (
          DEPARTMENTS.map(dept => {
            const deptCrew = groupedCrew[dept];
            if (!deptCrew || deptCrew.length === 0) return null;

            return (
              <div key={dept} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/50 px-4 py-2 border-b border-border font-bold uppercase tracking-wider text-xs text-foreground/80 flex items-center justify-between">
                  <span>{dept} Department</span>
                  <span className="text-[10px] bg-background px-2 py-0.5 rounded border border-border">{deptCrew.length}</span>
                </div>
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-border">
                    {deptCrew.map(member => (
                      <tr key={member.id} className="hover:bg-accent/30 group">
                        <td className="px-4 py-3 font-bold text-foreground w-1/4">{member.name}</td>
                        <td className="px-4 py-3 font-medium text-primary w-1/4">{member.title}</td>
                        <td className="px-4 py-3 text-muted-foreground w-1/4">{member.contact}</td>
                        <td className="px-4 py-3 w-32">{member.rate ? `$${member.rate}/day` : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}