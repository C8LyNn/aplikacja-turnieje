# WEB-005_A20_R17_HANDOFF — Ledger P05 / Isolated PG16

**Wave:** R17.1 · **Task:** WEB-005-T021-A20-R12 · **Agent:** A20 — PostgreSQL Migration Reconciliation · **Parent:** WEB-005/A00 · **Mode:** SOURCE-ONLY · **Date:** 2026-10-14 Europe/Warsaw.

**Final result:** `R17_SOURCE_VERIFIED / P05_SOURCE_ACCEPTED_OFFLINE_ONLY / OFFLINE_37+22_PASS / PG16_NOT_EXECUTED / R16_ARTIFACTS_UNAVAILABLE / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. R16 recovery status

Checked central documentation branch for `docs/web-005/agent-reports/A20/WEB-005_A20_R16_HANDOFF.md` and `WEB-005_A20_R16_PG16_PREFLIGHT.md`: both NOT_FOUND. GitHub branch search for `a20` returned no dedicated documentation branches. Local available A20 work directory contains no R16 artifact. The present thread does not establish completed A20 work in R16; **R16_ARTIFACTS_UNAVAILABLE**. Do not retrofit R15 output into fictitious R16 tests or patches. R17 itself supplies current evidence; no new P05 patch.

R16 contract was `WEB-005-T021-A20-R11` SOURCE ONLY and intended an isolation-ready PG16 preflight. Existing published R15 source-only materials remain linked below; R17 replaces none of them.

## 2. Live GitHub HEAD / CI / exact source files

- P05 PR38: https://github.com/C8LyNn/aplikacja-turnieje/pull/38 — OPEN DRAFT, UNMERGED; HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`; base release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Seven new files exclusively under `lib/db/migration-ledger-validator/`: `README.md`, `manifest.proposal.json`, `source-snapshots.editor.json`, `synthetic-fixtures.json`, `synthetic-history.json`, `validate.mjs`, `validate.test.mjs`.
- Local exact Git blobs match 6/6 mountable files: README `d68102bf577b6e78216032efb0cd996097cf34d8`; manifest `28f493263a2cbfb919db1f99b220058175b46ba0`; fixtures `55ba08be665b12158205473fabe16901d7926667`; history `f7898bdec530e91ec5215f464e1461512c4233be`; validator `430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e`; tests `96c3d6b5d3f7ff9c10c154de0dc7c04374f61917`. Editor bundle `source-snapshots.editor.json` Git blob `d73453363928c31bd452c1fa30ac726613708e17` was independently checked on GitHub previously; nine editor source snapshots matched exact upstream strings (9/9).
- Manifest: `PROPOSAL_ONLY_NOT_APPROVED`, source baseline release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, editor `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`, 14 canonical 0027–0040 identities. Source Git blobs 14/14 were confirmed in prior R15; in R17 four conflicting SQL files independently fetched again and matched pinned identity: release 0030 `50aa71ae0199806de3aaf3c57700d2739f2c42bc`, release 0031 `d44601f4b6477dc9366fc7a65475a0eede1c34c1`, editor 0030 `a6d4ce679136b016dc6eed0e490e3e54060ada22`, editor 0031 `b813547b834febe8e7398d1b2cfe204b84dd1ed5`. Source 0031 release still embeds BEGIN/COMMIT; no approved migration transformation.
- GitHub CI for PR38 exact HEAD: run `38569859562` FAILURE on unrelated upstream Pack19 snapshot matcher (`readOnly:true` versus `accessMode:"read only"`), downstream CI steps SKIPPED; fix source exists in separate PR35. This does NOT certify P05 or demonstrate P05-specific FAIL. No manual rerun requested.

## 3. Actually performed A20 R17 runtime — OFFLINE ONLY

**Node.js:** `v22.16.0`; user supplied /mnt/data local repo subset, no full app checkout or test PG environment. Commands actually executed:
~~~bash
cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node --test validate.test.mjs > /mnt/data/WEB-005_A20_R17_OFFLINE_TESTS.tap 2>&1
# EXIT 0 — 37/37 PASS; 4 suites, 0 fail/skip.
node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs > /mnt/data/WEB-005_A20_R17_NEGATIVE_TESTS.log 2>&1
# EXIT 0 — 22/22 supplementary A20-authored synthetic cases PASS; NOT independent A60 and NOT part of PR.
cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json > /mnt/data/WEB-005_A20_R17_CLI_STOP.json
# EXIT 2 — expected STOP; MANIFEST_PIN_MISMATCH and SOURCES_MISSING; ready_for_sql=false.
~~~
Results are independently reproducible from the exact PR38 source with Node22 and matching fixture. Positive synthetic histories (clean/release/editor/mixed) result REVIEW_ONLY; ambiguous legacy 0030/0031, orphan R31/E36, unknown/duplicate ledger, checksum mismatch, stale source, unsupported approval, missing catalog fingerprint, dependency cycles/missing earlier records -> STOP/invalid manifest. **ready_for_sql=false in ALL paths.**

