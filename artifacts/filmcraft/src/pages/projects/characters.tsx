import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter,
  getListCharactersQueryKey
} from "@workspace/api-client-react";
import { Plus, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function CharactersBible() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: characters, isLoading } = useListCharacters(projectId, { query: { enabled: !!projectId } });
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newChar, setNewChar] = useState({
    name: "",
    role: "supporting",
    age: "",
    description: "",
    backstory: "",
    motivation: "",
    arc: ""
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCharacter.mutate({ projectId, data: newChar }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey(projectId) });
        setNewChar({ name: "", role: "supporting", age: "", description: "", backstory: "", motivation: "", arc: "" });
      }
    });
  };

  const handleDelete = (charId: number) => {
    if (confirm("Delete this character?")) {
      deleteCharacter.mutate({ projectId, id: charId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey(projectId) });
        }
      });
    }
  };

  const roleColors: Record<string, string> = {
    protagonist: "bg-primary/20 text-primary border-primary/30",
    antagonist: "bg-destructive/20 text-destructive-foreground border-destructive/30",
    supporting: "bg-secondary text-secondary-foreground border-border",
    minor: "bg-muted text-muted-foreground border-border"
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Character Bible</h1>
          <p className="text-muted-foreground mt-1">Develop the cast of your story.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> New Character</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Character</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
                  <Input value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newChar.role} onValueChange={v => setNewChar({...newChar, role: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protagonist">Protagonist</SelectItem>
                      <SelectItem value="antagonist">Antagonist</SelectItem>
                      <SelectItem value="supporting">Supporting</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input value={newChar.age} onChange={e => setNewChar({...newChar, age: e.target.value})} placeholder="e.g. Mid 30s" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newChar.description} onChange={e => setNewChar({...newChar, description: e.target.value})} className="h-20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivation / Arc</label>
                <Textarea value={newChar.motivation} onChange={e => setNewChar({...newChar, motivation: e.target.value})} className="h-20" />
              </div>
              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={!newChar.name || createCharacter.isPending}>Save Character</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {characters?.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-medium mb-1">No characters defined</h2>
          <p className="text-sm">Start building your cast of characters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {characters?.map(char => (
            <div key={char.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive bg-background/80 hover:bg-destructive hover:text-white"
                onClick={() => handleDelete(char.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl">{char.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${roleColors[char.role || 'supporting']}`}>
                      {char.role}
                    </span>
                    {char.age && <span className="text-xs text-muted-foreground">Age {char.age}</span>}
                  </div>
                </div>
              </div>
              
              {char.description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{char.description}</p>
                </div>
              )}
              
              {(char.motivation || char.arc) && (
                <div className="p-3 bg-secondary rounded-lg space-y-2 mt-4 text-sm">
                  {char.motivation && (
                    <div>
                      <span className="font-medium text-xs uppercase text-muted-foreground block mb-0.5">Motivation</span>
                      <span className="text-foreground/90">{char.motivation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}