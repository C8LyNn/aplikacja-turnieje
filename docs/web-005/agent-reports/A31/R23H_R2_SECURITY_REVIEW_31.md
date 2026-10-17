# WEB-005 - R23H-R2 / A31 - PG16 SECURITY REVIEW

**File:** R23H_R2_SECURITY_REVIEW_31.md  
**Author:** A31 - PG16 Security Review & SQL Isolation  
**Recipient (first):** A30 - Security Coordination V2. Further handoff to A00/A60 is A30's responsibility.  
**Date:** 2026-10-17 (Europe/Warsaw)  
**Target:** C8LyNn/aplikacja-turnieje, C01 exact Git SHA fa3261b2c9510e110ac9eba21726812d3401a525  
**Audit mode:** INDEPENDENT SOURCE AUDIT / READ-ONLY. No Docker, SQL, PostgreSQL, image pull, tests, migration execution or deployment. Only report publication is a repository write.  
**Verdict:** **P0 / BLOCKED / PG16_EXECUTION_NOT_AUTHORIZED / G0-G5 HOLD / C01_INTEGRATION_NO_GO / RELEASE_NO_GO**.

## 1. Evidence and provenance

- A21 authoritative package: https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view ; ZIP SHA256 8ce88f7f643799d3f66ba508e85476cf050adb050aae6564e2db63682060f8b2. Direct ZIP inspection established R23H_CANONICAL_COMPOSE.yaml SHA256 3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70 and three companion Markdown files. A21 design: https://drive.google.com/file/d/1hEVyZ3_TmnkhI9DgGvMrygUpmFMjb28d/view ; validation matrix: https://drive.google.com/file/d/1wOKwnoB6yv2MXJUJ3gzybYUu0KnbZZfS/view ; risk register: https://drive.google.com/file/d/1Xj0XSIPsY-zX1d0BW886mtBxMlTkPXvW/view .
- A22 SQL-safety package: https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view ; ZIP SHA256 dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e . Four Markdown reports inspected. R23H_SQL_SAFETY_VERDICT.md SHA256 425c5f4b5f16358d73346b99192aff9c0bc1ed3fadba17e9eeaa8d664f742be5 ; destructive scope SHA256 562b59f7c5f338cb9ec29e97702e3d2e470377a0e8ca6eee888438ec08db1a63 ; permission matrix SHA256 42fb896017c6b2baa9261250eb3bed17fb58cfd3895560d520feb134628b05d8 .
- Previous A30 R23H reconciliation: https://docs.google.com/document/d/13jZ7-O7MT4KN_TcxYx1vwsn3OOuqe5IS8zqeSrsr9mM/edit . Its prior absence-of-A21/A22 evidence finding is superseded as a document-discovery issue by the source packages above. Its runtime NO-GO remains valid. Its previous three-database S2 assumption is contradicted by C01 source.
- Independently fetched C01 source at exact supplied SHA (not a mutable default branch): S1 test-database.ts blob 31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6; S2a replit-schema-catalog-reconciliation.integration.test.ts blob 6c6bd054e0f6affd5d07e63ee396f5a14b423fc4; S2b drizzle-schema-diff.integration.test.ts blob e008dbd9fe287632252d3fcfda246f60e4cc35d3; runner run-tests.ts blob da4188446aba4696f97eb7831fee0cc5824d212f; test-discovery.ts blob dd427fdafa92c089e2edad704079d81945c4; DB module lib/db/src/index.ts blob 50cbf483d87a8a741f4965acde5edf6225fedd3e. A22 supplies the wider 36-test, migrations 0001-0031 inventory; A31 independently cross-checked these selected critical paths, not all transitive SQL statements.
- Source URLs: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-database.ts ; https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts ; https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/drizzle-schema-diff.integration.test.ts ; https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/run-tests.ts .

No E2 Compose parser, E3 OCI/runner provenance, E4 Docker runtime or E5 SQL authentication/execution proof was produced here. Local ZIP and static source hashes prove bytes only, not safe deployment or a real test PASS.

## 2. Confirmed destructive footprint

