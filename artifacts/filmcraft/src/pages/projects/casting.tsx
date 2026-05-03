import { useState } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useListCastingCalls, useCreateCastingCall, useDeleteCastingCall,
  useListCastMembers, useCreateCastMember, useDeleteCastMember,
  getListCastingCallsQueryKey, getListCastMembersQueryKey
} from "@workspace/api-client-react";
import { Plus, UsersRound, FileSpreadsheet, Trash2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function CastingHub() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Casting</h1>
        <p className="text-muted-foreground mt-1">Manage casting calls and finalize your cast list.</p>
      </div>

      <Tabs defaultValue="calls" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <UsersRound className="w-4 h-4" /> Casting Calls
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Cast List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="flex-1 overflow-auto m-0 p-0 outline-none h-full">
          <CastingCallsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="list" className="flex-1 m-0 p-0 outline-none h-full border border-border rounded-xl bg-card overflow-hidden">
          <CastListTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CastingCallsTab({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data: calls, isLoading } = useListCastingCalls(projectId, { query: { enabled: !!projectId } });
  const createCall = useCreateCastingCall();
  const deleteCall = useDeleteCastingCall();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newCall, setNewCall] = useState({
    characterName: "", role: "supporting", description: "", ageRange: "", auditionDate: "", auditionLocation: "", status: "open"
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCall.mutate({ projectId, data: newCall }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListCastingCallsQueryKey(projectId) });
        setNewCall({ characterName: "", role: "supporting", description: "", ageRange: "", auditionDate: "", auditionLocation: "", status: "open" });
      }
    });
  };

  const handleDelete = (callId: number) => {
    if (confirm("Delete this casting call?")) {
      deleteCall.mutate({ projectId, id: callId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCastingCallsQueryKey(projectId) })
      });
    }
  };

  const statusColors: Record<string, string> = {
    'open': 'bg-green-500/20 text-green-500 border-green-500/30',
    'in-review': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    'cast': 'bg-primary/20 text-primary border-primary/30',
    'closed': 'bg-muted text-muted-foreground border-border',
  };

  if (isLoading) return <div className="p-8 text-center">Loading casting calls...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4"/> New Call</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Casting Call</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Character Name</label>
                  <Input value={newCall.characterName} onChange={e => setNewCall({...newCall, characterName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age Range</label>
                  <Input value={newCall.ageRange} onChange={e => setNewCall({...newCall, ageRange: e.target.value})} placeholder="e.g. 20-30" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description & Requirements</label>
                <Textarea value={newCall.description} onChange={e => setNewCall({...newCall, description: e.target.value})} className="h-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audition Date</label>
                  <Input type="date" value={newCall.auditionDate} onChange={e => setNewCall({...newCall, auditionDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={newCall.auditionLocation} onChange={e => setNewCall({...newCall, auditionLocation: e.target.value})} placeholder="e.g. Studio A / Zoom" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!newCall.characterName || createCall.isPending}>Save Call</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {calls?.map(call => (
          <div key={call.id} className="bg-card border border-border rounded-xl p-5 group relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(call.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusColors[call.status || 'open']}`}>
                {call.status}
              </span>
              <span className="text-xs text-muted-foreground uppercase">{call.role}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{call.characterName}</h3>
            {call.ageRange && <p className="text-sm text-muted-foreground mb-3">Plays Age: {call.ageRange}</p>}
            
            <p className="text-sm line-clamp-3 mb-4 text-foreground/80">{call.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
              {call.auditionDate && (
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{call.auditionDate}</div>
              )}
              {call.auditionLocation && (
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{call.auditionLocation}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CastListTab({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data: cast, isLoading } = useListCastMembers(projectId, { query: { enabled: !!projectId } });
  const createCast = useCreateCastMember();
  const deleteCast = useDeleteCastMember();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newCast, setNewCast] = useState({
    actorName: "", characterName: "", contact: "", rate: "" as string | number
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCast.mutate({ 
      projectId, 
      data: { ...newCast, rate: newCast.rate ? Number(newCast.rate) : null } 
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListCastMembersQueryKey(projectId) });
        setNewCast({ actorName: "", characterName: "", contact: "", rate: "" });
      }
    });
  };

  const handleDelete = (castId: number) => {
    if (confirm("Remove cast member?")) {
      deleteCast.mutate({ projectId, id: castId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCastMembersQueryKey(projectId) })
      });
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading cast list...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
        <h2 className="font-semibold">Confirmed Cast</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4"/> Add Actor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Cast Member</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Actor Name</label>
                <Input value={newCast.actorName} onChange={e => setNewCast({...newCast, actorName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Character Name</label>
                <Input value={newCast.characterName} onChange={e => setNewCast({...newCast, characterName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact / Email</label>
                  <Input value={newCast.contact} onChange={e => setNewCast({...newCast, contact: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day Rate ($)</label>
                  <Input type="number" value={newCast.rate} onChange={e => setNewCast({...newCast, rate: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!newCast.actorName || createCast.isPending}>Save Cast Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Character</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cast?.map((member) => (
              <tr key={member.id} className="hover:bg-accent/30 group">
                <td className="px-4 py-3 font-bold text-foreground">{member.actorName}</td>
                <td className="px-4 py-3 font-medium text-primary">{member.characterName}</td>
                <td className="px-4 py-3 text-muted-foreground">{member.contact}</td>
                <td className="px-4 py-3">{member.rate ? `$${member.rate}` : '-'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {cast?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No cast members added</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}