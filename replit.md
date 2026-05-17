# Studio di Gratia — FilmCraft

## Overview

Studio di Gratia's full-stack filmmaking production suite for directors, producers, and cinematographers. Covers the entire production lifecycle from initial idea through distribution across 15 fully functional modules, all living inside a single per-project workspace.

---

## Studio Branding

- **Studio name**: Studio di Gratia
- **Product name**: FilmCraft
- **Palette**: Dark cinematic — slate backgrounds, amber (`primary`) accents
- **Currency**: EUR (€) throughout
- The sidebar logo, mobile top bar, printed packets, and Export document footer all display "Studio di Gratia"

---

## Stack

| Concern | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Node.js | 24 |
| TypeScript | 5.9 |
| Frontend | React + Vite (`artifacts/filmcraft`) |
| Routing | Wouter |
| Server state | TanStack React Query |
| UI | Tailwind CSS + shadcn/ui |
| API | Express 5 (`artifacts/api-server`) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | drizzle-zod (server), Zod v4 (shared) |
| API contract | OpenAPI 3 (`lib/api-spec/openapi.yaml`) |
| API codegen | Orval → React Query hooks + Zod schemas |
| Build | esbuild (CJS bundle for server) |

> **Important**: Server routes must import Zod via `drizzle-zod` schemas (`insertXSchema` from `@workspace/db`), NOT via `import { z } from "zod/v4"` — esbuild cannot resolve the `/v4` subpath.

---

## Key Commands

```bash
pnpm run typecheck                          # Full typecheck across all packages
pnpm run build                              # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen  # Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/db run push        # Push DB schema changes to dev database
```

> Never run `pnpm dev` at workspace root. Artifacts run via Replit workflows.
> Never call service ports directly — always go through the shared proxy at `localhost:80`.

---

## Architecture

```
artifacts/
  api-server/src/
    routes/           — Express route handlers (one file per domain)
    index.ts          — App bootstrap
  filmcraft/src/
    pages/
      projects/       — All 15 module pages
    components/
      layout.tsx      — Sidebar + mobile nav (PROJECT_NAV array drives all links)
      ui/             — shadcn/ui primitives
    App.tsx           — Wouter route definitions

lib/
  api-spec/
    openapi.yaml      — Single source of truth for API contract
  api-client-react/
    src/generated/    — Orval-generated React Query hooks (DO NOT edit manually)
  api-zod/
    src/generated/    — Orval-generated Zod validators (DO NOT edit manually)
  db/src/schema/      — Drizzle table definitions (one file per domain)
```

---

## Database Schema Files (`lib/db/src/schema/`)

| File | Contents |
|---|---|
| `projects.ts` | Film projects (title, logline, genre, format, director, producer, budget, status) |
| `beats.ts` | Beat sheets — Save the Cat 15-beat structure |
| `mindmap.ts` | Mind map nodes (position, title, body, edges as JSON) |
| `characters.ts` | Character bibles (name, age, description, backstory, motivation, arc, notes) |
| `scenes.ts` | Script scenes — sceneNumber, intExt, location, timeOfDay, pages, synopsis, characters[], props[], costumes[], makeupFx[], notes |
| `casting.ts` | Casting calls + confirmed cast members |
| `crew.ts` | Crew members grouped by department |
| `shots.ts` | Shot list — shotType, cameraMovement, cameraBody, lens, description, status |
| `budget.ts` | Budget line items — category, estimatedAmount, actualAmount |
| `lighting.ts` | Lighting diagrams (canvas state saved as JSON) |
| `packets.ts` | Production packets (call sheets, schedules, reports, etc.) |
| `post_production.ts` | Post milestones + deliverables |
| `distribution.ts` | Distribution submissions (festival/distributor/platform/broadcaster/sales-agent) |
| `distribution_strategy.ts` | Press kit / strategy — one record per project |
| `tools.ts` | Production toolchain — software, hardware, platforms, services |

> **Scene array fields**: `characters`, `props`, `costumes`, `makeupFx` are stored as `text` in the DB but typed as `string[]` in the OpenAPI spec. The API serialises/deserialises them. Always treat them as arrays in the frontend (`Array.isArray(scene.characters) ? scene.characters : []`).