| Path | Target | Operation class | Source/authorization consequence |
|---|---|---|---|
| S1 common tests | Existing or generated schema tm_test_* in dedicated base test DB, default tm_test_access if not overridden | DROP SCHEMA IF EXISTS ... CASCADE; CREATE SCHEMA; replay 0001-0028; teardown CASCADE | Initial DROP precedes migration transaction; commit boundary before 0019; loss is not fully transaction-rollbackable; G3-S1 requires fresh exact schema and separate disposable database |
| S1 specialist migration test | Additional generated schema names based on the run schema, including _rollback and _marker_drift | DROP/CREATE SCHEMA and other DDL | S1 contract must explicitly include auxiliary schemas, not merely one schema name |
| S2a catalog reconciliation | 3 databases: tm_catalog_test_<16-hex>_dev, _prod, _fresh | CREATE DATABASE, migration/DDL/DML, DROP DATABASE IF EXISTS ... WITH (FORCE) | Must individually inventory creation, ownership, failures and authorized teardown |
| S2b Drizzle schema diff | 1 database: tm_drizzle_schema_test_<32-hex> | CREATE DATABASE, 0001-0020, DDL, TWO child invocations of drizzle-kit push --force --verbose, DROP DATABASE IF EXISTS ... WITH (FORCE) | Previously omitted fourth auxiliary database. Full API integration automatically discovers this test; requires explicit S2b approval |

The full API runner recursively discovers integration test filenames and invokes them at concurrency 1. A22 inventories 36. This does NOT make a test suite read-only. S2 needs cluster-level CREATEDB; this privilege is not name-prefix-scoped. Database owners retain ownership-based DROP capability even if CREATEDB is later revoked. A loopback DSN on a non-default port or a name containing test is not a physical cluster identity certificate. In S2 teardown, the name may be available even if an earlier CREATE failed: do not allow cleanup of names lacking a separately recorded successful create-and-own receipt.

## 3. P0 findings - mandatory hard blocks

| ID | Finding and security impact | Required closure / owner | Gate |
|---|---|---|---|
| P0-31-01 | **Four S2 databases, not three.** Prior S2 consent/permission inventories omit S2b and drizzle-kit push --force, risking unauthorized DDL on an unapproved target. | A20 amend canonical S2 permissions and four-DB runplan, A22 corroborate SQL map, A24 verify, A30 review, A60 accept. | G3-S2 / G4 |
| P0-31-02 | **Physical SQL target not attested.** TEST_DATABASE_URL guard and S2 localhost/non-5432 check do not establish Docker PGDATA identity or exclude Windows-native PostgreSQL. | A20+A24 obtain fresh PG system_identifier, container/image/volume IDs, net namespace and socket/mount certificate, prove no Windows native PG changes; A23 verify provenance. | G1 / G2 / G4 |
| P0-31-03 | **Irreversible S1 schema resets.** CASCADE may remove a preexisting schema/dependent objects, and reset spans multiple transactions. Auxiliary S1 schema names are not in the old single-schema contract. | G3-S1 limited own fresh DB/schema with exact nonce, existence/ownership checks and exhaustive auxiliary-name ledger; A20+A22+A24. | G3-S1 |
| P0-31-04 | **Broad CREATEDB and unsafe orphan cleanup.** S2 CREATE and FORCE DROP are cluster-scope capable; random database names are not ownership evidence. Cleanup may be attempted after CREATE failure. | Separate ephemeral S2 role, NOSUPERUSER/NOCREATEROLE/NOBYPASSRLS/NOREPLICATION, dedicated previously-empty cluster, positive created-by-this-run ledger for all four names, never delete uncertain names; A20+A24. | G3-S2 / G5 |
| P0-31-05 | **No sealed G4 launcher or inherited-environment defense.** The API runner inherits environment, DB module reads DATABASE_URL, S2b child propagates process.env then overrides DATABASE_URL. Env collision could aim at an unintended server. | A50 fail-closed allowlist, no inherited DATABASE_URL, TEST_DATABASE_URL, PG*, PGSERVICE, or foreign SCHEMA_COMPARE_*; inject generated DSNs only after signed G2 certificate, revalidate just before SQL. Fixture-generated S2a child SCHEMA_COMPARE_* values are allowed only for its attested scratch databases; A24+A60 review. | G4 |
| P0-31-06 | **Docker Option A verified only statically.** A21 YAML declares pg16 network_mode none, api-tests service:pg16, internal 127.0.0.1:55432, no host ports/networks/bind mounts, no runner PGDATA/admin secret. However Compose normalization, OCI provenance, correct network namespace and host port absence have no runtime attestation. Historical R23G host-published bridge version remains a governance hazard. | A00/A20 freeze A21 YAML hash and quarantine old variant. A23 attest OCI/Node/runner bytes; A24 parser and future runtime certificates; A60 verify negative overrides. | G0 / G1 / G2 |
| P0-31-07 | **Procedural GO is not an enforcing sandbox.** Unbuilt runner, unreviewed write paths, unsigned resolved runplan and resource preexistence checks make a destructive command unsafe even with an inert default Compose profile. | A00/A20/operator separate immutable phase approvals, exact config/image/source hashes, deny unknown overrides/entrypoints; A50 verified G4 launcher, A24 independent checks; A60 gatekeeper. | G0-G5 |

