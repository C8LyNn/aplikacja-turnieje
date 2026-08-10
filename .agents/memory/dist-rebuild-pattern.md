---
name: Workspace package dist rebuilds
description: When to run tsc rebuild in lib/* packages so downstream consumers see updated declarations.
---

## Rule
After adding exports to `lib/db` or `lib/api-client-react`, run `npx tsc` inside that package to regenerate `dist/`. Without this, TypeScript consumers that use project references (api-server, tournament-manager) will see stale `dist/index.d.ts` and report "property does not exist" errors for the new symbols.

**Why:** The api-server tsconfig uses `"references"` pointing to `lib/db` and `lib/api-zod`. TypeScript resolves declarations from the compiled `dist/`, not from `src/`. The runtime (esbuild) doesn't care — it bundles src directly — so the server runs fine; only tsc type-checking breaks.

**How to apply:**
- `lib/db` — add table → `cd lib/db && npx tsc`
- `lib/api-client-react` — add export → `cd lib/api-client-react && npx tsc --project tsconfig.json`
- Verify: re-run `npx tsc --noEmit -p artifacts/api-server/tsconfig.json` and confirm the symbols are now found.
