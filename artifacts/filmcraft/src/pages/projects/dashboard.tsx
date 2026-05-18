import { useGetProjectDashboard, useGetProject } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useProjectId } from "@/context/pod-project";
import {
  Users, Video, Wallet, FileText, Activity, Lightbulb, Settings,
  UsersRound, FileArchive, Clapperboard, Globe, Film, ChevronRight,
  CheckCircle2, Package
} from "lucide-react";
import { format } from "date-fns";

// ── Phase definitions ──────────────────────────────────────────────────────────

type ModuleCard = {
  name: string;
  path: string;
  icon: React.ReactNode;
  count: number | string;
  countLabel: string;
  subtext?: string;
};

// ── Phase Section Component ────────────────────────────────────────────────────

function PhaseSection({
  phase,
  color,
  modules,
  projectId,
}: {
  phase: string;
  color: string;        // Tailwind border + accent colour token
  modules: ModuleCard[];
  projectId: number;
}) {
  return (
    <div className="space-y-3">
      {/* Phase header */}
      <div className={`flex items-center gap-3`}>
        <div className={`h-px flex-1 bg-border`} />
        <span className={`text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full border ${color}`}>
          {phase}
        </span>
        <div className={`h-px flex-1 bg-border`} />
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {modules.map((mod) => (
          <Link key={mod.name} href={`/projects/${projectId}/${mod.path}`}>
            <div className="bg-card hover:bg-accent/40 transition-colors border border-border hover:border-primary/40 rounded-xl p-4 flex flex-col gap-2 cursor-pointer group h-full">
              <div className="flex items-start justify-between gap-1">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  {mod.icon}
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xl font-bold text-foreground leading-none">{mod.count}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">{mod.countLabel}</div>
                </div>
              </div>
              <div className="font-medium text-sm text-foreground leading-snug">{mod.name}</div>
              {mod.subtext && (
                <div className="text-[11px] text-muted-foreground leading-snug">{mod.subtext}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function ProjectDashboard() {
  const projectId = useProjectId();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId },
  });

  const { data: dashboard, isLoading: dashboardLoading } = useGetProjectDashboard(projectId, {
    query: { enabled: !!projectId },
  });

  if (projectLoading || dashboardLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project || !dashboard) return <div className="p-8">Project not found</div>;

  const d = dashboard;

  // ── Phase 1: Development ──────────────────────────────────────────────────
  const devModules: ModuleCard[] = [
    {
      name: "Development",
      path: "development",
      icon: <Lightbulb className="w-4 h-4" />,
      count: d.beatCount,
      countLabel: "Beats",
      subtext: "Beat sheet & mind map",
    },
    {
      name: "Characters",
      path: "characters",
      icon: <Users className="w-4 h-4" />,
      count: d.characterCount,
      countLabel: "Characters",
      subtext: "Character bibles",
    },
    {
      name: "Breakdown",
      path: "breakdown",
      icon: <FileText className="w-4 h-4" />,
      count: d.sceneCount,
      countLabel: "Scenes",
      subtext: "Script breakdown",
    },
  ];

  // ── Phase 2: Production ───────────────────────────────────────────────────
  const prodModules: ModuleCard[] = [
    {
      name: "Casting",
      path: "casting",
      icon: <UsersRound className="w-4 h-4" />,
      count: d.castCount,
      countLabel: "Cast",
      subtext: "Casting calls & cast",
    },
    {
      name: "Crew",
      path: "crew",
      icon: <Settings className="w-4 h-4" />,
      count: d.crewCount,
      countLabel: "Crew",
      subtext: "Dept. assignments",
    },
    {
      name: "Shot List",
      path: "shots",
      icon: <Video className="w-4 h-4" />,
      count: d.shotCount,
      countLabel: "Shots",
      subtext: "Camera setups & board",
    },
    {
      name: "Lighting",
      path: "lighting",
      icon: <Lightbulb className="w-4 h-4" />,
      count: d.lightingDiagramCount,
      countLabel: "Diagrams",
      subtext: "Lighting planner",
    },
    {
      name: "Budget",
      path: "budget",
      icon: <Wallet className="w-4 h-4" />,
      count: d.budgetTotal ? `$${(d.budgetTotal / 1000).toFixed(0)}k` : "$0",
      countLabel: "Total",
      subtext: "Line-item budget",
    },
    {
      name: "Packets",
      path: "packets",
      icon: <FileArchive className="w-4 h-4" />,
      count: d.packetCount,
      countLabel: "Packets",
      subtext: "Production documents",
    },
  ];

  // ── Phase 3: Post-Production ──────────────────────────────────────────────
  const postModules: ModuleCard[] = [
    {
      name: "Post-Production",
      path: "post-production",
      icon: <Clapperboard className="w-4 h-4" />,
      count: d.postMilestoneCount
        ? `${d.postMilestoneCompleteCount}/${d.postMilestoneCount}`
        : "0",
      countLabel: "Milestones",
      subtext: "Pipeline & deliverables",
    },
    {
      name: "Deliverables",
      path: "post-production",
      icon: <Package className="w-4 h-4" />,
      count: d.deliverableCount,
      countLabel: "Files",
      subtext: "DCP, ProRes, screeners…",
    },
  ];

  // ── Phase 4: Distribution ─────────────────────────────────────────────────
  const distModules: ModuleCard[] = [
    {
      name: "Submissions",
      path: "distribution",
      icon: <Globe className="w-4 h-4" />,
      count: d.distributionCount,
      countLabel: "Entries",
      subtext: "Festivals & platforms",
    },
    {
      name: "Press Kit",
      path: "distribution",
      icon: <Film className="w-4 h-4" />,
      count: d.distributionAcceptedCount,
      countLabel: "Accepted",
      subtext: "Strategy & one-sheet",
    },
  ];

  const pct = d.budgetTotal
    ? Math.min(100, Math.round((d.budgetAllocated / d.budgetTotal) * 100))
    : 0;

  const postPct = d.postMilestoneCount
    ? Math.round((d.postMilestoneCompleteCount / d.postMilestoneCount) * 100)
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8">
      {/* ── Project hero ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-bold bg-primary/20 text-primary border border-primary/20 rounded-md uppercase tracking-wide">
                {project.status || "Development"}
              </span>
              {project.genre && (
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border capitalize">
                  {project.genre}
                </span>
              )}
              {project.format && (
                <span className="text-xs text-muted-foreground capitalize">{project.format}</span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
              {project.title}
            </h1>
            {project.logline && (
              <p className="text-muted-foreground max-w-3xl text-base italic border-l-2 border-primary/50 pl-4 py-1">
                "{project.logline}"
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-sm text-muted-foreground space-y-1 bg-background/50 p-3 rounded-lg border border-border min-w-[160px]">
            {project.director && (
              <div><span className="font-medium text-foreground">Director:</span> {project.director}</div>
            )}
            {project.producer && (
              <div><span className="font-medium text-foreground">Producer:</span> {project.producer}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 Production Phases ───────────────────────────────────────── */}
      <PhaseSection
        phase="Development"
        color="border-violet-500/40 text-violet-400 bg-violet-500/10"
        modules={devModules}
        projectId={projectId}
      />
      <PhaseSection
        phase="Production"
        color="border-amber-500/40 text-amber-400 bg-amber-500/10"
        modules={prodModules}
        projectId={projectId}
      />
      <PhaseSection
        phase="Post-Production"
        color="border-sky-500/40 text-sky-400 bg-sky-500/10"
        modules={postModules}
        projectId={projectId}
      />
      <PhaseSection
        phase="Distribution"
        color="border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
        modules={distModules}
        projectId={projectId}
      />

      {/* ── Progress + Activity ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Production Overview
          </h2>

          {/* Budget */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Budget Allocated
              </span>
              <span className="font-semibold text-foreground">
                ${d.budgetAllocated.toLocaleString()} / ${d.budgetTotal.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pct}% of budget committed</p>
          </div>

          {/* Post-production progress */}
          {d.postMilestoneCount > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5" /> Post Pipeline
                </span>
                <span className="font-semibold text-foreground">
                  {d.postMilestoneCompleteCount} / {d.postMilestoneCount} milestones
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${postPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{postPct}% complete</p>
            </div>
          )}

          {/* Distribution stats */}
          {d.distributionCount > 0 && (
            <div className="pt-2 border-t border-border flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-2xl font-bold text-foreground">{d.distributionCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider ml-1.5">Submissions</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400">{d.distributionAcceptedCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider ml-1.5">Accepted</span>
              </div>
            </div>
          )}

          {/* Key numbers */}
          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border text-center">
            {[
              { label: "Scenes",  value: d.sceneCount },
              { label: "Shots",   value: d.shotCount },
              { label: "Cast",    value: d.castCount },
              { label: "Crew",    value: d.crewCount },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">Recent Activity</h2>
          {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== dashboard.recentActivity.length - 1 && (
                    <div className="absolute left-2 top-5 bottom-[-16px] w-px bg-border" />
                  )}
                  <div className="w-4 h-4 rounded-full bg-secondary border-2 border-background flex-shrink-0 z-10 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground leading-snug">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
