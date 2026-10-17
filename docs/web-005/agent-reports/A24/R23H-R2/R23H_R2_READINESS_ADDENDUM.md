# WEB-005 — A24 / R23H-R2 — FOUR-DB READINESS ADDENDUM

**Task:** `WEB-005-T024-R23H-R2-READINESS-ADDENDUM`  
**Date:** 2026-10-17 · Europe/Warsaw  
**Mode:** DOCUMENTATION / NO EXECUTION  
**Exact C01 commit:** `fa3261b2c9510e110ac9eba21726812d3401a525` · PR #60  
**Disposition:** `R23H_R2_READINESS_ADDENDUM_PUBLISHED` — documentation only. `SQL_01_P0_BLOCKED`, `PG16_EXECUTION_NOT_AUTHORIZED`, **G0–G5 all HOLD**, `C01_INTEGRATION_HOLD`, `RELEASE_NO_GO`.

This is an **additive, separately versioned correction**. It does not overwrite R23H originals or silently update earlier approvals. No Docker, SQL, migrations, image pull/build, API integration, DB mutation or cleanup has been executed by A24.

## 1. Original R23H artifacts — published full files, unchanged

A24 re-fetched each complete raw `text/markdown` file from Google Drive and compared it byte-for-byte against the original local R23H file. **Four out of four matches**, including full SHA-256. These are raw byte claims, unlike converted Google Docs logical-text comparisons.

| Original document | Full SHA-256 of raw bytes | Direct Drive link |
|---|---|---|
| `R23H_G0_G5_READINESS_MATRIX.md` | `7abccfb8d2909174ae4004d3f75c9dcfc69a8caea08320aec7a60942817d6e71` | https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view |
| `R23H_OPERATOR_APPROVAL_TEMPLATE.md` | `d0d56751650f5cd9742120d21f47f86f3d16063035a33850efd2fc2a606746d4` | https://drive.google.com/file/d/12-jnMC_TeweZkDTDDRXlJJE4pnbbaTjW/view |
| `R23H_EXECUTION_STOP_CONDITIONS.md` | `62c2a9731add6c714ac68719630aca143efb0d21c7759ef15504e3b33e8d6ff6` | https://drive.google.com/file/d/1DI76OgEAZ0Sx0R4K2gJkEBUt25JUgn8u/view |
| `R23H_A50_HANDOFF_CONTRACT.md` | `31fdbe57f61cd85fa564e57a7588054f02c0c972c3cfc42149899a723b6c9e8f` | https://drive.google.com/file/d/1iHTGPVWqsVW5Nu-nNz_f1DqRxTB347OG/view |

See prior versioned A24 R2 handoff (never retroactively modified): https://github.com/C8LyNn/aplikacja-turnieje/blob/2ea34f8c430a165b151d0fe8ac6c56ce7f6b43e4/docs/web-005/agent-reports/A24/R23H-R2/R23H_R2_READINESS_HANDOFF.md .

## 2. Authority, evidence and SQL-01 change

**A22 original authoritative static audit**: https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view · ZIP SHA-256 `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e`; source report `R23H_SQL_SAFETY_VERDICT.md` = **BLOCKED**, findings SQL-01 through SQL-10. A24 read the A22 SQL scope and permission matrix. **A50's separately published R2 SQL addendum** adds details about child process, base+four footprint and Drizzle config, but is not a replacement for A22 SQL approval: https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view .

