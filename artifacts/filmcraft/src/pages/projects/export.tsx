import { useParams } from "wouter";
import {
  useGetProject,
  useListScenes,
  useListCharacters,
  useListCastingCalls,
  useListCastMembers,
  useListCrewMembers,
  useListShots,
  useListBudgetItems,
  useGetBudgetSummary,
  useListTools,
  useListPostMilestones,
  useListDeliverables,
  useListDistributionEntries,
  useGetDistributionStrategy,
} from "@workspace/api-client-react";
import { Printer, Film, Users, UsersRound, Video, Wallet, Wrench, Clapperboard, Globe } from "lucide-react";

export default function ExportPage() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const q = { query: { enabled: !!projectId } };

  const { data: project } = useGetProject(projectId, q);
  const { data: scenes = [] } = useListScenes(projectId, q);
  const { data: characters = [] } = useListCharacters(projectId, q);
  const { data: castingCalls = [] } = useListCastingCalls(projectId, q);
  const { data: castMembers = [] } = useListCastMembers(projectId, q);
  const { data: crew = [] } = useListCrewMembers(projectId, q);
  const { data: shots = [] } = useListShots(projectId, q);
  const { data: budgetItems = [] } = useListBudgetItems(projectId, q);
  const { data: budgetSummary } = useGetBudgetSummary(projectId, q);
  const { data: tools = [] } = useListTools(projectId, q);
  const { data: milestones = [] } = useListPostMilestones(projectId, q);
  const { data: deliverables = [] } = useListDeliverables(projectId, q);
  const { data: distribution = [] } = useListDistributionEntries(projectId, q);
  const { data: strategy } = useGetDistributionStrategy(projectId, q);

  if (!project) {
    return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
  const allChars = Array.from(new Set(sortedScenes.flatMap((s) => Array.isArray(s.characters) ? s.characters : []).filter(Boolean)));
  const CHAR_COLORS = ["bg-amber-500/20 text-amber-300 border-amber-500/30", "bg-primary/20 text-primary border-primary/30", "bg-violet-500/20 text-violet-300 border-violet-500/30", "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"];
  const charColorMap: Record<string, string> = {};
  allChars.forEach((c, i) => { charColorMap[c] = CHAR_COLORS[i % CHAR_COLORS.length]; });

  const crewByDept = crew.reduce<Record<string, typeof crew>>((acc, m) => {
    const dept = m.department ?? "Other";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, {});

  const toolsByCat = tools.reduce<Record<string, typeof tools>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const budgetByCat = budgetItems.reduce<Record<string, typeof budgetItems>>((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky print bar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Film className="w-4 h-4 text-primary" />
          <span className="text-foreground">{project.title}</span>
          <span className="text-muted-foreground">— Production Document</span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Export PDF
        </button>
      </div>

      {/* ── Document body ── */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12 print:p-8 print:space-y-10">

        {/* ── 1. Project Header ── */}
        <section className="border-b-2 border-primary/30 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 text-xs font-bold bg-primary/20 text-primary border border-primary/20 rounded uppercase tracking-wide">
                  {project.status || "Development"}
                </span>
                {project.genre && <span className="text-xs text-muted-foreground capitalize">{project.genre}</span>}
                {project.format && <span className="text-xs text-muted-foreground capitalize">• {project.format}</span>}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">{project.title}</h1>
              {project.logline && (
                <p className="text-muted-foreground italic text-lg border-l-2 border-primary/40 pl-4 max-w-2xl">
                  "{project.logline}"
                </p>
              )}
            </div>
            <div className="text-sm space-y-1 text-muted-foreground bg-card border border-border rounded-lg p-4 min-w-[180px]">
              {project.director && <div><span className="font-medium text-foreground">Director</span><br />{project.director}</div>}
              {project.producer && <div className="mt-1"><span className="font-medium text-foreground">Producer</span><br />{project.producer}</div>}
            </div>
          </div>
        </section>

        {/* ── 2. Script Breakdown (AD Table) ── */}
        {sortedScenes.length > 0 && (
          <section className="print:break-before-page">
            <SectionHeader icon={<Film className="w-4 h-4" />} title="Script Breakdown" />
            {allChars.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Legend:</span>
                {allChars.map((c) => (
                  <span key={c} className={`px-2 py-0.5 rounded border text-[10px] font-medium ${charColorMap[c]}`}>{c}</span>
                ))}
              </div>
            )}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs text-left w-full whitespace-nowrap">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      {["Sc", "I/E", "TOD", "Pgs", "Location", "Characters", "Props", "Wardrobe", "Makeup/FX", "Synopsis"].map((h) => (
                        <th key={h} className="px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedScenes.map((scene) => {
                      const chars = Array.isArray(scene.characters) ? scene.characters : [];
                      const propsArr = Array.isArray(scene.props) ? scene.props : [];
                      const costumesArr = Array.isArray(scene.costumes) ? scene.costumes : [];
                      const makeupArr = Array.isArray(scene.makeupFx) ? scene.makeupFx : [];
                      return (
                        <tr key={scene.id} className="align-top hover:bg-accent/10">
                          <td className="px-2.5 py-2 font-mono font-bold border-r border-border">{scene.sceneNumber}</td>
                          <td className="px-2.5 py-2 border-r border-border">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scene.intExt === "EXT" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>{scene.intExt}</span>
                          </td>
                          <td className="px-2.5 py-2 border-r border-border text-muted-foreground">{scene.timeOfDay}</td>
                          <td className="px-2.5 py-2 font-mono border-r border-border text-muted-foreground">{scene.pages ?? "—"}</td>
                          <td className="px-2.5 py-2 font-semibold border-r border-border min-w-[120px] max-w-[160px] whitespace-normal">{scene.location?.toUpperCase()}</td>
                          <td className="px-2.5 py-2 border-r border-border min-w-[120px]">
                            <div className="flex flex-wrap gap-1">{chars.map((c) => <span key={c} className={`px-1 py-0.5 rounded border text-[10px] ${charColorMap[c] ?? ""}`}>{c}</span>)}</div>
                          </td>
                          <td className="px-2.5 py-2 border-r border-border min-w-[100px] max-w-[150px] whitespace-normal text-foreground/80">{propsArr.join(", ") || "—"}</td>
                          <td className="px-2.5 py-2 border-r border-border min-w-[100px] max-w-[150px] whitespace-normal text-foreground/80">{costumesArr.join(", ") || "—"}</td>
                          <td className="px-2.5 py-2 border-r border-border min-w-[100px] max-w-[150px] whitespace-normal text-foreground/80">{makeupArr.join(", ") || "—"}</td>
                          <td className="px-2.5 py-2 min-w-[160px] max-w-[240px] whitespace-normal text-foreground/80">{scene.synopsis || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── 3. Characters ── */}
        {characters.length > 0 && (
          <section>
            <SectionHeader icon={<Users className="w-4 h-4" />} title="Characters" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="font-bold text-foreground mb-1">{c.name}</h3>
                  {c.age && <p className="text-xs text-muted-foreground mb-2">Age {c.age}</p>}
                  {c.description && <p className="text-sm text-foreground/80 mb-2">{c.description}</p>}
                  {c.motivation && <div className="text-xs"><span className="font-medium text-muted-foreground">Motivation:</span> {c.motivation}</div>}
                  {c.arc && <div className="text-xs mt-1"><span className="font-medium text-muted-foreground">Arc:</span> {c.arc}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Casting ── */}
        {(castingCalls.length > 0 || castMembers.length > 0) && (
          <section>
            <SectionHeader icon={<UsersRound className="w-4 h-4" />} title="Casting" />
            {castingCalls.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Casting Calls</h3>
                <SimpleTable
                  headers={["Character", "Status", "Notes"]}
                  rows={castingCalls.map((c) => [c.character ?? "—", c.status ?? "—", c.notes ?? "—"])}
                />
              </div>
            )}
            {castMembers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Confirmed Cast</h3>
                <SimpleTable
                  headers={["Character", "Performer", "Contact", "Status"]}
                  rows={castMembers.map((c) => [c.character ?? "—", c.name ?? "—", c.contact ?? "—", c.contractStatus ?? "—"])}
                />
              </div>
            )}
          </section>
        )}

        {/* ── 5. Crew ── */}
        {crew.length > 0 && (
          <section>
            <SectionHeader icon={<Users className="w-4 h-4" />} title="Crew" />
            {Object.entries(crewByDept).map(([dept, members]) => (
              <div key={dept} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{dept}</h3>
                <SimpleTable
                  headers={["Name", "Title", "Contact", "Notes"]}
                  rows={members.map((m) => [m.name, m.title ?? "—", m.contact ?? "—", m.notes ?? "—"])}
                />
              </div>
            ))}
          </section>
        )}

        {/* ── 6. Shot List ── */}
        {shots.length > 0 && (
          <section className="print:break-before-page">
            <SectionHeader icon={<Video className="w-4 h-4" />} title="Shot List" />
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs text-left w-full whitespace-nowrap">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      {["Shot", "Scene", "Type", "Movement", "Camera", "Lens", "Description", "Status"].map((h) => (
                        <th key={h} className="px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shots.map((s) => (
                      <tr key={s.id} className="hover:bg-accent/10 align-top">
                        <td className="px-2.5 py-2 font-mono font-bold border-r border-border">{s.shotNumber}</td>
                        <td className="px-2.5 py-2 border-r border-border text-muted-foreground">{s.scene ?? "—"}</td>
                        <td className="px-2.5 py-2 border-r border-border"><span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px]">{s.shotType}</span></td>
                        <td className="px-2.5 py-2 border-r border-border text-muted-foreground">{s.cameraMovement ?? "—"}</td>
                        <td className="px-2.5 py-2 border-r border-border text-muted-foreground max-w-[120px] whitespace-normal">{s.cameraBody ?? "—"}</td>
                        <td className="px-2.5 py-2 border-r border-border text-muted-foreground">{s.lens ?? "—"}</td>
                        <td className="px-2.5 py-2 border-r border-border min-w-[160px] max-w-[240px] whitespace-normal text-foreground/80">{s.description}</td>
                        <td className="px-2.5 py-2 text-muted-foreground capitalize">{s.status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── 7. Budget ── */}
        {budgetItems.length > 0 && (
          <section>
            <SectionHeader icon={<Wallet className="w-4 h-4" />} title="Budget" />
            {budgetSummary && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-foreground">€{budgetSummary.totalEstimated.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Estimated</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-foreground">€{budgetSummary.totalActual.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Actual</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">{(budgetSummary.percentageUsed ?? 0).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Spent</div>
                </div>
              </div>
            )}
            {Object.entries(budgetByCat).map(([cat, items]) => (
              <div key={cat} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
                <SimpleTable
                  headers={["Description", "Estimated", "Actual", "Notes"]}
                  rows={items.map((i) => [i.description ?? "—", `€${(i.estimatedAmount ?? 0).toLocaleString()}`, `€${(i.actualAmount ?? 0).toLocaleString()}`, i.notes ?? "—"])}
                />
              </div>
            ))}
          </section>
        )}

        {/* ── 8. Production Tools ── */}
        {tools.length > 0 && (
          <section>
            <SectionHeader icon={<Wrench className="w-4 h-4" />} title="Production Tools" />
            {Object.entries(toolsByCat).map(([cat, catTools]) => (
              <div key={cat} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catTools.map((t) => (
                    <div key={t.id} className="border border-border rounded-lg p-3 bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">{t.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${t.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"}`}>{t.status}</span>
                      </div>
                      {t.purpose && <p className="text-xs text-muted-foreground mt-1">{t.purpose}</p>}
                      {t.projectNotes && <p className="text-xs text-foreground/70 mt-1.5 italic">{t.projectNotes}</p>}
                      {t.externalLink && <a href={t.externalLink} className="text-[11px] text-primary hover:underline mt-1 block" target="_blank" rel="noopener noreferrer">{t.externalLink}</a>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── 9. Post-Production ── */}
        {(milestones.length > 0 || deliverables.length > 0) && (
          <section className="print:break-before-page">
            <SectionHeader icon={<Clapperboard className="w-4 h-4" />} title="Post-Production" />
            {milestones.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pipeline Milestones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {milestones.map((m) => (
                    <div key={m.id} className="border border-border rounded-lg p-3 bg-card">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{m.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${m.status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : m.status === "in-progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"}`}>{m.status}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.phase}</p>
                      {m.notes && <p className="text-xs text-foreground/70 mt-1.5">{m.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {deliverables.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Deliverables</h3>
                <SimpleTable
                  headers={["Name", "Format", "Specs", "Recipient", "Due Date", "Status"]}
                  rows={deliverables.map((d) => [d.name, d.format ?? "—", d.specs ?? "—", d.recipient ?? "—", d.dueDate ?? "—", d.status ?? "—"])}
                />
              </div>
            )}
          </section>
        )}

        {/* ── 10. Distribution ── */}
        {(strategy || distribution.length > 0) && (
          <section>
            <SectionHeader icon={<Globe className="w-4 h-4" />} title="Distribution" />
            {strategy && (
              <div className="border border-border rounded-xl p-5 bg-card mb-6 space-y-4">
                {strategy.tagline && <p className="text-lg italic text-foreground border-l-2 border-primary/40 pl-4">"{strategy.tagline}"</p>}
                {strategy.shortSynopsis && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Short Synopsis</div>
                    <p className="text-sm text-foreground/80">{strategy.shortSynopsis}</p>
                  </div>
                )}
                {strategy.directorStatement && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Director's Statement</div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{strategy.directorStatement}</p>
                  </div>
                )}
                {strategy.festivalStrategy && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Festival Strategy</div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{strategy.festivalStrategy}</p>
                  </div>
                )}
              </div>
            )}
            {distribution.length > 0 && (
              <SimpleTable
                headers={["Name", "Type", "Status", "Fee", "Deadline", "Notes"]}
                rows={distribution.map((e) => [e.name, e.type ?? "—", e.status ?? "—", e.fee ? `€${e.fee}` : "—", e.submissionDate ?? "—", e.notes ?? "—"])}
              />
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Studio di Gratia — FilmCraft — {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </footer>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-primary">{icon}</div>
      <h2 className="text-base font-bold text-foreground uppercase tracking-wide">{title}</h2>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-secondary/50 border-b border-border">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-accent/10">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-foreground/80 max-w-[200px] whitespace-normal">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
