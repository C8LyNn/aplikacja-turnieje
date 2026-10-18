# WEB-005 — A70 / DEVELOPMENT FIRST / WAVE 3 — test-only scope preflight

**ROLE:** A70 — Match Lifecycle & Undo  
**TASK:** WAVE3 T040 — Undo regression boundary tests  
**STATUS:** IN_PROGRESS / TEST_ONLY / NO_CODE_CHANGES  
**Date:** 2026-10-18, Europe/Warsaw  
**Exact base:** [PR #119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) HEAD `b650a8e8de1841802c60f2af356bf0b404bd8018`  
**Isolated branch:** `test/web-005/t040-wave3-undo-regression-boundaries`

## Exclusive allowed paths — published before new test implementation

1. NEW `artifacts/api-server/test/roster-undo-wave3-boundaries.test.ts` — pure test-only synthetic input validation and missing/stale/replay provenance boundary for existing parser at PR #119.
2. NEW `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE3_HANDOFF.md` — this preflight and final succinct handoff.

Both target paths verified absent at base. **NO changes** to `tournament-roster.ts`, `roster-undo-payload.ts`, PR #119/#104, A40 #101 or A140 #116. PR #101's changed files (preclone adapter + action provenance and tests) do not overlap these new A70 files.

## Testing boundary and non-goals

Pure parser tests can establish fail-closed malformed persisted objects, permitted historical fields, clone/CAS-looking token rejection, deterministic repeated parsing and lack of input mutation. They **cannot establish server idempotence**, stale global latest Undo 409, actor authorization, MVCC lock behavior or SQL rollback. Those are database-backed functional invariants and remain **NOT_EXECUTED/PG16_HOLD**, even if the pure test suite passes. Existing PR #42/#119 PG16 integration definitions should remain unchanged and must be run only when a disposable physically isolated PG16 executor is separately approved.

The `undo-last` HTTP route currently performs `JSON.parse(lastAction.undoPayload)` outside the roster-service parser; invalid raw JSON is a distinct failure path and not automatically handled by this new pure suite. Note it as a potential future route task; **do not edit routes** in WAVE3.

**WAVE3_HANDOFF final fields:** ROLE | TASK | STATUS | BASE SHA | HEAD SHA | CHANGED PATHS | TEST COMMANDS + RESULTS | PR/LINK | CONFLICTS | NEXT OWNER.

**STOP:** no game logic/assets, production SQL/PG16/Docker, migrations, merge, live deploy, Replit sync or SWARM-006.
