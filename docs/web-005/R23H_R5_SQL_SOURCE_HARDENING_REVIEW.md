# WEB-005 — A22 / R23H-R5 — SQL SOURCE HARDENING REVIEW

**Task:** `WEB-005-T022-R23H-R5-SQL-SOURCE-HARDENING`  
**Owner/reviewer:** A22 SQL & Migration Safety → A50 Variant B Engineering; cc A20/A30/A31/A24/A60/A00.  
**Date:** 2026-10-18 Europe/Warsaw · **Mode:** READ-ONLY STATIC CODE REVIEW · **Priority:** P0 / CRITICAL.  
**Reviewed source:** **`C8LyNn/aplikacja-turnieje@3517658652a01c133ab1bf8c790128ec62d14bd6`** on `codex/web005-a50-r23h-r5-variant-b-source-only` (branch name is mutable; all findings bind to this exact commit).  
**Original parent C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` · GitHub compare: **ahead 8, behind 0, exactly 8 file paths changed**.  
**Reference:** [A60 R23H-R4 Independent Corrective QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/R23H_R4_INDEPENDENT_CORRECTIVE_QA.md), blob `167de4e65c428d27ebdd424acc5ba8f0afb3ef82`; [A22 R4 source contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md).  
**Result: `STATIC_SOURCE_REVIEW_COMPLETED_WITH_BLOCKERS / VARIANT_B_SOURCE_NOT_APPROVED / PG16_EXECUTION_HOLD`.** No database, Docker, SQL, migrations, tests, CI, merge, runtime cleanup or deployment was executed by A22.

## 0. Evidence policy and precise scope

This is a targeted **new B diff review**, not a repeat of R3/R4. At the exact B SHA, GitHub compare against C01 identified:
1. **Added** `artifacts/api-server/test/pg16-test-ownership.ts` (Git blob `5d4dcff22944650cdaeac77dd6ef323f1c2169e2`, 133 lines).
2. **Modified** `artifacts/api-server/test/drizzle-schema-diff.integration.test.ts` (blob `8379a5bc48aa5da1b221a29778a73c6abd995045`).
3. **Modified** `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts`.
4. **Modified** `artifacts/api-server/test/test-database.ts`.
5. **Modified** `artifacts/api-server/test/migration.integration.test.ts`.
6. **Modified** `artifacts/api-server/test/tournament-stages-composite-foreign-keys.integration.test.ts`.
7. **Modified** `artifacts/api-server/test/tournament-stages-procedural-recovery.integration.test.ts`.
8. **Modified** `artifacts/api-server/test/tournament-stages-production-migration.integration.test.ts`.

All eight changed files were retrieved from this exact commit for static review. This report verifies changed test/source guards **only**, not independently audited runtime behavior or a full 36-entrypoint destructive-path re-census. No executable sealed launcher or independent signed PG observer is among the eight changed paths. C01's full suite remains a separate future acceptance target, never inferred PASS from a read-only review.

**Evidence classification:** `SOURCE_VERIFIED` means present in Git blob; `DESIGN_REQUIRED` means a demanded code/launcher change; `RUNTIME_UNKNOWN` means no SQL/network/PG16 execution occurred; `SECURITY_APPROVED` is **false**.

## 1. Four S2 DBs — required ownership lifecycle and current B delta

Canonical exact names and transitions:

| Slot | Strict name | What B source actually changed | Pre-DROP minimum |
|---|---|---|---|
| `catalog_dev` | `tm_catalog_test_<16hex>_dev` | `createdDatabaseReceipts.dev = await createRunDatabase(...)`; in `after()`: `dropRunDatabase(...)` | One successful CREATE receipt explicitly bound to slot, exact name, OID, owner and attested cluster/run |
| `catalog_prod` | `tm_catalog_test_<16hex>_prod` | Same path | same |
| `catalog_fresh` | `tm_catalog_test_<16hex>_fresh` | Same path | same |
| `drizzle` | `tm_drizzle_schema_test_<32hex>` | `createdDatabaseReceipt = await createRunDatabase(...)`; in `after()`: `dropRunDatabase(...)` | same, plus signed `G3_S2_DRIZZLE_FORCE` |

**Positive B source delta (`pg16-test-ownership.ts` lines 41–76):**
- Before CREATE: regex identifier and read `pg_database`, reject a preexisting exact name.
- Only **after** `CREATE DATABASE "<name>"` resolves successfully and `pg_database` returns same-role `oid` and `owner` is `createdByRun:true` placed in a *local in-memory receipt*. B `after()` calls `dropRunDatabase()` **with receipt**, unlike original C01's name-only hook. The scenario where `CREATE` fails *before it commits* no longer gets a direct name-only DROP.
- At DROP: require receipt, compare runId + cluster-certificate **environment strings**, current name/OID/owner/principal, issue `DROP DATABASE "<name>" WITH (FORCE)`, then check name absent. B no longer uses `IF EXISTS`, correctly requiring a known object.
- This is a significant **static improvement** for the ordinary synchronous failed-CREATE path. It is **not independently authenticated run ownership**, physical cluster verification or a race-free operation.

### Required robust four-slot state machine

```text
RUN_AND_CLUSTER_EXTERNALLY_AUTHENTICATED
 -> SLOT_NAMED/RESERVED (runId, slot, strict regex, proposed DB name)
 -> PREFLIGHT_ABSENT_ON_CERTIFIED_CLUSTER
 -> CREATE_ATTEMPTED (durable event, before sending SQL)
 -> [success confirmed by actual CREATE response] + [db name→OID/owner/cluster observed]
 -> CREATE_CONFIRMED with immutable per-slot proof
 -> ACTIVE/DDL_AUTHORIZED
 -> PRE_DROP_ATTESTED (latest name, OID, owner, real cluster ID, run proof, exclusive writer)
 -> DROP_ATTEMPTED (durable event before sending SQL)
 -> DROP_CONFIRMED by catalog state + server execution receipt
