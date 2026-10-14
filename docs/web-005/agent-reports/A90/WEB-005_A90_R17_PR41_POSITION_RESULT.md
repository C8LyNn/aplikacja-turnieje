# WEB-005 / A90 R17 — PR41 sourceBasketPosition parity result

**TASK:** `WEB-005-T060-A90-B1-POSITION-R17` · **AGENT:** A90 / Backup V3 Integrity & Restore · **WAVE:** R17.1 · **DATE:** 2026-10-14 Europe/Warsaw  
**AUTH:** CONDITIONAL L1 on **existing** PR41 branch only. **OUTCOME:** `PATCH_REVISED / RUNTIME_NOT_EXECUTED / A60_PENDING`.  
**Original R16:** [R16 recovery evidence](./WEB-005_A90_R16_RECOVERY_RECORD.md) — `R16_ARTIFACTS_UNAVAILABLE`, no verified original R16 patch/report URL. Changes below are **newly authored R17 commits**, not falsely backdated R16 output.

## 1. Verified GitHub source, exact changes

- [**PR #41 — B1 Backup V3 integrity**](https://github.com/C8LyNn/aplikacja-turnieje/pull/41): `fix/web-005/t060-b1-backup-v3-integrity-r9` → `release/tournament-ops-20261013-01`.
- **OLD HEAD at R17 intake:** `e847cb705296a48ab5c68ece96776cd0e0bbb417`.
- **NEW HEAD after R17 scoped patch:** `f03cf3d09988a04ba9c2856e205d21f994ff67f1`.
- **Release base:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **New compare delta old→new:** 5 commits, **only two application file paths**:
  - `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` **+41/-0 lines**.
  - `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` **+154/-0 lines**.
- **Unchanged:** `application/backups/backup-v3.ts`, import/export contracts, V3 generated schemas, migrations/SQL, legacy importer, B2 revision/history, [B3A PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`, all other agent lanes.
- **No new PR, no merge, no composite branch.** PR41 still OPEN DRAFT.

### Test-first commit chronology (not a RED/GREEN runtime claim)

| Commit | Action |
|---|---|
| `ce0998fe8dea37c0f6fa3b18b31e1659cde3d962` | **First:** add position parity positive, null-legacy and corrupt mutation test *definitions* |
| `a5e7bd7e0ee368b4c5100f091020e5f0b4cdeeb6` | Implement minimal QPE per-basket rank-order and nullable route receipt position validator |
| `ff69266eab1ada0c60b52734d61f40908fda6aac` | Correct test-only missing-field TypeScript casts |
| `6c8f909805719b0af16a77a0385240894abb410a` | Add explicit **non-null** source position restore round-trip assertion |
| `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | Add deliberately late PostgreSQL INT4 overflow and all relevant clone-table rollback fixture |

No `RED failed` or `GREEN passed` is asserted: authored source tests were **not executed by A90**.

## 2. Exact B1 logic and compatibility boundary

**Existing source** already checks QP stage and output ownership, QPE↔OP set parity in `(basketId,playerBackupId,placementRank/finalRank)`, uniqueness of ranks/players and `(basketId,basketPosition)`, and source output ↔ executed receipt player/rank multiset. The **gap** was that a QPE basket position could be swapped while OP ranks stayed valid, and a route receipt's `sourceBasketPosition` was not bound to its exact QPE entry.

**New source-confirmed logic on PR41:**
1. Within each output basket, sort source QPE entries by global `placementRank` and require `basketPosition` = 1,2,... within that basket. This follows actual `buildQualificationProposal` generator source (`basketPosition: i - cursor + 1`). Detects swapped, missing, fractional or noncontiguous position (existing validator separately checks positive rank/position).
2. Within each executed route, find QPE position by **(source basketId, playerBackupId, global placementRank)**. If `sourceBasketPosition` is a **non-null number** in the immutable receipt, require positive integer and exact equality to the matching source QPE position. For a missing field `undefined` reject; for explicit **`null` allow**.
3. The **`null` exception is necessary**, not an accidental bypass: existing application `executeBasketRoute` actively writes `sourceBasketPosition: null` in its route entries; the public generated route-record type is `number|null`. Requiring every receipt to carry a number would silently invalidate current legal exports. The QPE rank-order invariant still checks the source positions when the receipt position is null.
4. OP itself contains `basketId`, `playerBackupId`, `finalRank` **but no basket position**. Existing approved QPE↔OP bijection therefore binds the same player/basket/rank; the new QPE order and optional explicit receipt check close the available position provenance without inventing an OP schema field or retrospective historical data.
5. Older V3 with *no optional Phase2/3 collections* bypasses this new check; records with **explicit null** receipt position remain valid. Missing a required route-entry property (undefined) is malformed in the current generated type, not equivalent to null. If there are unknown historical producers emitting a different interpretation of `basketPosition`, A00/HQ must document evidence before changing the rule; this patch does not change B2 legacy/revision policy.

**Boundary:** Not a portable `matches.revision` fix, not an Undo/History B2 policy decision; not a rewrite of basket execution or approved output serialization. No undocumented source value imputation.

## 3. Test-first synthetic fixtures and expected evidence

Existing test `Backup V3 B1: qualification and route corruption rejects before clone` retains its **12** table-driven corruption mutations in one `node:test` case. New additional test `Backup V3 B1: per-basket order and route source positions are fail-closed` defines:

| ID | Fixture | Expected behavior |
|---|---|---|
| P1 | **Current** exporter-generated valid QPE/OP/route with `sourceBasketPosition:null` | `validateBackupV3` accepts (legacy/current producer compatibility) |
| P2 | Copy of same valid synthetic export where each receipt has explicit **correct** QPE basket position | Validator accepts, HTTP import success, restored `stage_basket_route_entries.source_basket_position` equals exact supplied positions |
| N1 | Swap QPE positions, keep OP ranks/players unchanged | typed `BackupV3ValidationError` + HTTP `400 INVALID_BACKUP_V3`, zero additional clone roots |
| N2 | QPE gap `basketPosition=20` but unique and positive | same preclone rejection |
| N3 | QPE `basketPosition` omitted | same preclone rejection |
| N4 | Swap receipt positions across two players, retain matching ranks | same preclone rejection |
| N5 | Receipt position `99` for unchanged player/rank | same preclone rejection |
| N6 | Receipt position `0` | same preclone rejection |
| N7 | Receipt position property omitted instead of explicit `null` | same preclone rejection |
| RB1 | Synthetic valid export with one player `seed=2147483648` (legal positive number for V3 validator, **outside PostgreSQL INTEGER range**) | Preclone `validateBackupV3` accepts; after clone root/stages, DB integer overflow must cause HTTP non-2xx and transaction rollback; compare pre/post 13 fixed clone-parent/child-table counts, distinguish DB failure from preclone `INVALID_BACKUP_V3` |

The late failure fixture mutates **only synthetic data**, not database schema or triggers. It relies on `players.seed INTEGER` in `lib/db/migrations/0001_series_v1_clean_cutover.sql`, and player insertion occurring after cloned tournament/stages in `importBackupV3`. It verifies transactional atomicity, **not** a newly introduced importer patch. Neither the late failure nor the 7 new negative fixtures have been executed yet; their outcomes are acceptance criteria.

**Existing independent B1 negatives still apply:** wrong source basket/stage, duplicate arrival, source proposal rank/revision mismatch, and legacy absence of Phase2/3 receipts. The new suite extends, not replaces, them. Each new negative scenario executes within **one test body**; do not incorrectly count as 7 individual TAP PASS cases.

## 4. CI, A50 runtime and A60 independent gates

**Source-state:** `PATCH_REVISED`; **independent verdict:** `A60_REVIEW_REQUIRED_ON_NEW_SHA`. The [A60 R15 source matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) had `SOURCE_BLOCKED_FULL_QP_QPE_OP_PARITY` on **old** SHA `e847...`; do not carry an old verdict over the changed HEAD or self-approve.

**A50 environment:** original [R15 evidence](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) reports no full checkout/pnpm or physical PG16 execution. **A90 actual application tests: NOT_EXECUTED**; typecheck `NOT_EXECUTED`; integration PG16 `NOT_EXECUTED`; no exit/TAP or positive evidence. Automatic GitHub Actions may start on commits, but Pack19 old release matcher was previously blocking native DB gates; only actual new SHA workflow records can be attributed to this patch, and a prior gate failure does not validate these tests.

**A50 exact commands (only on owner-approved setup):**

~~~sh
git fetch origin fix/web-005/t060-b1-backup-v3-integrity-r9
git switch --detach f03cf3d09988a04ba9c2856e205d21f994ff67f1
git rev-parse HEAD
node --version     # Node 22
pnpm --version     # pnpm 10
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
# Only if A20 confirms dedicated physically isolated disposable PG16 and
# A00/owner supplies written DB reset authorization; no shared/production DB.
# TEST_DATABASE_URL must be explicitly injected as approved test-only secret.
TEST_DATABASE_SCHEMA=tm_test_a90_r17 TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
  pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

**Test DB safety:** `test-database.ts` calls `DROP SCHEMA IF EXISTS ... CASCADE`; `tm_test_*` naming alone is not physical isolation. No fallback to production; no secrets printed. A50 must supply full exact SHA, environment (redacted), permission/reset-scope evidence, actual command + exit, TAP totals, positive restored positions and pre/post row counts. A60 independently confirms the new SHA source semantics and assesses whether QPE monotonic-order validation impacts any documented valid legacy snapshot. **Do not grant `RUNTIME_VERIFIED` or `SOURCE_ACCEPTED` before that.**

## 5. Remaining dependencies / GO-STOP

- **A60:** review `f03cf3d...` and test oracle; either `SOURCE_ACCEPTED` or specific `SOURCE_BLOCKED` with narrow evidence. No author self-review.
- **A50/A20:** real physically isolated PG16 + Node/pnpm checkout and affirmative reset consent; evaluate seven negatives, existing 12 mutations, legal null, explicit non-null restore and late rollback; no PLAN-only substitute.
- **A00:** preserve current candidate P08 history, old/new SHA and changed-file delta; ask HQ to confirm known historical basket-position interpretation if A60 identifies a concrete counterexample.
- **B2 owner:** portable history/revision/legacy and Undo semantics remain `POLICY_OPEN` D1–D6 per [A90 R15 signable policy](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A90/WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md).
- **Conflict:** PR41 vs PR48 both edit `backup-v3.ts` and shared `stage-basket-route-execution.integration.test.ts` in different candidate states; no integration in WEB-005. Future SWARM-006 only **after** complete final WEB-005 closure and owner/HQ authorization.
- **Hard stop:** no new PR; no source outside existing PR41 2 files; no B3A PR48 merge; no DDL/migration/production import; no deployment; SWARM-006 HOLD.

**FINAL status:** `PATCH_REVISED / TEST_DEFINITIONS_COMMITTED / NATIVE_TESTS_NOT_EXECUTED / A60_REVIEW_PENDING / RELEASE_NO_GO`.
