# WEB-005 — A22 / R23H-R2 — FOUR-DATABASE SQL CONTRACT CORRECTION

**Task:** `WEB-005-T022-R23H-R2-FOUR-DB-CONTRACT`  
**Date:** 2026-10-17 (Europe/Warsaw)  
**Scope:** C01 full API `test:integration`; corrective addendum **only** to R23H A22 reports, especially SQL-01  
**Immutable target commit:** `fa3261b2c9510e110ac9eba21726812d3401a525`  
**Method:** source inspection / documentation-only. **No SQL, tests, migrations, Docker, connection to PostgreSQL or deployment executed.**  
**Execution status:** `BLOCKED` / `PG16_EXECUTION_NOT_AUTHORIZED`.

## 1. Correction and non-replacement rule

The earlier R23H audit and its four original deliverables remain intact. This document **supersedes only the incomplete three-database S2 authorization**, related privilege assumptions and G3-S2/G4/G5 cleanup expectations. It does **not** represent a new end-to-end SQL audit or a runtime certification.

**SQL-01 P0:** the full unchanged C01 integration runner includes **four** database-creation targets, not just the three `tm_catalog_test_*` databases. The fourth target is `tm_drizzle_schema_test_*` and is modified by **`drizzle-kit push --force`**. Approval for three DBs does not approve the full run. Other R23H findings and blockers remain open.

Earlier A22 evidence: [R23H A22 SQL Safety Bundle](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view). All source references below use this exact C01 SHA and Git's immutable blob SHA-1, which is distinct from the SHA-256 of this addendum.

## 2. Four-database S2 manifest — source verified

| Slot | Runtime-generated name | Creation | In-database mutations | Automatic test teardown |
|---|---|---|---|---|
| S2a-dev | `tm_catalog_test_<16hex>_dev` | `CREATE DATABASE` | 0001–0010; dev drift fixtures, DDL/DML; 0011 reconciliation | `DROP DATABASE IF EXISTS ... WITH (FORCE)` |
| S2a-prod | `tm_catalog_test_<16hex>_prod` | `CREATE DATABASE` | 0001–0010; prod drift fixtures, DDL/DML; 0011 reconciliation | same |
| S2a-fresh | `tm_catalog_test_<16hex>_fresh` | `CREATE DATABASE` | 0001–0010, test data and 0011 reconciliation | same |
| S2b-Drizzle | `tm_drizzle_schema_test_<32hex>` | `CREATE DATABASE` | 0001–0020, temporary divergent index/marker, two calls to `drizzle-kit push --force`, SQL cleanup from production guide | same |

**Naming:** S2a uses one random UUID-derived lowercase 16-hex suffix for three distinct suffixes `dev/prod/fresh`. S2b uses a distinct UUID-derived 32-hex suffix. The names are constructed **during the test's `before()` hook**, so their exact values cannot be pre-signed in G3 before execution without changing the C01 source. Authorize **only four declared name patterns and four maximum CREATEs**, with event-level runtime receipts/ownership proof; do not pretend to preknow a nonce.

