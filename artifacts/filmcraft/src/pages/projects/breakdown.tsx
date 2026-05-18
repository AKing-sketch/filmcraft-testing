import { useState } from "react";
import { useParams } from "wouter";
import { useProjectId } from "@/context/pod-project";
import {
  useListScenes, useGetScriptBreakdown, useCreateScene, useDeleteScene,
  getListScenesQueryKey, getGetScriptBreakdownQueryKey
} from "@workspace/api-client-react";
import { Plus, List, Trash2, Sun, Moon, Sunrise, Sunset, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function ScriptBreakdown() {
  const projectId = useProjectId();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"reader" | "ad">("reader");

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
        setNewScene({ sceneNumber: (scenes?.length || 0) + 2, heading: "", intExt: "INT", location: "", timeOfDay: "DAY", pages: "" });
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
    if (time === "DAY") return <Sun className="w-3 h-3 text-amber-500" />;
    if (time === "NIGHT") return <Moon className="w-3 h-3 text-blue-400" />;
    if (time === "DAWN") return <Sunrise className="w-3 h-3 text-orange-400" />;
    if (time === "DUSK") return <Sunset className="w-3 h-3 text-red-400" />;
    return null;
  };

  if (scenesLoading || summaryLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const sorted = (scenes ?? []).slice().sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Collect unique character names across all scenes for the legend
  const allChars = Array.from(
    new Set(
      sorted
        .flatMap((s) => (Array.isArray(s.characters) ? s.characters : []))
        .filter(Boolean)
    )
  );
  const CHAR_COLORS = [
    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "bg-primary/20 text-primary border-primary/30",
    "bg-violet-500/20 text-violet-300 border-violet-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ];
  const charColorMap: Record<string, string> = {};
  allChars.forEach((c, i) => { charColorMap[c] = CHAR_COLORS[i % CHAR_COLORS.length]; });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Breakdown</h1>
          <p className="text-muted-foreground mt-1">Scene reader and AD breakdown sheet.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Scene</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Scene</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scene #</label>
                  <Input type="number" value={newScene.sceneNumber} onChange={e => setNewScene({ ...newScene, sceneNumber: parseInt(e.target.value) })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Pages (e.g. 1.125)</label>
                  <Input type="number" step="0.125" value={newScene.pages} onChange={e => setNewScene({ ...newScene, pages: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">INT/EXT</label>
                  <Select value={newScene.intExt} onValueChange={v => setNewScene({ ...newScene, intExt: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INT">INT</SelectItem>
                      <SelectItem value="EXT">EXT</SelectItem>
                      <SelectItem value="INT/EXT">INT/EXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={newScene.location} onChange={e => setNewScene({ ...newScene, location: e.target.value })} required placeholder="e.g. COFFEE SHOP" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time of Day</label>
                <Select value={newScene.timeOfDay} onValueChange={v => setNewScene({ ...newScene, timeOfDay: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4 bg-card border border-border rounded-lg p-2 text-center text-sm shadow-sm">
          {[
            { value: summary.totalScenes, label: "Scenes" },
            { value: summary.totalPages, label: "Pages" },
            { value: `${summary.intCount}/${summary.extCount}`, label: "INT/EXT" },
            { value: `${summary.dayCount}/${summary.nightCount}`, label: "DAY/NIGHT" },
            { value: summary.uniqueLocations.length, label: "Locations", hidden: true },
            { value: summary.uniqueCharacters.length, label: "Characters", hidden: true },
          ].map((s) => (
            <div key={s.label} className={`p-2 bg-background rounded border border-border/50${s.hidden ? " hidden md:block" : ""}`}>
              <div className="font-bold text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-secondary/30 rounded-lg p-1 self-start">
        <button
          onClick={() => setActiveTab("reader")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "reader" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          <List className="w-4 h-4" /> Scene Reader
        </button>
        <button
          onClick={() => setActiveTab("ad")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "ad" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Table2 className="w-4 h-4" /> AD Breakdown Sheet
        </button>
      </div>

      {/* ── Scene Reader ── */}
      {activeTab === "reader" && (
        <div className="border border-border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium w-16">Sc #</th>
                  <th className="px-4 py-3 font-medium w-24">I/E</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium w-32">Time</th>
                  <th className="px-4 py-3 font-medium w-20 text-right">Pgs</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((scene) => (
                  <SceneRow key={scene.id} scene={scene} charColorMap={charColorMap} getTimeIcon={getTimeIcon} onDelete={() => handleDelete(scene.id)} />
                ))}
                {sorted.length === 0 && (
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
      )}

      {/* ── AD Breakdown Sheet ── */}
      {activeTab === "ad" && (
        <div className="flex-1 flex flex-col gap-3">
          {/* Legend */}
          {allChars.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Legend:</span>
              {allChars.map((char) => (
                <span key={char} className={`px-2 py-0.5 rounded border font-medium text-[11px] ${charColorMap[char]}`}>{char}</span>
              ))}
            </div>
          )}
          <div className="border border-border rounded-xl bg-card overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="text-xs text-left whitespace-nowrap">
                <thead className="bg-secondary/50 border-b border-border sticky top-0 z-10">
                  <tr>
                    {["Sc #", "I/E", "TOD", "Pgs", "Location", "Characters", "Props", "Wardrobe", "Makeup / FX / VFX", "Synopsis"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0 min-w-[80px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((scene) => {
                    const chars = Array.isArray(scene.characters) ? scene.characters : [];
                    return (
                      <tr key={scene.id} className="hover:bg-accent/20 align-top">
                        <td className="px-3 py-2.5 font-mono font-bold text-foreground border-r border-border">{scene.sceneNumber}</td>
                        <td className="px-3 py-2.5 border-r border-border">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scene.intExt === "EXT" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                            {scene.intExt}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border">
                          <div className="flex items-center gap-1">
                            {getTimeIcon(scene.timeOfDay ?? "")}
                            <span className="text-[11px]">{scene.timeOfDay}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground border-r border-border">{scene.pages ?? "—"}</td>
                        <td className="px-3 py-2.5 font-semibold text-foreground border-r border-border min-w-[140px] max-w-[200px] whitespace-normal">
                          {scene.location?.toUpperCase()}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border min-w-[140px]">
                          <div className="flex flex-wrap gap-1">
                            {chars.map((c) => (
                              <span key={c} className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${charColorMap[c] ?? ""}`}>{c}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border min-w-[120px] max-w-[180px] whitespace-normal text-foreground/80">{(Array.isArray(scene.props) ? scene.props : []).join(", ") || "—"}</td>
                        <td className="px-3 py-2.5 border-r border-border min-w-[120px] max-w-[180px] whitespace-normal text-foreground/80">{(Array.isArray(scene.costumes) ? scene.costumes : []).join(", ") || "—"}</td>
                        <td className="px-3 py-2.5 border-r border-border min-w-[140px] max-w-[200px] whitespace-normal text-foreground/80">{(Array.isArray(scene.makeupFx) ? scene.makeupFx : []).join(", ") || "—"}</td>
                        <td className="px-3 py-2.5 min-w-[200px] max-w-[320px] whitespace-normal text-foreground/80">{scene.synopsis || "—"}</td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                        No scenes added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scene Reader Row (expandable) ────────────────────────────────────────────
function SceneRow({
  scene,
  charColorMap,
  getTimeIcon,
  onDelete,
}: {
  scene: { id: number; sceneNumber: number; intExt?: string | null; location?: string | null; timeOfDay?: string | null; pages?: number | null; synopsis?: string | null; characters?: string | null; props?: string | null; costumes?: string | null; makeupFx?: string | null; notes?: string | null };
  charColorMap: Record<string, string>;
  getTimeIcon: (t: string) => React.ReactNode;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const chars = Array.isArray(scene.characters) ? scene.characters : [];
  const hasDetail = scene.synopsis || scene.characters || scene.props || scene.costumes || scene.makeupFx || scene.notes;

  return (
    <>
      <tr
        className="hover:bg-accent/30 group cursor-pointer"
        onClick={() => hasDetail && setOpen((o) => !o)}
      >
        <td className="px-4 py-3 font-mono font-bold text-foreground">{scene.sceneNumber}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${scene.intExt === "EXT" ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary"}`}>
            {scene.intExt}
          </span>
        </td>
        <td className="px-4 py-3 font-semibold">{scene.location?.toUpperCase()}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {getTimeIcon(scene.timeOfDay || "")}
            <span>{scene.timeOfDay}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{scene.pages}</td>
        <td className="px-4 py-3 text-right">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive hover:text-white" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </td>
      </tr>
      {open && hasDetail && (
        <tr className="bg-secondary/20 border-b border-border">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {scene.synopsis && (
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Synopsis</div>
                  <p className="text-foreground/90 leading-relaxed">{scene.synopsis}</p>
                </div>
              )}
              {chars.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Characters</div>
                  <div className="flex flex-wrap gap-1.5">
                    {chars.map((c) => (
                      <span key={c} className={`px-2 py-0.5 rounded border text-[11px] font-medium ${charColorMap[c] ?? ""}`}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(scene.props) && scene.props.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Props</div>
                  <p className="text-foreground/80">{scene.props.join(", ")}</p>
                </div>
              )}
              {Array.isArray(scene.costumes) && scene.costumes.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Wardrobe</div>
                  <p className="text-foreground/80">{scene.costumes.join(", ")}</p>
                </div>
              )}
              {Array.isArray(scene.makeupFx) && scene.makeupFx.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Makeup / FX / VFX</div>
                  <p className="text-foreground/80">{scene.makeupFx.join(", ")}</p>
                </div>
              )}
              {scene.notes && (
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Production Notes</div>
                  <p className="text-foreground/80 whitespace-pre-wrap">{scene.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
