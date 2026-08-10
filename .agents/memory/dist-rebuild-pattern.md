---
name: Workspace package dist rebuilds
description: When and how to rebuild dist for workspace libraries that use TypeScript project references.
---

# Workspace package dist rebuilds

## Rule
After schema/type changes to `lib/api-client-react`, `lib/api-zod`, or other workspace libraries that have `"composite": true` in their tsconfig, you must rebuild the dist or TS consumers (tournament-manager, api-server) will see stale declarations.

**Why:** The tournament-manager's `tsconfig.json` has `"references": [{ "path": "../../lib/api-client-react" }]`. With project references, TypeScript resolves imports from `dist/*.d.ts`, not `src/`. The `exports` field in `package.json` pointing to `src/index.ts` only matters for bundlers (Vite), not for `tsc --noEmit`.

**How to apply:**
- After changing `lib/api-client-react/src/generated/` (e.g. after running orval): `cd lib/api-client-react && npx tsc -p tsconfig.json`
- After changing `lib/api-zod/src/`: same pattern (check for tsconfig with `composite: true`)
- After changing `lib/db/src/`: `cd lib/db && npx tsc -p tsconfig.json`

## Symptom of stale dist
`npx tsc --noEmit` in `artifacts/tournament-manager` reports "Property 'X' does not exist on type 'Y'" even though `lib/api-client-react/src/generated/api.schemas.ts` clearly contains `X`.
