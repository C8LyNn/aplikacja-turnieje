# WEB-005 — A24 / R23H-R3 — FIVE-CONTEXT READINESS ADDENDUM

**Task:** `WEB-005-T024-R23H-R3-READINESS-MATRIX-CORRECTION`  
**Owner:** A24 (PG16 Test Readiness), reporting to A20 (PostgreSQL Coordination V2)  
**Mode:** DOCUMENTATION ONLY / NO EXECUTION  
**Date:** 2026-10-17 Europe/Warsaw  
**Immutable C01 source:** `fa3261b2c9510e110ac9eba21726812d3401a525` / PR #60  
**Disposition:** `R23H_R3_READINESS_ADDENDUM_PUBLISHED` — **all G0–G5 gates HOLD; SQL-01 P0 BLOCKED; no release GO.**

This brief versioned correction accompanies the [final R3 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/b829968584d76ecc777c7d4c785748ba07036740/docs/web-005/agent-reports/A24/R23H-R3/R23H_R3_G0_G5_READINESS_FINAL.md) and does not overwrite the original [R23H v1 matrix](https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view) or [R2 addendum](https://github.com/C8LyNn/aplikacja-turnieje/blob/8c37da7dc562ac4ddd28d6fa9c58b6066b7d0b1d/docs/web-005/agent-reports/A24/R23H-R2/R23H_R2_READINESS_ADDENDUM.md). Four full R23H original MD files were already published to Drive and verified 4/4 byte-identical; no republishing is necessary.

## 1. Source authority and conflict resolution

- **A22 corrected authoritative SQL contract:** [`R23H_R2_FOUR_DB_SQL_CONTRACT.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/6ded14bd0ca685cff1e5fcb0d70a8dde8ca27551/docs/web-005/R23H_R2_FOUR_DB_SQL_CONTRACT.md), Git blob `9bcbd445e9583556207fa25ab8b93afa3eb42132`, published SHA256 `63cd2d4c636ef03fa35cef37f378f9dd4768bc69f9310aa046457bd0f560cdf2`; original [A22 SQL safety bundle](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view), SHA256 `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e`.
- **A50 R2 source/runner addendum:** [`R23H_R2_SQL_SCOPE_ADDENDUM.md`](https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view) SHA256 `5275243e0d9f2f87873b864b69377dcda45be4df604b49dd15010910d3be83b5`; complete [A50 package folder](https://drive.google.com/drive/folders/15dhDKUdahHodZias_s3LHnO8Ti61C2D3).
- **Resolution:** A22's immutable C01 semantics prevail where A24 R2 or A50 aspirational role models disagree. This is **source contract acceptance for drafting only**, not A20 security signoff, A60 independent QA or effective PG runtime verification.

## 2. Exactly five run-owned user database contexts

| Context | Source blob SHA-1 | Database / SQL | Readiness |
|---|---|---|---|
| **S1 base (one preprovisioned DB)** | `test-database.ts` `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | `web005_c01_test_<nonce>`, `tm_test_<nonce>` schema; `DROP SCHEMA ... CASCADE`, `CREATE SCHEMA`, migrations 0001–0028, additional test-invoked 0030/0031 and dynamic DDL; reset not atomic | HOLD |
| **S2-CATALOG dev** | `replit-schema-catalog-reconciliation.integration.test.ts` `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | `tm_catalog_test_<16hex>_dev`; CREATE, 0001–0010/0011 & fixture drift, DROP WITH FORCE | HOLD |
| **S2-CATALOG prod** | Same | `tm_catalog_test_<16hex>_prod`; same family | HOLD |
| **S2-CATALOG fresh** | Same | `tm_catalog_test_<16hex>_fresh`; same family | HOLD |
| **S2-DRIZZLE** | `drizzle-schema-diff.integration.test.ts` `e008dbd9fe287632252d3fcfda246f60e4cc35d3` | `tm_drizzle_schema_test_<32hex>`; CREATE, 0001–0020, fixture DDL, **two child invocations `drizzle-kit push --config ./drizzle.config.ts --force --verbose`**, DROP WITH FORCE | HOLD |

**Count is 1 S1 base DB + 4 dynamically created S2 DBs = up to 5 run-owned user DBs**, excluding PG-maintenance/template databases. Dynamic suffixes are generated inside the fixtures' `before()` hooks: preauthorization must bind **exact regex, count limit, source blob, approved cluster and event-level ownership proof**, not fabricated runtime names/OIDs. A22 confirmed some `after()` cleanup paths can execute `DROP DATABASE IF EXISTS ... WITH (FORCE)` when CREATE was not confirmed; lexical names alone are not proof of ownership.

## 3. Combined effective C01 credentials, separate S2 approvals

**Critical R2 correction:** unchanged C01 reuses `TEST_DATABASE_URL` credentials for S1, S2-CATALOG and S2-DRIZZLE. The independent S1 role `NOCREATEDB` plus separate S2 `CREATEDB` role described aspirationally in older A24/A50 design is **NOT IMPLEMENTED** by this exact source. A future unchanged-C01 run would require one non-superuser ephemeral principal:

`LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS` plus only needed `CONNECT` and database `CREATE` for S1, own freshly created S1 schema and four scratch DBs. No `pg_signal_backend`, broad memberships or PostgreSQL bootstrap superuser credential inside A50. `CREATEDB` is **cluster-wide** and cannot be restricted to database name patterns; only a **fresh, empty, physically attested, separately named Docker PostgreSQL 16 cluster**, zero foreign objects and strictly limited role lifetime can contain this scope. Actual grants, role and ownership receipts remain NOT_EXECUTED / HOLD.

**Separate approvals are about *operations*, not distinct role identities:**

| Approval | Required explicit coverage | Triple signature status |
|---|---|---|
| `G3_S1_SCHEMA` | Base DB+schema name and owner; `DROP SCHEMA CASCADE`, fixtures/migrations including test-specific DDL; acknowledge same shared `CREATEDB` principal | A00/HQ, A20, Windows operator: **all HOLD** |
| `G3_S2_CATALOG` | 3 created DBs matching `^tm_catalog_test_[a-f0-9]{16}_(dev|prod|fresh)$`; CREATE, fixture migrations/drift, built-in `DROP DATABASE ... WITH (FORCE)` during G4; child-only `SCHEMA_COMPARE_*` for owned DBs | All HOLD |
| `G3_S2_DRIZZLE_FORCE` | 1 DB matching `^tm_drizzle_schema_test_[a-f0-9]{32}$`; CREATE, two pinned `drizzle-kit push --force` child calls, verified child `DATABASE_URL` and SQL effects, built-in force-drop during G4 | All HOLD |

Every triple signature must bind exact C01 SHA/source test blobs, frozen plan SHA256, host/Docker context, original PGDATA physical `system_identifier`, volume/container identities, effective role, allowed writes/teardown, expiry and source of evidence. **Earlier 3-DB-only `G3_S2_GO` is INVALID for complete C01**. No G3 approval substitutes for an additional G4 execution GO.

## 4. Corrected G0–G5 phases and STOP overlay

| Phase | R3 required future evidence and authorization | Current |
|---|---|---|
| **G0** | Original 36 `*.integration.test.ts` inventory; exact source/tree/lock, both S2 blobs and Drizzle config/version; signed OCI platform manifest, Node base/runner produced image IDs/digests; distinct OCI-read / pull / build / attestation authorizations. | HOLD |
| **G1** | Fresh never-reused Docker project/container/PGDATA volume with zero host-exposed PG ports, new S1 base DB, temporary common `CREATEDB` principal; leave Windows `postgresql-x64-16` on 127.0.0.1 / ::1 port 5432 untouched. | HOLD |
| **G2** | Separate operator-only `pg_controldata` inspection of **Docker** PGDATA plus separately approved SQL observer, linking system ID to volume device/inode, container PID/netns, authenticated `127.0.0.1:55432` inside Option A network; actual roles/ACL, all DB preexistence; mere `pg_isready` is insufficient. | HOLD |
| **G3** | Three **distinct** scope records: S1 schema, S2-CATALOG, S2-DRIZZLE_FORCE; each independent triple A00/A20/operator GO with actual combined principal and full automatic fixture teardown permissions. | HOLD |
| **G4** | Fresh signed GO for **exactly once** `pnpm --filter @workspace/api-server run test:integration` (all 36 files), after G0–G3 independently PASS. Sealed launcher drops inherited `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*` and foreign `SCHEMA_COMPARE_*`, then injects only signed DSNs; allows S2 catalogue-generated child vars and Drizzle child `DATABASE_URL` only on owned DBs. A50 must finish `read_only:true` writable-path census. Save five-context CREATE/owner/OID/attempted-auto-DROP ledger, two Drizzle command/SQL-effect/exit receipts, native full TAP/true exit/first causal failure, raw private hashes, sanitized Drive remote byte readback. `G4_DIAGNOSTIC_EVIDENCE_PASS` **is not** `API_SUITE_PASS`. | HOLD |
| **G5** | **New** triple GO after evidence preserved, limited to genuinely *remaining* exact run-created DB objects, G1 containers/volume and specific credentials. Four S2 fixture `after()` drops are G4 mutations, never deferred into G5 authorizations. Match names+OIDs+owners+cluster ID+CREATE success proof; confirm negative post-state and unchanged host Windows PG. Ambiguous cleanup = `CLEANUP_HOLD`, not forced deletion. | HOLD |

**Updated STOP codes (in addition to unchanged historical policy):** `STOP_3DB_STALE_SCOPE`, `STOP_FALSE_SPLIT_ROLE_ASSUMPTION`, `STOP_CREATEDB_FOREIGN_CLUSTER`, `STOP_WRONG_PGDATA_SYSTEM_ID`, `STOP_DRIZZLE_FORCE_TARGET`, `STOP_DRIZZLE_SQL_EFFECTS_UNREVIEWED`, `STOP_PARTIAL_CREATE_AUTODROP`, `STOP_S2_COUNT_OR_OWNER`, `STOP_G4_FIVE_CONTEXT_FOOTPRINT_INCOMPLETE`, `STOP_G4_UNSEALED_ENV_OR_FS`, `STOP_G5_UNOWNED_CLEANUP`. On STOP, freeze progression; privately preserve evidence, notify A00/A20/A22/A23/A30/A50/A60, demand a new individually scoped approval. STOP does **not** itself authorize `docker stop`, `rm`, wildcard `prune`, guessed SQL DROP, retries or reset of Windows native PostgreSQL.

**Known unresolved safety limit:** because fixture-generated names are assigned before successful CREATE and teardown may still target them, source-only review cannot prove that every force-drop always targets a run-created database. If a pre-run protection/ownership design cannot enforce a safe outcome for original C01 without editing the source, **NO G4**, not a waiver.

## 5. Handoff and decision

- **A20** — formally align DB role/grants/S1/S2a/S2b destructive scope with A22 corrected contract; review feasibility of pre-run protection for failed CREATE cleanup; no 3-DB or fake split-role signature.
- **A23** — independent provenance/SHA review of A22 Git contract, A50 addendum, original four R23H full files, and this newly versioned addendum.
- **A30** — assess short-lived cluster-wide common `CREATEDB`, Drizzle child `--force` target, partial CREATE auto-force-drop, secret isolation and G5 evidence.
- **A60** — independent **DOC** review of exact C01, five DB contexts, three distinct G3 consents, complete G4 TAP/child log and G5 residual-only design. Source DOC_ACCEPT cannot equal runtime GO.
- **A00** — owner approval decisions only after all source/security issues resolved and each future action separately authorized; never implied by this publication.

**Final status:** `R23H_R3_READINESS_ADDENDUM_PUBLISHED / A20_A30_A60_REVIEW_PENDING / SQL_01_P0_BLOCKED / G0_G5_HOLD / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.
