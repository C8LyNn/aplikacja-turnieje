# WEB-005 — A80 / DEVELOPMENT FIRST WAVE 2 / WAVE2_HANDOFF

**Role:** A80 — Stage Lifecycle & Sporting Rules
**Date:** 2026-10-18 Europe/Warsaw
**Priority:** HIGH / role-scoped feature development without destructive PG16.
**Final classification:** SOURCE_PATCH_PUBLISHED / DRAFT / INDEPENDENT_A60_QA_PENDING / TARGET_NODE_TAP_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.

## 1. Highest-impact independent task and authenticated source baseline

Continued existing A80 Swiss S3/S4 scope, not a new project. Verified:

- [PR57 Swiss score-first and BYE](https://github.com/C8LyNn/aplikacja-turnieje/pull/57), unchanged HEAD **a57fe31c1bc123c5217b3f58bcdd34750c64c5c6**, base release **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**; prior independent A60 source acceptance was scoped/conditional.
- [PR102 bounded full-sweep fallback](https://github.com/C8LyNn/aplikacja-turnieje/pull/102), unchanged HEAD **b2bbfd2bac32c81f2876138bf53273e61eccac0b**, stacked on PR57; source Swiss Git blob **d6a93a2b13887f7a85c289f532acb8ecc98dfd11**.
- [PR61 two-stage Swiss caller PG test](https://github.com/C8LyNn/aplikacja-turnieje/pull/61), unchanged HEAD **8c26778c94cd6c96987f3986b651066024f10d4a**, a separate sibling of PR102 based directly on PR57. A60 [R23C independent verdict](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR61_A80_SOURCE_QA.md), blob **32076101a886572cc09f9e4db3b61cb6dd4e8f08**, is PASS_WITH_CONDITIONS only for source, physical PG16 test NOT_EXECUTED.
- [Issue #75 C02 A40/A10](https://github.com/C8LyNn/aplikacja-turnieje/issues/75), [Issue #77 independent A60/A10](https://github.com/C8LyNn/aplikacja-turnieje/issues/77), and prior [A80 development-first handoff](./WEB-005_A80_DEVELOPMENT_FIRST_HANDOFF.md), blob **9a8ab0a05e5373dc4a07b15a7caaca64e8c7295d**. Those are assigned to their owners; no composite or protected merge authority taken by A80.

**Selected one actual regression:** The 4 full score-neutral pairwise-swap sweeps added by PR102 can reach a strict 2-pair local minimum while a complete 0-rematch matching remains possible. For 18 entrants with equal matchWins=0 and **84 different prior completed no_contest pair encounters**, the PR102 two-pair fallback returns **one rematch**; a single three-pair exchange reduces it to **zero rematches without changing the primary gap=0**. All recorded no_contest matches carry no awarded wins. This is a reproducible **synthetic domain algorithm** witness, NOT physical production tournament/PG16 proof. Actual stage-B caller history remains stage-filtered by stageId and is not edited.

## 2. Real test-first isolated source publication

- **[New Draft PR #118](https://github.com/C8LyNn/aplikacja-turnieje/pull/118)** — `fix/web-005/a80-wave2-swiss-three-pair-local-search`, base **PR102** SHA b2bbfd2bac32c81f2876138bf53273e61eccac0b, exact HEAD **c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e**. OPEN DRAFT, unmerged.
- **Commit 1, test-first:** **fa639d79b0c8ab4a497f8a39d22093f02e4baa8d**; added `artifacts/api-server/test/swiss-three-pair-regression.test.ts`, Git blob **56e9fffe616de6b8447e2983a1cd6b0ce4a378ec**, **104 lines**. Tests a complete explicit 18-player 84-edge history, validates an independent 9-pair zero-rematch witness, enforces 0 actual repeated opponents, input-order determinism, 18 unique players, scoreGap=0, and a 65-player odd BYE/history regression with completed walkover/no_contest and cancelled.
- **Commit 2, minimal solver repair:** **c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e**; modified `artifacts/api-server/src/domain/tournament/swiss.ts`, Git blob **79bb0aaeb6c5fa43a6d3725ffe0c13ddb1e4edf4**, **+58/-0 lines** relative to PR102. No other changed paths. Exactly **2 commits ahead / 0 behind** relative to PR102.

**Algorithm contract and bounded cost:** Existing <=16-entry exact bitmask DP and existing >16 4 full pairwise-sweep fallback are unchanged. After pairwise sweeps, for up to **32 current pair slots (<=64 non-BYE entrants)**, enumerate all **15 perfect matchings of six players** across triples of existing pairs, for at most **two full index sweeps**. Accept strictly lower `(sum absolute matchWins gap, repeated opponent count)` tuple only; no equal/greater-cost exchanges. Deterministic order of rank/seed/ID and candidate enumeration, no RNG, no duplicate players or absent players. New neighborhood is bounded by 2 × C(32,3) × 15 candidate evaluations at worst, plus O(1) local cost. Remains a LOCAL optimizer, **not globally optimal Swiss pairing**, and above 64 non-BYE entrants the documented PR102 2-pair fallback remains. The 65-entrant case normally removes one stage-local BYE before matching the remaining 64.

## 3. Actual tests and independent QA gaps

### Completed safe model check

Executed a standalone deterministic Python mirror of PR102's exact two-pair search and the proposed three-pair local search on the explicit synthetic 18-player history. **Process exit 0**, asserted:

| Scenario | Old PR102 bounded fallback | New 3-pair improvement |
|---|---|---|
| 18 entrants / 84 historical NC encounter pairs | 1 rematch | 0 rematches |
| Sum of absolute wins gap | 0 | 0 |
| Distinct paired IDs | 18 | 18 |
| Zero-repeat complete matching independently verified | exists | satisfied in the mirror |

One strict triple change `(1,2),(4,7),(17,18) → (1,18),(2,4),(7,17)` is a score-neutral non-rematch repair in the witness. The Python mirror is **NOT** execution of the TypeScript implementation or of authored Node tests.

### Not executed / deferred to proper executor

- Native `node --import tsx --test --test-concurrency=1 ./test/swiss-three-pair-regression.test.ts`: **NOT_EXECUTED** (no complete authenticated monorepo checkout + installed pnpm10 workspace dependencies in A80 execution container).
- Existing Swiss unit `./test/swiss.test.ts` and PR102 `./test/swiss-fallback-adversarial.test.ts` on combined PR118 checkout: **NOT_EXECUTED**.
- Monorepo `pnpm --filter @workspace/api-server typecheck`: **NOT_EXECUTED**.
- Physical PostgreSQL 16, API integration, Replit live, browser, data mutations, SQL and migrations: **NOT_EXECUTED / NOT_REQUIRED** for new pure domain test.
- Actual runtime test evidence must include checked-out **PR118 exact HEAD**, Node/pnpm versions, commands, process exit, TAP and deterministic fixture outcome. Do not declare feature PASS from authored tests or mirrored model.

### Automatic GitHub CI

At initial exact-HEAD readback, [PR118 Actions run 39127456285](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39127456285) was **IN_PROGRESS**, not a PASS/FAIL yet. This report intentionally records the observation as at readback and requires later CI status/log evidence. Prior PR102 [run 39125558132](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125558132) was FAILED by old Pack19 snapshot assertion before new Swiss tests, not evidence against Swiss fallback.

**Independent A60 EXACT-SHA QA PENDING** on PR118 c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e. Please verify all 15 layouts generated only once, strict cost monotonicity, two-pass bounded 64-entry cap, 18/32/64/65 parity, exact PR57→PR102 ancestry and TypeScript test legality before source acceptance. Any new defect requires separate scoped fix and fresh exact-SHA review.

## 4. A10/A40 file DAG, boundaries and rollback

**DAG:** release → [PR57 S3/S4] → [PR102 two-pair full-sweep] → **[PR118 triple-pair search]**. Separately PR57 → [PR61 stage-scope PG16 test]. **Never double-copy swiss.ts**, do not silently merge stacked PRs, and do not treat inclusion in disposable composite as release authorization. A40/A10 own Issue #75 integration after C01 first-failure triage; A60/A10 own Issue #77 QA/append-only evidence. PR118 only touches Swiss source and a new Swiss test file, not the PR61 test or routes/tournaments.ts shared by other owners.

**No modifications to:** all game content/assets/Unity/HTML/logic, APIs, route/stage lifecycle/TS-B terminal reopen, SE actionableRound, DE S5/S6, standings/Buchholz, BYE computation, Basket CAS, Backup V3, SQL/Docker/migrations, Replit live or protected branches.

**Rollback:** discard standalone PR118 branch or revert only commits fa639d79... and c2b5bcfa...; parent PR102, PR57 and sibling PR61 remain identical. No DB or production rollback necessary.

**Owner/safety status:** Development-first function-only modification not contingent on R23H dangerous PG16 work; no shared PG operation, CI rerun, deployment, merge or SWARM-006 activation. **RELEASE_NO_GO** remains unchanged.

**FINAL:** `WAVE2_HANDOFF_PUBLISHED / PR118_OPEN_DRAFT / MODEL_EXITS_ZERO_SCOPED / NODE_NATIVE_NOT_EXECUTED / A60_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.