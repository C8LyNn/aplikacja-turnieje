# WEB-005 — A22 / R23H-R3 — FINAL SQL CONTRACT HANDOFF

**Deliverable:** `R23H_R3_SQL_FINAL_CONTRACT.md`  
**Mode:** READ-ONLY / TARGETED SOURCE CORRECTION (no SQL, tests, migrations, Docker or CI executed)  
**Priority:** P0; **date:** 2026-10-17 (Europe/Warsaw)  
**Exact C01 source:** `C8LyNn/aplikacja-turnieje@fa3261b2c9510e110ac9eba21726812d3401a525`  
**Status:** `SQL-01_SOURCE_SCOPE_CORRECTED / PG16_EXECUTION_BLOCKED`. No G0–G5 execution approval is implied.

## 1. Inputs, scope and precedence

This is a targeted R23H-R3 **final *source-contract* handoff**, not a rerun of the R23H audit and not a runtime certification. It supplements, **does not overwrite**, the earlier A22 [R23H-R2 four-DB SQL contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/6ded14bd0ca685cff1e5fcb0d70a8dde8ca27551/docs/web-005/R23H_R2_FOUR_DB_SQL_CONTRACT.md) and the [R23H A22 original bundle](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view).

A50's newly read [`R23H_R2_SQL_SCOPE_ADDENDUM.md`](https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view) identifies **four dynamically created S2 databases *in addition to* one provisioned S1 base database**. A50 additionally published [runner recovery/attestation status](https://drive.google.com/file/d/1Jcpgs3vxCJ1hpqJ_pBvSChrorRiA0AS4/view). A22 independently inspected the exact C01 fixture, config, empty push schema, package and lock files and reconciles *intent vs execution proof* below.

**Correction to earlier wording:** the complete disposable test estate has **up to five run-owned user databases** (1 operator-provisioned S1 base + 4 C01 fixture-created S2 scratch DBs). It is incorrect to call all five dynamically created by `test:integration`. Standard PostgreSQL databases `postgres`, `template0`, `template1` are separate maintenance/templates, not part of five-run-owned count; exact maintenance inventory must be attested, not blindly assumed.

## 2. Canonical five-database SQL contract

| Slot | Provisioning and exact runtime name | C01 SQL/write scope | Test-owned automatic teardown |
|---|---|---|---|
| **S1 / BASE** | **Preprovisioned** by operator: proposed `web005_c01_test_<run_nonce>`; required actual DB name must contain `test` and must pass C01 URL guard; schema `tm_test_<run_nonce>` | `DROP/CREATE SCHEMA ... CASCADE`; fixture DDL/DML and migrations **0001–0028** (some replayed); additional migration-specific helper schemas; targeted **0030–0031** test migration | Drops test schema (including failure-path cleanup), **not** base database |
| **S2 / CATALOG-DEV** | C01 `CREATE DATABASE tm_catalog_test_<16hex>_dev` | 0001–0010 history, fixture drift DDL/DML, `0011` reconciliation | `DROP DATABASE IF EXISTS ... WITH (FORCE)` |
| **S2 / CATALOG-PROD** | C01 `CREATE DATABASE tm_catalog_test_<16hex>_prod` | 0001–0010 history, fixture drift DDL/DML, `0011` reconciliation | same |
| **S2 / CATALOG-FRESH** | C01 `CREATE DATABASE tm_catalog_test_<16hex>_fresh` | 0001–0010 history, fixture rows and `0011` reconciliation | same |
| **S2 / DRIZZLE** | C01 `CREATE DATABASE tm_drizzle_schema_test_<32hex>` | **0001–0020** fixture migrations; index/marker SQL; guarded production-index cleanup SQL twice; `drizzle-kit push --force` **twice** | `DROP DATABASE IF EXISTS ... WITH (FORCE)` |

