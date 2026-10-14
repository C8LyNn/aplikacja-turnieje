# WEB-005_A20_R20_HANDOFF — P05 Migration Ledger / Physical PG16 Gate

**AGENT:** A20 — PostgreSQL Migration Reconciliation · **TASK:** WEB-005-T021-A20-R20 · **WAVE:** R20 / 2026-10-14 Europe/Warsaw · **COORDINATOR:** WEB-005 A00.  
**MODE:** SOURCE ONLY + actual Node offline tests; no code lane/PG16 access.  
**FINAL DISPOSITION:** `DOCUMENTATION_PUBLISHED / P05_SOURCE_ACCEPTED_OFFLINE_ONLY / OFFLINE_37+22_PASS / PG16_NOT_EXECUTED / REVIEW_ONLY / ready_for_sql:false / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Exact instruction, old→new SHAs, PR state

Central instruction `docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md` Git blob `dabf0146a08ef8488400df9268b52210662cbb63`; read shared §§0–2 and AGENT A20 only. Zero code GO.

Repository `C8LyNn/aplikacja-turnieje`, release `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, live compare **identical** (0 ahead/behind).

**P05 / [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38)** — old R19 HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b` = **current R20 HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b` (NO CHANGE)**; OPEN, DRAFT, UNMERGED; base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; seven added files exclusively in `lib/db/migration-ledger-validator/`:

| File | Git blob SHA-1 |
|---|---|
| README.md | `d68102bf577b6e78216032efb0cd996097cf34d8` |
| manifest.proposal.json | `28f493263a2cbfb919db1f99b220058175b46ba0` |
| source-snapshots.editor.json | `d73453363928c31bd452c1fa30ac726613708e17` |
| synthetic-fixtures.json | `55ba08be665b12158205473fabe16901d7926667` |
| synthetic-history.json | `f7898bdec530e91ec5215f464e1461512c4233be` |
| validate.mjs | `430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e` |
| validate.test.mjs | `96c3d6b5d3f7ff9c10c154de0dc7c04374f61917` |

