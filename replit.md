# Tournament Manager

Webowa aplikacja do zarządzania turniejami sportowymi i esportowymi — tworzenie turniejów, zarządzanie uczestnikami, rozgrywanie meczów, widok drabinki i panel prowadzącego.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/tournament-manager run dev` — run the frontend (port 18283)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — guarded no-op used by Replit Publishing; application schema changes use reviewed forward-only SQL migrations
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, shadcn/ui, Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/tournaments.ts` — DB schema (tournaments, players, matches)
- `artifacts/api-server/src/routes/tournaments.ts` — all tournament/player/match routes
- `artifacts/tournament-manager/src/` — React frontend

## Architecture decisions

- Contract-first: OpenAPI spec generates both React Query hooks (`@workspace/api-client-react`) and Zod validation schemas (`@workspace/api-zod`)
- Bracket generation happens server-side at tournament start; bye matches auto-advance winners
- Single elimination: bracket size rounded up to next power of 2 — byes given to unseeded slots
- Round robin: all pairs generated in one round; winner determined by most wins when all matches complete
- `inArray()` from drizzle-orm used for batch player lookups in `enrichMatches()`

## Product

- **Dashboard** (`/`) — lista wszystkich turniejów z kartami statusu
- **Nowy turniej** (`/tournaments/new`) — formularz z walidacją (nazwa, format, max graczy)
- **Szczegóły turnieju** (`/tournaments/:id`) — zakładki: Przegląd, Gracze, Mecze, Drabinka
- **Panel prowadzącego** (`/tournaments/:id/host`) — wprowadzanie wyników, kończenie meczów
- **Widok drabinki** (`/tournaments/:id/bracket`) — pełnoekranowy widok do wyświetlania na projektorze

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching frontend or backend
- DB schema changes: reviewed forward-only SQL migrations and their guarded runners; automatic Drizzle push intentionally manages no application table
- API server must be restarted after code changes: it builds via esbuild before starting

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
