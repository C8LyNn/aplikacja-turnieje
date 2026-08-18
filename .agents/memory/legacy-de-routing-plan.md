---
name: Legacy DE routing-plan auto-generation
description: How missing routing plans are handled for legacy double_elimination tournaments at start time.
---

## Rule

`startStage()` now calls `ensureLegacyDeRoutingPlanExists(tournamentId)` before
`loadCompiledRoutingPlanV2` for every DE stage.  That function:

1. Exits immediately (no-op) if a plan already exists.
2. Exits immediately if the tournament is basket-authoritative
   (`basketFlowAuthorityVersion > 0` or any `stage_baskets` row present).
3. Otherwise compiles a canonical plan via `compileLegacyDeCanonicalPlan(stage)`
   — which uses `compileTournamentBlueprintV2` + `doubleEliminationFormatEngineV2`
   directly (same path as `basket-authority-routing-plan.ts`) — and saves it in
   its own transaction with `FOR UPDATE` on the tournament row (idempotent under
   concurrent calls).

**Why:** Legacy tournaments were created before the routing-plan requirement and
have no plan row, causing a 500 on every start attempt.  Automatic generation is
safe only for the legacy case because basket-authoritative tournaments derive
their plan from basket config; those must go through the proper wizard.

**How to apply:** Any change to the legacy plan compilation logic (e.g. adding a
new format option) must update `compileLegacyDeCanonicalPlan` in
`legacy-de-routing-plan.ts`.  The function is also exported for unit tests.

## Readiness check

`getStageStartReadiness` now queries plan + basket tables for DE stages and
populates `routingPlanStatus: { exists, legacyAutoGeneratable }` in the snapshot.
`assertStageStartReady` surfaces `ROUTING_PLAN_MISSING` (422) for non-auto-
generatable DE stages that lack a plan, preventing the false-READY → 500 path.

## Test file

`test/legacy-de-routing-plan.integration.test.ts` — 10 scenarios.
Run with: `TEST_DATABASE_URL=…/heliumdb_test TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA node --import tsx --test --test-concurrency=1`
The test file is NOT yet part of the `test:integration` npm script; add it when
the CI matrix is next updated.
