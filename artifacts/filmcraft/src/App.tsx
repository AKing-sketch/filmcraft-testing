import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
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

const queryClient = new QueryClient();

function Router() {
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
