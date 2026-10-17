# WEB-005 — A50 / R23H-R2 — FOUR-DATABASE + DRIZZLE-KIT SAFETY ADDENDUM

**Task:** `WEB-005-T050-R23H-R2-RUNNER-PUBLICATION` · **Date:** 2026-10-17 · **Scope:** SOURCE ONLY / DOCUMENTATION ONLY / NO EXECUTION  
**Exact unmodified C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60).  
**Supersedes for SQL scope only:** R23H documents incorrectly presented S2 as involving only three dynamically created databases. The five original R23H files remain byte-identical and are not silently edited.  
**Owner:** A50 design; A22 SQL safety is authoritative for future mutation approval; A20 physical PG16; A24 readiness; A30 security; A23 provenance; A60 independent QA.

## 1. Source-derived fourth database, in addition to the three catalog databases

The complete set of **four dynamically CREATEd/DROPped fixture databases** under the recursively discovered API `*.integration.test.ts` scope is:

| Test fixture / exact Git blob SHA-1 | Actual scratch database name(s) | Operations verified by reading C01 | Consent |
|---|---|---|---|
| `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` / `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | `tm_catalog_test_<16hex>_dev`, `_prod`, `_fresh` (three DBs per run) | `CREATE DATABASE` three times, SQL history, fixture schema/rows; `DROP DATABASE IF EXISTS ... WITH (FORCE)` during `after()` | `G3_S2_CATALOG` — explicit coverage of all three, no wildcard authority |
| `artifacts/api-server/test/drizzle-schema-diff.integration.test.ts` / **`e008dbd9fe287632252d3fcfda246f60e4cc35d3`** | `tm_drizzle_schema_test_<32hex>` (one additional DB) | `CREATE DATABASE` around line 231; complete forward SQL migration history, index/metadata writes; `drizzle-kit push --config ./drizzle.config.ts --force --verbose` around lines 177–199; `DROP DATABASE IF EXISTS ... WITH (FORCE)` around line 275 | **`G3_S2_DRIZZLE` separately reviewed/explicitly named**, and `--force` included in destructive write contract |

**Count scope nuance:** These **four dynamically created fixture DBs are additional to** the *preprovisioned base test DB* `web005_c01_test_<nonce>` used for S1 `tm_test_<nonce>` schema. Consequently the approved disposable PG16 cluster may contain **five run-owned databases total** (base + four dynamically generated), besides PostgreSQL system templates/maintenance DBs. Do not publish "only four databases exist" or conflate four S2 databases with the baseline S1 DB. All precise runtime names and OIDs are **PENDING** until authorized execution.

**Actual exact C01 proof**: source file reads at immutable commit above; `test-discovery.ts` blob `dd427fdafa92c089e2edad704079d81945c4b1c1` recursively includes all `*.integration.test.ts`; `run-tests.ts` blob `da4188446aba4696f97eb7831fee0cc5824d212f` invokes the entire integration set. The old three-DB design is **materially incomplete**, so earlier G3-S2/ G4/ G5 contract is not acceptable without replacement approvals. Independent A22 R23H SQL verdict: https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view (agent's external audit; here the fourth DB and force command were additionally source-verified directly).

## 2. `drizzle-kit push --force`: security and behavior

The C01 fixture invokes `node <lib/db/node_modules/drizzle-kit/bin.cjs> push --config ./drizzle.config.ts --force --verbose` as a child with `cwd=lib/db`; `env={...process.env, DATABASE_URL:testConnectionString}` and timeout 60 s. The child is aimed at the newly created fourth scratch DB, but **inheriting parent environment remains a risk**. `--force` bypasses normal interactive safeguard and can apply destructive DDL to the target. Actual SQL emitted by Drizzle depends on the exact installed package, schema and current scratch catalog, so the full statement set/impact is **PENDING A22 source/lock and dry SQL review**, NOT certified SAFE. Capture native stdout/stderr of both child and parent through the process tree and the target database fingerprint. Do not suppress this invocation, patch tests, remove `--force`, or claim reproduction of original CI from a filtered test set.

Must review `lib/db/drizzle.config.ts`, `lib/db/src/schema/index.ts` and package `drizzle-kit` pinned resolution; any unexpected schema/target/default URL is `STOP_UNEXPECTED_DRIZZLE_TARGET`. Include fixture-driven `DROP DATABASE ... WITH (FORCE)` in the same separately signed G3/G4 scope; cleanup can fail mid-way. `SCHEMA_COMPARE_*` variables constructed by *the catalog fixture* for its own disposable DBs are valid only as fixture-internal child values — not inherited host configuration.

## 3. Required changes to role/permissions and physical checks

- `CREATEDB` remains **cluster-wide** in PostgreSQL and cannot be restricted to a DB prefix. Provision only on a certified **new empty disposable** PG16 cluster, for a dedicated non-superuser role; **PENDING** grant/revocation evidence and operator/A20 decision. Runtime `NOSUPERUSER`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`; no bootstrap admin credential in Node container.
- Signed S2 must cover **both** CATALOG (three) and DRIZZLE (one), including internal `--force` DDL, fixture migrations, teardown WITH FORCE, role ownership and all possible orphan paths. `G3_S2_CATALOG` acceptance **does not imply** `G3_S2_DRIZZLE` acceptance. Require explicit triple approval A00/HQ + A20 + operator bound to one immutable plan, cluster system ID, image+source digests, names/naming regex, DB ownership and expiry.
- G2/physical certificate must prove no pre-existing matching schema or scratch DB, exact PG16 cluster system identifier/PGDATA volume/container/network namespace, no host port, internal localhost non-5432, immutable runner image and untouched Windows PG16 5432. A string-shaped DSN check is insufficient.
- S1 schema `tm_test_<nonce>` remains a **different** approval scope. Full G4 requires S1 plus both S2 subsets with no hidden skips.