## 4. P1 findings - close or explicitly accept before relevant phase

| ID | Finding | Remediation |
|---|---|---|
| P1-31-01 | PostgreSQL bootstrap admin password file remains mounted for the container lifetime; bootstrap-only secret claim is incorrect. | A20/A30 approve rotation/unmount design or explicit ephemeral-cluster residual risk; never mount admin secret in runner. |
| P1-31-02 | Runner is read_only with /tmp tmpfs 256m; no source-derived transitive write-path census for pnpm/tsx/esbuild/logs/fixtures. | A50 inventory paths and whitelist minimal isolated scratch; do not make /workspace writable or disable read_only to bypass errors. |
| P1-31-03 | pg_isready checks availability, not SCRAM, effective pg_hba or physical identity. Official PG init temporary server and PGPORT must match 55432; image bootstrap behavior not executed. | A20/A24 verify fresh PGDATA, effective SCRAM, actual test-role negative/positive auth and server settings at G1/G2. |
| P1-31-04 | SQL surface exceeds basic reset: migration 0030/0031 special cases, 0029 present but not in standard reset, dynamic EXECUTE, triggers, DDL and DML from API code; two Drizzle forced pushes. | A22 freeze per-file migration and specialized DDL ledger; A50 secure runner coverage; A60 refuse claim of exhaustive runtime trace from static documentation. |
| P1-31-05 | Raw TAP, env snapshots, paths, passwords or DSNs could be exposed in Drive/issue logs; local Drive sync is not assured. | A23 redaction/negative canaries; publish only sanitized evidence with exact cloud-byte SHA and access-control check. |
| P1-31-06 | Per-run volume/project interpolated names do not prove creation or freshness; Docker context and host-level operator privileges can bypass isolation. | A24 require preexisting-resource rejection, context fingerprint and exact IDs; rerun G2 after restart/drift. |

## 5. P2 strengthening

- P2-31-01: independent least-privilege Docker Desktop operator, no Docker socket in runner, no host binds or privileged container; patch and version inventory.
- P2-31-02: resource quotas/connection limits, seccomp/capability controls and non-root PostgreSQL hardening only after compatibility evidence with the exact image/entrypoint.

## 6. Mandatory evidence to change verdict

| Gate | Minimum independent evidence required | Current |
|---|---|---|
| G0 | SHA-frozen runplan/Compose, complete C01 source/tree and test inventory, PG linux/amd64 OCI manifest, Node base and runner image digest, authorization signatures | HOLD |
| G1 | Signed exclusive Option A, fresh unique PGDATA, no existing project/volume, inspected actual HostConfig ports/network/mounts, Windows native PostgreSQL untouched | HOLD |
| G2 | Container/image/volume/namespace identity bound to PG system_identifier, listener 127.0.0.1:55432, SCRAM test auth, effective roles/ACL, negative host target proof | HOLD |
| G3-S1 | Explicit approval of disposable base DB, exact run schema and auxiliary schemas, preexistence/ownership checks, destructive scope including teardown | HOLD |
| G3-S2 | **FOUR** new own databases, exact names and create receipts, temporary CREATEDB, approved two force pushes and FORCE DROP scope, separate S2 consent | HOLD |
| G4 | Sealed launcher and env negative canaries, startup physical-cert recheck, complete runner write census, true full test exit and lossless private raw evidence | HOLD |
| G5 | Signed exact-ID cleanup ledger, quarantine for missing create receipts, postrun no-orphan inventory, sanitized remote evidence readback and SHA/ACL verification | HOLD |

## 7. Decision for A30 - FIRST HANDOFF

**Security conclusion: BLOCKED.** Source inspection supports A21's no-host-port topology as a safer design, not a proven Docker runtime barrier. The A22 four-database discovery is a material P0 correction to earlier three-database authorization. The S1 CASCADE, S2 CREATEDB/FORCE DROP and Drizzle force-push paths are prohibited from execution until independently certified physical isolation and source-bound phase approvals exist.

**Immediate A30 action:** consolidate P0-31-01 through P0-31-07; send A20 the four-DB/G3-S2 amendment request, A24 the G1/G2 certificate and G3 ledger requirements, A50 the sealed-launcher/write-census request, A23 the immutable hashes and evidence controls. A30, not A31, transmits consolidated conclusions to A00/A60. Do not grant G0-G5 GO on this report.

**No Docker/SQL/test/deployment performed; no games or application code modified.**
