# WEB-005_A90_R20_HANDOFF

**Agent:** A90 — Backup V3 Integrity & Restore  
**Task / Wave:** `WEB-005-T060-A90-R20` / R20 (2026-10-14, Europe/Warsaw)  
**Authorization:** SOURCE ONLY. **No new A90 code GO.**  
**Main R20 artifact:** [WEB-005_A90_R20_BACKUP_B2_DECISIONS.md](./WEB-005_A90_R20_BACKUP_B2_DECISIONS.md) — named-owner signoff card D1–D6, exact B1/B3A QA fixtures, PG16 isolation/commands and stop conditions.  
**Handoff:** this file is the formal A90 R20 report to A00.  
**Publication branch:** `docs/web-005/a90-r20-backup-b2-decisions`; two A90 docs only, from central `chore/web-005/t000-wave1-control`.  
**Target release base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

## 1. Verified PRs and independent QA

| Packet | R19 snapshot → R20 live HEAD | Source/runtime classification |
|---|---|---|
| **P08 B1 / [PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41)** | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` → **unchanged full SHA** | OPEN DRAFT/unmerged; [A60 R18 independently](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) `SOURCE_ACCEPTED_CONDITIONAL` for B1 parity, including legacy `sourceBasketPosition:null`. No physical PG16 `RUNTIME_VERIFIED`. |
| **P15 B3A / [PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48)** | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` → **unchanged full SHA** | OPEN DRAFT/unmerged; same A60 R18 matrix `SOURCE_ACCEPTED_CONDITIONAL`; no connected 2-writer PG16 MVCC `RUNTIME_VERIFIED`. |
| Pack19 matcher / [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` → unchanged | Separate draft; do not integrate here or manually rerun paid CI. |

**Source paths reviewed:** `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts` on PR41; `artifacts/api-server/src/application/backups/backup-v3.ts` on release and PR48; `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` independently at each exact candidate HEAD; generated V3 QPE/OP/route contracts through R18 source reports; `docs/web-005/DECISIONS.md`, [A90 R19 source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r19-backup-owner-gate/docs/web-005/agent-reports/A90/WEB-005_A90_R19_BACKUP_OWNER_GATE.md).

**Relevant SHA/blobs:** PR41 validator `a8482fa7137f1d71817c8b4ec43da7d6292f8183`; PR41 test `05e2f1d753ca56aea727e1a998c8747ba004bfef`; PR48 test `ea463803b72e55e6664c0c59b578e6ba32a8b0ed`; PR48 exporter code `7302ebe53a4634b873a4f42f65da86870e9acabf`.

**A60 R19 evidence check:** A60 R19 central handoff/independent QA filenames returned 404 and no agent-named R19 docs branch found in consulted branch search. **Do not conclude no private/off-branch review took place.** The latest directly text-verifiable independent verdict on unchanged P08/P15 HEAD in these sources remains A60 R18 conditional acceptance, not full QA.

**CI:** [PR41 run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), `FAIL` early at old Pack19 matcher expecting `readOnly:true` vs actual Drizzle `accessMode:"read only"`, downstream database gates `SKIPPED`; this is neither B1 nor B3A native functional outcome.

**Actual A50 R19 evidence:** [A50 R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md) — Node/Git preflight exit0, `git -C /mnt/data rev-parse HEAD` exit128, no complete checkout/pnpm/physically isolated owner-approved PostgreSQL16. **0 application tests, no APP exit/TAP**.

**Actual A90 R20:** GitHub source/QA/PR reads and Markdown writes only; **`TYPECHECK=NOT_EXECUTED / PG16=NOT_EXECUTED / API_HTTP=NOT_EXECUTED / BUILD=NOT_EXECUTED`**. Do not supply invented exit code or test pass.

## 2. Deliverable acceptance summary

**B1 positive/negative/rollback for A50:** modern approved QP/QPE/OP executed-route import; legal exporter-generated `null` receipt and optional-absent old V3; explicit matching numeric source position round-trip; **7** source-position corrupted variants + **12** preexisting QP/OP/route corrupted variants → typed `400 INVALID_BACKUP_V3`, no root or child clone writes; distinct late PostgreSQL `seed=2147483648` overflow after clone root → 13-table rollback. These scenarios are **authored but not executed**, with 7 and 12 variants belonging to two table-driven Node tests rather than 19 independent TAP cases.

**B3A for A50:** PR48 separately on its own exact SHA; two authored second-connection writer barriers guarantee one old exporter-E `REPEATABLE READ / READ ONLY` snapshot vs next fully updated E2 (root/stage/match and approval/route receipts); additional match+history writer scenario is a **future proposed test**, not a current pass.

**Safety and runbook:** trusted complete per-SHA checkout, Node22, pnpm10 frozen dependencies, physically dedicated owner/A20-approved disposable PG16 test database/role plus **separately signed reset approval** for `TEST_DATABASE_SCHEMA=tm_test_*`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`. Explicit test-only `TEST_DATABASE_URL`, no `DATABASE_URL` fallback, no credential logging. The test helper actually invokes `DROP SCHEMA ... CASCADE`; A90 did not run it. Full commands/requirements are in the main artifact.

## 3. Backup B2 — specific owner/HQ signature needed

**Ticket:** `POLICY-BACKUP-B2-PORTABLE-HISTORY-R20`; **`POLICY_OPEN`**. [DECISIONS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md) and independently checked A60 R18 final gate do not contain a signed B2 policy.

**D1–D6** all need a named owner/HQ choice, version/date/GitHub permalink, explicit legacy compatibility and technical A20/A70 acknowledgments: strict new V3 profile vs old V2/V3; latest result_history/completed-match parity and missing histories; independent DB match-state CAS revision; typed action provenance/global Undo LIFO; nested old-ID remap reject/degrade/accept; typed preclone `400 INVALID_BACKUP_V3` vs late rollback/warnings. **No choices selected by A90, no B2 code authorization.** In particular a valid old `resultHistory:[]` cannot automatically be rejected, and DB `matches.revision` cannot be conflated with `resultHistory.revision`.

**Owner next single decision/action:** **A00/HQ to record a named signed D1–D6 disposition in the controlled DECISIONS ledger**, while separately authorizing A50's trusted full checkout and disposable PG16/reset if runtime acceptance is required before handoff. A20 confirms 0028/CAS/history triggers; A70 confirms completion/Undo order; A60 independently checks real tests.

## 4. Conflict / final handoff STOP

PR41 and PR48 overlap `artifacts/api-server/src/application/backups/backup-v3.ts` and `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`. Neither contains the other's code. A00/A10 records a future integration conflict; A90 must not merge/rebase/cherry-pick or run a composite branch.

R20 global source/policy/38 WEB004 historical-case mapping and new PR53/54 independent QA are separate agent ownership. The 38 WEB004 historical totals still are 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN, with 9 IDs `SOURCE_ID_NOT_AVAILABLE` at central R20 intake; **A90 does not fabricate those IDs or declare global source closure**. Final handoff requires A00/HQ separate GO; even a later signed `HANDOFF_WITH_RUNTIME_TEST_DEBT` transfers mandatory regression tests, **not** permission to deploy.

**Changes committed by A90 R20:** two Markdown files only on its own docs branch; **no source files, SQL, migration, PR merge or SWARM-006 activity**.

**FINAL:** `A90_R20_SOURCE_ONLY_DELIVERED / P08_SOURCE_ACCEPTED_CONDITIONAL / P15_SOURCE_ACCEPTED_CONDITIONAL / APP_RUNTIME_NOT_EXECUTED / B2_POLICY_OPEN / WEB005_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
