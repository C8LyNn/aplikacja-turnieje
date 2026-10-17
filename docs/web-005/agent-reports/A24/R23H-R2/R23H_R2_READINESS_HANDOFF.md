# WEB-005 — A24 / R23H-R2 — READINESS ARTIFACT HANDOFF

**Task:** `WEB-005-T024-R23H-R2-ARTIFACT-HANDOFF`  
**Date:** 2026-10-17, Europe/Warsaw  
**Mode:** DOCUMENT RECOVERY / NO EXECUTION  
**C01 source:** `C8LyNn/aplikacja-turnieje`, PR #60, immutable commit `fa3261b2c9510e110ac9eba21726812d3401a525`  
**Documentary status:** `R23H_R2_READINESS_HANDOFF_COMPLETE` (four existing full texts recovered, new versioned addendum).  
**Execution status:** `PG16_EXECUTION_NOT_AUTHORIZED`; **G0, G1, G2, G3-S1, G3-S2, G4, G5 = HOLD**. A22 SQL-01 is **P0 / BLOCKED** pending cross-agent acceptance. No Docker, SQL, image pull/build, migration, integration test, cleanup, game/source change or live deployment was executed by A24.

## 1. Recovered original R23H artifacts — byte-identical raw Markdown

The historical four files remain **unaltered**. Their SHA256 values were calculated from the original local bytes and independently compared with a fresh **raw Google Drive download**, including byte-for-byte `cmp`. These are real `text/markdown` Drive files, not converted Google Docs logical-text surrogates.

| Existing unmodified file | SHA256 (raw bytes, exact) | Direct verified Google Drive file |
|---|---|---|
| `R23H_G0_G5_READINESS_MATRIX.md` | `7abccfb8d2909174ae4004d3f75c9dcfc69a8caea08320aec7a60942817d6e71` | https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view |
| `R23H_OPERATOR_APPROVAL_TEMPLATE.md` | `d0d56751650f5cd9742120d21f47f86f3d16063035a33850efd2fc2a606746d4` | https://drive.google.com/file/d/12-jnMC_TeweZkDTDDRXlJJE4pnbbaTjW/view |
| `R23H_EXECUTION_STOP_CONDITIONS.md` | `62c2a9731add6c714ac68719630aca143efb0d21c7759ef15504e3b33e8d6ff6` | https://drive.google.com/file/d/1DI76OgEAZ0Sx0R4K2gJkEBUt25JUgn8u/view |
| `R23H_A50_HANDOFF_CONTRACT.md` | `31fdbe57f61cd85fa564e57a7588054f02c0c972c3cfc42149899a723b6c9e8f` | https://drive.google.com/file/d/1iHTGPVWqsVW5Nu-nNz_f1DqRxTB347OG/view |

Parent Drive folder: https://drive.google.com/drive/folders/1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36 . Earlier A24 GitHub summary: https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a24-r23h-readiness-20261017/docs/web-005/agent-reports/A24/R23H/R23H_A24_HANDOFF_DISPATCH.md . This R2 document **supplements / corrects** historical text; it does not rewrite prior files or create a runtime GO.

## 2. SQL-01 independent source recovery / normative correction

