import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Film } from "lucide-react";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { PodLayout } from "@/components/pod-layout";
import { PodProjectContext } from "@/context/pod-project";

import ProjectsList from "@/pages/projects/index";
import NewProject from "@/pages/projects/new";
import ProjectDashboard from "@/pages/projects/dashboard";
import DevelopmentWorkspace from "@/pages/projects/development";
import CharactersBible from "@/pages/projects/characters";
import ScriptBreakdown from "@/pages/projects/breakdown";
import CastingHub from "@/pages/projects/casting";
import CrewList from "@/pages/projects/crew";
import ShotList from "@/pages/projects/shots";
import BudgetTracker from "@/pages/projects/budget";
import LightingPlanner from "@/pages/projects/lighting";
import ProductionPackets from "@/pages/projects/packets";
import DistributionTracker from "@/pages/projects/distribution";
import PostProduction from "@/pages/projects/post-production";
import ProductionTools from "@/pages/projects/tools";
import ExportPage from "@/pages/projects/export";
import PodBoards from "@/pages/pod/boards";
import PodAssets from "@/pages/pod/assets";
import PodDeadlines from "@/pages/pod/deadlines";

const queryClient = new QueryClient();

type PodProject = {
  id: number;
  title: string;
  status?: string | null;
  podSlug?: string | null;
};

function usePodProject(slug: string) {
  return useQuery<PodProject>({
    queryKey: ["pod", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pods/${slug}`);
      if (!res.ok) throw new Error("Pod not found");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
  });
}

function PodRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, isError } = usePodProject(slug || "");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Film className="w-5 h-5 animate-pulse text-primary" />
          <span className="text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">Workspace not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono text-primary">{slug}</span> is not a registered project pod.
          </p>
        </div>
      </div>
    );
  }

  const base = `/pod/${slug}`;

  return (
    <PodProjectContext.Provider value={{ projectId: project.id, podSlug: slug || "" }}>
      <PodLayout podSlug={slug || ""} projectId={project.id}>
        <WouterRouter base={base}>
          <Switch>
            <Route path="/" component={ProjectDashboard} />
            <Route path="/development" component={DevelopmentWorkspace} />
            <Route path="/characters" component={CharactersBible} />
            <Route path="/breakdown" component={ScriptBreakdown} />
            <Route path="/casting" component={CastingHub} />
            <Route path="/crew" component={CrewList} />
            <Route path="/shots" component={ShotList} />
            <Route path="/budget" component={BudgetTracker} />
            <Route path="/lighting" component={LightingPlanner} />
            <Route path="/packets" component={ProductionPackets} />
            <Route path="/distribution" component={DistributionTracker} />
            <Route path="/post-production" component={PostProduction} />
            <Route path="/tools" component={ProductionTools} />
            <Route path="/boards" component={PodBoards} />
            <Route path="/assets" component={PodAssets} />
            <Route path="/deadlines" component={PodDeadlines} />
            <Route path="/export" component={ExportPage} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
      </PodLayout>
    </PodProjectContext.Provider>
  );
}

function MasterRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ProjectsList} />
        <Route path="/projects/new" component={NewProject} />
        <Route path="/projects/:id" component={ProjectDashboard} />
        <Route path="/projects/:id/development" component={DevelopmentWorkspace} />
        <Route path="/projects/:id/characters" component={CharactersBible} />
        <Route path="/projects/:id/breakdown" component={ScriptBreakdown} />
        <Route path="/projects/:id/casting" component={CastingHub} />
        <Route path="/projects/:id/crew" component={CrewList} />
        <Route path="/projects/:id/shots" component={ShotList} />
        <Route path="/projects/:id/budget" component={BudgetTracker} />
        <Route path="/projects/:id/lighting" component={LightingPlanner} />
        <Route path="/projects/:id/packets" component={ProductionPackets} />
        <Route path="/projects/:id/distribution" component={DistributionTracker} />
        <Route path="/projects/:id/post-production" component={PostProduction} />
        <Route path="/projects/:id/tools" component={ProductionTools} />
        <Route path="/projects/:id/export" component={ExportPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/pod/:slug/*?" component={PodRouter} />
      <Route component={MasterRouter} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
