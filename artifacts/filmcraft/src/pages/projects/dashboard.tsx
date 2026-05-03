import { useGetProjectDashboard, useGetProject } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { 
  Users, Video, Wallet, FileText, Activity, Lightbulb, Settings, UsersRound
} from "lucide-react";
import { format } from "date-fns";

export default function ProjectDashboard() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  
  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId }
  });
  
  const { data: dashboard, isLoading: dashboardLoading } = useGetProjectDashboard(projectId, {
    query: { enabled: !!projectId }
  });

  if (projectLoading || dashboardLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!project || !dashboard) return <div className="p-8">Project not found</div>;

  const modules = [
    { name: "Development", path: "development", icon: <Lightbulb className="w-5 h-5" />, count: dashboard.beatCount, countLabel: "Beats" },
    { name: "Characters", path: "characters", icon: <Users className="w-5 h-5" />, count: dashboard.characterCount, countLabel: "Characters" },
    { name: "Breakdown", path: "breakdown", icon: <FileText className="w-5 h-5" />, count: dashboard.sceneCount, countLabel: "Scenes" },
    { name: "Casting", path: "casting", icon: <UsersRound className="w-5 h-5" />, count: dashboard.castCount, countLabel: "Cast" },
    { name: "Crew", path: "crew", icon: <Settings className="w-5 h-5" />, count: dashboard.crewCount, countLabel: "Crew" },
    { name: "Shots", path: "shots", icon: <Video className="w-5 h-5" />, count: dashboard.shotCount, countLabel: "Shots" },
    { name: "Lighting", path: "lighting", icon: <Lightbulb className="w-5 h-5" />, count: dashboard.lightingDiagramCount, countLabel: "Diagrams" },
    { name: "Budget", path: "budget", icon: <Wallet className="w-5 h-5" />, 
      count: dashboard.budgetTotal ? `$${(dashboard.budgetTotal / 1000).toFixed(1)}k` : "$0", countLabel: "Total" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-xl border border-card-border shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/20 text-primary border border-primary/20 rounded-md">
              {project.status?.toUpperCase() || 'DEVELOPMENT'}
            </span>
            {project.format && <span className="text-sm text-muted-foreground capitalize">{project.format}</span>}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{project.title}</h1>
          {project.logline && <p className="text-muted-foreground max-w-3xl text-lg italic border-l-2 border-primary/50 pl-4 py-1">"{project.logline}"</p>}
        </div>
        <div className="flex flex-col text-sm text-muted-foreground gap-1 bg-background/50 p-3 rounded-lg border border-border">
          {project.director && <div><span className="font-medium text-foreground">Director:</span> {project.director}</div>}
          {project.producer && <div><span className="font-medium text-foreground">Producer:</span> {project.producer}</div>}
        </div>
      </div>

      {/* Quick Modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <Link key={mod.name} href={`/projects/${projectId}/${mod.path}`}>
            <div className="bg-card hover:bg-accent/50 transition-colors border border-card-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform">
                  {mod.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{mod.count || 0}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{mod.countLabel}</div>
                </div>
              </div>
              <div className="font-medium text-sm">{mod.name}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two columns: Stats & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Production Progress
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">Budget Allocation</span>
                  <span className="font-semibold text-foreground">
                    ${dashboard.budgetAllocated.toLocaleString()} / ${dashboard.budgetTotal.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min(100, (dashboard.budgetAllocated / Math.max(1, dashboard.budgetTotal)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border text-center">
                <div>
                  <div className="text-3xl font-bold text-foreground">{dashboard.sceneCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Scenes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{dashboard.shotCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Shots</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{dashboard.characterCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Characters</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== dashboard.recentActivity.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-border"></div>
                  )}
                  <div className="w-5 h-5 rounded-full bg-secondary border-2 border-background flex-shrink-0 z-10 mt-0.5"></div>
                  <div>
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(activity.timestamp), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}