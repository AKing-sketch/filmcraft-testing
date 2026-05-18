import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  Film, LayoutDashboard, FileText, Users, UsersRound,
  Video, Wallet, Lightbulb, FileArchive, Globe,
  Menu, X, Clapperboard, Wrench, Download, Settings,
  LayoutGrid, Package, CheckSquare, Lock
} from "lucide-react";
import { useGetProject } from "@workspace/api-client-react";

const POD_NAV = [
  { segment: "", label: "Dashboard", icon: LayoutDashboard },
  { segment: "/development", label: "Development", icon: Lightbulb },
  { segment: "/characters", label: "Characters", icon: Users },
  { segment: "/breakdown", label: "Breakdown", icon: FileText },
  { segment: "/casting", label: "Casting", icon: UsersRound },
  { segment: "/crew", label: "Crew", icon: Settings },
  { segment: "/shots", label: "Shot List", icon: Video },
  { segment: "/lighting", label: "Lighting", icon: Lightbulb },
  { segment: "/budget", label: "Budget", icon: Wallet },
  { segment: "/packets", label: "Packets", icon: FileArchive },
  { segment: "/post-production", label: "Post-Production", icon: Clapperboard },
  { segment: "/distribution", label: "Distribution", icon: Globe },
  { segment: "/tools", label: "Tools", icon: Wrench },
  { segment: "/boards", label: "Boards", icon: LayoutGrid },
  { segment: "/assets", label: "Assets", icon: Package },
  { segment: "/deadlines", label: "Deadlines", icon: CheckSquare },
  { segment: "/export", label: "Export", icon: Download },
];

interface PodLayoutProps {
  children: React.ReactNode;
  podSlug: string;
  projectId: number;
}

export function PodLayout({ children, podSlug, projectId }: PodLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId },
  });

  const sidebarContent = (
    <>
      {/* Logo — pod branded, no master nav link */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <div className="leading-none">
            <span className="font-bold text-sm text-primary">FilmCraft</span>
            <span className="block text-[10px] text-sidebar-foreground/40 font-normal tracking-widest uppercase">Pod</span>
          </div>
        </div>
        <button
          className="md:hidden p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 min-h-0">
        {project && (
          <div className="px-4 mb-4">
            <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Project
            </span>
            <p className="font-semibold text-sidebar-foreground mt-1 truncate text-sm leading-snug" title={project.title}>
              {project.title}
            </p>
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-none">
              {project.status || "development"}
            </span>
          </div>
        )}

        <nav className="space-y-0.5 px-2">
          {POD_NAV.map(({ segment, label, icon: Icon }) => (
            <PodSidebarLink
              key={segment || "dash"}
              href={`/pod/${podSlug}${segment}`}
              icon={<Icon className="w-4 h-4" />}
              label={label}
            />
          ))}
        </nav>

        {/* Pod isolation indicator */}
        <div className="mx-4 mt-6 px-3 py-2 rounded-md bg-sidebar-accent/30 border border-border/60 flex items-center gap-2">
          <Lock className="w-3 h-3 text-sidebar-foreground/40 flex-shrink-0" />
          <span className="text-[10px] text-sidebar-foreground/40 leading-tight">
            Isolated workspace. No access to other projects.
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-border bg-sidebar flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw]
          bg-sidebar border-r border-border
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 h-14 px-3 border-b border-border bg-sidebar flex-shrink-0">
          <button
            type="button"
            className="flex items-center justify-center w-11 h-11 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent transition-colors flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Film className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-bold text-primary">FilmCraft Pod</span>
          {project && (
            <span className="text-sm text-sidebar-foreground truncate flex-1 text-right">{project.title}</span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Mobile bottom nav */}
        {projectId && project && (
          <PodMobileBottomNav podSlug={podSlug} />
        )}
      </main>
    </div>
  );
}

function PodMobileBottomNav({ podSlug }: { podSlug: string }) {
  const TABS = [
    { segment: "", label: "Hub", icon: LayoutDashboard },
    { segment: "/development", label: "Dev", icon: Lightbulb },
    { segment: "/shots", label: "Shots", icon: Video },
    { segment: "/budget", label: "Budget", icon: Wallet },
    { segment: "/boards", label: "Boards", icon: LayoutGrid },
    { segment: "/deadlines", label: "Deadlines", icon: CheckSquare },
  ];

  return (
    <nav className="md:hidden flex overflow-x-auto border-t border-border bg-sidebar flex-shrink-0 safe-bottom scrollbar-none">
      {TABS.map(({ segment, label, icon: Icon }) => (
        <PodBottomTab
          key={segment || "hub"}
          href={`/pod/${podSlug}${segment}`}
          icon={<Icon className="w-4 h-4" />}
          label={label}
        />
      ))}
    </nav>
  );
}

function PodBottomTab({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const matchPattern = href.endsWith(href.split("/").slice(0, 3).join("/"))
    ? href
    : href + "/*?";
  const [isActive] = useRoute(matchPattern);
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
        isActive ? "text-primary" : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function PodSidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const matchPattern = href + "/*?";
  const [isActive] = useRoute(matchPattern);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
