# WEB-005 / A20 / R23F — PG16_ISOLATION_CONTRACT

**Task:** `WEB-005-T020-A20-R23F-PG16-INTEGRATION-PREFLIGHT`  
**Mode:** read-only design / source analysis; **execution state:** `PG16_EXECUTION_NOT_AUTHORIZED`.  
**Source under test:** [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) exact C01 HEAD `fa3261b2c9510e110ac9eba21726812d3401a525` — DRAFT/UNMERGED. **No source modifications or database contact under this task.**

## 1. Physical trust boundary

The only acceptable test target is a **new, exclusive PostgreSQL 16** process/container/VM with independent *data directory*, network namespace/firewall and no route/credential capable of reaching existing production, Replit, staging or shared PostgreSQL. Prefer owner-created disposable VM or local Docker container on an isolated host-only network, with port explicitly allocated and bound to loopback only (not default 5432), isolated directory or named volume created *for this run*. **Do not assume** localhost/port/URL, `test` in name, `tm_test_*`, Docker label or PGPASSWORD prove physical isolation. DNS can change, socket/proxy can redirect, Docker Desktop may expose a different endpoint. No remote public listeners or credential inheritance.

Operator independently records a nonsecret signed **physical certificate**: hostname (redact public details in shared report), OS/boot identity, container image `postgres:16` **with immutable digest** or verified PG16 binary build, exact container/VM/process ID, immutable data volume path/ID and its newly-created marker, owner process identity, *actual* listener PID+local port, port mapping, network/route and firewall proof, host data-dir ownership, cluster system identifier/volume UUID obtained **out of band by operator**, timestamp and expiry. Don't grant privileged database function access to test code just to see cluster ID. Certificate includes a hash of the operator observation evidence and explicitly attests **no existing user/business data**. **A20 must review the evidence, not simply accept self-labelled JSON.**

### Minimum namespace inventory

| Level | Isolated identity and constraint |
|---|---|
| Source | immutable C01 SHA, frozen pnpm lock hash, source blob pins, new disposable checkout/worktree; original C01 tree never patched |
| Host | exact owner-certified Windows 11 host, container/VM ID and process owner; no use of existing PostgreSQL Windows service/shared `postgres` process |
| Network | bound loopback nondefault port and isolation proof from OS/container mapping + PG endpoint, DNS/TLS/proxy path reviewed; unknown/remote hostname STOP |
| Cluster | **PG16** major version 16.x, independent empty PGDATA and system identifier, no link or mount of existing live data |
| Database | dedicated unique database containing `test`, proposed naming `web005_c01_test_<nonce>` (final signed name must match actual source guards); no inherited `DATABASE_URL` |
| Schema | exact unique `tm_test_<nonce>` only for standard API helper; **never** `public`, `main` or an existing schema |
| Extra catalogue fixtures | `replit-schema-catalog-reconciliation.integration.test.ts` creates **three additional database names** `tm_catalog_test_<16hex>_{dev,prod,fresh}` and drops them using `DROP DATABASE ... WITH (FORCE)`. This requires explicitly separate and stronger **CREATE_DATABASE/DROP_DATABASE** approval, ACL and cleanup ownership; not covered by tm_test schema grant. |
| User | DB credential scoped only to disposable cluster, ephemeral test account; role may need schema CREATE in *its own* DB, and catalogue-fixture role needs CREATEDB only for separately approved exact fixture. Never reuse production/Steam credentials. No application role may connect to other clusters. |

## 2. Exact C01 repository contracts

| File, exact Git blob | Confirmed behavior and safety impact |
|---|---|
| `qa/pack17/gate-contract.mjs` `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` | Env must include `NODE_ENV=test`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, PostgreSQL `TEST_DATABASE_URL`, database name containing `test` and target not containing `prod`, `TEST_DATABASE_SCHEMA` matches `^tm_test_[a-z0-9_]+$`. **String-only guard; not physical proof** |
| `artifacts/api-server/test/test-database.ts` `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | `NODE_TEST_CONTEXT` required; DB URL parsed; helper rewrites search_path, imports 0001–0028, actually **DROP SCHEMA IF EXISTS "tm_test_*" CASCADE**, CREATE SCHEMA, and drops on teardown/failure. It replaces `public.` in SQL; transaction wrappers are stripped for selected migrations. **Write/reset helper**, not read-only. |
| `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | In a Node integration test it requires localhost/nondefault PG port, creates `tm_catalog_test_<16hex>_{dev,prod,fresh}`, applies history, invokes **CREATE DATABASE / DROP DATABASE WITH (FORCE)**. Whole `test:integration` includes this file via discovery; must not authorize full suite on schema-only permission |
| `lib/db/test/schema-catalog-comparison.integration.test.mjs` `5b56164e535c361ff0e50532c9c368e7b77b206f` | An **additional** `lib/db` opt-in suite resets `public` in two separately provided databases if enabled; **EXCLUDED** from R23F C01 API scope. Do not set `SCHEMA_COMPARE_TEST_*` variables |
| `artifacts/api-server/test/tournament-atomic-correction-postgresql.integration.test.ts` `92fe7245604458aff815a6a21b2e2e19f757a54a` | Pack17 targeted fixture applies release corrections `0030/0031` **after** 0001–0028 test helper, removes standalone transaction boundaries from 0031; requires separate authorization for these test-only schema writes. |
| `artifacts/api-server/test/run-tests.ts` `da4188446aba4696f97eb7831fee0cc5824d212f` | Discovers all `*.integration.test.ts` recursively and invokes Node `--test-concurrency=1`; **does not silently skip catalogue test** |