**A22 source-of-record:** https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view — `R23H_A22_SQL_SAFETY_BUNDLE.zip`, raw SHA256 `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e`; `R23H_SQL_SAFETY_VERDICT.md` reports `BLOCKED / SQL-01 P0`. A24 inspected the A22 bundle and directly verified C01 fixture blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`.

Exact C01 source: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/drizzle-schema-diff.integration.test.ts

- The prior R23H A24/A20/A21/A50 phrase **"three S2 databases" is incomplete and UNSAFE to use for any signature**. Full C01 includes **four** S2 disposable databases, split into **S2a** and **S2b**:
  - **S2a catalogue:** three `tm_catalog_test_<16hex>_dev`, `tm_catalog_test_<16hex>_prod`, `tm_catalog_test_<16hex>_fresh`, created/dropped by `replit-schema-catalog-reconciliation.integration.test.ts` (blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`).
  - **S2b Drizzle:** one `tm_drizzle_schema_test_<32hex>`, created/dropped by `drizzle-schema-diff.integration.test.ts` (blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`), including **two calls to `drizzle-kit push --force --verbose`**, schema export/diff, fixture DDL and documented cleanup SQL containing `DROP INDEX`.
- Both S2 fixtures can use `CREATE DATABASE` and `DROP DATABASE IF EXISTS ... WITH (FORCE)`. A generated random name or `IF EXISTS` does **not** prove that the database was created by this run; a partial CREATE failure can still reach teardown. Actual 4-DB create/owner/existence ledgers and pre-drop re-attestation are mandatory.
- A22 mapped **36** API `*.integration.test.ts` entrypoints. S1's `resetTestSchema` starts with `DROP SCHEMA ... CASCADE` and standard migrations 0001–0028, but other fixtures explicitly execute additional migration 0030/0031 and dynamic DDL/trigger/index operations. S2b applies 0001–0020 plus Drizzle child operations; S2a has its own catalogue migration/reconciliation path. Migration 0029 exists but is **not** proven to run in the standard S1 reset; do not silently authorize it.
- This is an **amended source-level scope**, not proof of actual SQL execution, exhaustive transitive DML coverage, isolated server identity or effective runtime privileges.

## 3. R2 changes to phase gates / permission contract (supersedes 3-DB claims)

| Gate | Revised minimum before a future phase-specific signed GO | Current state |
|---|---|---|
| **G0** | Exact C01 SHA/tree, all 36-entry test inventory and S2b blob, fixed image provenance + authenticated OCI amd64 manifest and immutable Node base/runner digests; approved A21 **canonical no-host-port** Compose SHA. Any pull or build requires separately scoped consent. | **HOLD** |
| **G1** | New, zero-foreign-data Docker PG16, unique labelled container/PGDATA volume, empty scratch DB inventory, no Windows binds; operator-only bootstrap/admin secret and non-superuser runner. Windows `postgresql-x64-16` on host `5432` untouched. | **HOLD** |
| **G2** | Separate operator authorization for physical PGDATA read and separate observer SELECT permission; match `pg_controldata` `system_identifier`, actual Docker volume/device/inode, container PID/netns and authenticated SCRAM server/role/DB to `127.0.0.1:55432` **inside shared namespace**, not host Windows. Preexistence check covers all four S2 targets/patterns. | **HOLD** |
| **G3-S1** | Dedicated A00/HQ+A20+Windows operator consent for exact owned `tm_test_<nonce>` schema `DROP SCHEMA ... CASCADE` (setup/teardown), DB-level `CREATE` needed for `CREATE SCHEMA`, source-approved 0001–0028 and test-specific 0030/0031/dynamic DDL ledger; no shared/foreign schema. Note S1 is **not atomically roll-backable**. | **HOLD** |
| **G3-S2** | A **different** triple signature must explicitly list **S2a (3 DBs) + S2b (1 DB)**, generated name formats, `CREATEDB`, owner-based `DROP DATABASE ... WITH (FORCE)`, **two** `drizzle-kit push --force --verbose` and subordinate export/cleanup SQL, migration path, ownership and exact cleanup ledger. Full S2 privilege is cluster-wide and safe **only** on uniquely attested fresh disposable cluster, not by prefix-based GRANT. | **HOLD / SQL-01 P0** |
| **G4** | **Another** signed GO for exactly **one complete 36-entry** `pnpm --filter @workspace/api-server run test:integration`, no skip/filter/auto-retry. Sealed parent env removes inherited `DATABASE_URL`, foreign `SCHEMA_COMPARE_*`, `PGHOST`/`PGPORT`/other libpq overrides; permits only fixture-internal S2a child `SCHEMA_COMPARE_*` and S2b child `DATABASE_URL` forced to each attested scratch database. Require A50 fully audited writable paths and process/child DB routing. Capture true exit, complete TAP, first genuine failure and all four DB footprints. **Diagnostic-evidence PASS ≠ API-suite PASS.** | **HOLD** |
| **G5** | After separate cleanup GO and immutable private-raw + Drive-redacted evidence/readback, match **each actual newly created DB** (up to 4) by cluster system ID, DB name/OID, owner, creation-by-this-run ledger and pre-drop check; only then consider approved teardown/privilege revocation/container/volume cleanup. Partial CREATE/teardown mismatch = **CLEANUP_HOLD**. Never guessed `DROP`, global `prune`, broad `down -v`, or host native PG cleanup. | **HOLD** |

**Roles:** G2 observer is genuinely read-only. G3-S1 login has `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS` and scoped `CREATE` on the disposable base DB (plus ownership of its dedicated schema). Ephemeral G3-S2 login may obtain `CREATEDB` only for the independently attested **empty disposable cluster**, own only the created S2a/S2b databases, and must not hold `SUPERUSER`, `CREATEROLE` or `pg_signal_backend`. SQL `DROP` is ownership-dependent, not a general grant; `CREATEDB` cannot be limited by naming prefix. Operator bootstrap superuser/secret must **never** enter A50 runner. Privileges and exact role memberships must be observed and independently checked before any G4 test, not assumed from labels.

**Action consent granularity:** separate signed A00/HQ, A20 and *named Windows operator* approvals for G0 source/image registry review, image pull, runner image build, G1 provisioning, physical PGDATA read, G2 observer SQL, G3-S1, **G3-S2a+S2b with explicit Drizzle force-push authority**, G4 one test and G5 exact-ID cleanup. A previous signature is no substitute; all signatures must bind the same immutable plan SHA, source SHA, cluster ID, resources, authorized actions and UTC expiry.

## 4. R2 STOP / rollback amendments

Immediate **STOP / HOLD** if any: (1) three-DB-only approval/plan/launcher remains; (2) fourth `tm_drizzle_schema_test_<32hex>` omitted or pre-existing; (3) either S2 test blob or dynamic SQL/0030/0031 omitted from source ledger; (4) `CREATEDB` applied to Windows/shared/foreign PostgreSQL; (5) `drizzle-kit push --force` points anywhere but certified S2b DB; (6) inherited or child DSN resolves outside attested namespace/owned DB; (7) `DROP DATABASE WITH (FORCE)` can reach a name without proven run-created ownership, including on partial CREATE failure; (8) PGDATA `system_identifier`/container/volume/endpoint drift; (9) Windows host `5432` listener/PID changes, published host port or foreign mount; (10) missing A00+A20+operator exact-phase signatures; (11) test runner unexpectedly writes outside permitted disposable tmpfs/scratch; (12) missing full TAP/native exit, unredacted Drive secret leak or unverified evidence retention.

On STOP: **do not run another test, reconnect to a guessed database, expand roles, retry forced push, automatically drop anything or run destructive cleanup**. Preserve redacted and operator-private receipts; mark `STOP_WRONG_INSTANCE`, `STOP_SQL_SCOPE_DRIFT`, `STOP_DRIZZLE_FORCE_TARGET`, `STOP_DB_OWNERSHIP_UNPROVEN`, `STOP_PRIVILEGE_DRIFT`, `STOP_EVIDENCE_INCOMPLETE` or `CLEANUP_HOLD`; notify A00, A20, A22, A23, A30 and A60. Recovery and any exact-resource disposal require a **fresh three-party G5 scope** and operator ownership proof.

## 5. Handoff and independent QA

- **A20** — formally replace three-DB G3-S2 description with S2a+S2b **4-DB** approvals, update permission/fixture/migration/cleanup design, reconcile A21 R23H canonical Compose (supersedes A20 R23G-R2 topology only), preserve historic artifacts.
- **A23** — independently validate four historical SHA256 against raw Google Drive file bytes and the immutable Git R2 addendum blob, source provenance and exact C01/S2b blob; avoid confusing Drive raw bytes with normalized Google Docs text.
- **A30** — review P0 privilege/force-drop/Drizzle child `DATABASE_URL`/force-push targets and false-cleanup-on-failed-CREATE risk; do not grant security PASS from this read-only design.
- **A60** — independently inspect A22's 36-entry ledger and S2b source, exact four-DB G3-S2 consent, unmodified test suite, physical proof and evidence model. **No PG16 runtime acceptance** absent actual G0–G5 receipts; DB-free 426/426 PASS is not this.
- **A50 (informational)** — future full-suite runner, launcher and diagnostic evidence must be re-specified against S2a+S2b before requesting any GO.

**Versioning rule:** the four R23H files are archival **v1**, this Markdown is a separately named **R23H-R2 corrective addendum**. A 3-database-only approval is void for this full C01 suite; do not modify prior approved/history files silently.

**Final documentary verdict:** `R23H_R2_READINESS_HANDOFF_COMPLETE` (documents and correction available). **Runtime:** `G0_G5_HOLD / SQL_01_P0_BLOCKED / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.
