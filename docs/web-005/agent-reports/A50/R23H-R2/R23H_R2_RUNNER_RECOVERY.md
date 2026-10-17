# WEB-005 — A50 / R23H-R2 — RUNNER ARTIFACT RECOVERY

**Task:** `WEB-005-T050-R23H-R2-RUNNER-RECOVERY`  
**Date:** 2026-10-17 (Europe/Warsaw)  
**Agent:** A50 — Isolated Test Execution & QA Infrastructure  
**Mode:** SOURCE / DOCUMENTATION ONLY · **runtime:** NOT_EXECUTED  
**Immutable C01 source:** `C8LyNn/aplikacja-turnieje`, PR #60, exact SHA `fa3261b2c9510e110ac9eba21726812d3401a525`  
**Decision:** `RUNNER_ARTIFACT_RECOVERY_VERIFIED / DESIGN_ONLY / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.

## 1. Recovery vs. duplicate reconstruction

This task **recovers and re-verifies existing R23H originals**; it does not re-create their contents or grant runtime execution. The earlier handoff has already published them. The original local ZIP was opened, CRC validated (`testzip() -> None`), and all five original document bodies checked byte-for-byte against the embedded SHA256 manifest (5/5 PASS); the manifest itself is the sixth original artifact.

- **Primary shared Drive folder:** https://drive.google.com/drive/folders/15dhDKUdahHodZias_s3LHnO8Ti61C2D3
- **Documentation-only GitHub branch and folder:** https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2
- **Original R23H ZIP (six files):** https://drive.google.com/file/d/1paKE0NwPD7v9GDbdZ2ohjoyfuvoPPr6N/view ; `SHA256 671928e46ff11aebf1fcfefb07dd727f61eeccfb3fcbe81f4769c80fe10646cd` (20,285 bytes)
- **Previous full R23H-R2 handoff ZIP:** https://drive.google.com/file/d/18itz4ESZICw5KNfa6kD2IebuWtq0u4aX/view ; `SHA256 21f1fcee02e1c7e9dc0b9f519231ba85cc3c76e4ef5ec17d31dcb8936f7e7c7b` (31,641 bytes)
- **Previous additive SQL addendum:** https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view ; `SHA256 5275243e0d9f2f87873b864b69377dcda45be4df604b49dd15010910d3be83b5`
- **Previous R23H-R2 handoff:** https://drive.google.com/file/d/17vf6Y8pTIIrw64757edwPyuZ9Hd247tE/view ; `SHA256 8ba7311e565b082845786bfc1d59db99e09e2099ae05ed863f77d58c2b103598`

### Per-file provenance and verified raw cloud SHA256

The five original Markdown files were re-fetched as **raw bytes from Google Drive in this recovery task**. Their SHA256 values below matched the bytes in the original ZIP. The original `MANIFEST_SHA256.json` is byte-identically available in GitHub and in the original ZIP; its independent single-file Drive publication is tracked separately, rather than falsely claiming it was among the five earlier Markdown uploads.

| Original file | SHA256 of exact UTF-8 bytes | Published independent link | This task raw cloud check |
|---|---|---|---|
| `R23H_NODE_RUNNER_SPEC.md` | `e5e6a0afd3d7b60e07c6bbbbb536978b0fe28abca1a29f79cab547ae86041837` | https://drive.google.com/file/d/12snjBHsmZi3GPG-FOimqRaQXI_pyRDsj/view | MATCH |
| `R23H_RUNNER_WRITE_PATH_AUDIT.md` | `20a88487995c6a73427f16e31871f7e67e3fb11d8f270914a0b220f7e3ea3cbb` | https://drive.google.com/file/d/16zl0Cwb_rYuEcxxniDt1sXuzGLsuKU_O/view | MATCH |
| `R23H_FAIL_CLOSED_LAUNCHER_DESIGN.md` | `2e42697c027d53c96aa5352315c02a4537fe8b43975cf2c68626f71af9a7a33a` | https://drive.google.com/file/d/1YyJV5wfVeszPzffbEV2vp2OVq77YpdZt/view | MATCH |
| `R23H_DIAGNOSTIC_EVIDENCE_CONTRACT.md` | `846be2adf20d6c4844a1882509cd364431cb96858aa18a8b517efe62a5b2bf1f` | https://drive.google.com/file/d/14CX3uxz7NONpPAlkz6-KIbHsP1UPg7ZO/view | MATCH |
| `README_PL.md` | `dcf2accb5b7a60a0b52f6daf127bf5ebd835658dd3ba0225995dbc4eecff2c6e` | https://drive.google.com/file/d/1TSFyxg6ofLaJQ61TPvd7JRsDJ21qsoKX/view | MATCH |
| `MANIFEST_SHA256.json` | `dcb747a2cdb5769d93d3d775f1861d3a49bc2edfbf0ccbdc5c3def37834f2a78` | https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/MANIFEST_SHA256.json | Original ZIP bytes + Git blob matched in prior handoff |

Additional re-fetched cloud files: additive SQL addendum, old R23H-R2 handoff, original ZIP, previous complete ZIP — all **4/4 raw SHA256 MATCH** in this recovery. Thus **9/9 raw Google Drive objects sampled and re-hashed MATCH**; the separate original manifest is the tenth logical source asset, provided through GitHub and original ZIP rather than counted as a standalone Drive download. Windows `G:` client mirror synchronization is **NOT_VERIFIED**; remote cloud byte integrity does not attest the local drive letter.

## 2. Corrected SQL test scope — SQL-01 P0

A22 reported an omission in R23G's original three-DB design; A50 directly corroborated it at immutable C01 source. The **four dynamically created S2 databases** are **additional to** the independently provisioned **one S1 base test database** (`web005_c01_test_<nonce>`), i.e. **up to five run-owned user databases**. This does not include built-in PostgreSQL maintenance/template databases.

| Logical scope | Exact C01 fixture | Future database / schema | Observed source behavior | Admission |
|---|---|---|---|---|
| S1 | `test-database.ts` Git blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | base `web005_c01_test_<nonce>`, `tm_test_<nonce>` | `DROP/CREATE SCHEMA` incl. CASCADE; test migrations 0001–0028; teardown | separate G3-S1 GO |
| S2/catalog | `replit-schema-catalog-reconciliation.integration.test.ts` blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | `tm_catalog_test_<16hex>_dev`, `_prod`, `_fresh` | 3× `CREATE DATABASE`, fixture SQL, 3× `DROP DATABASE WITH (FORCE)` | separate S2/catalog signed scope |
| S2/Drizzle | `drizzle-schema-diff.integration.test.ts` blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3` | `tm_drizzle_schema_test_<32hex>` | 1× `CREATE DATABASE`, replay migrations, `node .../drizzle-kit/bin.cjs push --config ./drizzle.config.ts --force --verbose`, own `DROP DATABASE WITH (FORCE)` | **distinct S2/Drizzle/force signed scope** |

