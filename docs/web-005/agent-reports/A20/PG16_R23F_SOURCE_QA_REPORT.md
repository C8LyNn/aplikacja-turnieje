# WEB-005 / A20 / R23F — SOURCE QA, SHA inventory and open blockers

**Task:** `WEB-005-T020-A20-R23F-PG16-INTEGRATION-PREFLIGHT`  
**Agent:** A20 · **Mode:** docs-only, read-only GitHub source investigation; **no DB access or runtime execution**.  
**Verdict for DOCUMENT PREPARATION:** **`PG16_PREFLIGHT_READY_FOR_OWNER_APPROVAL`** — **NOT** `PG16_EXECUTION_AUTHORIZED`.  
**Runtime:** `PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Current PR, QA and original CI incident

- [C01 PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) **OPEN, DRAFT, UNMERGED**, exact independently fetched current **HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`**, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- [A50 Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73), latest native Windows R23E-R2 receipt: **426/426 PASS / 0 FAIL / 0 SKIP**, 25 full TAP logs, BuildTypes exit 0, ApiTypecheck exit 0, 36/36 steps exit 0. Do not equate those DB-free tests with an integrated PostgreSQL run.
- [A60 R23E-R2 independent acceptance](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23E_R2_C01_WINDOWS_DBFREE_INDEPENDENT_ACCEPTANCE.md), fetched Git blob SHA-1 **`pending_summary_readback`** (will be replaced in a later version if needed): 36/36 original Drive log SHA256 matched, independent verdict **`DBFREE_QA_ACCEPTED`**, DB integration `NOT_EXECUTED`.
- [A60 PG16 gate handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23E_R2_A00_PG16_GATE_HANDOFF.md) Git blob **`2db01dccb40f5a02155d19ff0b1fa72cf8058738`**; requires triple A00/HQ+A20+operator written GO, physically isolated PG16, independent S1 reset approval.
- [CI run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`: A20 fetched original job log, ~423,864 characters / 6,437 lines; step `Static and database release gates` FAILED. Last visible source runner message: `BLOCKED: API integration tests execution failed exit 1; signal none`. No first named actual `not ok` conclusively recoverable (TAP stream ends while last visible subtests are passing). PostgreSQL service ERROR rows also contain intentional failing fixtures, **not** test assertion evidence. **Exact first failure = UNKNOWN**. No workflow rerun/paid CI started.

## 2. Source inventory at C01 exact immutable SHA (Git blob SHA-1)

| File | Git blob SHA-1 | Source finding |
|---|---|---|
| `qa/pack17/gate-contract.mjs` | `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` | Pure fail-first NODE_ENV/TEST_DATABASE_* / TAP guard, explicitly says strings do not prove physical isolation |
| `qa/pack17/gate-contract.test.mjs` | `f59a65509009fbdf74a38239693238704b1af583` | Negative safety gate pure tests, not DB privilege protection |
| `qa/pack17/run-gates.mjs` | `8779ab2c1588cc62a2f3c5f63c57be9b55e86043` | static/integration/full modes; full embeds all DB/UI/build gates; not independently authorized |
| `artifacts/api-server/test/test-database.ts` | `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | Actual DROP/CREATE schema, test migrations 0001–0028, teardown DROP, no production schema allowed by string guard |
| `artifacts/api-server/test/test-discovery.ts` | `dd427fdafa92c089e2edad704079d81945c4b1c1` | Recursively enumerates all *.integration.test.ts |
| `artifacts/api-server/test/run-tests.ts` | `da4188446aba4696f97eb7831fee0cc5824d212f` | Sequential Node runner, inherits env, true native child status |
| `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` | `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | **CRITICAL:** CREATE 3 scratch DBs, DROP DATABASE WITH (FORCE) in teardown; requires S2 createdb/drop explicit GO |
| `artifacts/api-server/test/tournament-atomic-correction-postgresql.integration.test.ts` | `92fe7245604458aff815a6a21b2e2e19f757a54a` | Separate Pack17 test adds original release correction SQL 0030/0031 after 0001–0028 |
| `artifacts/api-server/package.json` | `bf931f87a7b0d5532b949f44c7e091878fe6db52` | `test:integration` invokes run-tests.ts |
| `package.json` | `07929726f77b63bf375af4eb3ad4c70482cc7e14` | Root TypeScript reference build first |
| `lib/db/src/index.ts` | `50cbf483d87a8a741f4965acde5edf6225fedd3e` | Database Pool reads `process.env.DATABASE_URL`; must prevent inherited production value |
| `lib/db/package.json` | `8c119efabac402704bc47be8798ab8e1ea621e7f` | Contains destructive scripts; avoid `push`, resets or schema comparison opt-in |
| `lib/db/test/schema-catalog-comparison.integration.test.mjs` | `5b56164e535c361ff0e50532c9c368e7b77b206f` | Separate opt-in suite drops `public` in two DBs; **excluded** |
| `.github/workflows/tournament-correction-ci.yml` | `e8b70393d311cd80c32ef78b2c16ac7b87d5ec63` | Original CI uses `postgres:16` service, port 5432; local PG16 should use independent dedicated nondefault port |
| `lib/db/migrations/0001_series_v1_clean_cutover.sql` | `ff35eeac793e46335e5be2697308cec337d03476` | Contains DROP TABLE/TYPE operations; safe only on fresh explicitly disposable fixture |
| `lib/db/migrations/0028_match_revision.sql` | `45eb2ea26e8bbeb290be4e8ded21b544440ce7ec` | Last standard helper migration |
| `lib/db/migrations/0030_controlled_correction_operations.sql` | `50aa71ae0199806de3aaf3c57700d2739f2c42bc` | Pack17 extra release correction migration |
| `lib/db/migrations/0031_atomic_correction_receipts.sql` | `d44601f4b6477dc9366fc7a65475a0eede1c34c1` | Embedded BEGIN/COMMIT; explicit wrapper strip in test fixture |

The 14-entry release/editor source-identity ledger from [A20 R23A](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md) remains `PROPOSAL_ONLY_NOT_APPROVED`; original editor 0030/0031 not interchangeable with release correction 0030/0031. D01–D04 migration allocation owner approval is a separate gate; no T055 SQL.

## 3. Published R23F docs-only deliverables and QA

| Artifact | Created on branch `chore/web-005/t000-wave1-control` | Commit SHA |
|---|---|---|
| [PG16_ISOLATION_CONTRACT.md](./PG16_ISOLATION_CONTRACT.md) | 1. Physical host/port/PGDATA/roles + two different destructive scopes | `7d2b927d3e06a9312ffcc4e616b44c1e884f0393` |
| [PG16_PREFLIGHT_CHECKLIST.md](./PG16_PREFLIGHT_CHECKLIST.md) | 2. Proof checklist with STOP classes and consent | `4d1dfceccfbf1a2d1fccdec741161f26212142dd` |
| [PG16_EXECUTION_AND_ROLLBACK_PLAN.md](./PG16_EXECUTION_AND_ROLLBACK_PLAN.md) | 3. E0–E8 stages, first fail, evidence/cleanup | `6d875365f49992749585f06b12ebcf77bc26c617` |
| [PG16_A50_DIAGNOSTIC_HANDOFF.md](./PG16_A50_DIAGNOSTIC_HANDOFF.md) | 4. Exact command and required TAP/root-cause handling | `2780b4ff07af3e48c9151cc3cdb2a8ab49ea8bc9` |
| [PG16_OWNER_APPROVAL_REQUEST.md](./PG16_OWNER_APPROVAL_REQUEST.md) | 5. Triple signer + G0–G5, S1/S2 separately | `78e12c6e5e5e014502836421038e586eba9ea62d` |
| [PG16_OFFLINE_PREFLIGHT.mjs](./PG16_OFFLINE_PREFLIGHT.mjs) | 6. **Never executed** purely local source/env validation, no DB, no network, no writes; never grants GO | `dccd8d8c1075be8a8bd25b3864a020e17ad27b44` |
| This report | 7. Source SHA, actually executed GitHub reads/static inspection and residual blockers | commit after publication / readback |

**A20 code static inspection:** `PG16_OFFLINE_PREFLIGHT.mjs` author-time source scan verified: no imported child-process runner, no network connect/fetch/client, no filesystem writes, no CREATE/DROP/DDL, and constant output `decision:'PG16_EXECUTION_NOT_AUTHORIZED'`. **No Node/PowerShell/native execution of this script**, no PostgreSQL connection. Offline source Git blobs were fetched via GitHub connector, not verified from owner's Windows disk in this turn.

### Test classification

| Check | Real result |
|---|---|
| PR60 exact HEAD + source blob readback | VERIFIED GitHub |
| A50 426/426 + A60 `DBFREE_QA_ACCEPTED` | VERIFIED PRE-EXISTING RECEIPTS (not rerun by A20) |
| Old GitHub workflow log/first failure | Log FETCHED; exit 1 confirmed; **first named error UNKNOWN** |
| A20 document publication/readback | Files created on GitHub; final blob readback pending later verification |
| Offline preflight script static safety scan | PASS SOURCE ANALYSIS ONLY |
| Offline preflight script native execution | NOT_EXECUTED |
| Owner Windows physical PG16 | NOT_CREATED / NOT_CERTIFIED |
| A00/HQ+A20+operator independent approval | MISSING |
| Catalog SELECTs, migrations, schema reset, CREATE/DROP DB, API Integration | **ALL NOT_EXECUTED** |
| Google Drive `G:\Mój dysk\ChatGPT\WEB-005\Raporty` sync | NOT_EXECUTED / CLOUD_SYNC_UNVERIFIED |
| A60 independent review of R23F **new documents** | PENDING |
| Protected merge, live, C02, SWARM-006 | ALL HOLD |

## 4. Explicit unresolved blockers for owner/operator

**Critical safety finding:** original C01 `test:integration` discovers `replit-schema-catalog-reconciliation.integration.test.ts` and therefore includes **CREATE DATABASE and DROP DATABASE WITH (FORCE)** on three temporary databases; older prior A20 planning only called out tm_test schema reset. **A00 must approve S2 explicitly or the full test command must not run.** The `lib/db` opt-in comparison drops public in distinct DBs and is excluded.

**Physical information missing:** independently verified Windows host, exact disposable PG16 container/VM and data directory, process/port/network/volume identity, empty test database, credential scope, role privileges for both S1 and S2, full teardown guarantee, observer certificate, approval TTLs. Need operator name and original signed evidence. Can't prove these from a target URL or artifact report.

**Source/runtime information missing:** exact *operator-local checkout* commit/lockfile blob evidence, Pg16 extension status on actual certified cluster, actual first failed API assertion/error, original CI stream truncation, executed real migrations/fixtures evidence, redacted stdout/stderr and true exit, permissions/audit for three DBs, post-run cleanup footprint and Google Drive remote readback.

**Owner decision:** pending triple exact-scope A00/HQ + A20 + Windows operator signoff. Current A20 work is document preparation only; does not constitute A20's execution signature. The future owner actions are explicitly in [PG16_OWNER_APPROVAL_REQUEST.md](./PG16_OWNER_APPROVAL_REQUEST.md).

**Final:** **`PG16_PREFLIGHT_READY_FOR_OWNER_APPROVAL`** (prepared docs and safety gates) / **`PG16_EXECUTION_NOT_AUTHORIZED`** (no actual test, DB reset, SQL, API Integration, C02 or release). A50 runs nothing on PG until separately signed GO; A60 independently verifies next real proof before any further C01/C02 decision.
