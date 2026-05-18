import { Link } from "wouter";
import { Film, Layers, Cpu, ArrowRight } from "lucide-react";

const PROJECT_TYPES = [
  {
    id: "series",
    label: "Web Series",
    projectId: 5,
    Icon: Layers,
    iconBg: "bg-violet-500/10 border border-violet-500/20",
    iconColor: "text-violet-400",
    accentColor: "group-hover:border-violet-500/40",
    tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    description:
      "Pilot to series bible — map your episode arc, manage season-level casting and crew, and track production across multiple phases.",
    template: "Wavelength — Sci-Fi Thriller Series",
  },
  {
    id: "short",
    label: "Short Film",
    projectId: 4,
    Icon: Film,
    iconBg: "bg-primary/10 border border-primary/20",
    iconColor: "text-primary",
    accentColor: "group-hover:border-primary/40",
    tagColor: "bg-primary/10 text-primary border-primary/20",
    description:
      "Script to screen in one workspace — scene breakdown, cast, crew, shot list, lighting diagrams, budget, and distribution pipeline.",
    template: "Still Frame — Drama Short",
  },
  {
    id: "interactive",
    label: "Interactive Short",
    projectId: 3,
    Icon: Cpu,
    iconBg: "bg-sky-500/10 border border-sky-500/20",
    iconColor: "text-sky-400",
    accentColor: "group-hover:border-sky-500/40",
    tagColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    description:
      "Branch and build — map decision trees on the mind map canvas, structure interactive scenes, and manage media assets for nonlinear storytelling.",
    template: "Interlude — Interactive Narrative",
  },
];

export default function Homepage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-16 md:py-24">
      {/* Platform label */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Film className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-[0.18em]">
          FilmCraft
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center tracking-tight mb-3">
        What are you making?
      </h1>
      <p className="text-muted-foreground text-center max-w-sm mb-14 text-[15px] leading-relaxed">
        Pick a project type to see a template built for your production.
      </p>

      {/* Type cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {PROJECT_TYPES.map(
          ({ id, label, projectId, Icon, iconBg, iconColor, accentColor, tagColor, description, template }) => (
            <Link key={id} href={`/projects/${projectId}`}>
              <div
                className={`group relative flex flex-col rounded-xl border border-border bg-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${accentColor} h-full`}
              >
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                {/* Type label */}
                <h2 className="text-xl font-bold mb-2 leading-none">{label}</h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {description}
                </p>

                {/* Template name + CTA */}
                <div className="mt-auto">
                  <span className={`inline-block text-[10px] font-medium px-2 py-1 rounded-md border mb-3 ${tagColor}`}>
                    {template}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Explore template
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          )
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-6">
        <Link
          href="/projects"
          className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Browse all projects →
        </Link>
        <span className="text-border">·</span>
        <Link
          href="/projects/new"
          className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Start from scratch →
        </Link>
      </div>
    </div>
  );
}
