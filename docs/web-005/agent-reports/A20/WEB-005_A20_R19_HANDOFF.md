# WEB-005_A20_R19_HANDOFF — P05 Historical Migration Ledger / Dedicated PG16 Gate

**Wave:** R19.1, 2026-10-14 Europe/Warsaw  
**Task:** `WEB-005-T021-A20-R19`  
**Agent:** A20 — PostgreSQL Migration Reconciliation · Parent: WEB-005 A00 Implementation Lead  
**Mode:** SOURCE/SAFE only, documentation and offline tests.  
**Final:** `R19_DOCUMENTED / PR38_NO_CHANGE_SOURCE / SOURCE_ACCEPTED_OFFLINE_ONLY / OFFLINE_37+22_PASS / PG16_NOT_EXECUTED / REVIEW_ONLY / ready_for_sql:false / SQL_STOP / FINAL_HANDOFF_NOT_AUTHORIZED / SWARM006_HOLD`.

## 1. Central instruction/old-vs-new source SHA

Central R19 prompt `docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md`, Git blob `076b14ca7ea953c818309502cce322c7dd6a7bef`. A20 read §§0–2 and only AGENT A20; no code-change GO.

Repository: `C8LyNn/aplikacja-turnieje`. Release base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, live compare `identical` (0 ahead/behind).

- P05 PR38: https://github.com/C8LyNn/aplikacja-turnieje/pull/38 — OPEN DRAFT, UNMERGED. **OLD R18 HEAD = NEW R19 HEAD = `2d36864f4d2f1c838073f387fd3c8efb3378c43b`**. Seven new files only in `lib/db/migration-ledger-validator/`; no source-code change by A20.
- Exact file names, preserved remote blob identities and original SQL checksums provided in the R19 gate: https://github.com/C8LyNn/aplikacja-turnieje/blob/d342c6f244c1d1985d6197c1162f63a879d9a245/docs/web-005/agent-reports/A20/WEB-005_A20_R19_PG16_GATE.md
- Local source checks `git hash-object` on six available files all match pinned GitHub blobs, including `validate.mjs` (`430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e`), `validate.test.mjs` (`96c3d6b5d3f7ff9c10c154de0dc7c04374f61917`), manifest (`28f493263a2cbfb919db1f99b220058175b46ba0`). Seventh editor snapshots file accessible via GitHub, blob `d73453363928c31bd452c1fa30ac726613708e17`.
- R19 GitHub manifest verification: original SQL source Git SHA matches **14/14**; editor pinned snapshot source strings **9/9**; immutable release+editor pins `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` / `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`. `manifest.proposal.json` = `PROPOSAL_ONLY_NOT_APPROVED`.
- Original history **0030/0031 release** = correction operations + atomic correction receipts; **0030/0031 editor** = Steam abstract world + catalog pagination indexes. Editor canonical proposal IDs = 0032/0033; release original 0031 embeds `BEGIN; COMMIT;`. These different source identities are **not** automatically adoptable. Do not infer DB execution from mere number/table existence.

## 2. R19 actual local Node execution and evidence

Environment actually observed in A20 container: Node.js `v22.16.0`, Git installed. Commands `pnpm`, `psql`, `docker`, `pwsh` not found; complete application per-PR checkout and owner-certified dedicated PG16 not available. **No PG16 connection, catalog SELECT, DDL, schema reset, migration, API app test or owner secrets used.**

Executed within `/mnt/data/t021_work/lib/db/migration-ledger-validator`:

~~~bash
node --test validate.test.mjs > /mnt/data/WEB-005_A20_R19_OFFLINE_TESTS.tap 2>&1
# actually exit 0; suites 4; tests 37; pass 37; fail 0; skipped 0

node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs > /mnt/data/WEB-005_A20_R19_NEGATIVE_TESTS.log 2>&1
# actually exit 0; 22/22 PASS; author-authored supplementary harness, outside PR38