R20 real local `git hash-object` = exact 6/6 matching current source pins for files in available local subset; editor snapshot verified via exact GitHub blob plus content match 9/9. Manifest `PROPOSAL_ONLY_NOT_APPROVED`, 14 canonical 0027–0040 source revisions: **14/14 pinned original SQL source Git blob matches** (R20 fetched in two batches), editor 0030–0038 snapshots **9/9 identical** to pinned editor source strings. Manifest release pin `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, editor `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`.

**Hard unresolved historic collision:** release original 0030 `controlled_correction_operations` versus editor original 0030 `steam_catalog_abstract_world` (proposed canonical 0032); release original 0031 `atomic_correction_receipts` versus editor original 0031 `steam_catalog_pagination_indexes` (proposed 0033). Release 0031 contains top-level BEGIN/COMMIT. A number, DDL table existence, or legacy migration ledger row alone proves neither lineage nor prior SQL execution. No adoption SQL/DDL, migrations, runner or production DB use authorized.

## 2. R20 offline runtime receipts (actual commands and exit)

**Environment:** Node v22.16.0, Git v2.47.3, six local code files at `/mnt/data/t021_work/lib/db/migration-ledger-validator/`; not a full app checkout. `psql`, `pnpm`, `docker`, `pwsh` commands unavailable in A20 container. Did NOT attempt PG16 connection, API integration, test schema reset or DDL.

~~~bash
cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node --test validate.test.mjs > /mnt/data/WEB-005_A20_R20_OFFLINE_TESTS.tap 2>&1
# ACTUAL: exit 0; 4 suites, 37 tests / 37 pass / 0 fail / 0 skipped
node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs > /mnt/data/WEB-005_A20_R20_NEGATIVE_TESTS.log 2>&1
# ACTUAL: exit 0; 22/22 author-authored synthetic neg cases PASS; NOT part of PR38/A60 independent suite
node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json > /mnt/data/WEB-005_A20_R20_CLI_STOP.json 2> /mnt/data/WEB-005_A20_R20_CLI_STDERR.log
# ACTUAL: exit 2; report.decision=STOP; report.ready_for_sql=false;
# manifestPin error MANIFEST_PIN_MISMATCH; sourceResult error SOURCES_MISSING
~~~

**Exact local output digests SHA-256:** `OFFLINE_TESTS.tap=702f610588e1069720e25ab41cddd085e0b90e3eb1393def6be7279e985999f6`; `NEGATIVE_TESTS.log=4dbe72e6ef44db3b83fe8098fc4d8f4fffcd6f123042a5f19016cdfa5d7d2e18`; `CLI_STOP.json=b3759739de1bffd2d2f07ad63ca851cfe559626553f37aff29e4c4df7a58e7b4`. These raw logs exist in the current A20 conversation workspace, **not** attached to this GitHub document. Node suite and A20 supplementary harness are **OFFLINE RUNTIME_VERIFIED** only. Historical clean/release/editor/mixed synthetic histories reach at most `REVIEW_ONLY`; unknown/orphan/duplicate/ambiguous histories and missing source/pin STOP; all outcomes `ready_for_sql:false`.

P05 GitHub Actions run `38569859562` remains `failure` at the prior Pack19 snapshot contract (readOnly:true vs accessMode:"read only"), before later target checks; separate P01 PR35 contains source change. This is **not full CI P05 PASS** nor P05-specific migration-logic FAIL. No paid/manual rerun requested or executed.

## 3. Independent R19 QA and latest A50 evidence

- [A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`: **P05 SOURCE_ACCEPTED_OFFLINE_ONLY**, exact same PR38 HEAD. No native PG16 source+runtime/full release acceptance. R19 independent A60 report **not found on the inspected control docs branch**, and no matching a60-r19 branch seen; do not invent or extend R18 acceptance. Separate formal GitHub PR38 submitted review list empty; documentary independent QA exists nonetheless.
- [A50 R19 coordinator receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md), Git blob `412117e31c297353b35a3c21fbd616d41754d4b6`: **APP_NATIVE_TESTS=0 / ENV_BLOCKED**; no complete trusted per-PR checkout/pnpm, Docker/psql or owner-certified physically dedicated PG16. Do not attribute A20's 59 offline cases to A50 native API/React/PG16.
- [A10 R19 21-package/38-case registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R19_FINAL_ONLY_PACKAGE_AND_38_CASES.md), Git blob `115458f64bfcb22150202b4fd6ef1bc128166df9`: 29 authentic-ish derived ID names, 9 original IDs `SOURCE_ID_NOT_AVAILABLE`, owner dispositions not signed. This is an A10/A00/HQ dependency, not an A20 ledger authorization.
- PR53 / #53 `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` and PR54 / #54 `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` are R19 newer SHA requiring independent A60 exact-head review; A20 performed no peer QA or code changes there.

## 4. Related API test targets and safety gate

PR41 / P08 **old R19 = R20 HEAD `f03cf3d09988a04ba9c2856e205d21f994ff67f1`**, OPEN DRAFT, A60 R18 `SOURCE_ACCEPTED_CONDITIONAL`; native test `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` requires real PG16:
- valid sourceBasketPosition QP/QPE/approved OP parity, source-to-clone integrity;
- invalid/swap/missing position => 400 `INVALID_BACKUP_V3` *before clone*, zero persisted writes/rollback, separate nullable historical data acceptance as policy.

PR42 / P09 **old R19 = R20 HEAD `021bed269f9ea8ac8ce53caeea44263c098aa2dd`**, OPEN DRAFT, A60 R18 `SOURCE_ACCEPTED_CONDITIONAL`; native test `artifacts/api-server/test/revert-match.integration.test.ts` requires real PG16:
- global latest Undo LIFO for roster `delete_player`/`restore_player`: stale X queued before newer committed Y => HTTP 409 `UNDO_ACTION_CHANGED`, zero roster/log side effects, Y still latest; valid latest Undo works.

