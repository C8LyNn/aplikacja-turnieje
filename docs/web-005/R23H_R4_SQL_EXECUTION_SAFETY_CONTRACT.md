# WEB-005 — A22 / R23H-R4 — SQL EXECUTION SAFETY CONTRACT

**Task:** `WEB-005-T022-R23H-R4-SQL-SAFETY` · **Priority:** P0 / CRITICAL · **Date:** 2026-10-18 (Europe/Warsaw)  
**Mode:** TARGETED SOURCE DESIGN / READ-ONLY. **NOT EXECUTED:** SQL, migrations, Docker, PostgreSQL, integration tests, deploy, application-code edits and merge.  
**Fixed application source:** `C8LyNn/aplikacja-turnieje@fa3261b2c9510e110ac9eba21726812d3401a525` (C01 / PR #60).  
**Inputs:** [A22 R3 final SQL contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/1e025d28253f0ce6e541f034f9eb3b99ff7151ec/docs/web-005/R23H_R3_SQL_FINAL_CONTRACT.md); [A60 R3 independent final QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md) (Git blob `fd8c735360fa8e8d4c78d4a82e09f4e21988fe93`); A50 R2 addendum (Drive `1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN`).  
**A60 disposition:** `R23H_BLOCKED / G0_NO_GO / G1_G5_HOLD`; **7 execution-security P0 remain OPEN**, notwithstanding the source-level SQL-01 inventory correction.

## 1. Decision and boundary

**`SQL-01 / missing S2 fourth DB`: SOURCE INVENTORY CLOSED** at R3. **`SQL-01 / safe destructive execution`: P0 BLOCKED**. This R4 file supplies a **candidate enforceable design**, not implementation, proof of isolation, privilege grants or authorization. It does NOT replace A22 R3's audited inventory.

Two distinct, mutually exclusive approval paths:
1. **C01 exact unchanged SHA / launcher-only containment.** The existing fixtures contain unguarded teardown and schema reset. A launcher can attest a *fresh, dedicated disposable cluster containing no foreign objects*, preprovision the S1 base, pin code/credentials and observe server writes; it **cannot reliably cancel a particular internal `DROP DATABASE ... WITH (FORCE)` issued after a failed CREATE using the same unrestricted CREATEDB test principal**. This path remains **NO_GO by default**, unless A00/HQ+A20+operator explicitly accept documented residual source risks on an independently proven fully disposable isolated cluster and A30/A31/A60 independently review the decision. No broad claim of guaranteed fail-closed teardown is permitted.
2. **Source-hardened candidate (preferred).** Modify the destructive fixture hooks and S1 helpers as §7, submit isolated reviewed PR, produce **NEW exact SHA**, rerun relevant source/security QA and freeze revised signed G0–G5 plan. **Do not label this a reproduction of the original unmodified C01 SHA.**

## 2. Complete C01 five-context SQL mutation envelope (source-visible operation classes)

The **five run-owned database contexts** comprise one preprovisioned S1 base (not created by the test runner) and four dynamic S2 databases (3 catalog + 1 Drizzle). Maintenance/system DBs are outside those five. Runtime-generated names/OIDs are **UNKNOWN before G4**. A pattern match is not CREATE ownership evidence. The following enumerates source-visible *operation sites and classes*, not a fabricated exact server statement trace; migrations contain dynamic `DO`/`EXECUTE format`, ORM and triggers may emit additional SQL, and `drizzle-kit` actual DDL is unknown until authorized trace.

### 2.1 S1 — ONE preprovisioned base DB (`web005_c01_test_<nonce>` is a signed launcher contract, not a C01 source-enforced name)

- **Schema identity:** `TEST_DATABASE_SCHEMA=tm_test_<nonce>`; current `getSafeTestDatabaseConfig()` accepts regex `^tm_test_[a-z0-9_]+$`, defaults to reused `tm_test_access`; requires `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, Node test context, URL DB name containing `test`, host/name not containing `prod`. These **text guards are not physical protection**.
- **Unconditional destructive reset:** `DROP SCHEMA IF EXISTS "<tm_test_*>" CASCADE`; `CREATE SCHEMA "<tm_test_*>"`; `SET search_path`. The initial DROP is **outside the following migration transaction**, not reversible by a later ROLLBACK. Error/normal teardown again calls CASCADE DROP; source `resetTestSchema()` suppresses a failed error cleanup and assumes later retrial. Separate manual test entrypoints repeat direct `DROP/CREATE SCHEMA`. Other schemas/objects can be affected by dependencies; a preexisting schema is **not** safe to reuse.
- **Standard application DDL via `resetTestSchema()`:** `0001–0028` (full names/contents are the exact files `lib/db/migrations/0001_* ... 0028_*`). These are **executed SQL**, not merely schema assertions. DDL/DML classes include `DROP TABLE IF EXISTS`, `DROP TYPE IF EXISTS ... RESTRICT`, `CREATE TYPE/SEQUENCE/TABLE/INDEX`, `ALTER TABLE/SEQUENCE`, `DROP/ADD CONSTRAINT`, `CREATE OR REPLACE FUNCTION`, `DROP/CREATE TRIGGER`, `INSERT/UPDATE`, computed `DO` DDL and `EXECUTE format(...)`, dependent FK/index reconstruction, trigger-invoked DML, test INSERT/UPDATE/DELETE, and transaction controls. Migration 0001 explicitly resets tables and enums. Migration 0026 replaces trigger functions including internal UPDATE; migration 0028 creates revision column/function and **DROP/CREATE TRIGGER**. There is a **COMMIT after 0018 before 0019** (enum visibility), so a later error is not a complete rollback. Code intentionally replays several migrations.
- **Special S1 migrations:** `tournament-atomic-correction-postgresql.integration.test.ts` applies `0030_controlled_correction_operations.sql` (**CREATE TABLE `tournament_correction_operations` + CREATE INDEX**, controlled-correction fixture DML), followed by `0031_atomic_correction_receipts.sql` (**ALTER TABLE ADD COLUMN, DROP CONSTRAINT IF EXISTS, ADD CHECK/constraints**, standalone BEGIN/COMMIT stripped) **after 0001–0028**. Both are executed against the test schema; **no implicit 0029** was observed in this specific path. These are additional to standard reset.
- **Special S1 manual migration / helper schemas:** `migration.integration.test.ts` directly resets the main schema, invokes dedicated tournament stages deployment/migration runner, uses two extra **`<schema>_rollback` and `<schema>_marker_drift` schemas**: each `DROP SCHEMA ... CASCADE`, `CREATE SCHEMA`, fixture `CREATE TABLE` or migration marker INSERT, migration/transaction rollback checks, then final CASCADE DROP. Their names are derived from `tm_test_*` but **do not themselves match the simple S1 regex**; approval and validator MUST enumerate this derived-name rule, not reject/silently omit it. `tournament-stages-production-migration.integration.test.ts` separately resets main schema and tests migration/marker/fixtures.
- **Special S1 reconstructed schema:** `tournament-stages-composite-foreign-keys.integration.test.ts` and `tournament-stages-procedural-recovery.integration.test.ts` each directly `DROP/CREATE SCHEMA`, run Drizzle **`export` to reconstruct SQL declarations** in S1 (not `push`), create/reverse/reconcile indexes, UNIQUE/FK constraints, procedural functions and triggers; `0008` is replayed in the procedural test, `0009` in the FK test; normal `dropTestSchema` performs CASCADE DROP. The FK test explicitly runs `ALTER TABLE ... DROP CONSTRAINT`, `CREATE UNIQUE INDEX`, `ALTER TABLE ... ADD CONSTRAINT/FOREIGN KEY`, including data-preservation API cases.
- **All other S1 integration entrypoints** use the fixture-backed API/ORM tests, executing CRUD (`SELECT/INSERT/UPDATE/DELETE`), triggers, locks and transaction effects inside the same isolated base/schema. Former R23H static inventory counted 36 API `*.integration.test.ts` files, **not 36 SQL statements and not 36 runtime PASS**; at future G0 enumerate all exact discovered entrypoints and their imported execution paths.

**Exact S1 source blobs:** `artifacts/api-server/test/test-database.ts` `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`; `migration.integration.test.ts` `5f84cbb783219bbaf55c788f0e9d508cf78e3d13`; `tournament-stages-production-migration.integration.test.ts` `409b22640bb1281deef45c133cf24c4488ac7765`; `tournament-stages-composite-foreign-keys.integration.test.ts` `569e288b806d16ac0635a9f89f06a4bfc25844d5`; `tournament-stages-procedural-recovery.integration.test.ts` `959d9b4f168e272e9708aa9afe0f21b6814a1da6`; `tournament-atomic-correction-postgresql.integration.test.ts` `92fe7245604458aff815a6a21b2e2e19f757a54a`. Specific SQL: migration 0001 blob `ff35eeac793e46335e5be2697308cec337d03476`; 0026 `92e0c8e8e37684f7c7b1b397e1839cb5f496c7ab`; 0028 `45eb2ea26e8bbeb290be4e8ded21b544440ce7ec`; 0030 `50aa71ae0199806de3aaf3c57700d2739f2c42bc`; 0031 `d44601f4b6477dc9366fc7a65475a0eede1c34c1`. All paths are under `artifacts/api-server/test/` or `lib/db/migrations/` at fixed C01 SHA.

### 2.2 S2-CATALOG — THREE dynamic databases

- **Exact names:** `tm_catalog_test_<16hex>_dev`, `tm_catalog_test_<16hex>_prod`, `tm_catalog_test_<16hex>_fresh`, sharing a random 16-hex UUID prefix; `CREATE DATABASE "<each>"` issued by an `adminPool` connecting to **S1 base** with the **same `TEST_DATABASE_URL` role** (removing `search_path` option). Each fixture `Pool` connects to the newly named DB; the default newly created DB is based on `template1`. A successful CREATE must be confirmed and tied to DB OID/owner/run before use.
- **Each DB:** SQL migration history **0001–0010** via BEGIN/COMMIT, followed by explicit test fixtures `INSERT INTO public.tournaments/players/matches/auth_credential_rate_limits`; reconciliation migration `0011` (with conditional constraints/index/foreign keys), assertion queries and fixture transaction rollback.
- **Catalog drift/repair operations:** `ALTER TABLE ... DROP CONSTRAINT`, `ALTER TABLE ... ADD UNIQUE/FOREIGN KEY CONSTRAINT`, `CREATE UNIQUE INDEX`, `DROP TABLE public.auth_credential_rate_limits` (in one drift scenario), `CREATE TABLE public.unexpected_match_reference`, `DROP TABLE public.unexpected_match_reference`, fixture `DELETE FROM public.matches`, and `INSERT` in `result_history`; no safe assertion that tests are read-only because some validation transactions roll back.
- **Internally derived child environment:** catalog comparison child gets fresh `SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL=urls.dev`, `SCHEMA_COMPARE_PRODUCTION_DATABASE_URL=urls.prod` and expected name/schema fields; inherits `...process.env`, so parent env cleansing and exact generated child exceptions are required.
- **Automatic teardown INSIDE G4:** after ending pools, iterate all **three names** and issue `DROP DATABASE IF EXISTS "<name>" WITH (FORCE)`, regardless of a separate per-name `CREATE_CONFIRMED` record. A failed creation can still leave a populated `databaseNames` map, and teardown attempts a DROP on it.

**Exact source:** `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts`, Git blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`, notably lines 24–48 (migrations), 75–105 (names/history), 112–289 (fixtures/drift), 436–455 (DML), 468–525 (CREATE/FORCE DROP), 676–687 (child env).

### 2.3 S2-DRIZZLE — ONE dynamic database

- **Exact name:** `tm_drizzle_schema_test_<32hex>` (UUID without dashes). Same principal on `adminPool` against base DB, then `CREATE DATABASE`, new test `Pool`. `databaseName` assigned **before successful CREATE**.
- **Actual fixture DDL:** run migrations **0001–0020** against `public`; BEGIN/COMMIT split after 0018 before 0019; `INSERT INTO public.app_schema_migrations`; `CREATE UNIQUE INDEX public.matches_stage_id_id_unique` (unqualified identifier, explicit table in public); later run the *separate* guarded production-guide SQL transaction **twice** which conditionally executes `DROP INDEX public.matches_stage_id_id_unique`. These source-side mutations are **not Drizzle push effects**.
- **TWO exact `drizzle-kit push --force --verbose` invocations**, one before and one after guarded cleanup; same function runs Node `lib/db/node_modules/drizzle-kit/bin.cjs push --config ./drizzle.config.ts --force --verbose`, `cwd=lib/db`, `env={...process.env,DATABASE_URL:testConnectionString}`, timeout 60 s; `drizzle.config.ts` uses the child `DATABASE_URL`, `schema="./replit-push-schema.ts"`, `schemaFilter=["information_schema"]`, `tablesFilter=["__replit_push_manages_no_tables__"]`, and the push declaration is the intentionally empty `pgSchema("information_schema")`. `pnpm-lock.yaml` resolves **drizzle-kit 0.31.10**.
- **Expectation vs proof:** assertions demand `No changes detected` from both calls; first also rejects visible DDL tokens in stdout/stderr. These conditions are **static assertions, not observed runtime outputs nor a PostgreSQL audit log**. The narrow filters reduce the expected `public` DDL risk, but `--force` would auto-accept a destructive diff if generated; command/config/installed binary/target must be attested. A successful test exit alone is insufficient to prove zero SQL.
- **Automatic G4 teardown:** after `testPool.end()`, unconditional name-presence-based `DROP DATABASE IF EXISTS ... WITH (FORCE)`; **no CREATE-success receipt/owner/DB-OID check**.

**Exact blobs:** `drizzle-schema-diff.integration.test.ts` `e008dbd9fe287632252d3fcfda246f60e4cc35d3` (lines 25–46, 53–79, 177–199, 202–279, 356–379); `lib/db/drizzle.config.ts` `952a37a5ea123a0948cdaea68be0ee4986828fa9`; `lib/db/replit-push-schema.ts` `693ff598782ac84dafa3b96907df92c427c8aeb7`; `lib/db/package.json` `8c119efabac402704bc47be8798ab8e1ea621e7f`; `pnpm-lock.yaml` `97ceb41938b53e8fc98f788ac1aa0c625761a2f2`; `docs/PRODUCTION_SCHEMA_DRIZZLE_RECONCILIATION.md` `bb0aecce365931f484c1cac6c53a46b00e9424d6`.

### 2.4 Explicitly out of this command

The separate `lib/db/test/schema-catalog-comparison.integration.test.mjs` can reset `public` on independently supplied URLs but is **NOT included** by this API `test:integration` discovery. It requires a distinct authorization if ever invoked. Additional SQL from foreign CLI, `lib/db` scripts or `migrate` commands is **NOT implicitly permitted** by this R4 envelope. G4 has exactly one pinned command and one discovery manifest; anything extra ⇒ STOP.

## 3. The P0 name collision + failed CREATE → FORCE DROP fault

**C01 actual sequence (both S2 fixtures):** (1) create random name and save it to global variable; (2) issue `CREATE DATABASE`; (3) later `after()` sees the saved string and issues `DROP DATABASE IF EXISTS ... WITH (FORCE)`. If CREATE fails because a database with that name already exists, the `after()` still **may attempt to delete that preexisting database**. A UUID and regex make collision unlikely, not impossible; they do not prove creation or permission. A role that happens to own the preexisting DB (e.g., leftover from a prior run under same principal) can delete it.

**Mandatory fail-closed state machine for *future source-hardened* S2 code:**
```text
PLANNED -> NAME_ALLOCATED
  -> PREFLIGHT_ABSENT_AND_RUN_BOUND
  -> CREATE_ATTEMPTED
  -> (CREATE_CONFIRMED -> OID_OWNER_CLUSTER_ATTESTED -> ACTIVE)
  -> (DROP_AUTHORIZED -> DROP_ATTEMPTED -> DROP_CONFIRMED)
Any mismatch / failed CREATE / missing receipt -> CLEANUP_HOLD (NO DROP).
```

Guards to implement: unique `run_id` bound to physical cluster cert and one fixture slot; `CREATE DATABASE` attempted only after strict zero-preexisting-DB check in the certified fresh cluster; set `createdByThisRun=true` **only after CREATE returned success**; immediately query trusted `pg_database` for exact name→OID/owner on the same attested cluster, persist receipt to separate restricted ledger; permit DROP **only** if matching run, successful CREATE receipt, DB OID and owner, same cluster identity and a pre-drop contemporaneous check. A fresh `pg_database` check is not atomic with a later DROP by name, so **disallow foreign sessions/DDL actors in the sealed isolated cluster**; OID can be reused and is not proof alone. Race-free object ownership requires both code guard and strong exclusion of all other writers. The fixture must abort before DROP on any discrepancy and keep `CLEANUP_HOLD` for operator inspection; no `IF EXISTS` as a substitute for receipt.

**Launcher's limited power on *unchanged* C01:** can fail before initial fork if preexisting object/foreign cluster, guarantee fresh PGDATA / no other principals and destroy the entire *verified disposable* environment **after separate G5 consent**, but **cannot inject ownership checks into the existing `after()` logic, revoke CREATEDB selectively per SQL statement, or prevent it from using the same credential after a CREATE error**. DB middleware/proxy or a separate constrained security-definer service would alter the architecture/source and needs new review. A signed exception accepting this residual risk only within a disposable cluster does not amount to a code fix.

## 4. Shared C01 TEST_DATABASE_URL principal — enforceable minimum grants

**Source truth:** S1 `getSafeTestDatabaseConfig()` supplies its connection string to the API `DATABASE_URL`; S2 `adminPool` derives credentials from the same `TEST_DATABASE_URL` and replaces only the database path for scratch pools. **No role split** is implemented at `fa3261...`. An apparently least-privilege S1 `NOCREATEDB` role and a separate S2 `CREATEDB` role cannot execute this unmodified suite.

| PG16 role attribute/object privilege | Required for unchanged C01 | Explicit containment |
|---|---|---|
| `LOGIN`, `CONNECT` | YES | Dedicated short-lived account on **fresh completely isolated cluster**; disallow login/route from host/native Windows. |
| **`CREATEDB`** | **YES, cluster-wide** | PostgreSQL role attribute; **cannot restrict by prefix `tm_*` or by DB GRANT**. Never on existing/native/shared cluster. |
| `SUPERUSER`, `CREATEROLE`, `REPLICATION`, `BYPASSRLS` | **NO** | Require negative `rol*` evidence, role memberships and `SET ROLE` paths, no superuser password or `pg_signal_backend` in runner. |
| S1 base DB `CONNECT`, `CREATE` and test schema ownership | YES | CREATE ON DATABASE required for `CREATE SCHEMA`; owner must match DROP/ALTER target. Base DB belongs to run; no foreign/preexisting test schema. |
| Newly created S2 DB `OWNER`; schema `public` rights | YES | CREATE DATABASE defaults to current role owner; inspect all four owner/OIDs and permissions. Under PG16 `public` schema commonly owned by `pg_database_owner`, which resolves to each DB owner — **attest actual template provenance/ACL**, do not assume. |
| `DROP DATABASE ... WITH (FORCE)` | Needs DB ownership | Not independently grantable `DROP DATABASE` privilege; FORCE can terminate eligible sessions where permitted but has blocked-session/prepared-transaction/logical-slot limitations. No external privilege escalation. |
| Optional role split, database-prefix enforcement or after-hook success token | **ABSENT in C01** | Requires NEW source SHA and independent regression/security QA. |

**Hard physical envelope:** A21 canonical Option A sealed PG16+Node namespace with **no published host ports**, PG container `network_mode:none`, runner `network_mode=service:pg16`, only local `127.0.0.1:55432` inside the shared namespace; independent Docker context, PGDATA volume ID, running container PID/netns inode, PG16 `system_identifier`, operator reference to native Windows postgresql service/ports, SCRAM-authenticated identity, and no preexisting DB/user objects besides explicitly approved maintenance/template and single fresh S1 base. **`localhost`, `test`, a regex, port 55432 and `pg_isready` are insufficient**.

## 5. Evidence: connect every DB to a single authorized run

**Pre-run A20/A24 control-plane certificate** (not supplied by test process): immutable `plan_sha256`, `run_id`, C01 SHA and exact full test-inventory digest, source/lock/image digests; Docker daemon context ID, PGDATA volume & container IDs, PID/netns, PG16 cluster system ID; verified distinct native Windows PG16 identity/ports, operator signatures and expiry. Must be exported to signed *read-only* context accessible to launch admission; never grant Node Docker socket or superuser password merely to attest.

**Minimal append-only ledger fields per logical slot** (`s1_base`, `s2_catalog_dev`, `s2_catalog_prod`, `s2_catalog_fresh`, `s2_drizzle`):
```yaml
run_id: <approved immutable run identifier>
plan_sha256: <signable plan digest>
c01_commit_sha: fa3261b2c9510e110ac9eba21726812d3401a525
cluster_system_identifier: <independent control-plane certificate>
pgdata_volume_id: <certificate>
db_slot: s1_base | s2_catalog_dev | s2_catalog_prod | s2_catalog_fresh | s2_drizzle
expected_name_rule: <strict per-slot exact name / regex>
actual_database_name: <runtime value or S1 fixed signed value>
db_oid: <server-observed OID or PENDING>
db_owner_oid_and_role: <server observed>
source_path_and_blob: <exact C01 source witness>
create_status: NOT_APPLICABLE_PREPROVISIONED | NOT_ATTEMPTED | ATTEMPTED | SUCCEEDED | FAILED
create_success_receipt_sha256: <restricted evidence or null>
operation: CREATE | CONNECT | MIGRATE | DDL | DML | PUSH_FORCE_1 | PUSH_FORCE_2 | DROP_ATTEMPT | DROP_CONFIRMED
pg_txid_if_available: <optional; not proof of successful CREATE by itself>
operation_timestamp_utc: <captured>
child_argv_config_binary_sha256: <where relevant>
sql_effect_before_after_digest: <observed future G4>
g3_scope_and_g4_signed_approval_id: <trusted verifier result>
cleanup_state: ACTIVE | VERIFIED_ABSENT | G5_RESIDUAL | CLEANUP_HOLD
evidence_sha256: <hashed redacted receipt; raw held restricted>
```

**Proof chain:** no S2 object is marked run-owned until successful CREATE + immediate independent DB name/OID/owner observation on *that same attested cluster*. Capture `pg_database` state before and after each creation and before teardown, and correlate PostgreSQL server DDL logs/events with Node parent/child process execution; distinguish S1 migrations, catalog drift/repair, Drizzle fixture SQL, two actual kit pushes and FORCE deletes. Stronger source-hardening can emit explicit receipt **before** continuing; unchanged C01 requires trusted external server-side observer and cannot prove it will stop unsafe in-process teardown. DB OID alone is insufficient: bind to system ID, run ID, exact successful CREATE, owner and timestamps. Runtime names never appear in Git SHA ahead of execution.

## 6. Separate G0–G5 authority envelopes

| Gate / signer | Exact mutation authority or constraint | Evidence and fail-closed condition |
|---|---|---|
| **G0** · A00/HQ, A20, operator | Only separately signed source/image/toolchain provenance operations; frozen exact C01 inputs. | A60 R3 reports **G0 NO_GO**, unknown executable/OCI provenance; neither build nor pull authorized by R4. |
| **G1/G2** · A00/HQ, A20, operator | Fresh disposable PG16 bootstrap and *independent* physical/network/Windows-native identity attestation. No application schema mutation authorization. | No reused volumes, host ports, Docker socket in runner or Windows PG access. Authenticated identity and empty/user-DB census before rights. |
| **G3-S1** · **three separate signatures** | One operator-provisioned base DB; strict run-nonce main `tm_test_*` plus `_rollback`, `_marker_drift`, and named test migration outputs. Authorize `DROP/CREATE SCHEMA CASCADE`, 0001–0028, 0030/0031, manual DDL and S1 auto teardown within G4; **do not authorize base DB DROP**. | No foreign S1 schemas or objects, DB CREATE/CONNECT and schema-owner evidence; S1 itself is non-atomic; COLLISION ⇒ STOP. |
| **`G3_S2_CATALOG`** · **three separate signatures** | Precisely 3 `tm_catalog_test_<16hex>_{dev,prod,fresh}` DBs, CREATE, 0001–0011 and fixture SQL/drift/repair, **3 built-in FORCE DROPs in G4**. | Bound to cluster ID, effective role/DB owners, max 3 names/creations; name-existence mismatch or CREATE failure ⇒ STOP/HOLD. |
| **`G3_S2_DRIZZLE_FORCE`** · **three separate signatures** | One `tm_drizzle_schema_test_<32hex>` DB, CREATE, 0001–0020, guarded index setup/cleanup, exactly **TWO** `push --force --verbose` with pinned target+config+binary, **1 FORCE DROP inside G4**. | `drizzle-kit 0.31.10` resolution, empty push schema and filters verified; **actual push SQL unknown**. Unanticipated public DDL, changed kit/config or foreign DSN ⇒ STOP/HOLD. |
| **G4 — full original C01** · **new three-signature consent**, all above valid | Exactly once: `pnpm --filter @workspace/api-server run test:integration`, unmodified 36-entrypoint discovery *subject to G0 re-enumeration*; S1+four S2 fixture writes and auto teardown already approved. | Sealed env, launcher negative checks/FS write paths, privilege and owner receipts, start/exit/TAP/first-error, server-side SQL effects, no filtered/skipped subtests or retries. Any source drift invalidates C01 GO. |
| **G5 — residual exact-ID cleanup** · **fresh independent three-signature consent** | Only individually proven run-owned leftover S1 schemas, four DBs and, **if separately named**, S1 base/PGDATA/volumes. No retroactive permission for automatic `after()` DROP in G4. | Before destructive G5 compare fresh OID/owner/system ID and successful CREATE receipt; ambiguous or reused objects remain `CLEANUP_HOLD`; no prefix cleanup, `docker volume prune`, `down -v` or FORCE escalation. |

**Consent-binding rules:** signatures from **A00/HQ + A20 + named Windows operator**, immutable scope/plan SHA, accepted source/lock/image hashes, certified PG physical IDs, role IDs, exact action list, max resource counts, expiry and no implied inheritance between S2 catalog and Drizzle. A30/A31 security and A24 readiness independently review; A60 independent QA. A JSON string `GO:true` or a self-asserted flag is not a cryptographic proof of authority.

**G4 vs G5 timing is critical:** both `after()` handlers execute `DROP DATABASE ... WITH (FORCE)` **inside the test run**. A future G5 action cannot authorize that historical deletion. An operator request to 'defer all drops to G5' would require source changes and a new SHA.

## 7. Exact change requests — CODE vs LAUNCHER vs RUNTIME

| ID / priority | Change required | Source code change? | Launcher / control plane feasible? | Gate |
|---|---|---|---|---|
| **R4-CODE-01 P0** | Replace `databaseName(s)`-presence teardown with per-slot `CREATE_CONFIRMED` token only after successful CREATE; require same-cluster/name/OID/owner/run proof, independent pre-DROP check, and fail-closed `CLEANUP_HOLD`. Never DROP failed CREATE/collision. | **YES**: both `replit-schema-catalog-reconciliation.integration.test.ts` and `drizzle-schema-diff.integration.test.ts`. | **NO** for guaranteed in-process STOP on unchanged C01. | P0-31-04 |
| **R4-CODE-02 P0** | Make S1 reset reject any existing unowned/main/helper schema; separate fresh per-run name and preserve failed cleanup evidence rather than blindly retry. Refactor manual S1 reset entrypoints to common proof guard. | **YES**: `test-database.ts` and four manual suites; fresh SHA. | Launcher **can** enforce fresh empty base and nonce but cannot ensure source reset fails closed on a foreign matching schema after fork. | P0-31-03 |
| **R4-CODE-03 P0** | Source-tied SQL mutation receipt hooks / exact side effects (including two push calls) with local restricted evidence; avoid silently swallowing cleanup errors; distinguish failed setup and already-attempted teardown. | **YES** if enforceable in-process per-operation STOP is mandated. | Launcher/server observer can capture partial evidence without code alteration, **not** fix unsafe hooks. | P0-31-01/04/05 |
| **R4-LAUNCH-01 P0** | Freeze precise C01 source/lock/toolchain, no alternative or skipped integration tests. | No, for unmodified C01. | **YES**, signed manifest/readonly checkout and approved executable fingerprint. | P0-31-07 |
| **R4-LAUNCH-02 P0** | Strip inherited `DATABASE_URL`, `TEST_DATABASE_URL`, libpq `PG*`, `SCHEMA_COMPARE_*`, dotenv/node loaders and foreign DSNs; construct only attested `TEST_DATABASE_URL`, internally reviewed S1 alias and source-generated S2 child overrides. | Not inherently; existing child env spreads parent, but trusted minimal parent may suffice. | **YES** with implemented allowlist and negative checks (none executed here). | P0-31-05 |
| **R4-LAUNCH-03 P0** | Sign/verify no-host-port physical PGDATA/system-ID and Windows separation; fresh S1 base, 4-name capacity, single CREATEDB role. | No. | **YES** via A20/A21/A24 control plane, not by process-local `localhost` assertion. | P0-31-02/04/06 |
| **R4-LAUNCH-04 P0/P1** | Controlled SQL/DDL event logging, positive CREATE/OID/owner register, allowed child binary/config target/argv, evidence redaction, approved RO tmpfs/FS write paths. | Optional improvements if audit-only; mandatory code above for enforceable pre-DROP STOP. | **PARTIALLY**; relies on properly approved server/operator observation, no after-the-fact stop. | P0-31-04/05; P1-31-02/04/05 |
| **R4-GOV-01 P0** | Independent signable G3-S1, G3-S2-CATALOG, G3-S2-DRIZZLE-FORCE, G4 and G5; no self approval or retrospective rights. | No. | **YES** owner-driven signature/authority system; currently missing. | P0-31-07 |

**No application code was changed by this report.** Every `R4-CODE-*` item is a **future proposed change** that invalidates fixed-C01 SHA assumptions and must be separately authorized/reviewed. In a code-fixed variant, re-establish exact migration/test inventory, regression outputs, installed `drizzle-kit` binary behavior, role grants and gate approvals.

## 8. STOP, failure cleanup and exact acceptance

**STOP before fork if:** C01 SHA/locked binary/runner differs; missing approval or signer; source-derived fixture list isn't exact; wrong physical cluster ID/PGDATA/netns/native Windows isolation; unexpected host port/foreign service/mount; unclean S1 base/unknown schema or S2 names; wrong effective role/grant/owner; inherited unsafe URL/libpq overrides; changed Drizzle config/empty declaration; missing readonly FS/evidence capacity. No automatic SQL retries or privilege elevation.

**STOP during G4 if:** fifth dynamic DB, re-used name, failed CREATE, unexpected DDL/child target, foreign session, unapproved FORCE effect, unknown owner/OID, any cleanup mismatch or missing receipt, failing evidence capture, unreviewed runtime write outside sealed FS. In source-hardened variant, stop *before* auto DROP; for unchanged C01 the hook may already have executed and this is a **material residual design defect**, not something the launcher can guarantee retroactively.

**CLEANUP_HOLD:** any failed CREATE with name already registered in code, ambiguous object ownership, partial S1 CASCADE, deferred/failed FORCE drop, unknown DB OID, discovered foreign DB, or incomplete log. Preserve exact observed event sequence; do not say "no DROP occurred" absent server proof. G5 must not delete ambiguous resources based on name alone.

**Future acceptance criteria:** A20 certified independent cluster, A24 effective role+five-context preflight, A30/A31 signed security review with disposition for C01 residual-source defects or changed-SHA patch, A50 implemented sealed launcher and mutation evidence, A60 independent artifact/diff/negative controls. G4 event ledger must support: 1 S1 operator base, **exactly 4 successful S2 CREATE** events (not mere plans), **4 matching DROP attempts and confirmed outcomes** (or explicit HOLD), **2 Drizzle force child commands** with exact binary+target, checked manual index cleanup vs push effects, and S1 migration/helper-schema lifecycle. This is a **future requested proof standard**, not a claim those events were observed now.

## 9. A60 P0 register disposition (no false closure)

| A60/A31 ID | Source/document delta in R4 | Current P0 |
|---|---|---|
| `P0-31-01` — incomplete S2 mutation approval | Five-context scope and precise 2-force/G3 split documented; **no signatures or trace**. | **OPEN — source scope corrected only** |
| `P0-31-02` — physical PG/Windows identity | Concrete certificate/negative native-port requirements. | **OPEN — physical evidence missing** |
| `P0-31-03` — S1 CASCADE / non-atomic migrations | Helper schemas, 0001–0028 plus 0030/0031, rollback limits and code fixes specified. | **OPEN — unsafe current reset** |
| `P0-31-04` — shared CREATEDB + collision/FORCE teardown | Source defect, two implementation variants, positive CREATE/OID/owner ledger defined. | **OPEN — source hook unpatched** |
| `P0-31-05` — inherited DSN/sealed launcher | Env allowlist and child exception contract; no implementation yet. | **OPEN — enforcement missing** |
| `P0-31-06` — static Docker vs actual isolated PG | Canonical Option A physical checks spelled out; no Docker execution. | **OPEN — infrastructure unverified** |
| `P0-31-07` — missing authority/governance | Independent G3-S1, catalog, Drizzle, G4, G5 approvals designed. | **OPEN — signatures absent** |

**Overall verdict:** `R23H_R4_SQL_EXECUTION_SAFETY_DESIGN_PUBLISHED` (upon immutable GitHub publication) / `P0_OPEN_7` / `SQL01_SOURCE_CLOSED_ONLY` / `PG16_EXECUTION_NOT_AUTHORIZED` / `G0_NO_GO / G1_G5_HOLD / RELEASE_NO_GO`.

## 10. Recipient-specific handoff

- **A20:** own source/launcher choice and signable five-context plan; freeze physical identities and signed G3 partition; no read-only design as GO.
- **A30:** security coordination to review failed-CREATE auto DROP and irreversible S1 CASCADE; decide source patch vs exceptional disposable-only residual-risk acceptance, no self-approval.
- **A31:** specialist review of PG16 CREATEDB/OWNER/FORCE and real source fix; independent signoff required, existing R2 does not imply R4 pass.
- **A50:** implement only in separately authorized task: launcher G0 evidence/allowlist and, if accepted, fixture code changes with new SHA and scoped mutation receipts. No execution under A22 task.
- **A24:** physical S1 base and 4 S2 owner/OID/cluster attestation, exact permissions, preflight/STOP matrix, and reconciliation of S1 derived helper-schema names.
- **A00/HQ:** maintain G0_NO_GO and require explicit independent signatures/risk disposition; no C01 original-code source mutation, tests, SQL, Docker or live approval from this document.

**Report authorship and static evidence are NOT equivalent to code implementation or executable PG16 safety.**
