---
name: Host Access Control
description: Role-based auth for tournament host panel — organizer HMAC tokens, DB support sessions, backward-compat host code.
---

# Auth architecture (as of June 2026)

## Three-tier backward-compatible auth in `checkHostAuth` (tournaments.ts):
1. **X-Organizer-Token** — HMAC-SHA256 signed JWT-like token (`signOrganizerToken` in `auth.ts`). Verified with `verifyOrganizerToken(token, tournamentId)`. Stateless.
2. **X-Support-Token** — hex token stored in `support_sessions` table. Validated against DB, also checks `passwordVersion` matches tournament's current `supportPasswordVersion`.
3. **X-Host-Code** (legacy) — plain-text code stored in `tournaments.hostCode`. Kept for backward compat.

## DB schema additions (in `lib/db/src/schema/tournaments.ts`):
- `tournamentsTable`: added `organizerPasswordHash`, `supportPasswordHash`, `supportPasswordVersion`
- New `supportSessionsTable`: `id`, `tournamentId`, `nick`, `sessionToken`, `passwordVersion`, `lastActiveAt`, `createdAt`
- New `authAuditLogTable`: `id`, `tournamentId`, `actorType`, `actorNick`, `action`, `details`, `createdAt`

## API routes (in `artifacts/api-server/src/routes/auth.ts`):
- `POST /api/tournaments/:id/auth/organizer-login` — verifies password (scrypt), returns signed token
- `POST /api/tournaments/:id/auth/support-login` — verifies password, creates DB session, returns `{ sessionToken, nick }`
- `GET /api/tournaments/:id/auth/support-sessions` — organizer-only, lists active support sessions
- `POST /api/tournaments/:id/auth/change-support-password` — organizer-only, bumps `supportPasswordVersion` (invalidates all support sessions)
- `GET /api/tournaments/:id/audit-log` — organizer-only

## Frontend auth (`lib/auth.ts`, `context/auth-context.tsx`):
- Role stored in `localStorage` key `tm_role`
- Organizer token stored in `sessionStorage` key `tm_org_{tournamentId}`
- Support token/nick stored in `sessionStorage` keys `tm_sup_{tournamentId}` / `tm_sup_nick_{tournamentId}`
- Global API client headers set via `setActiveOrganizerToken()` / `setActiveSupportToken()` from `@workspace/api-client-react`

## Frontend routes:
- `/` → Landing (role selection, 4 cards)
- `/dashboard` → Organizer dashboard (was `/`)
- `/support` → Support entry page
- `/fan` → Fan view

## `mapTournament` strips hashes:
Excludes `organizerPasswordHash`, `supportPasswordHash`, `supportPasswordVersion` from API responses; exposes `hasOrganizerPassword` and `hasSupportPassword` booleans.

**Why:** Passwords must never leave the server; clients only need to know if a password is set.
