# WEB-005 — A90 — WAVE R9 HANDOFF

**AGENT / TASK / WAVE:** A90 — Backup V3 Integrity & Restore / WEB-005-T060-A90-B1-R2 / R9.1 (2026-10-14, Europe/Warsaw)
**MODE:** GO SOURCE-CODE ONLY — B1, test-first.
**Parent / QA:** WEB-005-A00 / A50 runtime / A60 independent QA.
**GitHub:** https://github.com/C8LyNn/aplikacja-turnieje/pull/41 (DRAFT; NOT MERGED)
**BASE:** release/tournament-ops-20261013-01 @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`
**IMPLEMENTATION HEAD BEFORE REPORT COMMIT:** `748ef76d0a39358f2194cb78b39e1c88e4ce8daf`
**BRANCH:** `fix/web-005/t060-b1-backup-v3-integrity-r9`

## 1. Actual changes / source evidence
- `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`: 12 corrupt-backup cases (test-first commit `f72d399ca4d107c48e6b1f0389d2ae6c04a9ace7`); intact proposal+route fixture; direct validator assertion; HTTP `400 INVALID_BACKUP_V3`; no committed tournament clone by before/after query. **Test source only, NOT_EXECUTED.**
- `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` (new): deterministic, pure validation of approved QP entries versus materialized output (stage/basket/player/rank), source-stage participant membership, uniqueness, route topology, approved source QP revision, complete route arrival multisets and unique target-stage arrival.
- `artifacts/api-server/src/application/backups/backup-v3.ts`: call the validator from `validateBackupV3()` **before** `importBackupV3()` opens its transaction and inserts a clone; replace five route restore `continue` paths with typed `BackupV3ValidationError` so a failed lookup aborts the transaction.
- Source files are restricted to three paths listed above. No public schema changes, no migrations, no `routes/tournaments.ts`, no T040 or T020 edits.

## 2. Finding disposition
| Finding | Evidence / result |
|---|---|
| A51-F034 + F021/F022/F027 | `PATCH_PROPOSED`: QP→QPE→OP bijection, route entries/arrivals provenance and controlled rejections. |
| Silent route-import skips | `SOURCE_CONFIRMED` original; `PATCH_PROPOSED` guarded lookup failures. |
| Historical approved proposal underfill | `POLICY_OPEN`: no new validation of unexecuted basket capacity. Executed route must match existing `qualifierCount` contract. |
| B2: latest `result_history`, actionLog ID remap and portable revision | `NOT_IMPLEMENTED`; tracked separately with A70/T040. |
| B3: MVCC export and legacy V2/V3 parity | `NOT_IMPLEMENTED`; remains separate. |
| Production backup damage | `NOT_REPRODUCED`; do not imply any production corruption. |

## 3. Test evidence / commands for A50
**Status: NOT_EXECUTED.** No PostgreSQL16 test database was confirmed as physically isolated and authorized. No app tests, backend typecheck/build, CI, migration, or deployment were run; therefore there is **NO PASS evidence**.

A50 must first verify dedicated PostgreSQL 16, network/credentials isolation, `TEST_DATABASE_URL` identifying a test-only DB, and safe schema `tm_test_a90_b1`. The existing test runner `test-database.ts` resets a schema using DROP SCHEMA; **do not run these commands on production or shared DB**.

Suggested commands from repo root, once preflight has been authorized:
```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
TEST_DATABASE_URL='postgresql://TEST_USER:TEST_PASSWORD@ISOLATED_PG16_HOST/tournament_manager_test' \
TEST_DATABASE_SCHEMA='tm_test_a90_b1' \
TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA' \
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
```
Use actual isolated DB connection **without logging secrets**. Record command, timestamp, commit SHA, Node/pnpm versions, exit code, and TAP results. Do not interpret the 12 expected failures as application test failures: their assertions require HTTP 400 plus unchanged clone row counts.

Cases: intact round-trip; missing OP; wrong OP player/rank/basket; missing QP; pending proposal with OP; stale proposal revision; missing route entry; wrong receipt target or entry source; orphaned extra player; duplicate entry. Additional A50/A60 negative test needed after deliberately injected DB failure **inside** a clone transaction to prove atomic rollback beyond the preclone checks (currently `NOT_EXECUTED`).

## 4. QA / independent review contract
- A60 reviews exact PR #41 HEAD after final report commit; source-accepted is not runtime-certified.
- Verify no accidental B2/B3 semantics, schema or migrations. Check legal pending proposals, approved unexecuted routes, and ordinary legacy V3 without QP/RE remain permitted.
- Verify invalid QP/output/receipt fails **before the first clone INSERT** as `400 INVALID_BACKUP_V3`; for any unexpected DB-side mapping failure, transaction rollback leaves **zero committed clone rows**.
- Verify duplicate/foreign arrival cannot be silently omitted, and positive executed route remains idempotent after restore.
- Preserve status separation: `SOURCE_CONFIRMED` / `PATCH_PROPOSED` / `NOT_EXECUTED` / `POLICY_OPEN` / `BLOCKED`.

## 5. Dependencies / ownership
- **A20/T020/T021:** migration 0030/0031 conflict, historical ledger, accepted physical PG16 schema. No A90 SQL migration.
- **A50/T133:** safe execution and reproducible negative fixture evidence; physical isolated DB mandatory.
- **A60/T130:** independent source + PG16 acceptance, exact HEAD and review signoff.
- **A70/T040:** history/revert and Undo semantics are excluded from B1; no edit to shared `revert-match.ts`.
- **A10/A00:** record PR #41 as **P08+ CONDITIONAL** internal buffer only; not delivered to SWARM-006.
- No conflicting edits detected in `backup-v3.ts` at the verified release baseline; independently recheck HEAD before accepting diff.

## 6. GO/STOP and next action
**B1 code:** `PATCH_PROPOSED` / draft PR open. **B1 PG test:** `NOT_EXECUTED`; **B1 QA:** pending A60. **B2/B3:** STOP until next assignment and policy. **MERGE / DEPLOY / SWARM-006:** NOT AUTHORIZED. **Release:** NO-GO.

**Next action for A00:** have A50 perform physically isolated PG16/typecheck evaluation of PR #41, then request independent A60 signoff on the exact tested HEAD; do not merge on the basis of source review alone.