---

## API Route Files (`artifacts/api-server/src/routes/`)

| File | Base path |
|---|---|
| `projects.ts` | `/api/projects` |
| `dashboard.ts` | `/api/projects/:id/dashboard` |
| `beats.ts` | `/api/projects/:id/beats` |
| `mindmap.ts` | `/api/projects/:id/mindmap` |
| `characters.ts` | `/api/projects/:id/characters` |
| `scenes.ts` | `/api/projects/:id/scenes` |
| `casting.ts` | `/api/projects/:id/casting` + `/cast-members` |
| `crew.ts` | `/api/projects/:id/crew` |
| `shots.ts` | `/api/projects/:id/shots` |
| `budget.ts` | `/api/projects/:id/budget` |
| `lighting.ts` | `/api/projects/:id/lighting` |
| `packets.ts` | `/api/projects/:id/packets` |
| `post-production.ts` | `/api/projects/:id/post-production` |
| `distribution.ts` | `/api/projects/:id/distribution` + `/strategy` |
| `tools.ts` | `/api/projects/:id/tools` |

---

## Frontend Pages (`artifacts/filmcraft/src/pages/projects/`)

| File | Route | Module |
|---|---|---|
| `index.tsx` | `/` | Projects list |
| `new.tsx` | `/projects/new` | New project form |
| `dashboard.tsx` | `/projects/:id` | Dashboard (4 phases) |
| `development.tsx` | `/projects/:id/development` | Mind Map + Beat Sheet |
| `characters.tsx` | `/projects/:id/characters` | Character Bible |
| `breakdown.tsx` | `/projects/:id/breakdown` | Scene Reader + AD Breakdown Sheet |
| `casting.tsx` | `/projects/:id/casting` | Casting Calls + Confirmed Cast |
| `crew.tsx` | `/projects/:id/crew` | Crew by department |
| `shots.tsx` | `/projects/:id/shots` | Shot List |
| `budget.tsx` | `/projects/:id/budget` | Budget tracker |
| `lighting.tsx` | `/projects/:id/lighting` | Lighting Planner canvas |
| `packets.tsx` | `/projects/:id/packets` | Production Packets |
| `post-production.tsx` | `/projects/:id/post-production` | Milestones + Deliverables |
| `distribution.tsx` | `/projects/:id/distribution` | Submissions + Press Kit |
| `tools.tsx` | `/projects/:id/tools` | Production Tools |
| `export.tsx` | `/projects/:id/export` | Print-ready Production Document |

---

## Adding a New Module — Checklist

1. **DB schema** — add `lib/db/src/schema/<domain>.ts`, export from `lib/db/src/schema/index.ts`, run `pnpm --filter @workspace/db run push`
2. **OpenAPI spec** — add paths + schemas to `lib/api-spec/openapi.yaml`
3. **Codegen** — run `pnpm --filter @workspace/api-spec run codegen`
4. **API route** — create `artifacts/api-server/src/routes/<domain>.ts` using `insertXSchema` from `@workspace/db` for validation; wire into `routes/index.ts`
5. **Frontend page** — create `artifacts/filmcraft/src/pages/projects/<domain>.tsx` using generated hooks from `@workspace/api-client-react`
6. **Register route** — add `<Route>` to `artifacts/filmcraft/src/App.tsx`
7. **Add to nav** — add entry to `PROJECT_NAV` array in `artifacts/filmcraft/src/components/layout.tsx`

---

## Navigation Structure

`PROJECT_NAV` in `layout.tsx` drives both the desktop sidebar and mobile nav. Current order:

```
Dashboard → Development → Characters → Breakdown → Casting → Crew →
Shot List → Lighting → Budget → Packets → Post-Production → Distribution →
Tools → Export
```

---

## Generated Hook Naming Conventions (Orval)

Always verify generated names against `lib/api-client-react/src/generated/api.ts`. Key non-obvious names:

| Resource | Hook |
|---|---|
| Crew members | `useListCrewMembers` / `useCreateCrewMember` |
| Post milestones | `useListPostMilestones` / `useCreatePostMilestone` |
| Distribution entries | `useListDistributionEntries` |
| Distribution strategy | `useGetDistributionStrategy` / `useUpsertDistributionStrategy` |
| Budget summary | `useGetBudgetSummary` |
| Script breakdown summary | `useGetScriptBreakdown` |