**Source witnesses (all immutable C01 Git SHA-1 blobs, not this report's SHA-256):**

- [`artifacts/api-server/test/test-database.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-database.ts), blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`; lines 141–182 (guard), 185–192 (schema DROP/CREATE), 274–415 (migration application/commits), 416–430 (error/teardown).
- [`artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts), blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`; lines 75–87 and 468–525.
- [`artifacts/api-server/test/drizzle-schema-diff.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/drizzle-schema-diff.integration.test.ts), blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`; lines 25–46 (0001–0020), 53–79 (name), 166–207 (targeted index checks, push, cleanup SQL), 209–279 (connection, CREATE/teardown), 356–374 (two pushes).
- [`artifacts/api-server/test/run-tests.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/run-tests.ts), blob `da4188446aba4696f97eb7831fee0cc5824d212f`; [`test-discovery.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-discovery.ts), blob `dd427fdafa92c089e2edad704079d81945c4b1c1`: recursive complete `*.integration.test.ts` discovery, `--test-concurrency=1`. Earlier count **36 API integration entrypoints**; must be rechecked at future G0 against signed tree.
- **Proposed base name is a deployment contract, not a source requirement.** C01 `getSafeTestDatabaseConfig` only checks that DB name contains `test`, fingerprint lacks `prod`, schema matches `^tm_test_[a-z0-9_]+$` and reset literal equals `DROP_TM_TEST_SCHEMA`. It defaults to `tm_test_access`, **not an automatically fresh per-run nonce**; the sealed launcher **must** impose the stronger run-specific name.

## 3. Targeted Drizzle Kit 0.31.10 risk verdict

**Source-verified mitigating guard (strong, but not an executed no-op proof):**

- [`lib/db/drizzle.config.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/drizzle.config.ts) blob `952a37a5ea123a0948cdaea68be0ee4986828fa9`:
  `schema: "./replit-push-schema.ts"`; `tablesFilter: ["__replit_push_manages_no_tables__"]`; `schemaFilter: ["information_schema"]`; `dialect: "postgresql"`; `dbCredentials.url: process.env.DATABASE_URL`.
- [`lib/db/replit-push-schema.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/replit-push-schema.ts) blob `693ff598782ac84dafa3b96907df92c427c8aeb7`: the sole exported `pgSchema("information_schema")` **contains no declared application tables**.
- [`lib/db/package.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/package.json), blob `8c119efabac402704bc47be8798ab8e1ea621e7f`, requests `drizzle-kit ^0.31.10`. [`pnpm-lock.yaml`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/pnpm-lock.yaml), Git blob `97ceb41938b53e8fc98f788ac1aa0c625761a2f2`, resolves `drizzle-kit 0.31.10` in `lib/db`. Actual installed binary bytes/runtime are **not attested**.
- [`lib/db/src/schema/index.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/src/schema/index.ts), blob `46c981fafb2dd7bbcd1a0eb5d07a06ed88127f44`, is the **full runtime schema**, *not* the schema fed to `push`. The same test invokes `drizzle-kit export --schema ./src/schema/index.ts` **separately** (lines 89–108); do not confuse `export` with `push`.
- [`docs/PRODUCTION_SCHEMA_DRIZZLE_RECONCILIATION.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/docs/PRODUCTION_SCHEMA_DRIZZLE_RECONCILIATION.md), blob `bb0aecce365931f484c1cac6c53a46b00e9424d6`, describes previous Drizzle 0.31 false-positive destructive DDL and why the empty filters were selected, along with independent guarded `DROP INDEX` cleanup.

**Exact call path and safeguards:** the Drizzle fixture derives `testConnectionString` from an already validated `TEST_DATABASE_URL` by replacing DB pathname with its own freshly generated fourth database. `applyReplitPushToDisposableDatabase()` (lines 177–199) runs:

```text
node <workspace>/lib/db/node_modules/drizzle-kit/bin.cjs
  push --config ./drizzle.config.ts --force --verbose
cwd = lib/db
child.env = { ...process.env, DATABASE_URL: testConnectionString }
```

This happens **twice**: before and after **independent** guarded index cleanup (test lines 356–374). Assertions `/No changes detected/` are code expectations, **not evidence that this task observed no SQL changes**. The fourth DB is built with 0001–0020, which **does issue substantial DDL**, and test-owned SQL cleanup drops an index in its own explicit transaction; attribute these effects to *fixture migrations/cleanup*, not automatically to the Drizzle push.

**Effective risk:** the committed C01 config deliberately excludes all `public` application tables and should lead to an empty Drizzle-managed scope **when the pinned installed binary honors the filters**. This makes accidental destructive changes to `public` by that exact configured `push` **less plausible than an unfiltered `push --force`**, but `--force` *does* auto-accept data-loss statements if the engine generates them. No present source audit proves the actual binary's diff/result, absence of writes to other namespaces, or runtime target integrity. **Status: `DRIZZLE_EXPECTED_NO_APP_DDL_SOURCE_GUARD_VERIFIED / EFFECTIVE_SQL_NOT_EXECUTED`**, not `DRIZZLE_FORCE_NOOP_PASS` and not `DRIZZLE_CONFIRMED_DESTRUCTIVE`.

Official specifications: [Drizzle Kit push](https://orm.drizzle.team/docs/drizzle-kit-push) (filters + `force` semantics); [Drizzle configuration](https://orm.drizzle.team/docs/drizzle-config-file). Neither proves installed 0.31.10 bytes or runtime behavior.

**Highest-impact residual failure modes:** wrong physical PG target (even a localhost/non-5432 URL), altered/misresolved config/schema package/loader, installed dependency drift, inherited tainted environment, accidental fifth scratch DB collision and subsequent FORCE teardown, failure after CREATE leaving orphan DB, or unsupported/noisy Drizzle diff. Require actual pre/post SQL effect review or an approved observable *within separately authorized G4* without weakening isolation. There is no present permission to run `drizzle-kit --explain`, `push`, or a DB probe.

## 4. S1/S2 privilege correction — C01 exact unchanged command

**A50/A22 agreement:** effective credentials in `TEST_DATABASE_URL` are propagated to the **S1 test DB** and **both S2 fixture creator pools**. S2 rewrites only database path for new DBs. C01 does **not** implement independent S1 `NOCREATEDB` and S2 `CREATEDB` runtime users. `lib/db/src/index.ts` (blob `50cbf483d87a8a741f4965acde5edf6225fedd3e`) uses `process.env.DATABASE_URL`; test fixtures assign it from the validated config. Do not certify hypothetical role separation on this SHA.

| Privilege, right or isolation property | Minimum unchanged C01 test principal | Scope/control |
|---|---|---|
| `LOGIN` + `CONNECT` | **YES** | Only disposable, physically attested cluster and new run-owned base/scratch DBs; inspect inherited/default `CONNECT` rights |
| `CREATEDB` | **YES; cluster-wide role attribute** | Needed for the **four** S2 `CREATE DATABASE` operations; no PostgreSQL name-prefix ACL; never issue in Windows/shared instance |
| `SUPERUSER`, `CREATEROLE`, `REPLICATION`, `BYPASSRLS` | **NO** | Require negative evidence, no privileged memberships/`SET ROLE` route |
| S1 base DB `CREATE` + ownership of run schema/objects | **YES** | Required for `CREATE SCHEMA tm_test_*`, destructive `DROP ... CASCADE`, migrations and fixture DDL; base DB owned by dedicated test role or equivalent strictly verified access |
| Four S2 DB owner + contained `public` schema/objects | **YES** | `CREATE DATABASE` without `OWNER` defaults to current role; each new DB clones `template1` by default; prove unmodified template and DB ownership |
| `DROP DATABASE ... WITH (FORCE)` | **DB owner required** | No independent grantable `DROP DATABASE` ACL; `FORCE` termination limited by permissions and blockers; never infer owner from name |
| External bootstrap superuser password, Docker socket, native Windows PG role | **NEVER** | Not available in application runner or logs; operator-only provisioning |
| S1 permission revocation or separate S2 elevated session *inside the same unchanged runner* | **NOT IMPLEMENTED** | Treat as future-source change requiring a new SHA/review and a new signed plan |

PostgreSQL 16 semantics: [CREATE DATABASE](https://www.postgresql.org/docs/16/sql-createdatabase.html), [DROP DATABASE](https://www.postgresql.org/docs/16/sql-dropdatabase.html) and [object privileges](https://www.postgresql.org/docs/16/ddl-priv.html). The `CREATEDB` attribute cannot be limited by prefix; object ownership is stronger than a name convention. `FORCE` can fail if active sessions cannot be terminated and cannot be used inside a SQL transaction. The role grants/actual owners for future disposable PG16 are **PENDING**, not source verified.

**Mandatory containment:** `pg16` has independent *new* PGDATA and cluster system ID attested out of band, no host-exposed ports, no host/Windows database mounts, correct network namespace for `127.0.0.1:55432`. `TEST_DATABASE_URL` must be regenerated from trusted inputs after clearing `DATABASE_URL`, `TEST_DATABASE_URL`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSERVICE`, `PGSERVICEFILE`, `PGPASSFILE`, `PGOPTIONS`, `PGCONNECT_TIMEOUT`, `SCHEMA_COMPARE_*`, and any untrusted dotenv/node-loader/connection override. Internally source-generated S2 catalog child `SCHEMA_COMPARE_*`, Drizzle child `DATABASE_URL=testConnectionString`, and S1 test-derived `DATABASE_URL` remain **allowed only after exact-source review and signed launcher implementation**. `{...process.env}` in child code is not itself a trusted sanitizer.

## 5. Revised G3-S1 and split G3-S2 contract

**G3-S1**: independently signed A00/HQ+A20+Windows operator approval for one named, operator-owned fresh **base** DB and **all** run-specific `tm_test_<nonce>` plus migration-test helper schemas inside it, including CASCADE deletion and targeted 0030/0031. Verify no pre-existing run schema or foreign object before first mutation; reject the source default `tm_test_access` as a reusable operational target. No G3-S1 permission to delete the base DB.

**G3-S2 is one parent gate with two mandatory separately signed sub-scopes**:
- **`G3_S2_CATALOG_GO`**: three dynamic `tm_catalog_test_<16hex>_{dev,prod,fresh}` DBs, exact name regex, the C01 0001–0011/fixture DDL/DML envelope, automatic WITH FORCE teardown, owner/cluster proof and failures.
- **`G3_S2_DRIZZLE_FORCE_GO`**: one dynamic `tm_drizzle_schema_test_<32hex>` DB, 0001–0020 and fixture DDL/DML, two `drizzle-kit push --force` calls with reviewed 0.31.10 lock/config/empty schema, guarded cleanup, automatic WITH FORCE teardown, same owner/cluster proof and failures.

All three mutation scopes must be valid simultaneously for one **unmodified full C01 run**, and bound to a common immutable C01 tree+plan digest, source blob set, container/network namespace+PGDATA cluster ID, effective role, anticipated 5-user-DB ledger, source checkout and dependency digest. Authoritative signer identities, freshness/expiry and scopes must be verified outside application runner. **Previous three-DB approval is INVALID for this full run.** Runtime generated names cannot be preknown from code; pattern authorization must pair with independently captured **actual successful CREATE/owner evidence** as soon as objects appear. It cannot rely solely on `UUID` or `IF EXISTS`.

**Crucial G3/G4 boundary:** both S2 fixtures execute their `after()` `DROP DATABASE IF EXISTS ... WITH (FORCE)` **during G4**, not during G5. The distinct G3-S2 sub-scope and G4 signatures must expressly authorize these built-in drops *before* running. A hypothetical later G5 authorization does not authorize earlier test teardown.

## 6. G4 exact execution envelope — still NOT AUTHORIZED

G4 runs exactly `pnpm --filter @workspace/api-server run test:integration` only after G0/G1/G2/G3-S1/G3-S2-CATALOG/G3-S2-DRIZZLE/G4 independent authorizations. No tests can be silently skipped or rewritten; serial execution is no isolation guarantee. A50 shall provide source-complete signed inventory, frozen lock, executable Drizzle kit version/binary and harmlessness review, sealed env, read-only filesystem write-path plan and independent Docker/PG identity proof before asking for GO.

**Required observable G4 evidence:** base DB + all **four** dynamic database names, OIDs and owner/role/cluster fingerprint **captured at creation** (and before automatic deletion), individual `CREATE`/G4 `DROP WITH FORCE` event dispositions; S1 schema/migration ledger; both `push --force` child command/cwd/config hash/redacted environment/exit+signal; source-verified distinction between push DDL, fixture migration DDL and independent guarded index cleanup; real stdout/stderr and TAP counts, first causal failure, exit code and sanitized SHA256 receipts. Raw DSNs/passwords never uploaded to cloud. **`G4_DIAGNOSTIC_EVIDENCE_PASS` is distinct from `API_TEST_PASS`.** No rerun, alternate DSN, filtered `--test-name-pattern`, manual `push`, or safety-bypassing chmod/mount allowed without new authorization.

**Important source failure path:** C01 assigns random S2 database names **before** `CREATE DATABASE`; `after()` may issue `DROP DATABASE IF EXISTS ... WITH (FORCE)` even after a CREATE failure. The code does not itself require proof that it created the name before issuing DROP. This is a **latent dangerous cleanup path**, particularly on a shared cluster; the signed disposable-cluster boundary and live event ledger are mandatory. Any name collision, unknown owner or incomplete identity proof -> STOP and `CLEANUP_HOLD`, even if fixtures execute their own teardown attempt.

## 7. G5 exact cleanup and STOP policy

**G5 is separately signed residual cleanup/disposal**, not a blanket grant for the test's automatic `after()` work already done in G4. Before G5, preserve raw/restricted evidence, hashed redacted artifacts, actual resource states, and an independent account of unexpected effects. The approval covers only verified run-owned residual **S1 schemas/helper schemas**, **four specific S2 DB IDs/OIDs** that remain, and (if explicitly authorized) base DB/container/volume using independently verified physical identifiers. No name-prefix DELETE, no guessed nonce, no `DROP SCHEMA public`, no `docker system prune`, no ambiguous `down -v`, no role escalation or retry of full suite.

**Required STOP conditions (hard fail-closed):**
1. Mismatch in C01 SHA, test inventory, `drizzle.config.ts`, push schema, 0.31.10 dependency resolution or local binary; unknown `drizzle-kit` CLI/environment.
2. Wrong Docker context/PGDATA/system identifier/network namespace, any published PostgreSQL host port, native Windows PG exposure, foreign volume or pre-existing user DB outside signed baseline.
3. Missing G3-S1, either G3-S2-CATALOG or G3-S2-DRIZZLE/FORCE, G4 signer, expired/unauthenticated signature, absent role/ownership evidence.
4. Wrong DSN/host/user/db/schema, inherited untrusted `PG*`/`SCHEMA_COMPARE_*`/dotenv or source-generated child target mismatch.
5. Scratch DB name pre-exists or unexpected CREATE/DROP event, fifth scratch DB, unexpected `push` SQL that touches `public` or other unapproved namespace; first unexpected DDL is a **`STOP_UNEXPECTED_DRIZZLE_EFFECT`** even if test log would otherwise match.
6. CREATE failed but later automatic `after()` attempted DROP, unknown creator or owner/OID, orphan resources, FORCE failure, restricted session, incomplete logging/redaction, unsafe cache/write-path fallback -> **`CLEANUP_HOLD`** (no guessing, no retry).

**Five-context inventory** should include baseline/run/end states for: `s1_base`, `s2_catalog_dev`, `s2_catalog_prod`, `s2_catalog_fresh`, `s2_drizzle`; separately record maintenance/templates, S1 schema and auxiliary schemas, and dynamically captured owner/OID/cluster IDs. `BASE+4` is a count of *logical run targets*, not a claim that all exist concurrently for the entire run. Account for auto-teardown before asserting G5 absence.

## 8. Explicit SQL-01 verdict and scope classification

**`SQL-01 / FOUR-DB SCOPE OMISSION: CLOSED — SOURCE CONTRACT CORRECTED (R23H-R3)`.**

The previous incomplete three-DB authorization is superseded by this **five-context contract (one base + four dynamic)**. The Drizzle risk is *meaningfully mitigated at source* by 0.31.10 lock resolution, an intentionally empty push declaration and filters to `information_schema`/nonmatching tables; the correct conclusion is **expected no application-table DDL, not proven runtime no-op and not verified safety of `--force`**. A50's specific reported pending evidence remains pending. This statement closes the **documented inventory omission only**, not the required risk acceptance, effective role controls or runtime execution gate.

**`SQL-01 / PG16 MUTATION AUTHORITY AND RUNTIME: BLOCKED / NOT CERTIFIED`.**  
**`PG16_EXECUTION_NOT_AUTHORIZED` / `C01_INTEGRATION_HOLD` / `RELEASE_NO_GO`.**

A22 has neither issued, nor implied, G0–G5 approvals. No SQL, migrations, `push`, Node tests, Docker, cleanup or production work was performed. Do not downgrade P0 operational risk merely because the source-contract mapping is now complete.

## 9. Handoff obligations (20, 24, 30, 31, 50, 60)

- **A20 (PG coordinator):** adopt BASE+4 census, bind G3-S1, separately sign G3-S2-CATALOG and G3-S2-DRIZZLE-FORCE, attest pristine cluster+role boundary and owner-proof before any G4.
- **A24 (readiness):** require effective role `CREATEDB` only in new isolated cluster, S1 base CREATE/ownership, each S2 owner and public-schema rights, control plane ↔ data plane identity, native Windows PG untouched; return HOLD until proven.
- **A30 (security):** risk-accept only with exact guard+binary attestation, no host access, safe failure/cleanup behavior and vetted inherited env; retain P0 operational gate.
- **A31 (security specialist):** independently review the combined C01 S1/S2 principal, schemaFilter/tablesFilter interpretation, auto-teardown on failed CREATE, role memberships/OWNER/CONNECT/CREATE and index-cleanup scope.
- **A50 (runner/evidence):** update sealed launcher and G4 receipts to five logical contexts, exactly four CREATE/DROP fixtures, two force pushes, runtime SQL-effects attribution, immutable binary/lock and no unapproved write-path; no execution.
- **A60 (independent QA):** verify this contract's exact-source blobs, A50 published addendum, 0.31.10 lock, both G3-S2 scopes, physical signature/permissions, G4/G5 and 5-context evidence independently before any positive execution recommendation.

**Independent QA and runtime grants remain pending.** This document is a documentary SQL contract and does not attest safe execution.
