# FilmCraft

## Overview

A full-stack filmmaking production suite for directors, producers, and cinematographers. Covers the entire production lifecycle from development through distribution.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/filmcraft), dark cinematic aesthetic (slate/amber palette)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter
- **State**: TanStack React Query

## Features

- **Projects** — Film project management with status, genre, format, director, producer, budget
- **Dashboard** — Per-project overview with stats, budget progress, recent activity
- **Development** — Mind map (drag-and-drop node canvas) + Beat Sheet (Save the Cat structure)
- **Character Bible** — Full character cards with backstory, motivation, arc
- **Script Breakdown** — Scene-level breakdown with INT/EXT, location, time-of-day, props, cast
- **Casting** — Casting calls with status tracking + confirmed cast list
- **Crew List** — Crew grouped by department
- **Shot List** — Shots with type, camera movement, lens, status
- **Budget** — Line items by category with estimated vs actual, summary view
- **Lighting Planner** — Interactive drag-and-drop canvas for bird's-eye lighting diagrams
- **Production Packets** — Generate exportable production packet templates

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/api-client-react/` — generated React Query hooks (from Orval)
- `lib/api-zod/` — generated Zod validators (from Orval)
- `lib/db/src/schema/` — Drizzle table definitions (one file per domain)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/filmcraft/src/` — React frontend

## DB Schema Files

- `projects.ts` — Film projects
- `characters.ts` — Character bibles
- `beats.ts` — Beat sheets (Save the Cat structure)
- `mindmap.ts` — Mind map nodes
- `scenes.ts` — Script scenes / breakdown
- `casting.ts` — Casting calls + cast members
- `crew.ts` — Crew members
- `shots.ts` — Shot lists
- `budget.ts` — Budget line items
- `lighting.ts` — Lighting diagrams (canvas JSON)
- `packets.ts` — Production packets

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