At C01 exact source:
- **S1 existing base DB** `web005_c01_test_<nonce>` with fresh `tm_test_<nonce>` schema, original `test-database.ts` blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`: `DROP SCHEMA IF EXISTS ... CASCADE`, `CREATE SCHEMA`, migrations 0001–0028 in normal helper; other integration tests explicitly use 0030/0031 and dynamic DDL/auxiliary schemas. Source review of S1 does **not** certify atomic rollback; A22 says its reset is non-atomic.
- **S2a catalogue — 3 additional DBs** `tm_catalog_test_<16hex>_dev`, `tm_catalog_test_<16hex>_prod`, `tm_catalog_test_<16hex>_fresh`; original `replit-schema-catalog-reconciliation.integration.test.ts` blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`, `CREATE DATABASE` and `DROP DATABASE IF EXISTS ... WITH (FORCE)`.
- **S2b Drizzle — 1 additional DB** `tm_drizzle_schema_test_<32hex>`; original `drizzle-schema-diff.integration.test.ts` blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`: `CREATE DATABASE`, fixture migrations and DDL, `DROP DATABASE IF EXISTS ... WITH (FORCE)`, and **two calls** to `drizzle-kit push --config ./drizzle.config.ts --force --verbose` inside a child process. Child overrides `DATABASE_URL` to its own scratch DB while spreading the parent environment. `--force` bypasses interactive safeguards; do not assert that the installed Drizzle emits destructive statements without inspecting its *actual* resolved version, config and effective SQL.
- **Count distinction:** **four S2 dynamically created databases**, plus **one preprovisioned S1 base database** = up to **five run-owned user databases**, alongside system maintenance/template DBs. It is incorrect to sign "only three S2 DBs" or "four total user DBs."
- The complete API integration discovery includes **36** integration entrypoints per A22's static source ledger. No test runner has been executed in this task. Independent A60 check of exact discovery and all source fingerprints remains necessary.

Canonical network topology continues to be A21 R23H **Option A only**: PostgreSQL `network_mode:none`, runner `network_mode:service:pg16`, no host-published ports, **internal** `127.0.0.1:55432`, native Windows PostgreSQL `127.0.0.1:5432` / `[::1]:5432` untouched. Physical cluster identity must be proven by operator's *new Docker PGDATA* system identifier, mount/volume/PID/netns and authenticated SQL endpoint, not localhost string checks.

## 3. Narrow replacement G3-S2 / G4 / G5 readiness matrix (ALL HOLD)

| Gate | Addendum's **mandatory** consent / PASS prerequisites | STOP on |
|---|---|---|
| **G3-S2 — 4 DB approval** | Separately approved **S2a CATALOG (3)** **and S2b DRIZZLE (1)** in the **same newly attested empty disposable PG16**. An A00/HQ, A20 and named Windows operator signed record must explicitly enumerate `CREATEDB` cluster-wide risk, all four name regexes, `CREATE DATABASE`, owner-based `DROP DATABASE IF EXISTS ... WITH (FORCE)` and S2b's exact **two** `drizzle-kit push --config ./drizzle.config.ts --force --verbose` child invocations plus dynamic SQL / migrations. Bind to exact C01 SHA, source blobs, frozen plan hash, Docker host/context, PGDATA `system_identifier`, target DB ownership, evidence policy and expiry. Prefer **separately identifiable signed S2a and S2b subconsents**; a single S2 record is sufficient only if both explicitly approved and verifiable by all three signers. | Three-DB-only or generic `CREATEDB` consent; absent Drizzle force approval; foreign target/owner; unknown emitted SQL scope; role overprivilege; changed cluster/source |
| **G4 — one full API test** | Fresh distinct three-party G4 GO only *after* G0/G1/G2/G3-S1/G3-S2a/G3-S2b accepted. A50 seals C01 source, all **36** entrypoints, effective privileges, true 5-context DB ledger (base+4 scratch) and environment; untrusted inherited `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*` libpq DSNs and `SCHEMA_COMPARE_*` removed before injecting only approved base DSN. Source-generated S2a child `SCHEMA_COMPARE_*` and S2b child `DATABASE_URL` allowed **only** when mapped to exact owned temporary DBs. Audit pinned `lib/db/drizzle.config.ts`, resolved drizzle-kit and child cwd/argv/target; runner `read_only:true` filesystem write census before GO. Run exactly **once** `pnpm --filter @workspace/api-server run test:integration`, no filter, skip, retry or source edit. Capture original complete TAP, stdout/stderr, child exit/signal, first genuine `not ok`/exception and full DB footprint. `DIAGNOSTIC_EVIDENCE_PASS` is distinct from `API_SUITE_PASS`. | Missing fourth DB/Drizzle entrypoint, unsealed inherited parent env, disallowed child DSN, unreviewed `--force` effects, incomplete TAP/logs, unknown filesystem writes, no signed scope |
| **G5 — preserve + exact cleanup** | **Another** independent A00+A20+operator GO only after private raw evidence and sanitized remote Drive **byte** readback. Exact run-owned **base DB + 4 S2 DB** inventory records each generated name, DB OID, owner, cluster ID, preexistence, successful CREATE receipt, and outcome of teardown. Before any *manual* `DROP` independently re-check creation-by-this-run, present ownership and physical cluster ID. Teardown of S1 and S2 during G4 is already authorized only within their own signed mutation scopes; it does **not** grant general manual G5 cleanup. Operator cleanup limited to exact new G1 container/PGDATA volume resource IDs with matched labels/creation times; Windows PG16 remains untouched. | Missing create receipt (including partial CREATE failure), unexpected existing similarly named DB, orphan with unproven owner, different OID/cluster ID, foreign resource, lost evidence, generic `prune`/`down -v`/wildcard DROP |

**Permissions (target-state, NOT observed):** G2 observer = read-only catalog. S1 non-superuser login = CONNECT+DB-level CREATE on dedicated base DB and *only* owned disposable schema/objects, **NOCREATEDB**. S2 short-lived dedicated non-superuser login = temporary **CREATEDB** cluster-wide only on physically exclusive fresh cluster; owner of its **four newly created** DBs, with DDL/DML and `DROP DATABASE ... WITH (FORCE)` within those owned DBs. No `SUPERUSER`, `CREATEROLE`, `REPLICATION`, `BYPASSRLS`, `pg_signal_backend`, host/native/production access or superuser secret exposed to A50. Privileges are not name-prefix restricted, so **physical isolation and exact ownership ledger** are mandatory; DB `DROP` depends on ownership (not a generic GRANT). Actual role grants/revocation are PENDING G2/G3 evidence.

## 4. Operator approval — validation of original vs corrected scope

The original `R23H_OPERATOR_APPROVAL_TEMPLATE.md` contains **`G3_S2_GO` for THREE scratch databases** and fields `s2_database_names: GENERATED_AT_G4_LOG_ACTUAL_THREE` / `s2_exact_three_db_generation_and_force_drop`. **Therefore the original template does NOT cover the fourth Drizzle DB or force-push**, cannot be signed as-is to authorize complete C01 and must stay archival. The corrected signed approval **must include** at minimum:

```yaml
task: WEB-005-T024-R23H-R2-READINESS-ADDENDUM
c01_sha: fa3261b2c9510e110ac9eba21726812d3401a525
canonical_plan_sha256: PENDING
operator_host_docker_context_and_pgdata_system_id: PENDING
phase: G3_S2
s2_catalog:
  consent: HOLD
  count: 3
  regex: "^tm_catalog_test_[a-f0-9]{16}_(dev|prod|fresh)$"
  create_db: false
  drop_db_with_force: false
