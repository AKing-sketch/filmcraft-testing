import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  Film, LayoutDashboard, FileText, Users, UsersRound,
  Video, Wallet, Lightbulb, FileArchive, Settings, Globe,
  Menu, X, ChevronLeft, Clapperboard, Wrench, Download
} from "lucide-react";
import { useGetProject } from "@workspace/api-client-react";

const PROJECT_NAV = [
  { segment: "", label: "Dashboard", icon: LayoutDashboard },
  { segment: "/development", label: "Development", icon: Lightbulb },
  { segment: "/characters", label: "Characters", icon: Users },
  { segment: "/breakdown", label: "Breakdown", icon: FileText },
  { segment: "/casting", label: "Casting", icon: UsersRound },
  { segment: "/crew", label: "Crew", icon: Settings },
  { segment: "/shots", label: "Shot List", icon: Video },
  { segment: "/lighting", label: "Lighting", icon: Lightbulb },
  { segment: "/budget", label: "Budget", icon: Wallet },
  { segment: "/packets",         label: "Packets",          icon: FileArchive },
  { segment: "/post-production", label: "Post-Production",   icon: Clapperboard },
  { segment: "/distribution",    label: "Distribution",      icon: Globe },
  { segment: "/tools",           label: "Tools",             icon: Wrench },
  { segment: "/export",          label: "Export",            icon: Download },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [isProjectRoute, params] = useRoute("/projects/:id/*?");
  const projectId = params?.id ? parseInt(params.id, 10) : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const { data: project } = useGetProject(projectId || 0, {
    query: { enabled: !!projectId },
  });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-primary hover:text-primary/80 transition-colors"
        >
          <Film className="w-5 h-5" />
          <span>FilmCraft</span>
        </Link>
        {/* Mobile close button */}
        <button
          className="md:hidden p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 min-h-0">
        <nav className="space-y-1 px-2">
          <SidebarLink
            href="/"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="All Projects"
            exact
          />
        </nav>

        {projectId && project && (
          <div className="mt-6">
            <div className="px-4 mb-3">
              <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                Current Project
              </span>
              <p className="font-semibold text-sidebar-foreground mt-1 truncate text-sm leading-snug" title={project.title}>
                {project.title}
              </p>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-none">
                {project.status || "development"}
              </span>
            </div>
            <nav className="space-y-0.5 px-2">
              {PROJECT_NAV.map(({ segment, label, icon: Icon }) => (
                <SidebarLink
                  key={segment}
                  href={`/projects/${projectId}${segment}`}
                  icon={<Icon className="w-4 h-4" />}
                  label={label}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* ── Desktop sidebar (always visible ≥ md) ───────────────────── */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-border bg-sidebar flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ────────────────────────────────────── */}
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

      {/* ── Main content ─────────────────────────────────────────────── */}
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
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <Film className="w-4 h-4" />
            <span className="text-sm">FilmCraft</span>
          </Link>
          {project && (
            <>
              <ChevronLeft className="w-3 h-3 text-sidebar-foreground/30 rotate-180" />
              <span className="text-sm text-sidebar-foreground truncate flex-1">{project.title}</span>
            </>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* ── Mobile bottom nav (project context only) ──────────────── */}
        {projectId && project && (
          <MobileBottomNav projectId={projectId} />
        )}
      </main>
    </div>
  );
}

function MobileBottomNav({ projectId }: { projectId: number }) {
  const ALL_TABS = [
    { segment: "",               label: "Hub",    icon: LayoutDashboard },
    { segment: "/development",   label: "Dev",    icon: Lightbulb },
    { segment: "/shots",         label: "Shots",  icon: Video },
    { segment: "/budget",        label: "Budget", icon: Wallet },
    { segment: "/post-production", label: "Post", icon: Clapperboard },
    { segment: "/distribution",  label: "Distrib", icon: Globe },
  ];

  return (
    <nav className="md:hidden flex overflow-x-auto border-t border-border bg-sidebar flex-shrink-0 safe-bottom scrollbar-none">
      {ALL_TABS.map(({ segment, label, icon: Icon }) => (
        <BottomTab
          key={segment || "hub"}
          href={`/projects/${projectId}${segment}`}
          icon={<Icon className="w-4 h-4" />}
          label={label}
        />
      ))}
    </nav>
  );
}

function BottomTab({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const [isActive] = useRoute(href === `/projects/${href.split("/")[2]}` ? href : href + "/*?");
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
        isActive
          ? "text-primary"
          : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  exact = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  const matchPattern = exact ? href : href + "/*?";
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