The Drizzle fixture sets its own `DATABASE_URL` for the disposable scratch DB **inside a child process**, using `env:{...process.env,DATABASE_URL:testConnectionString}`. This makes inherited parent environment variables a critical trust boundary. The catalogue fixture similarly generates its own `SCHEMA_COMPARE_*` child variables for the three disposable databases. The launcher must reject **untrusted inherited** DSNs and libpq/`PG*` connection override variables while allowing only those **reviewed, source-generated child exceptions**.

Exact C01 `lib/db/drizzle.config.ts` (blob `952a37a5ea123a0948cdaea68be0ee4986828fa9`) contains restrictive `tablesFilter` and `schemaFilter`, but this **cannot establish the actual `drizzle-kit push --force` SQL effect**. It is not valid to declare `FORCE_NOOP`, harmlessness, API PASS or root cause identification without independent A22 review of the pinned package/lock and actual effective DDL against the isolated fixture. Its complete SQL write contract is **PENDING**.

## 3. Launcher, authority, environment, writes, cleanup: no runtime PASS

**Fail-closed launcher design (NOT IMPLEMENTED/NOT EXECUTED):** require full C01 commit/tree/clean checkout, `pnpm-lock.yaml` SHA256 `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef` (historical prior receipt, future revalidation PENDING), immutable Node22/pnpm10 base and built image digest (PENDING), current G1 PGDATA cluster/system ID and network namespace/certs (PENDING), exact complete recursive `*.integration.test.ts` inventory including both S2 fixtures, fresh separate G3-S1, S2/catalog and S2/Drizzle+force triple approvals, and G4 triple approval. Reject mismatches/expired approval/foreign volume. A JSON true flag or URL is **not** independently authenticated approval.

**Permissions:** `CREATEDB` is a cluster-wide role attribute, not a grant limited by DB-name prefix. Accept it only for a freshly certified **empty disposable PG16 cluster**, for a time-limited non-superuser runner role lacking `CREATEROLE`, `BYPASSRLS` and replication. Neither a `tm_test_*` name nor localhost/non-5432 alone proves safe physical identity. Bootstrap superuser password must never reach runner or cloud log. Exact allowed changes must include S1 and **all four** S2 databases and Drizzle force scope; no unreviewed `DROP public` scripts.

