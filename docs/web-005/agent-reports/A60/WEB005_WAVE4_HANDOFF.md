# WEB-005 — A60 / DEVELOPMENT FIRST WAVE 4 — INDEPENDENT QA HANDOFF

**ROLE / TASK:** A60 — Independent QA & Release Gates · WAVE4 cross-application non-destructive QA · **DATE:** 2026-10-18 · **STATUS:** `PARTIAL` (safe scoped tests DONE, end-to-end integration BLOCKED). **NO RELEASE GO.**

## 1. Pin the actual candidate

- **C02** [Draft PR #101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101): **BASE** original C01 `fa3261b2c9510e110ac9eba21726812d3401a525` ([Draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60)); **HEAD** `a5bfd07b822c223fd995604dc2e228935ab81498`, re-read independently. **C02 HEAD is not a standalone released product.** [Automatic run 39125456595](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125456595), job `117669533771`, finished **FAIL** at **Static and database release gates**.
- **C02 changes relative to C01:** only five paths — `artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`, `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts`, corresponding two `artifacts/api-server/test/*.test.ts` files, and `docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md`. These are **DB-free, unconnected Backup V3 validators**, not new integrated tournament creation/stage/match behavior. In particular C02 **does not wire** provenance validator into preclone action port nor authorize import/Undo/CAS.
- **A50 current Wave4 diagnostic work** [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), last exact SHA observed `7befb8bbfc9d150469e5405859b0e8b4e789f8a6` (moving independent branch). A50 reports `process.exitCode` preserves output flush and **3/3 synthetic static tests PASS** but first original C01 PG16 API integration failing assertion/root cause remains **UNKNOWN**. This A60 run did not execute those three tests and does not treat them as independent PASS.
- **A110 CAS** [Draft PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) was last observed at `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` and **is not incorporated into C02**. Keep feature OFF pending exact-new-SHA frontend/authorization QA. No overlap was introduced by A60.

**A60 code changes:** `NO CODE CHANGES`. A60 writes only this new docs report + optional SHA256 sidecar on isolated docs branch; all executable tests were local temporary read-only copies verified against exact original Git blob OIDs.

## 2. Actually executed test matrix (C02 exact source blobs)

| Scope | Executed command, binary provenance, original Git blob source | Actual outcome |
|---|---|---|
| **Round Robin match schedule** | `node --experimental-strip-types --test test/round-robin.local.test.ts`; exact **source** `589702a7e8fe3e26baf0867286b16e06dae03353`, exact original **test** `9dadb0ae76823009df614b814f25d52ee330871f` verified via `git hash-object`. Only isolated test import suffix `.ts` changed for Node22. | **4 PASS / 0 FAIL / 0 SKIP / exit 0**, for 3–6 participants. TAP SHA256 `2a52d633c83e9f456baee90bf3968069a04c8cb552792bab81d53e8952dc7c07`. |
| **Results BO1/3/5 and invalid series** | A60 independently authored pure tests run against exact unmodified `src/domain/match/series-result.ts` Git blob `3aa22ad7b4b5acb887a5d45e5f338dbd20e63a1a`: `node --experimental-strip-types --test test/series-result.wave4.test.ts`. | **14 PASS / 0 FAIL / 0 SKIP / exit 0**; valid winners from score and negative BO/score/threshold validations. TAP SHA256 `10436b095fcb0f191c328e91e61c45163f3b93eaa381c6c1033dc46b4ae8afb1`. |
| **Round Robin boundary/property smoke** | `node --experimental-strip-types --test test/round-robin.a60-property.test.ts`; same independently verified exact RR module, A60 synthesized 0/1/2/7/8/9/16/32-player fixtures. | **8 PASS / 0 FAIL / 0 SKIP / exit 0**; uniqueness, round collisions, deterministic reversed input and source-array immutability. TAP SHA256 `e5e1f731b7a2d76d56fe3cd4e498bbf6d0da2f2729ba1d22abf51ad610bf3fe6`. **Audit note:** the first A60-generated assertion used `n*(n-1)/2` at `n=0`, producing JS `-0` and a **test-only** 7/8 FAIL (exit1); test was corrected to expect literal 0, app source unchanged. Original failed TAP preserved: `a2292e2799a504154f69bb1a246a6d92eaa459a8c3970f216c1fdf4538fef416`. |

**Native sum, latest corrected executions: `26/26 PASS, 0 FAIL, 0 SKIP`, all exit 0.** Node `v22.16.0`, Git `2.47.3`. There is NO `pnpm` binary or complete pinned monorepo dependency tree in this sandbox. **No full API server, HTTP, frontend React, migration, Docker, PostgreSQL, TS monorepo typecheck or browser tests were performed by A60.** Independently authored test cases are identified as such; no claims are made that they are upstream repository test files.

## 3. Cross-lifecycle C02 SOURCE-ONLY contract probe

**Executed read-only source checks:** 30/30 positive exact-SHA static predicates across eight original Git blob sources. This verifies that the examined implementation contains specified branches, entrypoints and guards; it **does not execute the creation→registration→stage→match→result transaction cycle**.

| Boundary | Verified exact Git blob and contract |
|---|---|
| Create tournament + stage plan | `create-tournament-with-plan.ts` blob `3d53ab665324e493fbced390091753efa03b8954`; validation `validateTournamentStagePlan`, transaction, tournaments insert, first stage generated and `tournamentStagesTable` persistence for subsequent stages. |
| Register participants | `tournament-roster.ts` blob `1a9184d92736b5c2bcca07bb0d3067a0f7b314ce`; exported add-player operation, draft-only roster, duplicate-name rejection, limit, transaction. Historical Undo action and session permission behavior not executed. |
| Stage readiness, start and complete | `stage-start-readiness.ts` blob `47c54afa8dd60fee3c105f05af2a50c1e9cd36ad`; `stage-lifecycle.ts` blob `e344fd4198e081a3a4574d976829665bea71fb6a`; readiness evaluator, start/complete entrypoints, incomplete matches block transition, SE/DE/Swiss/RR coverage in code. No actual multi-stage DB advance run. |
| Complete match + version guards | `complete-match.ts` blob `fa77dc80c1250766ed73db605f985abc7b2fa591`; series winner derived from score, `expectedRevision` CAS guard, finalized match cannot be completed twice, elimination no-contest blocked. |
| Organizer progression | `tournament-operations.ts` blob `77a5eeb9ab538247a950cec5531936b6078b6535`; draft min participants, proposed next action, incomplete earlier Swiss round guard. |
| Standings and edge results | `standings.ts` blob `2f87df4e6ce5d62580197cc0b2ea7d283f8a6efd`; completed-match projection, Swiss BYE, no-contest exclusion. No UI/server parity run. |
| Full-cycle integration coverage | `tournament-stages-full-flow.integration.test.ts` blob `33bc863c5dd0eddc2eb759aa35927c550121481c`; full Swiss 16 → Group 8 → SE 4 authored, **REQUIRES** `getSafeTestDatabaseConfig`, SQL/test schemas and authenticated PG16; **NOT RUN**. |

**Source check audit note:** the first static predicate erroneously looked for `stagesTable`; actual code uses `tournamentStagesTable`. Corrected the *A60 probe only*, re-fetched the exact original blob and **final 30/30 PASS**. This was not a discovered application bug or a native test.

## 4. Critical actual gaps / conflicts and decisions

1. **P0 INTEGRATION BLOCKED — C01 API first-failure**: original C01 API integration exit 1 unresolved; **C02 CI fails** release gate. Wave4 A50's exit/flush diagnostics fix is **not** an API product bug fix. No authentic successful native PG16 test or release GO.
2. **End-to-end workflow NOT TESTED**: create tournament HTTP→players→stage start→match completion→standings→stage completion requires a known disposable DB, run-owned schemas and authoritative API/auth roles. That chain was intentionally **not run** here. The scoped results are DB-free, not `C02_INTEGRATION_PASS`.
3. **C02 SOURCE ASSEMBLY INCOMPLETE**: C02 includes older PR66/PR64 Backup validator blobs. A10/A40 must reconcile newer [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) and [#104](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) **2+2 directly overlapping paths**, then rerun combined exact-new-SHA tests. No automatic cherry-pick/merge. No importer/auth authority implied.
4. **Gameplay and live preservation**: C02's only five changed paths include **zero** game sources/assets, `stream/animated-effects`, frontend UI, Steam/admin auth or migrations. That is **SOURCE_DIFF_PASS only**, not verified Replit/live parity. [A140 #116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) owner controls live preservation; [A110 #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) Basket CAS feature remains OFF until authorized client/server QA.
5. **Sporting/UI separate scope**: A80 owns Swiss/SE/DE/RR corrections, A70 match/Undo, A120 bracket/standings/audience/stream browser/regression. Their authored or independent exact-sha results should be integrated only after A10 registry and A40 owned candidate; A60's 26 pure tests cannot substitute browser, DB, results concurrency, admin access or feature parity.

**Release label:** `SOURCE_CONTRACT_30_PASS / DBFREE_NODE_26_PASS / DB_NOT_TESTED / C01_API_FAILURE_UNKNOWN / C02_CI_FAIL / RELEASE_NOT_APPROVED / SWARM006_HOLD`.

## 5. Minimal next actions, owner and safe release/test threshold

- **A40 + A10:** produce a new C02 integration candidate with explicit inclusion/exclusion DAG and exact SHA; replace old PR66/PR64 blobs with individually QA-accepted PR100/PR104 only after full checkout tests and A10 collision report. No blind Replit sync.
- **A50:** preserve first real failing API test name/exit/full private TAP; continue [PR105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) diagnostic-only scope. If a product defect is confirmed, publish its own isolated source+regression SHA; do not mask original CI exit 1.
- **A20 + A00 + Windows operator:** when separately authorized, provide disposable isolated PostgreSQL16 source/role/DDL envelope and per-phase approval. Only then run full native original end-to-end cycle and 36 API integration entrypoints; no implicit G0 from this DB-free report.
- **A70/A80/A110/A120:** per-role targeted pure and frontend tests on the exact future composite SHA; verify Undo replay/401/403 drafts, sporting rematches/BYE/stage invariants and real bracket/standings/stream direct-load.
- **A60:** on exact new composite SHA rerun safe native typecheck/unit/frontend tests and inspect actual logs/TAP, compare game/stream/admin protected blob hashes, and label SOURCE, TEST, DB and RELEASE independently. **No release acceptance until an owner-authorized integration gate and A00 decision.**

## 6. Evidence, mutations and ownership

**Local evidence ZIP:** `WEB005_A60_WAVE4_QA_EVIDENCE.zip` (attached in this conversation), SHA256 `bbe34d2bb289a4fb48adcf41f71cf5c252302b02667efd96085a34afbfe6bb06`, verified ZIP CRC. Contains exact RR + played series original source blobs, original RR upstream test copy, A60 independent test scripts, four TAP logs (including the superseded failed test-only run), per-file SHA256/exit metadata manifest. No secrets/logs from production or PG16.

**A60 CHANGED PATHS:** documentation-only `docs/web-005/agent-reports/A60/WEB005_WAVE4_HANDOFF.md` and its checksum sidecar on A60-owned docs branch. No audited PR branch touched. **PROHIBITED OPERATIONS executed:** none — Docker=0, SQL=0, PG16=0, migrations=0, CI dispatch=0, Replit edits=0, game/stream/admin code edits=0, merge=0, deploy=0.