**Physical PostgreSQL16**, `TEST_DATABASE_URL`, `psql`, Docker, dedicated database, application integration tests: **NOT_EXECUTED / BLOCKED**. No DB credentials or connection were used. Full A50 R15 independent environment report showed 0 app test receipts; this A20 author offline verification must not be added to A50 native app counters.

## 4. Independent QA — A60 exact HEAD

**Signed independent source verdict exists:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md, Git blob `195f23368f3932889552f83a5981a90994a28cdf`. P05 on exact PR38 HEAD is `SOURCE_ACCEPTED_OFFLINE_ONLY`, not PG16/runner acceptance; no PR38 submitted GitHub review event. No R17 A60 live acceptance asserted.

A50 published environment blocker: https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md, blob `86b89937c32a01cb62253019f3d3808890b47c24`. No full per-PR checkout/pnpm and no physically approved isolated PG16 in A50 evidence. A20 did not claim it could mount the user's PC through a connector.

## 5. New R17 scoped deliverable and dependencies

**[WEB-005_A20_R17_PG16_UNBLOCK.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/7abfb1bcf18f69ec884bfc5f0df7e7a8f649baa6/docs/web-005/agent-reports/A20/WEB-005_A20_R17_PG16_UNBLOCK.md)** — GitHub commit `7abfb1bcf18f69ec884bfc5f0df7e7a8f649baa6`. Contains owner/A00-approved preflight requirements, R15 safe catalog SQL link, non-mutating first gate, separate reset approval rule, fixture profiles F0-F4, deterministic PR41 QP/QPE/OP `sourceBasketPosition` parity and PR42 roster `delete_player/restore_player` global LIFO negative cases, and separate commands for PR39/44/45/46/48/49/51.

Pinned R17 target source heads:
- P08 PR41: `e847cb705296a48ab5c68ece96776cd0e0bbb417` OPEN DRAFT — **A60 SOURCE_BLOCKED** on QP/QPE/OP position parity; prior R16 patch NOT present on GitHub during A20 readback.
- P09 PR42: `1ae0ccb801f4177052bff1ec7041e55b8c992c8b` OPEN DRAFT — **A60 SOURCE_BLOCKED** for roster global latest-Undo LIFO; prior R16 patch NOT present on GitHub during A20 readback.
Only A90 (P08) and A70 (P09) may change their PR code under the scoped R17 authorizations. A20 does not edit code or issue an external QA acceptance.

**Shared code/test dependencies:** PR41/48 share `backup-v3.ts` and `stage-basket-route-execution.integration.test.ts`; PR42/51 share `routes/tournaments.ts` and `revert-match.integration.test.ts`; these are different source HEADs and MUST be tested separately, no composite branch. P05 has no source files overlapping application PRs.

## 6. Owner/A00 decision / GO-STOP

**One actionable owner decision:** supply A50 access to a trusted PC/VM with a full pinned repo checkout, Node22/pnpm10, plus a *physically separate disposable PostgreSQL16*; certify exact host/port/db/container ID, read-only test role, schema `tm_test_*`, zero prod/shared access, and initially approve `READ_ONLY_CATALOG_PRECHECK` **only**. After real catalog receipt, owner may decide separately on bounded DROP/RESET `tm_test_*` with `TEST_DATABASE_URL` and `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`; this report is NOT that reset permission. The existing helper is destructive; no execution in this wave.

| Gate | Outcome |
|---|---|
| P05 current source SHA, review scope | SOURCE_CONFIRMED / SOURCE_ACCEPTED_OFFLINE_ONLY |
| A20 offline tests 37 and supplemental 22 | RUNTIME_VERIFIED_OFFLINE, exit 0 |
| A20 CLI fail-closed | PASS, decision STOP / exit 2 |
| R16 artifact recovery | R16_ARTIFACTS_UNAVAILABLE |
| A50 true app/physical PG16 tests | NOT_EXECUTED / ENVIRONMENT_BLOCKED |
| PR41 and PR42 corrected source HEAD | NOT_VISIBLE / A70,A90 OWNERS |
| Historical ledger adoption, migration SQL/DDL and runner | HARD STOP |
| Cross-PR merge / release / deployment / SWARM-006 | HARD STOP / RELEASE_NO_GO |

**Files changed in this R17:** ONLY own agent documentation files under `docs/web-005/agent-reports/A20/` on control branch. No changes to PR38 HEAD, SQL migration files, application code, or release. A00 receives direct GitHub link and SHA in PR38 conversation; no automatic cross-chat delivery asserted.

**FINAL:** `WEB-005-T021-A20-R12 — HANDOFF_PUBLISHED / PG16_NOT_EXECUTED / R16_ARTIFACTS_UNAVAILABLE / REVIEW_ONLY / SQL_STOP / SWARM006_HOLD`.