---

## Module Reference

### 1 — Projects List (`/`)
All projects as cards. Each card shows title, genre, format, director, producer, status badge, and phase quick-links. "New Project" opens a full creation form.

### 2 — Dashboard (`/projects/:id`)
Four production-phase sections (Development / Production / Post-Production / Distribution), each containing stat cards with live counts that link directly to the relevant module. Budget progress bar, recent-activity feed.

### 3 — Development (`/projects/:id/development`)
Two tools in tabs: **Mind Map** (drag-and-drop node canvas, persisted as JSON) and **Beat Sheet** (Save the Cat 15 beats, notes per beat, colour-coded progress bar).

### 4 — Character Bible (`/projects/:id/characters`)
Full character cards: name, age, physical description, backstory, motivation, arc, production notes. Add/edit/delete.

### 5 — Breakdown (`/projects/:id/breakdown`)
Two tabs:
- **Scene Reader** — expandable rows revealing synopsis, character badges, props, wardrobe, makeup/FX, notes
- **AD Breakdown Sheet** — wide scrollable production grid: Sc #, I/E, TOD, Pages, Location, Characters (colour-coded), Props, Wardrobe, Makeup/FX/VFX, Synopsis

Summary bar: total scenes, pages, INT/EXT split, DAY/NIGHT split, unique locations, unique characters.

### 6 — Casting (`/projects/:id/casting`)
**Casting Calls** — open roles with status workflow (open → in-progress → offer-out → closed). **Confirmed Cast** — performer, character, contact, contract status, dates, agent.

### 7 — Crew (`/projects/:id/crew`)
Full roster grouped by department. Name, title, contact, daily rate, notes.

### 8 — Shot List (`/projects/:id/shots`)
Shot type (WS/MS/CU/ECU/OTS/POV/INSERT/AERIAL), camera movement, camera body, lens, description, status. Filter by type and status. Inline status advance.

### 9 — Budget (`/projects/:id/budget`)
Line items by category. Estimated (€) vs actual (€). Summary bar: total estimated, total actual, variance, % used. Category sub-totals in table.

### 10 — Lighting Planner (`/projects/:id/lighting`)
Interactive bird's-eye lighting diagram canvas. Drag-and-drop fixtures (key, fill, back, practical, bounce, flag). Saved per setup/scene name.

### 11 — Packets (`/projects/:id/packets`)
Production packet generator. Types: call sheet, shooting schedule, one-liner, production report, safety brief. Print/export via browser dialog. Footer says "Studio di Gratia".

### 12 — Post-Production (`/projects/:id/post-production`)
**Pipeline Milestones** — Editorial, VFX, Colour, Sound, Music, Delivery. Click to advance status. Overall progress bar. **Deliverables Tracker** — format, specs, recipient, due date, status.

### 13 — Distribution (`/projects/:id/distribution`)
**Submissions Tracker** — festivals, distributors, platforms, broadcasters, sales agents. Status workflow. Fee (€), dates, notes. **Press Kit / Strategy** — tagline, short synopsis, long synopsis, director's statement, technical specs, bios, festival strategy, release strategy, press contact.

### 14 — Tools (`/projects/:id/tools`)
Production toolchain registry. Category (software/hardware/platform/service/workflow), purpose, external link, project notes, workflow notes, assigned user, status (active/testing/planned/archived). Card grid with category + status filter chips.

### 15 — Export (`/projects/:id/export`)
Single-page print-ready production document aggregating all 13 data sources:
project header → script breakdown (AD table with character legend) → characters → casting → crew → shot list → budget summary + line items → tools → post-production milestones + deliverables → distribution entries + press kit.
Sticky "Print / Export PDF" button triggers browser print. Footer: "Studio di Gratia — FilmCraft — [date]".

---

## User Preferences

- Studio name is **Studio di Gratia** — use this everywhere in UI, footers, and documentation
- Currency is **EUR (€)** — never USD
- Dark cinematic aesthetic — slate backgrounds, amber accent (`primary`), no light mode
