# WEB-005 / A20 / R23G — PG16_S1_S2_PERMISSION_MATRIX

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION` · **Date:** 2026-10-17 Europe/Warsaw · **Mode:** source-verified read-only review · **Consent:** all phases require independent A00/HQ + A20 + operator per resource. **Runtime:** `NOT_EXECUTED`.

## Exact source proof (PR #60 HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`)

| Test fixture | File / Git blob SHA1 | Actual effects; scope |
|---|---|---|
| Pack17 contract pure | `qa/pack17/gate-contract.mjs` / `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` | Requires `NODE_ENV=test`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, test-named PG URI not containing prod, `tm_test_*`; string validation only, **cannot certify cluster** |
| Standard API DB bootstrap | `artifacts/api-server/test/test-database.ts` / `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | `getSafeTestDatabaseConfig` requires `NODE_TEST_CONTEXT`, derives scoped `search_path`, then **DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE**, CREATE SCHEMA, applies **0001–0028**, selected replay/transform, and teardown DROP SCHEMA. Needs S1 and privileges to create/drop own schema and objects |
| Dedicated Pack17 PG test | `artifacts/api-server/test/tournament-atomic-correction-postgresql.integration.test.ts` / `92fe7245604458aff815a6a21b2e2e19f757a54a` | After standard fixture, applies **release** `0030_controlled_correction_operations.sql` and `0031_atomic_correction_receipts.sql` with test wrapper handling only if separately approved. **Not** wholesale migration rollout |
| S2 catalogue fixture | `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` / `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | Requires `localhost` / `127.0.0.1` / `::1` on **non-5432**; `CREATE DATABASE tm_catalog_test_<16hex>_{dev,prod,fresh}`; applies SQL, creates drift; teardown `DROP DATABASE IF EXISTS ... WITH (FORCE)`; uses adminPool same test DSN. **Needs S2 separate** |
| API test selection | `artifacts/api-server/test/test-discovery.ts` / `dd427fdafa92c089e2edad704079d81945c4b1c1` and `run-tests.ts` / `da4188446aba4696f97eb7831fee0cc5824d212f` | `pnpm --filter @workspace/api-server run test:integration` recursively discovers **all** `*.integration.test.ts` with `--test-concurrency=1`; catalogue fixture part of full suite. Do not skip it covertly |
| Explicit excluded opt-in | `lib/db/test/schema-catalog-comparison.integration.test.mjs` / `5b56164e535c361ff0e50532c9c368e7b77b206f` | Can reset `public` in two databases if SCHEMA_COMPARE_TEST_* enabled. **DENY** this independent path; no public reset on base test DB |
| DB client | `lib/db/src/index.ts` / `50cbf483d87a8a741f4965acde5edf6225fedd3e` | Opens pool from `DATABASE_URL`; its parent env MUST be absent/unset. Fixture sets test derived URL locally. Never inherit Windows `DATABASE_URL` |

## Least-privilege role matrix

| Operation / object | Operator bootstrap PG superuser G1 | Test runner before S1/S2 | S1 dedicated runner after grant | S2 dedicated runner after grant |
|---|---|---|---|---|
| Open existing Windows PostgreSQL at 5432 | **DENY** | DENY | DENY | DENY |
| Connect to newly created base test DB | Setup only | Metadata if G2 signed | ALLOW | ALLOW |
| `CREATE/DROP SCHEMA tm_test_<nonce>` | Not needed after provisioning | DENY | **ALLOW**, own schema only (enforced by exclusive empty disposable DB + own ACLs) | ALLOW as part of S1 only |
| Run SQL 0001–0028 against own schema | DENY until test approval | DENY | ALLOW on new disposable base DB via test helper only | ALLOW from S1 if both signed |
| Create application fixture rows / rollbacks | DENY until test approval | DENY | ALLOW inside own S1 test DB | ALLOW in exact signed S2 child DBs |
| Cluster role `CREATEDB` | Bootstrap G1 may grant after S2 signature | **NO** | **NO** | **YES**, only empty physically isolated **entire cluster**, temporary per-run |
| `CREATE DATABASE tm_catalog_test_<16hex>_{dev,prod,fresh}` | Never used by tests | DENY | DENY | **ALLOW** when S2 signed; actual run-created names logged |
| `DROP DATABASE IF EXISTS ... WITH (FORCE)` | G1 bootstrap does not run fixtures | DENY | DENY | **ALLOW only for three newly owned S2 databases**; privilege technically cluster-wide CREATEDB plus db ownership; physical isolation is primary guard |
| Drop `public` in **base** DB or host/shared DB | DENY | DENY | DENY | DENY |
| Install extension with superuser | G1 setup separately authorized only | DENY | DENY | DENY |
| `drizzle-kit push`, shell migrators, live ledger edits | DENY by this task | DENY | DENY | DENY |
| Delete container / volume / Docker network | Per-item operator cleanup G5 only | DENY | DENY | DENY |
| Connect outside isolated namespace | DENY | DENY | DENY | DENY |

