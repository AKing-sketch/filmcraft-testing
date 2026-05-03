import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListLightingDiagrams, useCreateLightingDiagram, useDeleteLightingDiagram, useUpdateLightingDiagram,
  getListLightingDiagramsQueryKey
} from "@workspace/api-client-react";
import { Plus, Lightbulb, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// A simplified implementation of a canvas-based lighting editor
// For a production app, this would use a proper canvas library like fabric.js or konva

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
}

function LightingEditor({ diagramId, initialData, onSave, onCancel }: { diagramId: number, initialData: string | null, onSave: (data: string) => void, onCancel: () => void }) {
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    try {
      return initialData ? JSON.parse(initialData) : [];
    } catch {
      return [];
    }
  });
  
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const addElement = (type: string) => {
    setElements([...elements, { id: Math.random().toString(), type, x: 200, y: 200 }]);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left - 20; // 20 is half width of element
    const y = e.clientY - bounds.top - 20;

    setElements(elements.map(el => 
      el.id === draggedItem ? { ...el, x, y } : el
    ));
    setDraggedItem(null);
  };

  const removeElement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setElements(elements.filter(el => el.id !== id));
  };

  const TOOLS = [
    { type: 'camera', label: 'Camera', color: 'bg-primary text-primary-foreground' },
    { type: 'subject', label: 'Subject', color: 'bg-foreground text-background' },
    { type: 'key-light', label: 'Key Light', color: 'bg-yellow-400 text-black' },
    { type: 'fill-light', label: 'Fill Light', color: 'bg-blue-400 text-black' },
    { type: 'backlight', label: 'Backlight', color: 'bg-white text-black' },
    { type: 'practical', label: 'Practical', color: 'bg-orange-400 text-black' },
    { type: 'window', label: 'Window', color: 'bg-cyan-200 text-black' },
  ];

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col">
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
        <h2 className="font-bold text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary"/> Lighting Planner</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(JSON.stringify(elements))} className="gap-2"><Save className="w-4 h-4"/> Save Layout</Button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-48 bg-card border-r border-border p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="text-xs uppercase font-bold text-muted-foreground mb-2 tracking-wider">Elements</div>
          {TOOLS.map(tool => (
            <div 
              key={tool.type} 
              className={`p-3 rounded border border-border/50 text-sm font-medium cursor-pointer text-center ${tool.color} shadow-sm hover:scale-105 transition-transform`}
              onClick={() => addElement(tool.type)}
            >
              {tool.label}
            </div>
          ))}
          <div className="mt-8 text-xs text-muted-foreground p-3 bg-secondary/50 rounded">
            Click an element above to add it. Drag elements to position them.
          </div>
        </div>
        
        {/* Canvas */}
        <div 
          className="flex-1 relative bg-secondary/20 overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {elements.map(el => {
            const tool = TOOLS.find(t => t.type === el.type);
            return (
              <div
                key={el.id}
                draggable
                onDragStart={(e) => handleDragStart(e, el.id)}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold cursor-grab active:cursor-grabbing border-2 border-border shadow-md ${tool?.color}`}
                style={{ left: el.x, top: el.y }}
              >
                {el.type.substring(0, 3).toUpperCase()}
                <button 
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center hidden group-hover:flex"
                  onClick={(e) => removeElement(el.id, e)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LightingPlanner() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: diagrams, isLoading } = useListLightingDiagrams(projectId, { query: { enabled: !!projectId } });
  const createDiagram = useCreateLightingDiagram();
  const updateDiagram = useUpdateLightingDiagram();
  const deleteDiagram = useDeleteLightingDiagram();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDiagram.mutate({ projectId, data: { name: newName } }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewName("");
        queryClient.invalidateQueries({ queryKey: getListLightingDiagramsQueryKey(projectId) });
      }
    });
  };

  const handleDelete = (diagramId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this diagram?")) {
      deleteDiagram.mutate({ projectId, id: diagramId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLightingDiagramsQueryKey(projectId) })
      });
    }
  };

  const handleSaveDiagram = (diagramId: number, canvasData: string) => {
    updateDiagram.mutate({ id: diagramId, data: { canvasData } }, {
      onSuccess: () => {
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: getListLightingDiagramsQueryKey(projectId) });
        toast({ title: "Diagram saved" });
      }
    });
  };

  const activeDiagram = diagrams?.find(d => d.id === editingId);

  if (editingId && activeDiagram) {
    return (
      <LightingEditor 
        diagramId={activeDiagram.id} 
        initialData={activeDiagram.canvasData || null}
        onSave={(data) => handleSaveDiagram(activeDiagram.id, data)}
        onCancel={() => setEditingId(null)}
      />
    );
  }

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lighting Planner</h1>
          <p className="text-muted-foreground mt-1">Design overhead lighting and camera setups.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> New Diagram</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Lighting Diagram</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Diagram Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Sc 5 - Coffee Shop Master" />
              </div>
              <Button type="submit" className="w-full" disabled={!newName || createDiagram.isPending}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {diagrams?.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-medium mb-1">No diagrams yet</h2>
          <p className="text-sm">Create a diagram to start planning your setups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diagrams?.map(diagram => (
            <div 
              key={diagram.id} 
              className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
              onClick={() => setEditingId(diagram.id)}
            >
              <div className="h-40 bg-secondary/30 relative flex items-center justify-center border-b border-border overflow-hidden" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {diagram.canvasData && JSON.parse(diagram.canvasData).length > 0 ? (
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{JSON.parse(diagram.canvasData).length} Elements</div>
                ) : (
                  <div className="text-xs text-muted-foreground opacity-50">Empty Canvas</div>
                )}
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <Button variant="secondary" size="sm">Open Editor</Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-semibold">{diagram.name}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => handleDelete(diagram.id, e)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}