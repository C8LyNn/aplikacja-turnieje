# WEB-005_A90_R17_HANDOFF

**AGENT:** A90 — Backup V3 Integrity & Restore  
**TASK / WAVE:** `WEB-005-T060-A90-B1-POSITION-R17` / R17.1 · 2026-10-14 Europe/Warsaw  
**MODE:** CONDITIONAL CODE GO L1 — **only existing PR41** `fix/web-005/t060-b1-backup-v3-integrity-r9`.  
**DELIVERABLES:** [R16 recovery record](./WEB-005_A90_R16_RECOVERY_RECORD.md) · [R17 PR41 position result](./WEB-005_A90_R17_PR41_POSITION_RESULT.md) · this handoff.  
**PUBLICATION:** own documentation branch `docs/web-005/a90-r17-position-recovery`; no changes to A00 common prompts.  
**RELEASE SOURCE BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

## R16 recovery (required first)

**`R16_ARTIFACTS_UNAVAILABLE`:** R16 central assignment `WEB-005-T060-A90-B1-POSITION-R16` found (blob `688e9c149dcf542587125d5f05a4a9683f3ac156`), but original A90 R16 handoff/patch/commit could not be verified or recovered. PR41 was still old HEAD `e847cb705296a48ab5c68ece96776cd0e0bbb417` at R17 intake; no matching A90 R16 report on central docs or matching branch. This is **not evidence that no work ever occurred outside GitHub**. A factual recovery record is published; this R17 work is **not retroactively labeled an original R16 artifact**.

## Verified R17 code patch

| Element | Exact evidence / status |
|---|---|
| **PR41 / P08** | [OPEN DRAFT #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41), unmerged; **OLD** `e847cb705296a48ab5c68ece96776cd0e0bbb417` → **NEW** `f03cf3d09988a04ba9c2856e205d21f994ff67f1` |
| **HEAD delta** | 5 new commits; 2 paths only: `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` **+41/-0** and `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` **+154/-0** |
| **Test-first** | First tests commit `ce0998fe8dea37c0f6fa3b18b31e1659cde3d962` **before** validator commit `a5e7bd7e0ee368b4c5100f091020e5f0b4cdeeb6`; following test-only refinements `ff69266e...`, `6c8f9098...`, `f03cf3d0...` |
| **Behavior SOURCE_CONFIRMED** | Per-output-basket QPE `basketPosition` 1..N sorted by global `placementRank` (matches actual proposer `i-cursor+1`); exact non-null receipt `sourceBasketPosition` parity by source basket+player+rank; `undefined` rejected, **explicit `null` accepted** to preserve current exporter, which writes null. OP itself has no position, so existing QPE↔OP player/basket/rank bijection retained |
| **Tests authored** | Existing 12 corrupted cases untouched, plus 7 position negatives in a single new Node test body; current/null and explicit numeric positive (HTTP import + stored receipt readback); late INTEGER overflow after clone root causes expected DB failure/rollback across 13 clone-related tables |
| **Actual tests by A90** | `NOT_EXECUTED`: no full local repo checkout/pnpm10, authorized isolated PostgreSQL16 or HTTP/TypeScript execution; no exit/TAP or false PASS. Test-first commit order **is not RED/GREEN execution proof** |
| **A60 verdict** | Old [R15 independent review](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) = `SOURCE_BLOCKED_FULL_QP_QPE_OP_PARITY` on old SHA. **New independent verdict needed** on `f03cf3d...`; not self-accepted |
| **PG16 gate** | [A50 R15 evidence](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md): Node22/Git reported but full checkout/pnpm and approved physical PG16 missing. A50 may run only with A20 + owner isolated disposable DB and reset authorization. No simulated PLAN-only PASS |
| **CI** | Old release/PR isolated CI Pack19 matcher still expects `readOnly:true` vs `accessMode:"read only"`, correction in separate [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35); automatically triggered workflows on R17 commits are not interpreted as Backup V3 PASS when feature gate skipped |

## GO / STOP / dependencies

- **GO performed:** amendment to existing PR41, position validator + integration test definitions, GitHub exact-SHA report and R16 recovery note.
- **STOP honored:** no modifications to `backup-v3.ts`, no B2 history/revision/Undo policy, no PR48 B3A merge (`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` remains separate), no new PR/DDL/migrations, no shared/prod DB tests, no staging/live, no manual paid CI, no merge to release/main, no SWARM-006.
- **Automatic CI at NEW PR41 HEAD:** [run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), job `116056098551`, **FAIL at earlier Pack19 source-contract tests**; downstream `Static and database release gates` **SKIPPED**. This does not test or reject B1 functional behavior. Existing [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) owns the separate Pack19 matcher fix. No manual rerun authorized or initiated.
- **A20:** migration/source evidence and written physically isolated test PG16 preflight.
- **A50:** exact-head `git rev-parse HEAD`, `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts` only after explicit test-only DB proof; log versions/exits/TAP, seven position cases, old 12, positive restore and late rollback. `TEST_DATABASE_URL` must be dedicated, `TEST_DATABASE_SCHEMA=tm_test_a90_r17`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; harness DROP SCHEMA CASCADE is destructive.
- **A60:** independent source QA exact **new** PR41 SHA, review QPE ascending-rank/position relation against producer and legacy null compatibility, and test source/test-run evidence separately; report `SOURCE_ACCEPTED` or concrete `SOURCE_BLOCKED` without assuming A50 execution.
- **A00:** record OLD→NEW PR41 SHA, R16 artifact unavailable vs R17 patch delivered; no falsely backdated R16 completion. Reserve future integration conflict PR41↔PR48 on same `backup-v3.ts` and test path exclusively for SWARM-006 **after** formal final closeout.
- **Owner/HQ policy:** B2 D1–D6 portable revisions/latest history/legacy Undo remain `POLICY_OPEN`, see [A90 R15 signable policy](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A90/WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md). No new B2 semantics in patch.

**FINAL STATUS:** `PR41_PATCH_REVISED / R16_ARTIFACTS_UNAVAILABLE / PG16_NOT_EXECUTED / A60_NEW_SHA_PENDING / WEB005_RELEASE_NO_GO / SWARM006_HOLD`. 