**Fixture lineage:** standard API test helper stops at **0028**; *not* release Steam 0029 nor release correction 0030/0031 by default. Pack17 atomic correction test separately adds 0030/0031 to its fixture. Editor 0030/0031 collide with release numbers; editor proposed canonical 0032–0040 are **PR38 proposal only** (`PROPOSAL_ONLY_NOT_APPROVED`). No C01 preflight may import live editor migrations, infer `APPLIED` from file names, or create new Basket CAS migration ID.

### Extensions and version

Project CI workflow `.github/workflows/tournament-correction-ci.yml` exact blob `e8b70393d311cd80c32ef78b2c16ac7b87d5ec63` uses `postgres:16`, test DB service. Core standard API fixture 0001–0028 should start with PostgreSQL's normally installed `plpgsql`; no blanket `CREATE EXTENSION` is authorized here. **`pg_trgm` belongs to separate editor catalog proposed 0035, not automatically needed for C01 base schema**. Before signing deployment/test, A50 inventory exact fixture SQL for extension dependencies and check approved cluster `pg_extension` via authorized read-only catalog phase. If a required extension is absent, STOP and separately approve *test-cluster-only* provisioning by operator; no silent superuser/extension installs.

## 3. Permission split: read-only vs test mutations

**Phase P0 offline:** read GitHub/checkout source and host operator reports, no database connection at all; harmless static preflight may compare C01 source blob SHA and the signed certificate format, never emit credentials. **This is the ONLY phase permitted by current R23F instruction.**

**Phase P1 (future)** requires **three written approvals A00/HQ + A20 + operator** for exact immutable cluster/DB/schema and **`READ_ONLY_CATALOG_GO`**. Observer role `LOGIN,CONNECT` to one disposable database, limited catalog visibility, no elevated flags, `CREATEDB`, schema CREATE, application writes, or escalation memberships. Use `default_transaction_read_only=on` and short timeouts. Previously prepared [catalog SELECT-only](https://github.com/C8LyNn/aplikacja-turnieje/blob/ee25edb9a6296e256005d477d3d5fadfa1d1859d/docs/web-005/agent-reports/A20/WEB-005_A20_R23C_PG16_CATALOG_SELECT_ONLY.sql), then separate named-scope ledger-read approval. Not aimed at live/Replit.

**Phase P2 (future)** after separate tripartite **`DISPOSABLE_SCHEMA_RESET_GO`**: test execution role may `CREATE/DROP` only the exact new `tm_test_*` schema and own objects; instance-level owner enforces no other grants/schemas/databases. Test role is never superuser; do not run as admin. Schema teardown occurs only after evidence capture and only for resources certified as **created by this run**.

**Phase P3 (future)** for full API Integration: separate explicit **`CATALOG_THREE_DATABASE_CREATE_DROP_GO`**, with operator-created disposable cluster where scoped test role has `CREATEDB` by necessity, ***zero*** rights to connect to other clusters. This is a high-impact privilege: do not grant on a shared cluster; operator certificates must include exact allowed names/glob, endpoint and purpose, and A50 must record actual created UUID suffix and post-run zero residual databases. A00 may decline: then **DO NOT RUN FULL `test:integration` AND DO NOT CLAIM CI FIRST FAILURE REPRODUCED**. Running a bounded subset must be separately recorded as incomplete; never change test source/skip flags.

## 4. Immediate STOP predicates

Fail closed if: no exact C01 SHA or drifted test helper/guard blobs; no triple signer; unknown PGDATA/container identity, inherited shared service or mounted prod volume; non-loopback/unknown forwarding, proxy or live secrets; mismatched host/port/IP/db/schema/cluster fingerprint; PG not 16; other schema/database ownership; mixed `DATABASE_URL` target; reset count unspecified; any pre-existing target schema/database containing non-fixture data; no disposable evidence backup/checkpoint; no approved exact teardown plan; missing `pg_trgm` when *actually required* by separately approved fixture; accidental `DROP public` opt-in tests; mismatch in proposed 0027–0040 ledger; unreviewed CREATE/DROP DATABASE fixture or unexpected process/network writes; credentials in logs; unattended run with expired approval. A failed source-only preflight = **STOP** without DB contact.

## 5. Retention / Google Drive policy

Owner reports target: `G:\Mój dysk\ChatGPT\WEB-005\Raporty` (Windows local synchronized folder). Create **unique R23F subdirectory** `C01_PG16_R23F_<UTC>_<random>` later by *authorized owner/operator*, not A20 during docs phase. Keep unsanitized raw stdout/stderr/DSNs **only in access-restricted local scratch**, never inside synced Drive. Write redacted evidence with SHA256 of the **redacted bytes**, fingerprints, manifest, phase gates and TAP to Drive temp filename; rename atomically after flush; verify by Google Drive API remote listing/download/hash before reporting `CLOUD_SYNC_VERIFIED`. Local path exists or green cloud checkmark alone means only `LOCAL_FILE_WRITTEN / SYNC_UNVERIFIED`. Offline/Drive failure leaves `CLOUD_SYNC_UNVERIFIED`; never claim remote receipt. Drive contents are evidence, not A00 approval.

**Result:** `ISOLATION_CONTRACT_DRAFT_READY / PHYSICAL_TARGET_NOT_CERTIFIED / PG16_EXECUTION_NOT_AUTHORIZED / NO_DB_CONTACT`.
