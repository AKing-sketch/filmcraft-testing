import { useListProjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Film, Calendar, Clapperboard } from "lucide-react";
import { format } from "date-fns";

export default function ProjectsList() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your film productions</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse"></div>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Clapperboard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">Create your first project to start organizing your script, breakdown, casting, and budget.</p>
          <Link href="/projects/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group relative flex flex-col h-full bg-card rounded-xl border border-card-border p-6 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full border border-border">
                    {project.status || 'Development'}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
                
                <p className="text-muted-foreground text-sm flex-1 line-clamp-2 mb-6">
                  {project.logline || 'No logline provided.'}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border">
                  {project.format && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clapperboard className="w-3 h-3" />
                      <span className="capitalize">{project.format}</span>
                    </span>
                  )}
                  {project.genre && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                      <span>{project.genre}</span>
                    </span>
                  )}
                  {project.startDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}