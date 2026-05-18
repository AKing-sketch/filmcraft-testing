import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Film, Layers, Cpu, ArrowRight, Upload, FileText,
  CheckCircle2, AlertCircle, Loader2, X, Clapperboard
} from "lucide-react";
import { useCreateProject, useCreateScene } from "@workspace/api-client-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type ParsedScene = {
  sceneNumber: number;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: string;
};

type ScriptAnalysis = {
  title: string;
  pageCount: number;
  detectedType: "short" | "feature" | "unknown";
  sceneCount: number;
  characterCount: number;
  scenes: ParsedScene[];
  characters: string[];
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string }
  | { status: "parsed"; fileName: string; analysis: ScriptAnalysis }
  | { status: "creating"; fileName: string; analysis: ScriptAnalysis }
  | { status: "error"; message: string };

// ─── Homepage type cards ─────────────────────────────────────────────────────

const PROJECT_TYPES = [
  {
    id: "short-feature",
    label: "Short Film / Feature",
    projectId: 4,
    Icon: Clapperboard,
    iconBg: "bg-primary/10 border border-primary/20",
    iconColor: "text-primary",
    accentColor: "group-hover:border-primary/40",
    tagColor: "bg-primary/10 text-primary border-primary/20",
    description:
      "Script to screen in one workspace — scene breakdown, cast, crew, shot list, lighting diagrams, budget, and festival distribution. Type auto-detected from your script.",
    template: "Still Frame — Drama Short",
  },
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

const TYPE_LABELS: Record<string, string> = {
  short: "Short Film",
  feature: "Feature Film",
  unknown: "Script",
};

// ─── Upload zone ─────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
        px-8 py-10 cursor-pointer transition-all duration-200
        ${dragging
          ? "border-primary/60 bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-card/60"
        }
        ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
      `}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Upload className="w-5 h-5 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground text-sm">
          Drop your script here, or{" "}
          <span className="text-primary underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          PDF · Word (.docx) · Google Doc export — up to 30 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Analysis result card ────────────────────────────────────────────────────

function AnalysisCard({
  fileName,
  analysis,
  onReset,
  onCreate,
  creating,
}: {
  fileName: string;
  analysis: ScriptAnalysis;
  onReset: () => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const typeLabel = TYPE_LABELS[analysis.detectedType] ?? "Script";

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground leading-snug">{analysis.title}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono truncate max-w-xs">{fileName}</p>
          </div>
        </div>
        <button onClick={onReset} className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-background border border-border px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-foreground">{analysis.pageCount}</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">pages</p>
        </div>
        <div className="rounded-lg bg-background border border-border px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-foreground">{analysis.sceneCount}</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">scenes</p>
        </div>
        <div className="rounded-lg bg-background border border-border px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-foreground">{analysis.characterCount}</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">characters</p>
        </div>
      </div>

      {/* Detected type */}
      <div className="flex items-center gap-2 mb-5">
        <Film className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-sm text-foreground">
          Detected as{" "}
          <span className="font-semibold text-primary">{typeLabel}</span>
          {analysis.detectedType === "unknown" && (
            <span className="text-muted-foreground"> — you can adjust this after creation</span>
          )}
        </span>
      </div>

      {/* Scene preview */}
      {analysis.scenes.length > 0 && (
        <div className="mb-5 rounded-lg border border-border bg-background overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider border-b border-border">
            Scene breakdown preview
          </p>
          <div className="divide-y divide-border/50 max-h-36 overflow-y-auto">
            {analysis.scenes.slice(0, 8).map((s) => (
              <div key={s.sceneNumber} className="px-3 py-1.5 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground/40 w-5 text-right flex-shrink-0">{s.sceneNumber}</span>
                <span className="text-primary/70 font-mono text-[10px] flex-shrink-0">{s.intExt}</span>
                <span className="text-foreground/80 truncate">{s.location}</span>
                <span className="ml-auto text-muted-foreground/40 flex-shrink-0 text-[10px]">{s.timeOfDay}</span>
              </div>
            ))}
            {analysis.scenes.length > 8 && (
              <p className="px-3 py-1.5 text-xs text-muted-foreground/40 italic">
                +{analysis.scenes.length - 8} more scenes
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onCreate}
        disabled={creating}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 transition-colors disabled:opacity-60"
      >
        {creating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creating project…</>
        ) : (
          <><FileText className="w-4 h-4" /> Create project from this script</>
        )}
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Homepage() {
  const [, navigate] = useLocation();
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createScene } = useCreateScene();

  async function handleFile(file: File) {
    setUploadState({ status: "uploading", fileName: file.name });
    try {
      const form = new FormData();
      form.append("script", file);
      const res = await fetch("/api/upload/script", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Upload failed");
      }
      const analysis: ScriptAnalysis = await res.json();
      setUploadState({ status: "parsed", fileName: file.name, analysis });
    } catch (err) {
      setUploadState({
        status: "error",
        message: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    }
  }

  async function handleCreate() {
    if (uploadState.status !== "parsed") return;
    const { analysis } = uploadState;
    setUploadState({ status: "creating", fileName: uploadState.fileName, analysis: uploadState.analysis });
    try {
      const format =
        analysis.detectedType === "feature" ? "feature" : "short";
      const project = await createProject({
        data: { title: analysis.title, format, status: "pre-production" },
      });
      const id = project.id;
      // Seed up to 40 scenes
      const scenesToSeed = analysis.scenes.slice(0, 40);
      await Promise.all(
        scenesToSeed.map((s) =>
          createScene({
            projectId: id,
            data: {
              sceneNumber: s.sceneNumber,
              intExt: s.intExt,
              location: s.location,
              timeOfDay: s.timeOfDay,
              pages: 1,
              synopsis: "",
              characters: [],
              props: [],
              costumes: [],
              makeupFx: [],
              notes: "",
            },
          })
        )
      );
      navigate(`/projects/${id}`);
    } catch {
      setUploadState({ status: "error", message: "Failed to create project. Please try again." });
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 md:py-20">
      {/* Platform label */}
      <div className="flex items-center gap-2 mb-8">
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
      <p className="text-muted-foreground text-center max-w-sm mb-10 text-[15px] leading-relaxed">
        Upload your script and FilmCraft builds your workspace — or pick a type to explore a template.
      </p>

      {/* Upload zone / result */}
      <div className="w-full max-w-lg mb-10">
        {uploadState.status === "idle" && (
          <UploadZone onFile={handleFile} disabled={false} />
        )}

        {uploadState.status === "uploading" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/60 px-8 py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">Parsing script…</p>
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono truncate max-w-xs">
                {uploadState.fileName}
              </p>
            </div>
          </div>
        )}

        {uploadState.status === "parsed" && (
          <AnalysisCard
            fileName={uploadState.fileName}
            analysis={uploadState.analysis}
            onReset={() => setUploadState({ status: "idle" })}
            onCreate={handleCreate}
            creating={false}
          />
        )}

        {uploadState.status === "creating" && (
          <AnalysisCard
            fileName={uploadState.fileName}
            analysis={uploadState.analysis}
            onReset={() => {}}
            onCreate={() => {}}
            creating={true}
          />
        )}

        {uploadState.status === "error" && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Upload failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{uploadState.message}</p>
            </div>
            <button
              onClick={() => setUploadState({ status: "idle" })}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-4xl mb-8">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground/40 uppercase tracking-widest">or explore a template</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {PROJECT_TYPES.map(
          ({ id, label, projectId, Icon, iconBg, iconColor, accentColor, tagColor, description, template }) => (
            <Link key={id} href={`/projects/${projectId}`}>
              <div
                className={`group relative flex flex-col rounded-xl border border-border bg-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${accentColor} h-full`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h2 className="text-xl font-bold mb-2 leading-none">{label}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{description}</p>
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
      <div className="mt-10 flex items-center gap-6">
        <Link href="/projects" className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Browse all projects →
        </Link>
        <span className="text-border">·</span>
        <Link href="/projects/new" className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Start from scratch →
        </Link>
      </div>
    </div>
  );
}
