import { useState, useEffect } from "react";
import { useGetWorkspaceSettings, useUpdateWorkspaceSettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Film, ChevronLeft, Building2, MapPin, Globe, AlignLeft, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STUDIO_TYPES = [
  { value: "production-company", label: "Production Company" },
  { value: "independent-filmmaker", label: "Independent Filmmaker" },
  { value: "creative-collective", label: "Creative Collective" },
  { value: "research-lab", label: "Research Lab" },
  { value: "interactive-media", label: "Interactive Media Studio" },
  { value: "freelancer", label: "Freelancer" },
  { value: "hybrid", label: "Hybrid" },
];

type FormState = {
  name: string;
  description: string;
  studioType: string;
  location: string;
  website: string;
};

export default function WorkspaceSettings() {
  const { data: workspace, isLoading } = useGetWorkspaceSettings();
  const { mutate: update, isPending } = useUpdateWorkspaceSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    studioType: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    if (workspace) {
      setForm({
        name: workspace.name ?? "",
        description: workspace.description ?? "",
        studioType: workspace.studioType ?? "",
        location: workspace.location ?? "",
        website: workspace.website ?? "",
      });
    }
  }, [workspace]);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    update(
      {
        data: {
          name: form.name || undefined,
          description: form.description || null,
          studioType: form.studioType || null,
          location: form.location || null,
          website: form.website || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Workspace updated", description: "Your studio settings have been saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save workspace settings.", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Film className="w-5 h-5 text-primary animate-pulse" />
      </div>
    );
  }

  const currentType = STUDIO_TYPES.find((t) => t.value === form.studioType)?.label;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          All Projects
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Film className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest leading-none mb-0.5">
              FilmCraft
            </p>
            <h1 className="text-xl font-bold leading-none">Workspace Settings</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 ml-12">
          Your studio identity — how your workspace appears across FilmCraft and on all exports and packets.
        </p>
      </div>

      {/* Preview strip */}
      <div className="mb-8 px-4 py-3 rounded-lg border border-border bg-sidebar flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Film className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="block text-[9px] font-semibold text-sidebar-foreground/35 uppercase tracking-[0.15em] leading-none mb-0.5">
            FilmCraft
          </span>
          <span className="block text-sm font-semibold text-primary truncate leading-none">
            {form.name || "Studio di Gratia"}
          </span>
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground/40">sidebar preview</span>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Studio Name */}
        <div className="space-y-2">
          <Label htmlFor="ws-name" className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            Studio / Workspace Name
          </Label>
          <Input
            id="ws-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="My Studio"
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground/60">
            Appears in the sidebar, on export documents, and production packets.
          </p>
        </div>

        {/* Studio Type */}
        <div className="space-y-2">
          <Label htmlFor="ws-type" className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            Studio Type
          </Label>
          <Select value={form.studioType} onValueChange={(v) => set("studioType", v)}>
            <SelectTrigger id="ws-type" className="bg-background border-border">
              <SelectValue placeholder="Select studio type">
                {currentType}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STUDIO_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="ws-desc" className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
            Description
          </Label>
          <Textarea
            id="ws-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="A short description of your studio, focus, or approach…"
            className="bg-background border-border resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="ws-location" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            Location
          </Label>
          <Input
            id="ws-location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Porto, Portugal"
            className="bg-background border-border"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="ws-website" className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            Website
          </Label>
          <Input
            id="ws-website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://studiedigratia.com"
            className="bg-background border-border"
          />
        </div>

        {/* Save */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={isPending || !form.name.trim()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
