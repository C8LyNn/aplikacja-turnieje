# WEB-005 — A20 / R21 · PG16 owner gate

**Task:** `WEB-005-T021-A20-R21` · **Agent:** A20 PostgreSQL Migration Reconciliation · **Date:** 2026-10-14 (Europe/Warsaw) · **Mode:** SOURCE/SAFE only.  
**Decision:** `WAIT_OWNER / ENV_BLOCKED / P05_REVIEW_ONLY / ready_for_sql:false / PG16_NOT_EXECUTED / SQL_STOP / SWARM006_HOLD`.

## 1. Actual owner decision and source evidence

- [R21 central instruction](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R21_AGENT_PROMPTS.md), Git blob `f90aa01ada90a0a311eb9a8d97d04a5c65c89e45`. R21 is **owner intake**, no code change GO.
- [R21 owner decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md), Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`: `DRAFT FOR OWNER SIGNOFF`, **zero signed selections**. Section 7 `EXEC=A/B/DEFER___`, `TEST_RESET_GO___` and `FINAL_HANDOFF_GO___` remain blank. Owner-signed URL: **NULL**. No separate physical host/database/observer approval. Therefore `WAIT_OWNER`; neither EXEC-A nor EXEC-B is selected.
- [Independent A60 R20 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), Git blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`, states `HANDOFF_NOT_READY`. P05's unchanged-source verdict is `SOURCE_ACCEPTED_OFFLINE_ONLY` from A60 R18; no physical PG16/runner signoff. R20 A60 does independently accept new source PR53 scoped and PR54 conditional, **not** full release.
- [A50 R20 executor receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R20_RECEIPT.md), blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`: 0 native React/API/PG16 tests, missing full trusted per-SHA checkout/pnpm10 and owner-provided dedicated PG16. A20 runtime verified Node v22.16.0 and local R20 log files only; `pnpm`, `psql`, `docker`, `pwsh` unavailable here. **No R21 PostgreSQL or API command was run.**

P05 [PR38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38): OPEN/DRAFT/UNMERGED; R20 and current R21 HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, release branch unchanged. `manifest.proposal.json` remains `PROPOSAL_ONLY_NOT_APPROVED`; release/editor original numbers `0030/0031` refer to distinct migrations and require exact lineage + checksum + owner-approved adoption policy. R20 offline receipts: 37/37 Node tests, 22/22 A20-only synthetic negatives exit 0; missing pin/source CLI `STOP` exit 2. **Not rerun in R21**: no new HEAD/evidence. All validator outcomes `ready_for_sql:false`; no DDL/adoption/runner GO.

## 2. One precise A00/owner unblock request — physical test environment

Owner must choose and sign **EXEC-A** in packet §7, or explicitly choose/defer an alternative with all required release implications. If EXEC-A: supply A50 a trustworthy authorized PC/VM with full Git checkout at each PR exact SHA, Node22/pnpm10, frozen lockfile deps, a *physically dedicated disposable* PostgreSQL **16** cluster and signed nonsecret **READ_ONLY_CATALOG_PREFLIGHT** certificate:

- Owner/approver ID/date/permission ID and expiry; exact PG16 cluster/container ID + immutable image digest, actual host/IP or socket and port, database name, observer role, expected schema `tm_test_<unique>`, source/fixture profile F0 (empty) or separately proven F1/F2; independent attestation **NO production/shared/staging/Replit/customer data or credential reuse**.
- Read-only observer without superuser, CREATEDB, CREATEROLE, BYPASSRLS, REPLICATION or CREATE DB/schema privileges; credentials delivered privately, never in GitHub, shell args or logs.
- After signed approval, A50 may run the existing **unchanged** [catalog SELECT-only SQL](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R15_PG16_CATALOG_READ_ONLY.sql), under `BEGIN READ ONLY`, local query timeout, `ROLLBACK` using explicit `psql -X -W -v ON_ERROR_STOP=1 -h <host> -p <port> -U <observer> -d <dedicated_db> -v schema=<tm_test_schema> -f <approved_sql_path>`. Only then verify host/version/database/role/schema/constraints/triggers/FKs and preserve sanitized command/exit/catalog digest. A matching SQL response alone **does not** establish physical isolation; match out-of-band certificate.
- **Separate future written approval** needed for any destructive `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, exact `tm_test_*` schema, test-only executor role, explicit `TEST_DATABASE_URL` pointing to that independent DB (NEVER fallback to `DATABASE_URL`), exact PR SHA/suite and fixture reset/disposal. This packet has **no signed reset GO**. The existing `resetTestSchema()` executes `DROP SCHEMA ... CASCADE` and creates default fixture through 0028, not all release 0029–0031. Original SQL has explicit `public.*`; `search_path` is not a safety boundary. Never run opt-in catalog tests that can `DROP SCHEMA public CASCADE` as a general preflight.

