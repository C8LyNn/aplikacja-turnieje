# WEB-005_A90_R22_HANDOFF

**AGENT:** A90 — Backup V3 Integrity & Restore  
**TASK:** `WEB-005-T060-A90-R22-B2-CORE` · **WAVE:** R22.1, 2026-10-15 Europe/Warsaw  
**AUTHORIZATION:** L2 — NEW isolated test-first strict-policy validator, **NO importer/exporter wiring**.  
**PRIMARY REPORT:** [WEB-005_A90_R22_BACKUP_STRICT_CORE.md](./WEB-005_A90_R22_BACKUP_STRICT_CORE.md) — code design, tests, exact blobs, downgrade boundary, new A30/A20/A70/A110 dependencies and STOP.  
**NEW CANDIDATE:** [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56), OPEN DRAFT, label `R22_NEW_SOURCE_CANDIDATE`, head `fix/web-005/t060-b2-strict-policy-core-r22`, base `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**FINAL PR HEAD:** **`77707092202ca79277de7bc57cc4e37e4c033171`**.

## 1. Actual GitHub implementation and boundaries

**Commits, in test-first order:** `95f6ceddd029cad77df82218076433905438e6e9` (unit test definitions) → `1b55e0788ec995db306d637e63bf3fb15e5bdd71` (isolated pure module) → `77707092202ca79277de7bc57cc4e37e4c033171` (test-only TS structural correction).

**Diff vs pinned release base:** three commits, exactly two **ADDED**, no existing modified:
- `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` (+285, blob `c663c3d8347f22caf9375ae48a6f7670a6629d34`);
- `artifacts/api-server/test/backup-v3-strict-policy.test.ts` (+171, blob `fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc`).

No edits to existing [PR41 B1](https://github.com/C8LyNn/aplikacja-turnieje/pull/41), head `f03cf3d09988a04ba9c2856e205d21f994ff67f1`, nor [PR48 B3A](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), head `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`; both remain OPEN DRAFT/unmerged. No edits to current `backup-v3.ts`, existing focused integration test, OpenAPI/Zod, application route, SQL/DDL, migration, Undo writer or T055 basket source.

## 2. Owner choices and implemented pure scope

[Owner B1=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md); [A00 under explicit owner Backup-topic delegation B2=B, B3=A, B4=A, B5=A, B6=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md). **No repeat policy questions.** These are approved product choices, not automatic DB/import implementation authorization.

Pure strict-policy entrypoint proposed on new unintegrated metadata `strictPolicy`:
- B1 strict marker with `STRICT_MARKED / INVALID_PROFILE / UNATTESTED` classification; untrusted absence is NEVER automatically trusted legacy;
- B2 strict completed-match latest `resultHistory` congruence against source-confirmed tuple; strict missing history fails;
- B3 explicit independent positive `matchStateRevisions[]` for each match, **no equality** with history sequence;
- B4 typed `match_result_submitted` source-index completion actions, unique portable IDs and contiguous total order beyond ambiguous timestamps; needs A70 action-type/semantics signoff;
- B5 recognized nested Undo player/match references fail on missing/foreign IDs, arbitrary opaque numeric fields not interpreted as IDs;
- B6 typed **error code** `INVALID_BACKUP_V3` only, NOT HTTP 400 or rollback.

**Source status:** `SOURCE_CANDIDATE_ONLY / NOT_WIRED`. Existing importer unchanged. The proposed marker lacks producer provenance: dropping it returns `UNATTESTED` and strict function rejects, but **no live legacy-vs-modern downgrade prevention has been proven**. A30/A00 must first define positive safe historic provenance or gated serializer version; never silently accept stripped modern as legacy. New metadata is not yet generated V3 / exported by existing producer. Legacy V2/V3 legal importer and unsafe Undo degradation are not implemented by this module.

## 3. Tests actually executed / CI

**New code:** eight deterministic `node:test` case bodies authored first, including valid completed result and intentionally distinct CAS/history revisions, absent/contradictory history, action total order/ties, completion provenance, nested foreign recognized IDs, strict marker stripping, unknown profile version and typed errors. These use **focused synthetic projections**, not complete generated Backup V3 export/import/PG fixtures. **None has an actual runtime TAP receipt from this environment.**

**A90 native application test results:** `pnpm install / repo typecheck / tsx node:test / HTTP / PG16 = NOT_EXECUTED`, real exit/TAP for those commands **N/A**. The currently available environment has no authenticated full clean Git worktree plus frozen dependencies; A50 R21 reports 0 native app tests. A small standalone TypeScript syntax probe in the local environment was not compilation of either PR56 file and is not counted.

**Observed automatic CI on exact new HEAD:** [GitHub workflow 38646256645](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646256645), job `116133734773`: **FAIL in Pack19 snapshot consistency tests**; Pack20–26 and **Static and database release gates SKIPPED**. This is an inherited upstream contract blocker, **not** proof that PR56 unit tests failed or passed. PR35 owns separate old matcher fix. No manual/paid CI rerun initiated.

**A50 required non-DB test commands on separate clean exact SHA:** `pnpm install --frozen-lockfile`, `pnpm --filter @workspace/api-server run typecheck`, `pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-strict-policy.test.ts`. Real A50 or authorized tester records git HEAD, Node22/pnpm10 versions, command/exit and TAP. No DB reset required for this pure module.

## 4. Independent QA and conditional future GO

**A60 R21** ([source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md)) was on the **old PRs**, not PR56; `HANDOFF_NOT_READY`. **New PR56 has NO independent A60 exact-head acceptance yet**. Do not treat author review or automatic Pack19 as that signoff.

**Unblockers:** A60 exact PR56 SHA source QA + native focused typecheck/unit test; A30 strict marker-removal / historical producer attestation; A20 match CAS 0028 and future clone-local portability; A70 actual completion action event+LIFO semantics; A110 future T055 `basketConfigRevision` export/restore compatibility. Only A00 future file-scoped explicit GO could wire the module into import/export and API, create certified legacy-v2/v3 path, do SQL/PG tests, or address B3/B4 writers. PR41/48 shared file conflict remains future authorized integration work, not A90 R22.

**STOP:** no PR merge/rebase/cherry-pick, no release/composite, no production/shared SQL/migrations, no paid CI manual rerun, no staging/live, no SWARM-006. New PR56 remains independent draft.

**FINAL:** `A90_R22_NEW_PR56_SOURCE_CANDIDATE / TEST_FIRST_AUTHORED / NOT_WIRED / DOWNGRADE_CLASSIFIER_DEPENDENCY / A60_QA_PENDING / NATIVE_NOT_EXECUTED / CI_PACK19_BLOCKED / RELEASE_NO_GO / SWARM006_HOLD`.
