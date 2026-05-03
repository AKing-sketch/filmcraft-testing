import { useState } from "react";
import { useParams } from "wouter";
import {
  useListDistributionEntries, useCreateDistributionEntry,
  useUpdateDistributionEntry, useDeleteDistributionEntry,
  getListDistributionEntriesQueryKey
} from "@workspace/api-client-react";
import { Plus, Trash2, ExternalLink, Globe, Award, Tv, Building, Users, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

const ENTRY_TYPES = [
  { value: "festival",     label: "Film Festival",     icon: Award },
  { value: "distributor",  label: "Distributor",        icon: Building },
  { value: "platform",     label: "Streaming Platform", icon: Tv },
  { value: "broadcaster",  label: "Broadcaster",        icon: Globe },
  { value: "sales-agent",  label: "Sales Agent",        icon: Users },
  { value: "other",        label: "Other",              icon: MoreHorizontal },
];

const STATUSES = [
  { value: "considering", label: "Considering",  color: "bg-secondary text-secondary-foreground border-border" },
  { value: "submitted",   label: "Submitted",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "screened",    label: "Screened",     color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "accepted",    label: "Accepted",     color: "bg-green-500/20 text-green-500 border-green-500/30" },
  { value: "deal-made",   label: "Deal Made",    color: "bg-primary/20 text-primary border-primary/30" },
  { value: "rejected",    label: "Rejected",     color: "bg-destructive/20 text-destructive border-destructive/30" },
  { value: "withdrawn",   label: "Withdrawn",    color: "bg-muted text-muted-foreground border-border" },
];

function statusStyle(status: string) {
  return STATUSES.find(s => s.value === status)?.color ?? "bg-secondary text-secondary-foreground border-border";
}

function typeIcon(type: string) {
  const Icon = ENTRY_TYPES.find(t => t.value === type)?.icon ?? MoreHorizontal;
  return <Icon className="w-4 h-4" />;
}

export default function DistributionTracker() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useListDistributionEntries(projectId, {
    query: { enabled: !!projectId }
  });
  const createEntry  = useCreateDistributionEntry();
  const updateEntry  = useUpdateDistributionEntry();
  const deleteEntry  = useDeleteDistributionEntry();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({
    type: "festival", name: "", status: "considering",
    submissionDate: "", responseDate: "", notes: "", url: "",
    fee: "" as string | number,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate({
      projectId,
      data: { ...newEntry, fee: newEntry.fee ? Number(newEntry.fee) : null },
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) });
        setNewEntry({ type: "festival", name: "", status: "considering", submissionDate: "", responseDate: "", notes: "", url: "", fee: "" });
      }
    });
  };

  const handleStatusChange = (entryId: number, status: string) => {
    updateEntry.mutate({ projectId, id: entryId, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) })
    });
  };

  const handleDelete = (entryId: number) => {
    if (confirm("Remove this entry?")) {
      deleteEntry.mutate({ projectId, id: entryId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDistributionEntriesQueryKey(projectId) })
      });
    }
  };

  // Group by type
  const grouped = ENTRY_TYPES.map(t => ({
    ...t,
    items: entries?.filter(e => e.type === t.value) ?? [],
  })).filter(g => g.items.length > 0);

  // Summary stats
  const total     = entries?.length ?? 0;
  const submitted = entries?.filter(e => ["submitted","screened","accepted","deal-made"].includes(e.status)).length ?? 0;
  const accepted  = entries?.filter(e => ["accepted","deal-made"].includes(e.status)).length ?? 0;

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Distribution</h1>
          <p className="text-muted-foreground mt-1">Track festivals, platforms, and distribution deals.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Distribution Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newEntry.type} onValueChange={v => setNewEntry({ ...newEntry, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newEntry.status} onValueChange={v => setNewEntry({ ...newEntry, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
                <Input value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} required placeholder="e.g. Sundance Film Festival" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Submission Date</label>
                  <Input type="date" value={newEntry.submissionDate} onChange={e => setNewEntry({ ...newEntry, submissionDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Date</label>
                  <Input type="date" value={newEntry.responseDate} onChange={e => setNewEntry({ ...newEntry, responseDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL</label>
                  <Input value={newEntry.url} onChange={e => setNewEntry({ ...newEntry, url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Submission Fee ($)</label>
                  <Input type="number" value={newEntry.fee} onChange={e => setNewEntry({ ...newEntry, fee: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })} className="h-20" />
              </div>
              <Button type="submit" className="w-full" disabled={!newEntry.name || createEntry.isPending}>Save Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{submitted}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Submitted</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{accepted}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Accepted</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-medium mb-1">No distribution entries yet</h2>
          <p className="text-sm max-w-sm mx-auto">Track festival submissions, distribution deals, streaming platforms, and broadcasters.</p>
        </div>
      )}

      {/* Grouped cards */}
      <div className="space-y-8">
        {grouped.map(group => (
          <div key={group.value}>
            <div className="flex items-center gap-2 mb-3">
              <group.icon className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-foreground/70">{group.label}</h2>
              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded border border-border">{group.items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.items.map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">{entry.name}</h3>
                      {entry.submissionDate && (
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {entry.submissionDate}</p>
                      )}
                      {entry.responseDate && (
                        <p className="text-xs text-muted-foreground">Response: {entry.responseDate}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.notes}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <Select value={entry.status} onValueChange={v => handleStatusChange(entry.id, v)}>
                      <SelectTrigger className={`h-7 text-[10px] uppercase tracking-wider font-bold border px-2 w-auto min-w-[110px] ${statusStyle(entry.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entry.fee ? (
                      <span className="text-xs font-mono text-muted-foreground">${entry.fee} fee</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