Other API PR39/44/45/46/48/49/51 exact HEADs + test path/oracles are documented in R20 companion gate. **No** actual PG16 integration tested by A20, and no `TEST_DATABASE_URL` connected. Standalone PRs with same filename (PR41/48, PR42/51) must have independent per-SHA executions, never transfer TAP results.

**R20 PUBLISHED COMPANION:** [WEB-005_A20_R20_PG16_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/97fa564376834541e4b0d18240e84a62077e45fc/docs/web-005/agent-reports/A20/WEB-005_A20_R20_PG16_GATE.md), commit `97fa564376834541e4b0d18240e84a62077e45fc`. Includes owner-signed physical PG16/host/DB role allowlist; explicit `TEST_DATABASE_URL` without `DATABASE_URL` fallback; `tm_test_*` constraints; existing statically inspected read-only `pg_catalog` preflight, three-tier approval, F0–F4 fixture source boundary, precise Windows/PowerShell and per-PR integration commands and expected negative outcomes. **PG16 preflight commands are prepared, NOT_EXECUTED**.

## 5. One concrete owner/A00 action and no-code-change boundary

**REQUEST EXACTLY ONE OWNER ENVIRONMENT APPROVAL:** name and connect a trusted A50 test PC/VM with full per-PR clean Git worktree (Node22/pnpm10 frozen lockfile) *and* a physically isolated disposable PG16 cluster/database with independently signed identity: owner/permission ID, image digest/container ID, host/port/DB, PG16, read-only observer privileges and exclusive test schema. Approve only catalog `SELECT` first. A50 executes owner-certified nonmutating preflight and reports command/exit/catalog identity; **separate second written GO** would be needed to run `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` and any mutating integration test. Missing any owner evidence = `PG16_NOT_EXECUTED / ENV_BLOCKED`. Never connect to existing shared/staging/prod or real user backups.

**Policy:** owner-approved historical ledger adoption/manifest, Backup B2 history/legacy/revisions and other A00 signatures remain OPEN. A20 has no permission to select product decisions, sign test debt, authorize a release or transfer to another swarm. A60 R18 formally `HANDOFF_NOT_READY`; R20 remains interim documentation. A00/HQ may consider `HANDOFF_WITH_RUNTIME_TEST_DEBT` ONLY after independently supported source/owner policy/38-case closeout, with mandatory future integrated tests. No automatic SWARM-006.

**File changes in R20:** exactly these two documentation files under `docs/web-005/agent-reports/A20/` on `chore/web-005/t000-wave1-control`. No modifications to P05 HEAD, `lib/db/migrations/`, application code, release/main, PR53/54, no new PR, merge, DDL, staging/live or deployment.

| Gate | Evidence | Result |
|---|---|---|
| P05 PR38 old/new exact SHA, source | OPEN DRAFT, no HEAD movement, local blobs, 14/14 Git source, editor 9/9 | SOURCE_CONFIRMED |
| A20 author Node offline | 37/37 PASS + 22/22 supplementary PASS, actual exit 0 | OFFLINE_RUNTIME_VERIFIED |
| Unapproved manifest CLI | STOP exit 2, `ready_for_sql:false` | EXPECTED FAIL-CLOSED |
| A60 exact-HEAD P05 | R18 `SOURCE_ACCEPTED_OFFLINE_ONLY`; no new R19 report verified | OFFLINE_SOURCE_ONLY |
| PG16 physical catalog/API integration | No owner-certified target/approval; no psql/docker | NOT_EXECUTED / BLOCKED |
| Historical ledger adoption / production SQL/DDL | No GO | STOP |
| Merge / staging / live / SWARM-006 handoff | No owner/HQ final GO | STOP / HOLD |

**FINAL:** `WEB-005-T021-A20-R20 — HANDOFF_PUBLISHED / SOURCE_CONFIRMED / OFFLINE_59_PASS / PG16_NOT_EXECUTED / REVIEW_ONLY / SQL_STOP / SWARM006_HOLD`.
