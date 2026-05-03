import { useListProjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Plus, Film, Clapperboard, Lightbulb, Video, Globe, Package
} from "lucide-react";

const PHASES = [
  {
    label: "Development",
    segment: "development",
    icon: Lightbulb,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  },
  {
    label: "Production",
    segment: "shots",
    icon: Video,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    label: "Post-Production",
    segment: "post-production",
    icon: Clapperboard,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  },
  {
    label: "Distribution",
    segment: "distribution",
    icon: Globe,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
];

export default function ProjectsList() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your film productions</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Clapperboard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first project to start organizing your script, breakdown,
            casting, and budget.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects?.map((project) => (
            <div
              key={project.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all hover:shadow-md group"
            >
              {/* ── Project header — tapping goes to dashboard ── */}
              <Link href={`/projects/${project.id}`}>
                <div className="p-5 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:scale-105 transition-transform">
                      <Film className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full border border-border capitalize">
                      {project.status || "development"}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {project.title}
                  </h3>

                  {project.logline && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-1">
                      {project.logline}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.format && (
                      <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {project.format}
                      </span>
                    )}
                    {project.genre && (
                      <span className="text-xs text-muted-foreground">
                        • {project.genre}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* ── Phase quick-access strip ── */}
              <div className="border-t border-border grid grid-cols-4">
                {PHASES.map(({ label, segment, icon: Icon, color }) => (
                  <Link
                    key={segment}
                    href={`/projects/${project.id}/${segment}`}
                  >
                    <div
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 text-center hover:bg-accent/40 transition-colors cursor-pointer border-r border-border last:border-r-0`}
                    >
                      <div className={`p-1.5 rounded-md border ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                        {label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