Any wrong physical host, database, schema, user, source SHA, missing certificate, secret leak, shared DB or unspecified reset scope => **STOP BEFORE CONNECTION/TEST**.

## 3. Bounded A50 PR-specific API commands — FUTURE, NOT EXECUTED

**All rows require owner-signed physical identity + a distinct later test/reset GO, full *separate* exact SHA checkout, `pnpm install --frozen-lockfile`, unique dedicated `tm_test_*`, test-only `TEST_DATABASE_URL`, and actual PostgreSQL 16 fixture.** Run from `artifacts/api-server/` and capture invocation, exact HEAD, exit/TAP/skip, expected negative zero-write, sanitized DB fingerprint, A60 independent review. Tests mutate disposable test data; no part of this table grants execution.

| PR | Exact HEAD SHA | Node test (from `artifacts/api-server/`) |
|---|---|---|
| #41 | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts` |
| #42 | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts` |
| #39 | `16053ee132756ca05b6f2cd1f0cabae823905387` | `node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts` |
| #44 | `2f0187b7242681c394c09058b5ef647667206bd6` | `node --import tsx --test --test-concurrency=1 ./test/session-revocation-race.integration.test.ts` |
| #45 | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | `node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts` |
| #46 | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `node --import tsx --test --test-concurrency=1 ./test/tournament-delete-revocation.integration.test.ts` |
| #48 | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | `node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts` |
| #49 | `99298b81501c3e7764d653604923522a19b9f05c` | `node --import tsx --test --test-concurrency=1 ./test/auth-organizer-revocation-r12.integration.test.ts` |
| #51 | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | `node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts` |

#41 Backup B1 positive QP/QPE/OP sourceBasketPosition parity and intentionally corrupted 400 INVALID_BACKUP_V3 before clone/zero writes; #42 concurrent queued stale roster undo expected 409 UNDO_ACTION_CHANGED/zero writes. Repeated test filenames #41/#48, #42/#51 do **not** imply interchangeable results. For fixture deficiency or missing owner/PG16 target: `NOT_EXECUTED/ENV_BLOCKED`, not PASS. All other exact test oracles remain in [A20 R20 gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/97fa564376834541e4b0d18240e84a62077e45fc/docs/web-005/agent-reports/A20/WEB-005_A20_R20_PG16_GATE.md).

## 4. Required stop and next owner action

**WAIT_OWNER (exact link):** [WEB-005_R21_OWNER_DECISION_PACKET.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md) §7 `EXEC=A/B/DEFER`, `TEST_RESET_GO`, `FINAL_HANDOFF_GO` still unsigned; no trusted physical host/PG16. A00 obtains explicit answers and written physical test credentials/permissions, **not** an A20 inferred approval. If owner instead selects EXEC-B, that's a separate final-only conditional policy **after** all case/source/product decisions, with hard downstream release tests and no immediate PG16 access by A20.

**FINAL:** `WEB-005-T021-A20-R21 / NO_NEW_P05_SOURCE_EVIDENCE / WAIT_OWNER / PG16_NOT_EXECUTED / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`. No new app code, no SQL/DDL, no merge or deployment, and no SWARM-006 invocation.