node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json > /mnt/data/WEB-005_A20_R19_CLI_STOP.json 2> /mnt/data/WEB-005_A20_R19_CLI_STOP.stderr
# actually exit 2; report.decision STOP; report.ready_for_sql false
# manifestPin.errors: MANIFEST_PIN_MISMATCH; sourceResult.errors: SOURCES_MISSING
~~~

The locally generated files above contain the underlying actual R19 TAP/stdout/JSON; not GitHub-published artifacts. Positive synthetic histories return at most `REVIEW_ONLY`, and any missing source/pin, unresolved historical 0030/0031 or unknown/orphan ledger must fail closed. **These 59 offline tests are NOT native application or PostgreSQL integration tests; no full environment acceptance.**

GitHub Actions at unchanged PR38 HEAD: `Tournament correction safety CI` workflow run `38569859562` = `failure`, blocked upstream by historical Pack19 `readOnly:true` matcher against Drizzle `accessMode:"read only"`. PR35 is separate proposed source fix; downstream runtime gates do not pass. No manual/paid rerun was attempted.

## 3. Independent A60 R18 and A50 R18 evidence, no self-certification

[A60 R18 independent source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`, and [R18 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json) identify **P05 SOURCE_ACCEPTED_OFFLINE_ONLY** at exact unchanged HEAD. Physical PG16/runner acceptance is **NOT_EXECUTED**. No submitted GitHub PR38 review recorded, but published A60 signed report is separate documentary acceptance.

[A50 R18 central receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), blob `a54e410eddf12ff9b909cb8a73cfd91d1d91acad`, confirms **0 real application React/API/PG16 tests** in its own execution environment; lacks trusted full checkout/pnpm and dedicated PG16. Do not count author offline Node tests as A50 native app testing.

[A60 R18 final handoff gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md), blob `e838d37d15a30beb83dd65ec5189b10df89827b0`: `HANDOFF_NOT_READY`, also due PR54 source privacy blocker, PR53 ownerless picks, 38 historical WEB-004 case disposition gaps and unsigned owner policies. **Do not** promote P05 scoped acceptance to WEB005 final closeout.

## 4. Related API draft exact SHA and A50 future test contract

Current P08/PR41 **old R18 = R19 `f03cf3d09988a04ba9c2856e205d21f994ff67f1`** OPEN DRAFT: A60 R18 `SOURCE_ACCEPTED_CONDITIONAL` for Backup B1 QP/QPE/approved OP `sourceBasketPosition` parity. Real corrupted fixture/rollback and valid baseline PG16 results `NOT_EXECUTED`; test `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` must verify 400 `INVALID_BACKUP_V3` and ZERO clone writes on corrupt position.

Current P09/PR42 **old R18 = R19 `021bed269f9ea8ac8ce53caeea44263c098aa2dd`** OPEN DRAFT: A60 R18 `SOURCE_ACCEPTED_CONDITIONAL` for global roster undo guard; `tournament-roster.ts` `latestUndoable` source recheck; test `artifacts/api-server/test/revert-match.integration.test.ts` queued X/stale undo after Y commit must yield 409 `UNDO_ACTION_CHANGED` ZERO writes; legal latest undo must work. Physical PG16 runtime `NOT_EXECUTED`.

Other backend exact candidate test paths for PR39/44/45/46/48/49/51 plus checksum/signature/fixtures appear in the [R19 PG16 gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/d342c6f244c1d1985d6197c1162f63a879d9a245/docs/web-005/agent-reports/A20/WEB-005_A20_R19_PG16_GATE.md). Their PR HEADs were actually verified R19, not inferred from outdated R18 snapshot. PR41/48 and PR42/51 share test filenames but **different source code HEADs**; no composite checkout/test result transfer.

No A20 code lane ownership of PR41/42 or others; no merge. Code diff changes R19 in A20's scope: **none**. Only documentation paths under `docs/web-005/agent-reports/A20/` added.

## 5. Published R19 deliverable, physical PG gate and one owner action

**[WEB-005_A20_R19_PG16_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/d342c6f244c1d1985d6197c1162f63a879d9a245/docs/web-005/agent-reports/A20/WEB-005_A20_R19_PG16_GATE.md)**, commit `d342c6f244c1d1985d6197c1162f63a879d9a245`: signed-test-target prerequisites, exact physical PG16/DB/role/schema allowlist and STOP conditions, reusable R15 nonmutating `pg_catalog` SQL, copyable conditional `psql` PowerShell and per-PR integration commands, F0/F1/F2/F3/F4 fixture split, safe rollback boundary, independently sourced A60 review.

**ONE concrete A00/owner unblock request:** provide A50 a trusted approved PC/VM with full checkout per exact PR SHA, Node22/pnpm10 frozen dependencies, *and* independently certifiable dedicated disposable PostgreSQL 16 host/DB/observer role. Sign **read-only catalog preflight only** first (exact instance ID, immutable image, host/port, database, PG16 major, nonprivileged role, `tm_test_*` test schema and out-of-production proof); only a **second separately signed permission** may allow isolated `TEST_DATABASE_URL`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, precise disposable schema reset/feature integration. Anything missing => `ENV_BLOCKED / PG16_NOT_EXECUTED`, not PASS.

This runbook **does not authorize** current A20/A50 to use shared/prod DB, execute history SQL, adopt ledger/receipt, run migration runner, rebase/cherry-pick/merge, use Replit, initiate staging or SWARM-006.

## 6. Owner policy, collision and final-only handoff decision

- Owner decisions still open: Backup B2 result history/revision/legacy, correction/roster rollback lifecycle as owned by A70/owner, plus multiple cross-packet product policies tracked by A00/A10/A60. Historical ledger adoption not approved by source manifest or A20.
- File collision: P05 standalone `lib/db/migration-ledger-validator/*` does not overlap API PR41/42 source files; PR41/48 overlap `backup-v3.ts` and integration test; PR42/51 overlap `routes/tournaments.ts` / `revert-match.integration.test.ts`. These conflicts are for **later authorized SWARM-006 integration**, not WEB005 merge.
- Independent final handoff not ready (A60 R18); R19 code lanes PR53/54 + full 38-case WEB004 owner decisions/A50 runtime debt remain under other agents. A20 cannot sign exemptions. No `HANDOFF_WITH_RUNTIME_TEST_DEBT`, `FINAL_HANDOFF_GO` or `RELEASE_GO` has been conferred to A20. `SWARM006_HOLD`.

| Control | Actual R19 evidence | GO / STOP |
|---|---|---|
| PR38 source identity | Same old/new exact HEAD; local 6/6 blobs; 14/14 SQL source blobs, editor 9/9 snapshots | SOURCE_CONFIRMED |
| P05 Node tests | 37/37, exit 0 | OFFLINE RUNTIME_VERIFIED |
| A20 supplemental synthetic negatives | 22/22, exit 0 | OFFLINE RUNTIME_VERIFIED / AUTHOR_ONLY |
| Missing approved manifest/source CLI | STOP, exit 2 | FAIL-CLOSED PASS |
| Independent P05 A60 | SOURCE_ACCEPTED_OFFLINE_ONLY | Scoped-only |
| A50 native application / PG16 | Zero tests, physical target unavailable | NOT_EXECUTED / BLOCKED |
| History-adoption/real SQL/DDL/schema resets | Not authorized | HARD STOP |
| Merge/release/staging/live/SWARM-006 | No final owner GO | HARD STOP / RELEASE_NO_GO |

**Report publication:** this `WEB-005_A20_R19_HANDOFF.md` and the companion R19 PG16 gate on `chore/web-005/t000-wave1-control`; no PR code or release ref edited. Final commit/blob+direct link are verified and recorded in the PR38 discoverability comment.

**FINAL:** `WEB-005-T021-A20-R19 — DOCS_PUBLISHED / SOURCE_CONFIRMED / OFFLINE_59_PASS / A60_P05_OFFLINE_ONLY / PG16_NOT_EXECUTED / SQL_STOP / SWARM006_HOLD`.
