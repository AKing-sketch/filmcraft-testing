import { useState } from "react";
import { useCreateProject } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Film } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    title: "",
    logline: "",
    genre: "",
    format: "feature",
    status: "development",
    director: "",
    producer: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    createProject.mutate({ data: formData }, {
      onSuccess: (project) => {
        toast({
          title: "Project created",
          description: "Your new project has been created successfully."
        });
        setLocation(`/projects/${project.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive"
        });
      }
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>
      
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground">Set up a new production workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Project Title <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              placeholder="e.g. The Grand Budapest Hotel" 
              value={formData.title} 
              onChange={e => handleChange("title", e.target.value)}
              className="text-lg py-6"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logline">Logline</Label>
            <Textarea 
              id="logline" 
              placeholder="A one or two sentence summary of your film..." 
              value={formData.logline} 
              onChange={e => handleChange("logline", e.target.value)}
              className="resize-none h-24"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={formData.format} onValueChange={v => handleChange("format", v)}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">Feature Film</SelectItem>
                <SelectItem value="short">Short Film</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input 
              id="genre" 
              placeholder="e.g. Sci-Fi, Drama" 
              value={formData.genre} 
              onChange={e => handleChange("genre", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="director">Director</Label>
            <Input 
              id="director" 
              placeholder="Director's name" 
              value={formData.director} 
              onChange={e => handleChange("director", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="producer">Producer</Label>
            <Input 
              id="producer" 
              placeholder="Producer's name" 
              value={formData.producer} 
              onChange={e => handleChange("producer", e.target.value)}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.title || createProject.isPending}>
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}