**S2a primary source:** [`artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts), **blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`**, lines 75–87 (identifier contract), 97–105 (migration history), 468–525 (create/setup/drop), 676–688 (child comparison environment).

**S2b primary source:** [`artifacts/api-server/test/drizzle-schema-diff.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/drizzle-schema-diff.integration.test.ts), **blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`**, lines 25–48 (0001–0020), 56–79 (identifier pattern), 177–199 (Drizzle child `push --force`), 209–279 (create/migrate/teardown), 356–374 (two Drizzle pushes and cleanup SQL).

**S2b authoritative target binding:** `applyReplitPushToDisposableDatabase()` launches the local `drizzle-kit` binary with `push --config ./drizzle.config.ts --force --verbose` and child `env: { ...process.env, DATABASE_URL: testConnectionString }`. [`lib/db/drizzle.config.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/drizzle.config.ts), blob `952a37a5ea123a0948cdaea68be0ee4986828fa9`, lines 3–4, 21, consumes `process.env.DATABASE_URL`. **`--force` must never be allowed against a reused/foreign DB.** This is a real schema-changing tool call, even though the test expects a no-change result in its fixtures.

**Runner inclusion:** [`artifacts/api-server/test/run-tests.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/run-tests.ts), blob `da4188446aba4696f97eb7831fee0cc5824d212f`, spawns full discovered integration tests with `--test-concurrency=1`; [`artifacts/api-server/test/test-discovery.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-discovery.ts), blob `dd427fdafa92c089e2edad704079d81945c4b1c1`, matches `*.integration.test.ts`. The earlier R23H inventory counted **36** API integration entrypoints. Serial execution is not a safety privilege boundary.

## 3. S1 remains independently destructive, not subsumed by S2

S1 retains the source-verified `DROP SCHEMA IF EXISTS "tm_test_*" CASCADE` / `CREATE SCHEMA` / migrations `0001–0028` (some replayed) / automatic teardown and additional helper schemas in migration tests. `0030/0031` are invoked in the separate atomic-correction integration test. No claim is made that the S2 databases replace or contain S1.

Source: [`artifacts/api-server/test/test-database.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-database.ts), blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, lines 141–182 (connection naming guards), 189–192 (initial destructive reset), 274–415 (migration TX with intermediate COMMIT), 416–430 (error/teardown CASCADE DROP). This is **not an atomic rollback of the previous schema**.

Separate S1 and S2 approvals remain mandatory. S1 schema pattern/name, test-only database name and reset token are **not proof of physical isolation**.

## 4. Effective privilege and ownership contract — critical nuance

**C01 source reality: the same `TEST_DATABASE_URL` credentials are reused for S1 and both S2 fixtures.** S1 code derives `DATABASE_URL` from that config; both S2a and S2b construct their `adminPool` from its base URL and change only database pathname for scratch DBs. Therefore a claimed independent **S1 NOSUPERUSER/NOCREATEDB role versus separate S2 CREATEDB role is not implemented by the unmodified C01 runner**.

There are only two honest options:

1. **For this exact unchanged C01 run:** one tightly controlled **ephemeral, non-superuser role with `CREATEDB`** within a freshly created, physically isolated, disposable PG16 cluster. It requires `CONNECT` and database-level `CREATE` on the fresh S1 base DB (to create schema), ownership of each newly created `tm_test_*` schema and its objects, and ownership of each of four scratch DBs. DDL/DML in scratch `public` requires object ownership / applicable schema rights; as creator and default DB owner, the role controls newly created DB contents. No Windows, existing shared or production PostgreSQL endpoint can be reachable.
2. **Future source redesign, NOT allowed in this audit:** split DB credentials by fixture/test path into S1 (no `CREATEDB`) and S2 (ephemeral `CREATEDB`), with separate independently audited runner/launcher and new pinned SHA. Do **not** assert this separation exists at C01.

Minimum C01 effective role: `LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS`. It must **not** own an existing cluster-wide/shared application DB and must not inherit other privileged roles. Test runner receives **no bootstrap superuser password**, no `pg_signal_backend` role, no broad role memberships, no cross-host credentials and no authority on host Windows PostgreSQL.

- `CREATEDB` is a **cluster-wide role attribute**, not grantable for a name prefix. Database-level `CREATE` is needed for `CREATE SCHEMA`; it also cannot be restricted to `tm_test_*` names inside the database. The only reliable containment is a separate empty cluster.
- `DROP DATABASE` belongs to the **database owner** (or superuser), not to a grantable `DROP` privilege. `DROP DATABASE ... WITH (FORCE)` can terminate only eligible backends and fails if protected sessions/prepared transactions/active logical slots block it; it is not transactional or reversible.
- `CONNECT`, `CREATE` and `public` schema privileges must be independently observed; the source shows requirements **but not actual PostgreSQL grants or ownership**. A short-lived test credential is not sufficient if the cluster is shared.

PostgreSQL 16 normative references: [CREATE DATABASE](https://www.postgresql.org/docs/16/sql-createdatabase.html), [DROP DATABASE](https://www.postgresql.org/docs/16/sql-dropdatabase.html), [Privileges](https://www.postgresql.org/docs/16/ddl-priv.html).

**Additional evidence:** [`lib/db/src/index.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/src/index.ts), blob `50cbf483d87a8a741f4965acde5edf6225fedd3e`, lines 7–13, connects using `process.env.DATABASE_URL`.

## 5. Revised G3-S2: separate four-DB mutation approval

**G3-S2 GO is documentation of the *approved mutation envelope*, not a claim that four DBs already exist.** Require distinct dated signatures from A00/HQ, A20 and Windows operator, independently of G3-S1; the approval must bind to:

- C01 exact SHA/tree and blob identities cited here; runner command and immutable Node/Drizzle dependency lock + image digests; clean host/runner namespace, no host-published PostgreSQL port, fresh owned PGDATA volume and an out-of-band physical PG cluster identity (system identifier tied to container/volume).
- Exactly **three S2a names matching the 16-hex catalog pattern and one S2b name matching the 32-hex Drizzle pattern**, total **four**; both creation and **automatic test teardown DROP WITH FORCE**; 0001–0010/0011 S2a, 0001–0020/Drizzle `push --force` S2b; fixture-internal DML/DDL; no extra database scope.
- The **combined ephemeral test role** privilege requirement described in section 4, verified against the isolated cluster; no assumption of separate S1/S2 credentials in unchanged C01.
- A strict **preexisting object prohibition**: cluster baseline excludes foreign databases, test schemas, sessions or borrowed PGDATA; exact runtime-generated names must be logged immediately on creation/observation and connected to successful CREATE receipts and owner/OID. Merely matching a regex or UUID is **not ownership proof**.
- Raw SQL/server logs and mutation ledger held in restricted evidence storage; sanitized SHA-256 receipts to shared Drive; failure/teardown contingency acknowledged in advance.

**Important consent boundary:** the C01 `after()` hooks issue destructive `DROP DATABASE ... WITH (FORCE)` *during G4 test execution*, not in a later G5 cleanup phase. **G3-S2 + G4 signatures must already authorize this built-in teardown. G5 is only for any *remaining* explicitly owned resources.** An external G5 signature cannot retroactively authorize teardown that already occurred.

If an approved launch cannot provide preexisting-object protection and reliable event-level CREATE/owner proof **without altering C01**, **STOP / remain BLOCKED**; do not silently modify tests or grant wider rights.

## 6. Revised G4: exact full integration + destructive footprint collection

G4 must be separately authorized only after G0–G3 (including **both** G3-S1 and corrected G3-S2) pass with immutable evidence. Source-authorized diagnostic command:

`pnpm --filter @workspace/api-server run test:integration`

The sealed launcher must discard inherited `DATABASE_URL`, `TEST_DATABASE_URL`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSERVICE`, `PGOPTIONS`, `PGSERVICEFILE` and external `SCHEMA_COMPARE_*` before injecting precisely audited test values. Keep **internally assigned** S2a child `SCHEMA_COMPARE_* = urls.dev/urls.prod` and S2b child `DATABASE_URL = testConnectionString`; do not globally break the source fixtures. Reject unapproved libpq service, socket, transport or role overrides. A URL containing `test`, loopback or a non-5432 port is not a physical attestation.

Before any write, independently prove the runner's `127.0.0.1` is the PG16 container namespace, not Windows; no Docker socket/Windows mount/host network; C01 checkout/lock/image provenance unchanged; four S2 targets possible only in the signed empty cluster. Observe every `CREATE DATABASE` and `DROP DATABASE`, exact name, cluster system ID, database OID and owner; record S2b `drizzle-kit push --force` invocation/exit/effect and both S2a/ S2b test hooks. Preserve full test count, Node exit/signal, first real failure, complete stdout/stderr and authorized log redaction. `API_TEST_PASS` is **separate** from `G4_DIAGNOSTIC_EVIDENCE_PASS`.

**Do not silently skip the Drizzle or catalog test** to make a three-database run look complete. No edits to the original test files, no alternate `--test-name-pattern`, no manual SQL. Any missing fixture, unexpected DB, privilege drift or observed foreign target fails G4 regardless of assertion counts.

## 7. Exact STOP / fail-closed conditions

| Trigger | Required behavior |
|---|---|
| Different SHA, different migration/Drizzle kit code or unknown runner flags | **STOP G0**. Re-review before new approval. |
| Wrong Docker context, nonempty/reused PGDATA, host-published ports, Windows/native PG reachable or physical identity mismatch | **STOP G1/G2**; never connect with mutation principal. |
| `TEST_DATABASE_URL`/other DSN resolves to unverified host, socket, service, wrong DB/user; `PG*` or `SCHEMA_COMPARE_*` foreign value survives | **STOP before G4**; no fallback to native localhost. |
| G3-S2 describes only three DBs, ignores `--force` or automatic `after()` DROP, or lacks one signature | **STOP / BLOCKED**. |
| Unrecognized role, `CREATEDB` outside disposable cluster, `SUPERUSER`/privileged membership, absent base DB `CREATE`, unexpected owner/`CONNECT` | **STOP / BLOCKED**. |
| Any planned runtime-generated database name already exists, CREATE fails, owner/OID/source of database cannot be proved, or unexpected fifth database | **STOP; quarantine / `CLEANUP_HOLD`**. Never infer ownership from name or `IF EXISTS`. |
| `drizzle-kit push --force` sees foreign DB, unauthorized diff/target, mismatched Drizzle binary or unresolved config | **STOP; preserve evidence**. |
| `DROP DATABASE WITH (FORCE)` fails due to sessions/replication/permissions; teardown affects unexpected object | **`CLEANUP_HOLD`**; no privilege escalation, no blanket retries. |
| Evidence gaps, partial fixture setup, truncated logs, redaction failure or unapproved source mutation | **FAIL diagnostic gate** and retain artifacts for operator review. |

**Code-level residual hazard:** in both S2 tests, database names are assigned **before CREATE**; the `after()` cleanup iterates names and uses `DROP DATABASE IF EXISTS ... WITH (FORCE)`. If setup fails (including a preexisting name collision), cleanup may still target a name **without positive CREATE success evidence**. This cannot be repaired by labeling a database `test`. On a shared cluster, do not run C01 at all. On disposable PG16, any ambiguity after failure means operator-controlled HOLD; report the already attempted teardown rather than asserting it was prevented.

## 8. Revised G5: exact owned-resource cleanup and verification

Automatic `after()` cleanup is part of G4. G5 starts only after complete logs and the four-DB/S1 resource ledger are preserved, independently reviewed and **separately** approved by A00/HQ + A20 + operator for any residual action.

For **each** S2 target, preserve immutable `CREATE_ATTEMPTED`, `CREATE_CONFIRMED`, `DROP_ATTEMPTED`, `DROP_CONFIRMED` or `CLEANUP_HOLD` status, linked to exact name, cluster system ID, DB OID/owner, credential/role, source path/blob, UTC event time and evidence SHA-256. Confirm absence of all **four** named scratch DBs and run-owned S1/helper schemas; ensure the base DB, native Windows PG16 service, foreign databases, processes and volumes were not modified. Absent database after successful automatic teardown needs **verification**, not a second forced DROP.

Residual deletion may target **only** resources with independent proof that the **same run created them in the attested disposable cluster**. Ambiguous objects are retained under `CLEANUP_HOLD` for operator decision. Never run blanket `DROP DATABASE`, `DROP SCHEMA public`, `docker system prune`, `docker volume prune`, `down -v` with ambiguous project/volume identity, or grant superuser/`pg_signal_backend` to force cleanup. Do not rerun the full tests just to clean up. Archive restricted raw evidence and hashed redacted Drive receipts before disposal.

**Required minimal ledger schema (documentary, not SQL):**

```yaml
source_sha: fa3261b2c9510e110ac9eba21726812d3401a525
cluster_system_id: PENDING_ATTESTATION
runner_image_digest: PENDING_ATTESTATION
mutation_scope: G3-S1 | G3-S2a | G3-S2b
logical_slot: s1_schema | s2a_dev | s2a_prod | s2a_fresh | s2b_drizzle
generated_name: CAPTURE_AT_RUNTIME
postgres_database_oid: CAPTURE_AT_RUNTIME
effective_role_and_owner: CAPTURE_AT_RUNTIME
state: PLANNED | CREATE_ATTEMPTED | CREATE_CONFIRMED | DROP_ATTEMPTED | DROP_CONFIRMED | CLEANUP_HOLD
source_path_and_blob: REQUIRED
approval_g3_s1_or_s2: REQUIRED
approval_g4: REQUIRED
approval_g5_if_residual_cleanup: REQUIRED
sql_or_hook_exit_evidence_sha256: REQUIRED
operator_and_a60_review: PENDING
```

## 9. Owner handoff (20, 24, 30, 31, 50, 60)

- **A20 — coordination:** replace every canonical **three-DB** statement with **four-DB S2a + S2b**; amend G3-S2 approvals to cover automatic G4 teardown and `--force`, and G5 to residual-only exact-ID cleanup. Publish revised plan digest; retain R23H originals.
- **A24 — PG16 readiness:** prove empty cluster, out-of-band system ID, original Windows PG16 unchanged, effective same-credential `CREATEDB`/base `CREATE`/DB ownership and namespace isolation. Provide a preflight verdict, not test results.
- **A30 — security coordination:** evaluate high-privilege combined effective C01 role versus the *aspirational* split-role design, inherited DSN boundary, FORCE termination, and auto-cleanup on failed CREATE. Keep SQL-01 open until independently signed.
- **A31 — PG16 security reviewer:** independently challenge actual C01 S2a/S2b role and ownership semantics, default `public` schema rights, Drizzle child target binding and residual cleanup hazards; issue independent verdict.
- **A50 — integration execution owner:** adjust exact full-run mutation capture to all 4 DBs; retain serial full-run command and complete causal logs; do not execute while G0–G4 authorization incomplete, do not skip S2b.
- **A60 — independent QA:** check both immutable S2 blobs, all four database receipts, real effective role, both G3 approvals, physical identity, G4 teardown, G5 residual disposition, no foreign impact and redacted source integrity. No GO solely from written contract.

## 10. Verdict

**`R23H_R2_FOUR_DB_SQL_CONTRACT_DOCUMENTED`** — the *corrective source-backed addendum* is prepared.  
**`R23H_SQL_CONTRACT_VERIFIED`: NOT GRANTED.**  
**`PG16_EXECUTION_NOT_AUTHORIZED` / `BLOCKED` persists.**

No destructive SQL or test execution was performed; this document authorizes **nothing** by itself. Original R23H findings, artifacts and approvals remain separate and unchanged.