**Write-path census:** `read_only:true` plus approved `/tmp` tmpfs is only an **unverified design**. `drizzle-kit` and transitive packages may write temporary files, cache under XDG/HOME, `node_modules` directories, workspace outputs or child-generated logs. The full source-derived and dynamic runtime census, cache redirection, UID/write permissions and tmpfs capacity are **PENDING**. Preserve `read_only:true`, prohibit host/production bind mounts, deny silent writable `/workspace` or global system changes. Unknown write => `STOP_RUNNER_FILESYSTEM_WRITES` prior to G4.

**Diagnostic evidence:** keep original raw stdout/stderr and unmodified TAP locally in **non-synced restricted scratch**, capture true process exit/signal and first real Node TAP `not ok` or earliest uncaught exception; classify deliberate negative-test PG errors separately from failing assertions. For Drizzle child specifically record sanitized argv/cwd, resolved actual target identity, child exit if captured, and effects ledger. Only leak-screened/redacted reports with distinct published-bytes SHA256 may go to Drive; remote byte readback before `CLOUD_STORED`. Real API integration result and first CI failure remain `UNKNOWN / NOT_EXECUTED`.

**G4 fixture-internal cleanup vs. G5 external cleanup:** G3 scopes must expressly approve test hooks that `DROP SCHEMA` and `DROP DATABASE ... WITH (FORCE)` **during G4**. Later manual G5 requires a separate three-party exact-object permission against actual S1 base/schema and all four S2 names/OIDs/owners plus container/volume/PGDATA IDs. Partial Drizzle/catalog teardown can leave orphans: inventory, preserve evidence, `CLEANUP_HOLD`; **never** use wildcards, `docker prune`, ambiguous `compose down -v`, assumed prefix ownership, SQL resets on Windows PostgreSQL or any automatic retry.

## 4. Explicit states and ownership for next review

| Domain | Current state | Next independent owner action |
|---|---|---|
| Previously published R23H document SHA256 | **PASS** (local ZIP 5/5; raw Drive 9/9; Git manifest) | A23 independent integrity/provenance review |
| SQL four S2 DB presence and Drizzle force command in exact source | **SOURCE_VERIFIED** | A22/A20 examine actual Drizzle package+DDL and approve/reject expanded contracts |
| Four-DB SQL rights/physical safety | **PENDING / NO_GO** | A20 + A22 + A30/31 signed safety review |
| Exact-SHA future Linux runner / environment | **DESIGN_ONLY / PENDING** | A50 source-only implementation review; A24 preflight criteria |
| Node base/runner OCI digests and generated build | **PENDING / NOT_EXECUTED** | G0 approval before any pull/build |
| Writable path census, `read_only` and tmpfs behavior | **PENDING / NOT_EXECUTED** | A50/A24/A60 future independent testing only after authorization |
| Real S1/S2 roles, G0–G5 triple GO, physical PG16 certificate | **PENDING / HOLD** | A00/HQ + A20 + operator, individually for each phase |
| Full C01 API integration G4, TAP, first failure, G5 cleanup | **NOT_EXECUTED / UNKNOWN** | A50 after authorized gates; independent A60 review |
| Windows G: mirrored bytes vs Drive cloud | **NOT_VERIFIED** | operator compares two byte SHA256 values |

**No Dockerfile build, image pull, Docker/Compose invocation, SQL, migrations, tests, schema push, cleanup, file/source/game edits, CI, merge or live deployment were performed.** Files created are documentation and integrity receipts only. Existing C01 and earlier R23H originals were not modified.

## 5. Distribution / coordination

Send this recovery report + primary folder and SHA256 evidence to **A20 (coordination)**, **A23 (evidence/integrity)**, **A24 (readiness)**, **A30 (security)** and **A60 (independent QA)**; A00 remains the owner of release gates. GitHub Issue #73 (central/A00 and evidence), Issue #76 (PG/security/readiness), Issue #77 (independent QA) are shared routing locations; issue comments are *cross-agent dispatch records*, not proof a different ChatGPT thread has consumed the document. **Acknowledgments: PENDING until expressly confirmed.**

**Final:** `A50_R23H_R2_RUNNER_RECOVERY_SOURCE_VERIFIED / DESIGN_ONLY / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