Any error/timeout/ambiguous CREATE, missing owner/OID/certificate, changed target,
race/membership/unapproved writer or lost connection -> STOP + CLEANUP_HOLD; NO DROP.
```

**Distinct critical cases:**
- **Collision before CREATE:** already-existing exact name ⇒ STOP and NEVER delete it; randomness/prefix and same-role ownership are not proof of creation.
- **CREATE rejects normally:** persist `CREATE_FAILED`, never produce receipt; no DROP.
- **Connection drops/timeout after CREATE may have committed:** record `CREATE_OUTCOME_AMBIGUOUS`, do not infer success from later object existence, no auto-DROP; retain exact unresolved name and inspect under separate G5 consent.
- **CREATE succeeds but post-CREATE catalog/OID read fails:** same `CLEANUP_HOLD`; original code currently has no persisted attempt/ambiguous ledger.
- **Drop response ambiguous:** do not retry with FORCE; record `DROP_OUTCOME_AMBIGUOUS`, re-attest via independent read-only observer and separately signed residual G5.
- **OID reuse:** OID alone is 32-bit and potentially reused; bind successful CREATE event, actual owner OID/name, `system_identifier`, exact run/slot, creation time/sequence, and **no competing SQL principals**. Merely matching owner/old OID is not enough if a foreign actor can delete/recreate objects.
- **TOCTOU:** `pg_database` check followed by `DROP DATABASE` is not one atomic conditional operation. PostgreSQL `DROP DATABASE` has no `WHERE oid=...`; enforce single writer/exclusive isolated cluster with independent control-plane identity and strictly no foreign sessions/operators. A pre-DROP check is necessary but not race proof.
- **Session blockers/FORCE:** cannot assume `WITH (FORCE)` succeeds (prepared transactions, logical replication facilities, unkillable sessions/insufficient termination authority). Never grant superuser or automatic retry to make teardown succeed.

## 2. P0 source findings against A50 exact B SHA

### `R5-SQL-P0-01` — **S1 CASCADE DROP still lacks durable CREATE/OID ownership proof**

`pg16-test-ownership.ts` lines 77–133:
- `createRunSchema()` rejects preexistence, then `CREATE SCHEMA`, `COMMENT ON SCHEMA ... 'WEB005_G4:<runId>:<clusterCertificateSha256>'` and compares schema owner with `current_user`.
- `resetRunSchema()` lines 114–124 **accepts any preexisting schema** bearing that same comment and same principal, then performs `DROP SCHEMA "<name>" CASCADE` **without checking the schema's previously recorded CREATE success/OID**.
- `dropRunSchema()` lines 125–133 likewise accepts current **name + forgeable/mutable comment + owner**; there is **no immutable per-slot S1 receipt** and no pre-DROP comparison against a saved S1 OID.
- The comment is writable by the schema owner, and environment runId/cert fingerprint are not themselves independently authenticated. An old or replaced same-role object with a matching marker can be dropped, and CASCADE may remove dependencies. The code does not require a prior in-process CREATE receipt for reset/drop.

**Fix:** introduce per-slot S1 `CREATE_CONFIRMED` receipt (main, `_rollback`, `_marker_drift`) persisted in protected run ledger and returned from `CREATE SCHEMA`/authoritative catalog validation; compare **exact creation OID + owner OID + real physical cluster ID + run slot** before *every* CASCADE drop. Allow intentional same-run resets only after positive same-run proof and a signed policy explicitly covering their repeated lifecycle, not solely a comment or regex. No blind automatic reset of an inherited schema. Independently inspect dependent objects/foreign ownership as applicable. Fix all manual S1 reset entrypoints and shared drop wrappers; do not bypass guard on setup failures.

**Source status:** **P0 OPEN**. Main S1 name is now bound to `WEB005_RUN_ID` in `getSafeTestDatabaseConfig()` — good, but still no secure drop receipt.

### `R5-SQL-P0-02` — **Context SHA environment value is syntactically validated, not authenticated or SQL-cluster bound**

`requireSafetyContext()`, helper lines 18–25, checks only `WEB005_RUN_ID` as 32 lowercase hex and `WEB005_PG16_CLUSTER_CERT_SHA256` as 64 hex; `same()` compares **two caller-supplied strings**. Neither proves that a signature/attestation was verified nor that `adminPool` points at physical PostgreSQL `system_identifier` recorded in a trusted control plane. `dbIdentity()` queries `pg_database` and `current_user`, not cluster identity. S2 owner comparison is role-relative, not independent evidence that database belongs to this run.

**Fix:** external signer-verified one-use `run_id/plan_sha` certificate bound to signed **base DB, auth role OID, PG system_identifier, Docker volume/container/netns, source commit, DSN host and port**; require independent verifier proof before any DB SQL. Bind every S1/S2 guard to that real certificate and validate against a trusted read-only SQL/control-plane observer after connection. Do not trust a 64-hex env value just because it parses. Continue enforcing A21 isolated no-port Docker PG16; no native Windows fallback.

**Source status:** **P0 OPEN**. The A50 B branch does not contain a sealed launcher/verifier implementation.

### `R5-SQL-P0-03` — **Missing S2 receipt is silently treated as successful teardown, not explicit orphan HOLD**

In `dropRunDatabase()` lines 59–63, `if (!receipt) return;` is correctly *nondestructive* but conflates **CREATE never attempted** with **CREATE rejected** and **CREATE succeeded but acknowledgment/OID read lost**. The fixtures allocate names before CREATE; after-hook passes undefined after error. No durable pre-CREATE event or status exists; a database created before losing its response could remain orphaned without a `CLEANUP_HOLD` teardown result or exact operator escalation. In CATALOG the loop also stops at first thrown DROP, so later slots' dispositions must be recorded independently (not silently overlooked).

**Fix:** explicit `NOT_ATTEMPTED / CREATE_ATTEMPTED / CREATE_CONFIRMED / CREATE_FAILED / CREATE_AMBIGUOUS / DROP_PENDING / DROP_FAILED / CLEANUP_HOLD` per slot, append-only durable event *before* CREATE and DROP, preserve generated names even without receipt, require a failure/hold disposition for any uncertain attempt and explicit status for remaining catalog slots. Never resume or force-drop ambiguous objects without separately signed G5 exact identity. Never label an undefined receipt as `DROP_OK`.

**Source status:** **P0 OPEN** (destructive failure-path certification blocker, despite correct normal failed-CREATE skip).

### `R5-SQL-P0-04` — **S2 TOCTOU/OID reuse and same-role replacement not excluded by B source**

Helper lines 30–76 has preflight `SELECT` and later name-based `CREATE`/`DROP`. DB OID and owner are compared **from catalog reads on the test role connection**; the receipt does not carry **real** `system_identifier`, owner OID, DB creation event ID, signature or durable server evidence. There is no exclusive-writer enforcement in changed code. If a foreign actor with the same owner privileges replaces a DB between read and DROP, catalog/name-based DROP can target an unrelated object; 32-bit OID reuse, although rare, is a formal bypass scenario.

**Fix:** prove physical no-other-writer constraints out-of-process; trusted server event timeline and stable owner/principal OID, run-bound receipt identity and independent pre-DROP reconciliation. A source-side `SELECT` alone is insufficient to prove race freedom; reject any external client access, other DB creator or unexpected catalog delta. Preserve `CLEANUP_HOLD` on identity ambiguity.

**Source status:** **P0 OPEN** pending launcher/control-plane implementation and security review.

### `R5-SQL-P0-05` — **No enforced non-optional Drizzle forced-push SQL-effect attestation**

The exact reviewed Drizzle fixture retains **two** calls to `node lib/db/node_modules/drizzle-kit/bin.cjs push --config ./drizzle.config.ts --force --verbose`; child inherits `{...process.env,DATABASE_URL:testConnectionString}`. `drizzle.config.ts` remains original C01 blob `952a37a5ea123a0948cdaea68be0ee4986828fa9`: empty `pgSchema("information_schema")`, `tablesFilter=["__replit_push_manages_no_tables__"]`, `schemaFilter=["information_schema"]`. `pnpm-lock.yaml` still resolves `drizzle-kit 0.31.10`. **These are intended restrictive filters, not actual SQL-effect evidence.** The first push's stdout/stderr regex does not prove absence of DDL; the second push lacks a symmetric negative-DDL-output assertion. No server-audited before/after catalog or actual SQL effect attribution implemented in B diff.

**Fix:** for *each* push, pin installed executable bytes+lock SHA, argv, `cwd`, child effective target/cert and redacted env; prove both child DSNs resolve only to owned `s2_drizzle` DB. Capture SQL writes (including dynamic DDL) with authorized server trace/log or equivalent independently trusted observer and before/after `public`/relevant schema catalog fingerprints; require expected **zero Drizzle-authored application DDL** in either call, separate from **fixture** migrations 0001–0020, `CREATE UNIQUE INDEX`, and guarded index `DROP INDEX`. Unexpected SQL/target/config/verbosity/error ⇒ STOP and `CLEANUP_HOLD`; no silent `--force` retry. Child `{...process.env}` is acceptable only if launched by an actually implemented parent allowlist and all inherited `PG*`/libpq service files/loader secrets are removed.

**Source status:** **P0 pre-G4 admission OPEN**, SQL effects **RUNTIME_UNKNOWN**.

### `R5-SQL-P0-06` — **No positive attestation of base S1 database and privileges in modified fixture**

The B `getSafeTestDatabaseConfig` binds `TEST_DATABASE_SCHEMA` to `tm_test_<WEB005_RUN_ID>` but retains original broad `TEST_DATABASE_URL` path guard ("test" name, no "prod"), and does **not** enforce exact signed operator-provisioned `web005_c01_test_<nonce>` DB name, host socket identity, verified role grants or negative native Windows cluster attestation. The shared test principal still has cluster-wide `CREATEDB` for 4 S2 DBs, and might own other preexisting objects; `CREATE`/schema comments don't narrow this role attribute.

**Fix:** sealed launcher and G2 independently attest exact preprovisioned S1 base name+OID, role attributes, `CONNECT/CREATE` rights, S2 ownership, template/public ACL, real PGDATA/system_identifier and isolated namespace; reject wrong DSN **before any test SQL**. Keep `NOSUPERUSER/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS`, no blanket `pg_signal_backend` privilege escalation. If a split role is desired, implement as new source architecture and review; don't claim it for this B commit.

**Source status:** **P0 OPEN**.

## 3. Strict S1 schema contract / CASCADE acceptance

Required states per S1 main/`_rollback`/`_marker_drift`:
1. Validate signed `WEB005_RUN_ID`, exact `TEST_DATABASE_SCHEMA`, base DB owner/cluster cert and exclusive writer before connecting for DDL.
2. Observe **ABSENT** initially under fresh certified `s1_base`, then issue CREATE once; on successful CREATE, independently obtain schema OID + owner OID and protected creation receipt before any dependent migration.
3. Repeated suite reset must carry a **previous positive same-run receipt for exact existing schema OID** and a separately documented allowance to destroy *only run-created* objects; do not accept a matching COMMENT as proof.
4. Before any `DROP SCHEMA ... CASCADE` inspect run-bound schema+dependent object ownership, exact `nspowner` and `nspoid` and no foreign dependency. A `DROP ... CASCADE` can remove objects other than those in the target schema; fail closed if dependencies cannot be proven run-owned.
5. Between pre-DROP and DROP ensure exclusive writer/no foreign connected session. Catalog check + drop is not an atomic object-ID-targeted action. On failed/ambiguous CASCADE, record evidence and `CLEANUP_HOLD`; never blindly "retry reset".
6. For helpers use exact derived names `tm_test_<runId>_rollback`, `tm_test_<runId>_marker_drift`; they have their own CREATE/owner/OID/teardown evidence, not just a common main-schema marker.

**Current B static state:** correct run-bound names, positive CREATE then mutable COMMENT and same-user verification; **insufficient ownership provenance for reset/teardown**. All S1 negative tests (preexisting same-marker foreign schema, changed marker, changed OID/owner, fail between CREATE and COMMENT, partial failure after first COMMIT, collateral CASCADE dependency) remain **NOT EXECUTED**.

## 4. Complete source mutation and migration 0029–0031 mapping

| File | Actual source effect class | In the original or reviewed B full API `test:integration` paths reviewed? |
|---|---|---|
| `0001–0028` | S1 `resetTestSchema` full suite DDL/DML; some migration replays, multiple transaction blocks and non-atomic commit after 0018 | **YES — SOURCE VERIFIED**, including helper fixtures |
| **`0029_steam_game_catalog_v1.sql`** | Unqualified `CREATE TABLE IF NOT EXISTS` for `steam_catalog_games`, `steam_catalog_terms`, `steam_catalog_game_terms`; `CREATE INDEX`, `DROP/ADD CONSTRAINT`, term-seed `INSERT ... ON CONFLICT DO NOTHING`. These are actual DDL/DML *if separately run*. Git blob `e6c6ff4c4bc81181391a3b6cedafba3ab96c6c41`. | **NOT INCLUDED** in `test-database.ts` migration 0001–0028 list, **NOT INCLUDED** in S2 catalog 0001–0010/0011 or Drizzle 0001–0020, and **NOT INCLUDED** in the atomic-correction test's explicit `urls` array. **No observed invocation within these traced fixtures**. A full 36-file import/transitive source census remains PENDING; therefore don't assert universally no other test runs 0029. |
| **`0030_controlled_correction_operations.sql`** | `CREATE TABLE IF NOT EXISTS tournament_correction_operations`, constraints, `CREATE INDEX`; foreign keys with `ON DELETE CASCADE`. Git blob `50aa71ae0199806de3aaf3c57700d2739f2c42bc`. | **YES — SOURCE VERIFIED**: explicitly applied after 0001–0028 by `tournament-atomic-correction-postgresql.integration.test.ts`; code removes standalone transaction boundaries where present. |
| **`0031_atomic_correction_receipts.sql`** | BEGIN/COMMIT in file (stripped by test), `ALTER TABLE` ADD COLUMN, DROP two CHECK constraints and re-add new CHECK constraints. Git blob `d44601f4b6477dc9366fc7a65475a0eede1c34c1`. | **YES — SOURCE VERIFIED**, after 0030 in that test. |
| S2 catalog / S2 Drizzle | Catalog `0001–0010` + `0011` (drift/repair); Drizzle `0001–0020` + independent guarded index cleanup; two `push --force` | **YES — SOURCE VERIFIED**. 0029–0031 not in their explicit migration arrays. |

**Important dependency nuance:** the text of migration `0030` says to apply it "**after migrations 0001–0029**", but the Pack17 PostgreSQL fixture applies 0030/0031 after `resetTestSchema()` (0001–0028), without 0029. This is a **source/test-vs-deployment sequence divergence**, not by itself proof of destructive malfunction: 0029 handles the Steam catalog and may be logically independent. A50/A20 must explicitly resolve whether skipping 0029 is intentional isolated-test scope, and whether the full migration chain requires a separate signed 0029 test. No automatic extra migration application in R5.

## 5. Required negative-case matrix (DESIGN ONLY — do NOT label PASS)

Use globally unambiguous test IDs; A60 reported cross-agent N15/N16 collisions. Suggested canonical `SQLR5-` names:

| Case | Injection / fault | Required B result |
|---|---|---|
| SQLR5-S2-01 | Any of 4 DB names preexists (same user or foreign owner) | STOP before CREATE; no DROP, no session termination |
| SQLR5-S2-02 | CREATE rejects definitively | `CREATE_FAILED/CLEANUP_HOLD`, 0 DROP |
| SQLR5-S2-03 | Network reply lost after server committed CREATE | `CREATE_AMBIGUOUS/CLEANUP_HOLD`, preserve name; no auto DROP |
| SQLR5-S2-04 | Post-CREATE catalog read fails | No ownership receipt; hold orphan; no DROP |
| SQLR5-S2-05 | Same name/owner but different OID or replaced object | `PRE_DROP_OID_OWNER_MISMATCH`, no DROP |
| SQLR5-S2-06 | OID reused with same role and another CREATE event | Reject via durable run/slot event + exclusive writer attestation |
| SQLR5-S2-07 | Active session/permission failure during FORCE DROP | Record `DROP_FAILED`, no grant escalation or blind retry |
| SQLR5-S2-08 | CREATE dev successful; prod ambiguous; fresh never attempted | Per-slot outcomes and residual inventory; no silent return |
| SQLR5-S1-01 | Preexisting S1 main/helper schema with same forgeable marker | HOLD; no CASCADE absent matched CREATE receipt/OID |
| SQLR5-S1-02 | S1 schema OID changed between same-run resets | HOLD; no CASCADE |
| SQLR5-S1-03 | CREATE SCHEMA succeeds but COMMENT/verification fails | Mark ambiguous orphan; hold, do not drop by name |
| SQLR5-S1-04 | Foreign dependent object would be removed by CASCADE | STOP; no DROP |
| SQLR5-CTX-01 | Wrong PG cluster, same local host/port/role names and valid-looking env fingerprint | STOP before SQL; real `system_identifier` mismatch |
| SQLR5-CTX-02 | Tainted inherited `DATABASE_URL`, `PGHOSTADDR`, `PGSERVICE`, `SCHEMA_COMPARE_*`, `NODE_OPTIONS` | STOP before fork or any SQL; source-owned child exceptions only |
| SQLR5-DRZ-01 | First or second push emits unexpected public DDL | Stop+quarantine; attribution by child SQL event trace |
| SQLR5-DRZ-02 | Kit executable/config/schema/lock changes | STOP before child; no silent replacement |
| SQLR5-MIG-01 | 0030 assumes 0029 applied while fixture skips it | Signed declaration + source dependency proof; otherwise HOLD |

Testing/real SQL evidence has **NOT** been generated by this A22 review. All cases are recommendations to A50/A24/A60 for separately authorized code and negative QA.

## 6. Remediation ownership / status of every correlated P0

| A60 risk | R5 reviewer disposition | Blocking next evidence | Owner |
|---|---|---|---|
| `P0-31-01` five-context destructive admission | **OPEN**; B now guards standard CREATE/DROP but does not prove all G3/G4 effects | G3-S1 + distinct `G3_S2_CATALOG`, `G3_S2_DRIZZLE_FORCE`; exact B SHA; dual force effect ledger | A20/A22/A24 |
| `P0-31-02` PG/Windows physical identity | **OPEN**; 64-hex env cert is not physical attestation | Signed independently verified `system_identifier`/PGDATA/netns/native Windows exclusion and SQL observer | A20/A24/operator |
| `P0-31-03` S1 CASCADE | **OPEN P0**, matching COMMENT ≠ durable CREATE receipt | Source fix R5-SQL-P0-01; dependents/owner/OID chain and negative cases | A50/A22/A31 |
| `P0-31-04` CREATEDB / name collisions / ambiguous CREATE | **OPEN P0**, common failed-CREATE guard **partially implemented** | Durable attempted/ambiguous ledger, server identity+exclusive writer, no silent undefined receipt | A50/A20/A31 |
| `P0-31-05` DSN / launcher | **OPEN**, `{...process.env}` in child, no executable sealed verifier | Source implementation of clean env and signed launcher, independent negative QA | A50/A20 |
| `P0-31-06` OCI/isolation | **OPEN**, canonical Compose static only | Certified fresh PG container/volume/no ports/base image and runtime binding | A21/A24/operator |
| `P0-31-07` authorizations | **OPEN**, no current signed gate decisions | 1-use triple signature scoped G3-S1, G3-S2-CATALOG, G3-S2-DRIZZLE_FORCE, G4 auto teardown, G5 exact residual only | A00/HQ/A20/operator |

**Summary:** `P0_OPEN_7` — no runtime acceptance claimed. Newly authored B guards are an improvement; **none of the seven operational P0 is closed by reading code**.

## 7. What A50 must submit for *next* review

1. **New exact immutable B SHA** with source patches for `R5-SQL-P0-01/-03` and source-level prevention of unauthorized S1 CASCADE; use receipt-bearing interfaces not free-form env-marker `COMMENT` as sole proof. A50 must preserve all four S2 slot outcomes even after first cleanup failure.
2. Signed/verified, tested-as-code **launcher** enforcing clean child environment and no SQL before physical cluster/role/run certificate validation (not just a design PDF and not `sha` pattern checks); independently authenticated controlled evidence reader.
3. Four S2 per-slot durable `CREATE_ATTEMPTED / SUCCESS / AMBIGUOUS / DROP_ATTEMPTED / CONFIRMED` event records, plus S1 equivalent; cluster ID/DB OID/owner OID and exclusive writer attestation; no false PASS from name presence.
4. Two Drizzle force-call SQL-effect provenance, exact installed binary/config/target hashes; no-go if unexpected DDL. Retain real SQL logging private, only redacted/hash-verified evidence published.
5. Signed mutation scopes and independent negative test results when future G0/G1–G4 approval exists. **Never claim any executed PASS from this static review**. Provide B SHA vs C01 diff and A60/A31 follow-up review.
6. Resolve documented `0029` omission vs `0030` prerequisite note. Preserve `0029` DDL in the migration inventory even when intentionally omitted by the API fixture.

**Gate verdict:** `R23H_R5_SQL_STATIC_REVIEW_COMPLETE_WITH_P0_BLOCKERS`; `B_SOURCE_IMPLEMENTED_PARTIAL`; `B_SOURCE_APPROVAL_DENIED_PENDING_FIX`; `PG16_EXECUTION_NOT_AUTHORIZED`; `G0_NO_GO / G1_G5_HOLD`; `SQL-01_DOCUMENTARY_CLOSED_ONLY`.

**Scope proof:** this review performed GitHub-only reads, comparison and documentation publication. **NO** SQL, PostgreSQL, Docker, migration execution, integration tests, gameplay edits, merge or deployment.