s2_drizzle:
  consent: HOLD
  count: 1
  regex: "^tm_drizzle_schema_test_[a-f0-9]{32}$"
  fixture_git_blob_sha1: e008dbd9fe287632252d3fcfda246f60e4cc35d3
  create_db: false
  drop_db_with_force: false
  drizzle_push_force_count: 2
  drizzle_sql_effects_review: PENDING
  drizzle_child_database_url_attested: false
runner_role_createdb_clusterwide: false
database_create_success_ownership_ledger: PENDING
a00_hq_signature_url: PENDING
a20_sql_signature_url: PENDING
windows_operator_signature_url: PENDING
signer_validity_expiry_utc: PENDING
decision: HOLD
```

This YAML is **not executable** and does **not** self-authorize. An A00 review alone, unsigned A20 documentation, or prior 3-DB consent cannot become GO. Every state-changing action (OCI/pull/build, G1 creation, operator-only PGDATA read, G2 SELECT, G3-S1, G3-S2a and S2b, G4, G5) remains independently gated by applicable triple authorization; prior gate PASS never cascades.

## 5. Additional STOP conditions (overlay on untouched historical STOP catalogue)

- `STOP_S2_FOUR_DB_SCOPE_MISSING` — any launcher, approval, DB ledger, G4/G5 plan accounts for only three S2 databases.
- `STOP_DRIZZLE_FORCE_UNREVIEWED` — `drizzle-kit push --force` source/config/resolved dependency/target SQL footprint not reviewed and explicitly signed; **no default exemption** just because a schema filter exists.
- `STOP_DRIZZLE_TARGET_DRIFT` — child `DATABASE_URL`, effective `drizzle.config.ts` or connection escapes attested `tm_drizzle_schema_test_<32hex>` in certified namespace/cluster.
- `STOP_CREATEDB_PRIVILEGE_SCOPE` — missing explicit cluster-wide CREATEDB risk acknowledgment; S2 grants on Windows/shared cluster or broadened/superuser role.
- `STOP_S2_DB_CREATE_UNPROVEN` — dynamic DB creation failed or is unproven, a same-named DB preexisted, or cleanup attempts `DROP DATABASE IF EXISTS ... WITH (FORCE)` without an immutable successful CREATE and owner/cluster/OID chain.
- `STOP_SQL_MIGRATION_SCOPE_DRIFT` — S1 auxiliary/dynamic DDL, test-specific 0030/0031, S2b migration path or emitted Drizzle SQL differs from signed manifest.
- `STOP_G4_INCOMPLETE_TEST_DISCOVERY` — omitted S2b fixture, test filters/skips, changed original command or missing original TAP/child evidence.
- `CLEANUP_HOLD` — any ambiguous DB/resource ownership or incomplete redacted Drive evidence prevents safe G5 disposal.

On STOP, preserve operator-private raw logs and redacted immutable evidence, freeze further tests/role changes/DROP, notify A00/A20/A22/A23/A30/A50/A60 as appropriate. **Do not auto-stop/remove containers, run speculative cleanup or retry**. Any corrective action needs new exact-scope approval, and destructive G5 cleanup needs a new independent triple GO. Emergency host response, if needed, remains with the Windows operator under separately authorized incident procedures.

## 6. Independent acceptance and handoff

- **A20:** verify/issue canonical 4-S2-DB SQL permission and migration/DDL ledger, plus separate S1, correct G3/G4/G5 signoff terms; reconcile A21 canonical topology, source of physical cluster identity.
- **A23:** independently verify raw Drive 4/4 SHA256 and new addendum exact Git blob+SHA, cross-reference A22 bundle SHA and C01 two S2 Git blob identities; distinguish source text from runtime evidence.
- **A30:** assess temporary cluster-wide CREATEDB, force-drop partial-CREATE case, child inherited env, actual `drizzle-kit --force` SQL effects, admin secret exposure and no-host-port threat model.
- **A50:** amend sealed launcher, expected 36-test list, 5-context footprint, child argv/DSN evidence and exact G3-S2a/S2b signatures. **No G4 execution** pending all gates.
- **A60:** independently review four-DB contract, operator signatures/physical PGDATA linkage/role snapshots, actual emitted SQL provenance, complete one-run TAP/exit and G5 resource ledger when future evidence exists. **DOC_QA only** today, no PG16 runtime PASS or release.
- **A00/HQ:** freeze one canonical run-plan source and explicitly decide future actions; **none** are granted by this document.

**Historical status stays:** `R23H_READINESS_DESIGN_COMPLETE` (v1 documentation). **Updated status:** `R23H_R2_READINESS_ADDENDUM_PUBLISHED` (additive documentation only) / `G0_G5_HOLD` / `SQL_01_P0_BLOCKED` / `C01_INTEGRATION_HOLD` / `C02_HOLD` / `RELEASE_NO_GO`.