## 4. Sealed launcher changes (DESIGN — NOT IMPLEMENTED OR RUN)

1. Rebuild exact runtime inventory from pristine C01 SHA, enumerate and hash all integration test files; assert presence and blob of `drizzle-schema-diff.integration.test.ts` as well as catalog fixture. Verify expected `pnpm-lock.yaml` SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef`; clean tracked source and no foreign files affecting package behavior.
2. Reject *all inherited* `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*` libpq overrides (`PGHOST`, `PGPORT`, `PGSERVICE`, `PGPASSFILE`, `PGPASSWORD`, `PGDATABASE`, `PGUSER`, `PGOPTIONS`, etc.), external `SCHEMA_COMPARE_*`, credential/config-file loaders and inherited npm/pnpm registry secrets before deriving any DSN. Do not blindly deny `PGPORT` injected by a reviewed future sidecar plan unless that is an **explicit signed per-run setting** built by the launcher itself; default is empty.
3. Only after independent approved physical identity and S1/S2a/S2b GO: create minimal allowlisted env and test secret-derived DSN to `127.0.0.1:55432` inside shared-namespace Option A, specified base DB/role; no URL print, no Docker socket or host binds. Test-generated catalog child `SCHEMA_COMPARE_*` and Drizzle child `DATABASE_URL` are explicit **reviewed exceptions**, not trusted inherited inputs. The latter needs stronger source inspection of `drizzle.config.ts` and the exact `drizzle-kit` package before approval.
4. Fail closed when G3_S2_DRIZZLE authorisation absent/expired, fourth database unaccounted for, test source blob changed, force flag altered/unreviewed, scratch DB existence not proven fresh, or PG permissions unknown. No automatic rerun, rescue grant, alternate DSN, patch, or partial-scope mislabelling.
5. Authorised command remains exactly `pnpm --filter @workspace/api-server run test:integration` with full discovered suite. If any test is intentionally excluded, label `PARTIAL_SCOPE` and require fresh distinct operator-approved plan; cannot claim root-cause reproduction.

## 5. Write-path census and evidence contract changes

**PG write paths (ADDED):** catalog three DBs + one Drizzle scratch database; Drizzle `push --force` can change relations/indexes/constraints inside its scratch DB (exact mutation catalog **PENDING A22**), fixture `INSERT` and SQL migrations, force cleanup. Base S1 schema reset and migrations still separate. Capture before/after independent DB census for **base + four ephemeral DBs**. Auto teardown runs *during G4* and is part of specific signed test scope, NOT authorisation for external G5 cleanup.

**Linux filesystem write paths (PENDING):** Drizzle process runs from `lib/db`; package runtime may write to `/workspace/lib/db`, `node_modules/.cache`, `~/.cache`, XDG/temp, log directories or other dynamic paths. No source-level proof of every dependency write or read-only compatibility. `read_only: true` remains mandatory, `/tmp` tmpfs capacity/UID/access remains **PENDING**. Never add host bind or toggle rootfs writable silently. Capture filesystem writes using authorised G0 audit and later explicitly approved G4 smoke, not this task.

**Evidence additions:** `DATABASE_INVENTORY_5_CONTEXTS.json` (base + four ephemeral; include system templates separately), `DRIZZLE_PUSH_COMMAND_REDACTED.json` (exact child argv+cwd, child exit/signal, target cert), `DRIZZLE_PUSH_SQL_EFFECTS_REVIEW.json` (**PENDING**), `G3_S2_CATALOG_GO.json` and `G3_S2_DRIZZLE_FORCE_GO.json` as separately attributed signed scopes, `S2_CREATEDB_FOUR_DB_LEDGER.json` (all four exact names and creation/teardown/ownership/OID results), `G4_API_RECEIPT.json` and first genuine `not ok` stack. Do not upload raw DSNs or unredacted CLI `--verbose` output: review secret redaction first, then hash redacted bytes and confirm remote Google Drive readback.

**Cleanup:** on failure, record exactly which DBs were created, existence and full identities. Before any manual G5 cleanup require fresh A00/A20/operator triple approval for exact DB OIDs/owners and PGDATA resource IDs. No prefix-based DROP, `docker system prune`, `down -v`, or cleanup of unowned objects. Partial fixture teardown errors => `CLEANUP_HOLD`, no automatic retries.

## 6. Evidence classifications / current disposition

| Check | State |
|---|---|
| Four dynamic DB names / C01 source sites | **SOURCE_VERIFIED** (source-only GitHub file and blob) |
| Drizzle `push --force` command / env-inheritance | **SOURCE_VERIFIED** (source-only code lines 177–199) |
| Full SQL emitted by actual Drizzle push | **PENDING A22** |
| Installed `drizzle-kit` implementation + version/lock resolution | **PENDING** |
| OCI Node/runner digests, Linux runtime write paths | **PENDING** |
| All G0–G5 triple approvals incl S2_DRIZZLE_FORCE | **NOT_GRANTED** |
| Docker build/run, SQL, migrations, PG integration/cleanup | **NOT_EXECUTED** |
| A60 independent acceptance of updated contract | **PENDING** |

**Status:** `R23H_R2_SQL_SCOPE_ADDENDUM_READY / SQL01_SCOPE_BLOCKER_PENDING_A22_A20 / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
