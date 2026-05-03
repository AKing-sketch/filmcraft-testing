import { useState } from "react";
import { useParams } from "wouter";
import { 
  useListBudgetItems, useGetBudgetSummary, useCreateBudgetItem, useDeleteBudgetItem,
  getListBudgetItemsQueryKey, getGetBudgetSummaryQueryKey
} from "@workspace/api-client-react";
import { Plus, Wallet, Trash2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["above-the-line", "below-the-line", "post-production", "marketing", "contingency", "other"];

export default function BudgetTracker() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: items, isLoading: itemsLoading } = useListBudgetItems(projectId, { query: { enabled: !!projectId } });
  const { data: summary, isLoading: summaryLoading } = useGetBudgetSummary(projectId, { query: { enabled: !!projectId } });
  
  const createItem = useCreateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    category: "below-the-line", description: "", estimatedAmount: "", actualAmount: "" as string | number
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate({ 
      projectId, 
      data: { 
        ...newItem, 
        estimatedAmount: Number(newItem.estimatedAmount),
        actualAmount: newItem.actualAmount ? Number(newItem.actualAmount) : null
      } 
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListBudgetItemsQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey(projectId) });
        setNewItem({ category: "below-the-line", description: "", estimatedAmount: "", actualAmount: "" });
      }
    });
  };

  const handleDelete = (itemId: number) => {
    if (confirm("Delete this budget item?")) {
      deleteItem.mutate({ projectId, id: itemId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBudgetItemsQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetBudgetSummaryQueryKey(projectId) });
        }
      });
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Group items
  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  if (itemsLoading || summaryLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground mt-1">Track estimates vs actuals.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Budget Item</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} required placeholder="e.g. Camera Rental, Location Fee" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Amount ($)</label>
                  <Input type="number" step="0.01" value={newItem.estimatedAmount} onChange={e => setNewItem({...newItem, estimatedAmount: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Amount ($)</label>
                  <Input type="number" step="0.01" value={newItem.actualAmount} onChange={e => setNewItem({...newItem, actualAmount: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!newItem.description || !newItem.estimatedAmount || createItem.isPending}>Save Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-primary"><Wallet className="w-32 h-32" /></div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-medium relative z-10">Total Estimated</div>
            <div className="text-3xl font-bold text-foreground relative z-10">{formatCurrency(summary.totalEstimated)}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-medium relative z-10">Total Actual</div>
            <div className="text-3xl font-bold text-foreground relative z-10">{formatCurrency(summary.totalActual)}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-primary"><PieChart className="w-32 h-32" /></div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-medium relative z-10">Variance</div>
            <div className={`text-3xl font-bold relative z-10 ${summary.totalActual > summary.totalEstimated ? 'text-destructive' : 'text-primary'}`}>
              {summary.totalActual > 0 ? formatCurrency(summary.totalEstimated - summary.totalActual) : '-'}
            </div>
            {summary.totalActual > 0 && (
              <div className="text-xs mt-2 bg-secondary/50 inline-block px-2 py-1 rounded">
                {(summary.percentSpent).toFixed(1)}% spent
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-6">
        {!groupedItems || Object.keys(groupedItems).length === 0 ? (
          <div className="text-center p-16 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h2 className="text-lg font-medium mb-1">No budget items</h2>
            <p className="text-sm">Start building your production budget.</p>
          </div>
        ) : (
          CATEGORIES.map(category => {
            const catItems = groupedItems[category];
            if (!catItems || catItems.length === 0) return null;
            
            const catEst = catItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
            const catAct = catItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);

            return (
              <div key={category} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-xs text-foreground/80">{category.replace(/-/g, ' ')}</span>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-muted-foreground">EST: <span className="font-bold text-foreground">{formatCurrency(catEst)}</span></span>
                    <span className="text-muted-foreground">ACT: <span className="font-bold text-primary">{formatCurrency(catAct)}</span></span>
                  </div>
                </div>
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-border">
                    {catItems.map(item => (
                      <tr key={item.id} className="hover:bg-accent/30 group">
                        <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                        <td className="px-4 py-3 text-right font-mono w-32 text-muted-foreground">{formatCurrency(item.estimatedAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono w-32">{item.actualAmount ? formatCurrency(item.actualAmount) : '-'}</td>
                        <td className="px-4 py-3 w-16 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(item.id)}>
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