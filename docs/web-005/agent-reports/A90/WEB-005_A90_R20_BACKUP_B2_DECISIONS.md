# WEB-005 — A90 / R20 — Backup B2 owner decision and B1/B3A acceptance gate

**TASK:** WEB-005-T060-A90-R20 · **ROLE:** A90 — Backup V3 Integrity & Restore · **DATE:** 2026-10-14 (Europe/Warsaw)  
**AUTHORIZATION:** `SOURCE_ONLY` / product-policy alternatives, source-QA reconciliation, test contract. No code lane, no merge/rebase/cherry-pick, no release, no staging/live, no production/shared PostgreSQL, no SWARM-006.  
**REPO:** `C8LyNn/aplikacja-turnieje`; **release source** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**R20 documentation:** `docs/web-005/a90-r20-backup-b2-decisions`; this is **not** an owner signature or a release approval.

## 1. Exact source evidence and scope

| Item | Current live GitHub HEAD; status | Independent evidence | R20 state |
|---|---|---|---|
| P08 / B1 [PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1`; `OPEN DRAFT`, not merged, same release base | [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), source blob `a8482fa7137f1d71817c8b4ec43da7d6292f8183` | `SOURCE_ACCEPTED_CONDITIONAL`; PG16 actual tests `NOT_EXECUTED` |
| P15 / B3A [PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`; `OPEN DRAFT`, not merged, same release base | Same A60 R18 [21-package matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json) | `SOURCE_ACCEPTED_CONDITIONAL`; PG16 actual MVCC checks `NOT_EXECUTED` |
| Pack19 contract [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c`; separate OPEN DRAFT | Separate matcher repair | Never include in PR41/48 or rerun paid CI without GO |
| A50 [R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md) | blob `412117e31c297353b35a3c21fbd616d41754d4b6` | Node 22.16.0/Git 2.47.3 preflight; no full checkout (`git -C /mnt/data rev-parse HEAD` exit 128), pnpm10, approved PG16 or DB reset GO | **0 native application tests**, no typecheck/API/PG exit/TAP |
| A60 R19 new-signature search | Expected central A60 R19 report paths 404 and no A60-R19 named docs branch found in consulted repo scope | A60 R18 report *does* explicitly cover the unchanged PR41/48 SHAs | No invented new R19 QA or PASS; preserve verified R18 scoped source verdict only |

**A90 R20 actual commands executed:** GitHub API file/PR/source/QA review and Markdown publication only. **No Git checkout, pnpm, PostgreSQL connection, schema reset, HTTP API test, typecheck, build or TAP. `NATIVE_RUNTIME=NOT_EXECUTED`; actual application exit codes: N/A.**

**Known GH Actions blocker:** [PR41 exact-head run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193) failed upstream in old Pack19 `readOnly:true` matcher, whereas B3A code uses Drizzle `accessMode:"read only"`. Downstream static/database gates skipped. This **does not** establish feature-specific B1/B3A FAIL/PASS; PR35 owns the separate change. No paid manual rerun.

## 2. Backup B1 — source-frozen QA matrix for A50

**Exact PR41 source:** `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` + `artifacts/api-server/src/application/backups/backup-v3.ts`; authored tests `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` at current SHA.

**SOURCE_CONFIRMED:** A60 accepted QP/QPE→approved output (OP) player/basket/rank parity, QPE `basketPosition` 1..N per output basket by rank, and non-null executed receipt `sourceBasketPosition` parity with the exact QPE player/basket/rank. The **actual route writer may emit `sourceBasketPosition:null`** — legal current/legacy V3; malformed missing required field is a different negative case. OP has no portable source basket position field, so do not invent one. No R20 code change.

| ID | Synthetic case | Required real isolated PG16 acceptance |
|---|---|---|
| **B1-P1** | Current exporter-generated valid approved Phase3 QP/QPE/OP + executed route; `sourceBasketPosition:null` as emitted | Validator accepts, HTTP import 2xx, post-import restored proposal/OP/receipt/participants, re-execution idempotent |
| **B1-P2** | Valid legal older V3 *without optional Phase2/3 arrays*; approved but unexecuted route where historically lawful | Preserve positive import; no invented required Phase2/3 fields or executed-route quota for unexecuted route |
| **B1-P3** | For the same synthetic valid export replace null receipt positions with **matching** numeric QPE per-basket positions | Validator and HTTP import 2xx; database readback of `stage_basket_route_entries.source_basket_position` exactly matches portable source |
| **B1-N01–N07** | Swap QPE positions, QPE gap, omit QPE position, swap receipt positions, wrong `99`, zero, omit required receipt property instead of null | Typed `BackupV3ValidationError` **before first clone INSERT**, HTTP `400 INVALID_BACKUP_V3`, zero committed clone root and children |
| **B1-N08–N19** | Existing 12 corrupted QP/QPE/OP/route cases: missing/wrong OP, wrong basket/rank/player, orphan/pending/stale proposal, incomplete/misdirected/extra/duplicate arrival | Same typed preclone 400 and zero clone rows. These **12 variants are one table-driven Node test body**, not 12 separate TAP PASS events |
| **B1-RB1** | Inject `players[0].seed=2147483648` in synthetic validator-valid V3. Exceeds PostgreSQL `INTEGER` after tournament/stage clone inserts | Genuine **late** database error, not preclone `INVALID_BACKUP_V3`; no success response; rollback of tournament and 13 allowlisted clone/child table counts with FK/orphan sanity |

**Evidence precision:** The seven new position negatives also live within **one** Node test body. Current preclone negatives count clone tournament roots by name; **do not claim a preclone child-table census is already asserted per each N**. The 13-table pre/post census is authored for the late-overflow fixture, not executed or evidence of full rollback yet. A50 must produce actual typed-status/zero-write and late-rollback receipts.

## 3. Backup B3A — isolated PostgreSQL MVCC snapshots for A50

**Exact PR48:** `exportBackupV3` uses one `db.transaction(...,{isolationLevel:"repeatable read",accessMode:"read only"})`; the compiled route plan is loaded with `loadCompiledRoutingPlanV2InTransaction(tx,...)`. This is **SOURCE_CONFIRMED**, not a connected transaction-isolation observation.

1. **B3A-M1 — root/stage/match barrier:** exporter E has read root; writer W on **a second PG16 connection** commits changed tournament name, stage title, match note; E resumes. E must contain the entire **old** cohort; a later independent export E2 must contain the entire **new** cohort. No torn state.
2. **B3A-M2 — approval/route barrier:** E has read root; W approves QP, materializes OP and executes route; E resumes. E must have only the **pre-approval** cohort with no new QP/OP/receipt; E2 after committed W must have the complete approved proposal, outputs and executed route receipt.
3. **B3A-M3 — proposed supplemental result history:** E reads root; W atomically writes a completed result and matching `result_history`; E consistent old match/history and E2 consistent new. **NOT already authored/executed in PR48**; requires future test-file authorization, not an R20 code lane.
4. **B3A-M4 — session guard / safety:** source and native PG16 introspection confirm `transaction_isolation=repeatable read`, `transaction_read_only=on`, same `tx` including helper; exporter error never returns a successful half-built V3. Preserve V3 legal legacy positive route round-trip.

**Execution boundaries:** Test PR41 and PR48 on **separate clean exact-SHA checkouts**, never in one R20 composite branch. No inferred cross-PR combined test PASS.

## 4. Owner/HQ B2 portable history/Undo decision card (UNSIGNED)

**TICKET:** `POLICY-BACKUP-B2-PORTABLE-HISTORY-R20`; **BLOCKER:** no signed choices in checked [DECISIONS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md), R19 A90 report or A60 R18 gate. **A90 selects none of the options below.**

**SOURCE_CONFIRMED invariants and open gaps:** V3 `matches[*]` does **not** serialize DB `matches.revision` (CAS/state revision); `resultHistory[*].revision` is an independent per-match result history sequence; no forced equality. Current generated V3 requires `resultHistory` and `actionLog` array **properties**, but allows each to be `[]`; action `undoPayload` can be `null`. Absence of mandatory JSON property is distinct from legal empty array. Existing importer validates individual history refs/revisions but not universal current-completed-result↔newest-history tuple parity. Undo payload remapper uses `map.get(oldId) ?? oldId` for recognized nested old match/player IDs, leaving a possibly unmapped original ID; risk is **STATIC_INFERRED**, not demonstrated user-data corruption. Portable action rows lack original action ID and deterministic tie-break when `createdAt` ties.

| Decision | Owner/HQ alternatives — select explicitly, never by A90 |
|---|---|
| **D1 Modern strict vs legacy** | **A** explicit new strict capability/version marker only for new producers; legal V2 and old V3 keep documented compatibility path. **B** strict for every V3 only after a corpus/producer audit and migration plan. **C** diagnostics/no new rejection. Define whether malformed old-producer missing JSON property is transformed or rejected. |
| **D2 History parity** | **A** strict completed-match requires latest `MAX(resultHistory.revision)` tuple parity + history presence and defined BYE/walkover/NC/revert exceptions. **B** reject present mismatch but missing history degrades direct Revert for approved profile. **C** diagnostic only. Decide date precision and legitimate `resultHistory:[]` behavior. |
| **D3 Portable match state revision** | **A** explicit portable `matches.revision` contract; **B** database default/rebase on clone with specified CAS effect; **C** no portability and restrict unsafe Undo/Revert until regeneration. A20 verifies `0028_match_revision.sql` and physical triggers first. **Do not confuse state revision with result-history revision.** |
| **D4 Action provenance / global Undo ordering** | **A** typed completion action with active provenance and portable deterministic order; **B** legal legacy null/empty/unknown accepted, but Unsafe Undo disabled; **C** A70 runtime guard only. Choose same-`createdAt` tie-break and `actionLog:[]` handling. |
| **D5 Nested action ID remapping** | **A** modern strict preclone reject for unknown/foreign recognized player/match IDs; **B** import legacy with explicit safe Undo degradation / warning; **C** preserve old fallback and accept/restrict risk by signature. Unknown historic keys aren't automatically recognized. |
| **D6 Error / rollback / user messaging** | **A** strict-profile `400 INVALID_BACKUP_V3` before clone, separate full late transaction rollback, preserve legacy positives and return clear user-safe errors; **B** owner-approved restricted import with warning, disabled affected Undo, no partial success. |

**Required named signoff** (all blank intentionally):

- Owner/HQ signer, version, timestamp and exact [DECISIONS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md) permalink: `_________________________`.
- Chosen **D1–D6** options + explicit V2 / historical V3 / new strict V3 acceptance matrix: `_________________________`.
- A20 `matches.revision`/0028/trigger evidence and A70 completion action + global LIFO + Direct Revert dependencies acknowledged: `_________________________`.
- A60 exact future B2 source/QA contract and A00 local coordinator acknowledgment: `_________________________`.
- Distinct **bounded future B2 CODE GO:** `NOT_GRANTED_IN_R20`. The form does not grant it.

Until signed: preserve legal existing import acceptance; do **not** impose new blanket `resultHistory:[]` rejection, synthesize portable match CAS state, or silently bless unmapped Undo IDs. If signed decision requires new V3 serialized fields or schema migration, route API/DB ownership through separate future scoped authorizations.

## 5. A50 safe preflight / reproducible commands — NOT EXECUTED HERE

**Single actionable dependency on A00/owner:** provide A50 a trusted runner/VM with full pinned monorepo checkout, Node22/pnpm10/frozen dependencies and, for each PG test, **written certification from owner+A20** of a physically separate disposable PostgreSQL16 host/cluster/DB and explicit authority to reset only a scoped `tm_test_*` schema. The test helper **really calls `DROP SCHEMA IF EXISTS ... CASCADE`**; URL-name regex alone does not prove physical separation. Never print `TEST_DATABASE_URL`, use production/shared fallback or run with unverified reset rights.

~~~sh
# EXAMPLE ONLY, A50 on explicitly approved test runner. A90 did not execute.
git fetch origin fix/web-005/t060-b1-backup-v3-integrity-r9
git switch --detach f03cf3d09988a04ba9c2856e205d21f994ff67f1
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
# Inject TEST_DATABASE_URL privately with owner authorization.
TEST_DATABASE_SCHEMA=tm_test_a90_r20 TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts

# Separately clean exact PR48 HEAD for B3A MVCC, never composite:
git switch --detach 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3
git rev-parse HEAD
pnpm --filter @workspace/api-server run typecheck
TEST_DATABASE_SCHEMA=tm_test_a90_r20_b3a TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

**Native test receipt required:** actual head SHA per checkout, scrubbed Node/pnpm/PG16 environment and approved DB proof + reset signature, exact commands and **exit code**, TAP case totals, actual HTTP 2xx/400, zero clone counts/late rollback, B3A old-E versus new-E2 field cohorts and writer commit proof. Then independent A60 exact-SHA runtime verdict. Authored source tests are **NOT** native PASS.

## 6. Formal handoff and STOP

**Collision:** PR41 and PR48 both modify `artifacts/api-server/src/application/backups/backup-v3.ts` and `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`. A00/A10 should retain the future conflict DAG; no A90 R20 cross-PR merge, test cherry-pick or code amendment.

**Global context (not A90 ownership):** R20 central report identifies 38 historic WEB004 cases with **0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN**; A10 R19 knows only 29 case IDs, 9 `SOURCE_ID_NOT_AVAILABLE`. No made-up IDs, no signed per-row waivers. PR53/PR54 new-head source QA is A60's lane, not an A90 determination.

**Final:** `A90_R20_POLICY_AND_QA_DELIVERED / P08_SOURCE_ACCEPTED_CONDITIONAL / P15_SOURCE_ACCEPTED_CONDITIONAL / APP_NATIVE_RUNTIME_NOT_EXECUTED / B2_OWNER_SIGNATURE_OPEN / WEB005_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`. No app source edits, owner-policy choices, SQL, merge, deploy or SWARM-006 activation.