**Important privilege caveat:** Standard PostgreSQL `CREATEDB` cannot be constrained by SQL GRANT to a specific database-name prefix. **S2 would be unsafe on existing Windows PG16** even with a `test` database name. Therefore S2 GO may be issued *only on the new empty cluster with zero foreign databases/data, no external network and short-lived role*. Superuser must never be passed into A50 test process or Google Drive.

### Conditional permissions and hard denial rules

- S1 permission is **not** S2 consent. S2 requires additional named `CREATEDB` and `DROP DATABASE WITH FORCE` acceptance, including fixture behavior that intentionally simulates "Production" *only as test DB suffix `prod`*; `tm_catalog_test_<hash>_prod` is a disposable fixture, **not production**. The standard Pack17 URL string guard rejects a **base target** with prod, not the S2 generated fixture name.
- A test runner cannot be safely configured as strictly read-only while it runs integration fixtures: schema and DB writes are inherent. Separate read-only observer for G2 vs ephemeral privileged-for-test login for G3/G4.
- **Actual test harness limitation:** generic S1 `DROP SCHEMA` may fail if role lacks schema ownership; role must own target scratch DB/schema, but no other database/role object. Fail closed instead of widening grants.
- S2 fixture may perform `DROP DATABASE WITH (FORCE)` and disconnect its own pools; if operation targets anything not matching the signed 3-name inventory, STOP cleanup and isolate cluster. No retries/skip to conceal errors.
- Parent Windows environment `DATABASE_URL`, `PGSERVICE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGPASSFILE`, `SCHEMA_COMPARE_TEST_*` must not leak into runner. Generate ephemeral `TEST_DATABASE_URL` *inside* container from private secret, enforce literal certified host `127.0.0.1:55432`, name, schema and role; no live fallback or redirected socket.
- Test runner already runs local `NODE_TEST_CONTEXT`; do not forge it manually. Real test source and library migration code remain unchanged.

## GO matrix and traceability

```text
S1_GO = A00_G3_S1 && A20_G3_S1 && OPERATOR_G3_S1
S2_GO = A00_G3_S2 && A20_G3_S2 && OPERATOR_G3_S2
FULL_API_GO = G0_SOURCE_SHA_PASS && G1_PHYSICAL_CERT_PASS && G2_READ_ONLY_PASS
              && S1_GO && S2_GO && A00_G4 && A20_G4 && OPERATOR_G4
```

If **S1=false**: no DB mutation or API Integration. If **S2=false**: no full `test:integration` command. A separate explicitly named file subset may be studied/authorized later but MUST be labelled `PARTIAL_TEST_SCOPE`, not reproduced original complete job. **Current all S1/S2/G4 approvals missing**, no Docker/DB action undertaken.

**Verdict:** `S1_S2_CONTRACT_SOURCE_VERIFIED / S1_NOT_AUTHORIZED / S2_NOT_AUTHORIZED / PG16_EXECUTION_HOLD`.
