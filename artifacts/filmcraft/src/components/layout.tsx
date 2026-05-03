import { Link, useRoute } from "wouter";
import { 
  Film, LayoutDashboard, FileText, Users, UsersRound, 
  Video, Wallet, Lightbulb, FileArchive, Settings, Plus,
  ChevronRight
} from "lucide-react";
import { useGetProject } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isProjectRoute, params] = useRoute("/projects/:id/*?");
  const projectId = params?.id ? parseInt(params.id, 10) : null;
  
  const { data: project, isLoading } = useGetProject(projectId || 0, {
    query: { enabled: !!projectId }
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary hover:text-primary/80 transition-colors">
            <Film className="w-5 h-5" />
            <span>FilmCraft</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span>All Projects</span>
            </Link>
          </nav>

          {projectId && !isLoading && project && (
            <div className="mt-8">
              <div className="px-4 mb-2 flex flex-col">
                <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">Current Project</span>
                <span className="font-semibold text-sidebar-foreground mt-1 truncate" title={project.title}>
                  {project.title}
                </span>
                <div className="flex items-center mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {project.status || 'Development'}
                  </span>
                </div>
              </div>
              <nav className="space-y-1 px-2 mt-4">
                <SidebarLink href={`/projects/${projectId}`} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                <SidebarLink href={`/projects/${projectId}/development`} icon={<Lightbulb className="w-4 h-4" />} label="Development" />
                <SidebarLink href={`/projects/${projectId}/characters`} icon={<Users className="w-4 h-4" />} label="Characters" />
                <SidebarLink href={`/projects/${projectId}/breakdown`} icon={<FileText className="w-4 h-4" />} label="Breakdown" />
                <SidebarLink href={`/projects/${projectId}/casting`} icon={<UsersRound className="w-4 h-4" />} label="Casting" />
                <SidebarLink href={`/projects/${projectId}/crew`} icon={<Settings className="w-4 h-4" />} label="Crew" />
                <SidebarLink href={`/projects/${projectId}/shots`} icon={<Video className="w-4 h-4" />} label="Shot List" />
                <SidebarLink href={`/projects/${projectId}/lighting`} icon={<Lightbulb className="w-4 h-4" />} label="Lighting" />
                <SidebarLink href={`/projects/${projectId}/budget`} icon={<Wallet className="w-4 h-4" />} label="Budget" />
                <SidebarLink href={`/projects/${projectId}/packets`} icon={<FileArchive className="w-4 h-4" />} label="Packets" />
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  const [isActive] = useRoute(href + "/*?");
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
