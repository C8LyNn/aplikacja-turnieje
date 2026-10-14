# WEB-005-00-WAVE1-R1 — EXECUTION HANDOFF

**Issued by:** 00 — IMPLEMENTATION LEAD | **Date:** 2026-10-14 | **Status:** WAVE 1 DISPATCH READY / NO IMPLEMENTER HANDOFF YET

## Evidence baseline reverified immediately before write

- `main`: `c50cc48e6fa508592bda3f4838111e9cff5af80c`
- `release/tournament-ops-20261013-01`: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`
- `codex/game-catalog-editor-reliability`: `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`
- [PR32](https://github.com/C8LyNn/aplikacja-turnieje/pull/32) remains OPEN/UNMERGED, 51 commits, 856 files; source HEAD unchanged.
- PR [#7](https://github.com/C8LyNn/aplikacja-turnieje/pull/7) and [#27](https://github.com/C8LyNn/aplikacja-turnieje/pull/27) remain OPEN draft; T040 must reconcile both.
- Existing [CI push](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38407345710) and [PR](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38407744200) runs failed at Pack19; all later relevant workflow steps were SKIPPED.
- Exact full WEB-004 consolidated handoff not located; only supporting blueprint and partial agent-state files available (B001 OPEN).

## Created and readback-verified task branches

| Owner | Branch | BASE SHA | Authorization |
|---|---|---|---|
| 10 / T010-A10 | `fix/web-005/t010-pack19-contract` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | Conditional GO: minimal source test correction; no broad refactor |
| 20 / T020-A10 | `fix/web-005/t020-migration-reconciliation` | same | GO analysis only; SQL/files migration changes require additional 00 approval |
| 30 / T030-A10 | `fix/web-005/t030-steam-catalog-write-auth` | same | Conditional GO: route auth + isolated fixtures; no prod secret |
| 60 / T130-A60 | no implementation branch | same audit baseline | GO: independent matrix, diff review/test results |

**Coordinator-only register branch:** `chore/web-005/t000-wave1-control`; registers at `docs/web-005/BACKLOG.md` and `docs/web-005/DECISIONS.md`. Control branch is NOT main/release and must never be confused with a release approval.

## Worker 10 order

Inspect `qa/pack19/source-contract.test.mjs` and `artifacts/api-server/src/routes/tournament-se-correction-readiness.ts` on pinned SHA. Test expects `isolationLevel:"repeatable read",readOnly:true` while Drizzle router uses `accessMode:"read only"`. Repair contract only; preserve snapshot read-only semantics/organizer guard/no writes. Before/after `node --test qa/pack19/source-contract.test.mjs`; readiness tests; then other packs and Pack17 full only with isolated PostgreSQL TEST and explicit cost-safe execution. Produce small diff and test evidence; independent A60 review; draft PR only, no merge. Stop on branch drift, unexpected ORM runtime bug, unapproved CI cost/prod access.

## Worker 20 order

Compare `main` 0001–0026, release 0027–0031 and editor 0027–0038; note release 0030 correction journal/0031 receipts versus editor 0030 abstract world/0031 paginated indexes. Inventory ledger, checksums, FK, trigger/constraint ordering. Propose deterministic reconciled manifest, historical DB upgrade test matrix (clean, release-applied, editor-applied, partial) and rollback, with fixture-only PostgreSQL16. **Analysis only**, no SQL migration edits or execution before 00 accepts plan. Do not touch production/replit.

## Worker 30 order

Audit 3 unguarded release mutations: `POST /api/steam-catalog/taxonomy`, `POST /api/steam-catalog/import`, `PUT /api/steam-catalog/games/:id/classification`; review `requireSteamCatalogAdmin` on editor reference branch. Apply narrow fail-closed catalog admin auth in task branch if contract clear. Negative tests: anonymous/viewer/support/organizer-without-catalog-admin, bad token, no config; positive dedicated catalog admin; verify no DB changes on denied requests and public GET preserved. No real token read or production activation; independent A60 review; no merge/deploy.

## Worker 60 order

Prepare QA_MATRIX; for all worker HANDOFFs inspect exact commit diff + execute available isolated tests and return PASS/FAIL/BLOCKED/NOT_EXECUTED. Never label old CI or static inspections as current PASS. Minimum Pack19/20–26/Pack17, migration clean & upgrade/ledger, 3 auth routes negative/positive, and release-wide safety test inventory. QA remains independent and owns no implementation code.

## Operational restrictions

- Replit FROZEN. No live UI/API/DB, runtime secrets, schema changes, deployment, merge, paid CI reruns without explicit owner approval.
- `main` and release preserved. No cross-task file writes; 00 only manages control docs; T010/T020/T030 exclusive ownership per scope.
- Max 3 implementation lanes + 1 QA; T040–T120 HOLD except backlog planning.
- No producer code changes, local DB tests, QA execution, or new workflow runs confirmed by this coordinator operation.

## Decision and blocker summary

- D003: T010 conditional GO; D004 T020 analysis GO; D005 T020 SQL STOP; D006 T030 conditional GO; D007 T130 QA GO.
- B001 missing consolidated WEB-004 handoff; B002 CI Pack19; B003 migrational ordinal collision/unknown ledger; B004 catalog token provisioning; B005 production SHA unknown; B006 independent QA release gate missing; B007 unprotected branches.

## Next physical action and reporting

User/coordination layer must deliver these orders to the already-created worker conversations; the GitHub connector cannot post a ChatGPT message to another thread. On receipt of each `WEB-005-Txxx-Ayy-R1` report, 00 checks commit & results via GitHub and updates BACKLOG/DECISIONS with citation. T130-A60 verifies diffs independently, then 00 determines rework/PR_READY/accepted. No task is ARCHIVED yet.

**Evidence grade:** SOURCE + historical CI only; NEW TESTS = NOT_EXECUTED; production deployment SHA = UNKNOWN.