# WEB-005 — A50 / R23H-R2 — RUNNER PACKAGE PUBLICATION & HANDOFF

**Task:** `WEB-005-T050-R23H-R2-RUNNER-PUBLICATION`  
**Date:** 2026-10-17 Europe/Warsaw  
**Mode:** ARTIFACT RECOVERY / SOURCE ONLY / NO DOCKER / NO SQL / NO TEST  
**Immutable test source:** `C8LyNn/aplikacja-turnieje` PR #60 commit `fa3261b2c9510e110ac9eba21726812d3401a525` — **NOT MODIFIED**.  
**Scope:** publishes original R23H source artifacts byte-for-byte, adds a separately versioned SQL scope addendum, does not authorize G0–G5.

## 1. Publication and recovery proof

**Google Drive publication folder:** https://drive.google.com/drive/folders/15dhDKUdahHodZias_s3LHnO8Ti61C2D3  
**GitHub documentation-only branch:** `docs/web005-a50-r23h-r2-runner-publication`, derived from `chore/web-005/t000-wave1-control` — does not modify C01 commit, tests, CI or gameplay.  
**GitHub docs folder:** https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2

Six **original** recovered artifacts from the original `WEB005_A50_R23H_NODE_RUNNER_DESIGN.zip` (no rewrites):

| Original file | SHA256 of original exact bytes | Independently fetched published Git blob SHA-1 (matches locally calculated Git blob) | Direct GitHub |
|---|---|---|---|
| `R23H_NODE_RUNNER_SPEC.md` | `e5e6a0afd3d7b60e07c6bbbbb536978b0fe28abca1a29f79cab547ae86041837` | `9c19b84e82e060b04fd739080bd8cf307f359685` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/R23H_NODE_RUNNER_SPEC.md) |
| `R23H_RUNNER_WRITE_PATH_AUDIT.md` | `20a88487995c6a73427f16e31871f7e67e3fb11d8f270914a0b220f7e3ea3cbb` | `b169d41eefa59e735a7975c68bee803f56e6a0c1` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/R23H_RUNNER_WRITE_PATH_AUDIT.md) |
| `R23H_FAIL_CLOSED_LAUNCHER_DESIGN.md` | `2e42697c027d53c96aa5352315c02a4537fe8b43975cf2c68626f71af9a7a33a` | `48277b42eca932c1e589b9587759bd7fab238050` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/R23H_FAIL_CLOSED_LAUNCHER_DESIGN.md) |
| `R23H_DIAGNOSTIC_EVIDENCE_CONTRACT.md` | `846be2adf20d6c4844a1882509cd364431cb96858aa18a8b517efe62a5b2bf1f` | `dca6f46efc3012d131b62f543f223658a249ec60` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/R23H_DIAGNOSTIC_EVIDENCE_CONTRACT.md) |
| `README_PL.md` | `dcf2accb5b7a60a0b52f6daf127bf5ebd835658dd3ba0225995dbc4eecff2c6e` | `0f16bbf93f6f9faa6c973e156846b2a9db758639` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/README_PL.md) |
| `MANIFEST_SHA256.json` | `dcb747a2cdb5769d93d3d775f1861d3a49bc2edfbf0ccbdc5c3def37834f2a78` | `d6abcd5a931d39f15c697d470fa02ca0025ae7cc` | [Source](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/MANIFEST_SHA256.json) |

**Original ZIP, present on Drive:** https://drive.google.com/file/d/1paKE0NwPD7v9GDbdZ2ohjoyfuvoPPr6N/view ; SHA256 `671928e46ff11aebf1fcfefb07dd727f61eeccfb3fcbe81f4769c80fe10646cd`; 6 ZIP members, original manifest covers five documents. Local original ZIP CRC and 5/5 manifest file SHA256 **PASS**. Published Git blobs fetched from branch and compared to local expected original Git blobs **6/6 MATCH**, constituting cryptographic proof that published Git contents have the stated original SHA256. Google Drive individual Markdown/ZIP copies were successfully uploaded. After publication, all **eight raw Drive files** (five original Markdown documents, additive SQL addendum, handoff report, original ZIP) were independently **downloaded as raw base64 bytes, decoded and SHA256-hashed; 8/8 MATCH** against local originals. The original JSON manifest was not separately uploaded to Drive, but is byte-verifiably published in GitHub and remains inside the independently checked original Drive ZIP. Windows G: sync remains `PENDING` (cloud remote proof is not Windows mount proof).

## 2. New, additive SQL-01 addendum — four dynamically generated databases

**New file:** [`R23H_R2_SQL_SCOPE_ADDENDUM.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2/R23H_R2_SQL_SCOPE_ADDENDUM.md), SHA256 of source bytes `5275243e0d9f2f87873b864b69377dcda45be4df604b49dd15010910d3be83b5`; [Drive copy](https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view).

**Material correction:** four dynamic DBs **plus a separately provisioned S1 base DB** (thus *up to five run-owned user DBs* besides system databases). The four are 3 × `tm_catalog_test_<16hex>_{dev,prod,fresh}` (`replit-schema-catalog-reconciliation.integration.test.ts`, blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`) plus **1 × `tm_drizzle_schema_test_<32hex>`** (`drizzle-schema-diff.integration.test.ts`, blob `e008dbd9fe287632252d3fcfda246f60e4cc35d3`). Fourth fixture creates and force-drops its own database and invokes `node <drizzle-kit/bin.cjs> push --config ./drizzle.config.ts --force --verbose` with child-only `DATABASE_URL` set to that disposable database. Child inherits other `process.env` fields, so launcher must cleanse parent env. This fourth DB and force command were verified by actual exact-C01 GitHub source reads.

**Additional config nuance verified:** exact C01 `lib/db/drizzle.config.ts` Git blob `952a37a5ea123a0948cdaea68be0ee4986828fa9` declares `tablesFilter:["__replit_push_manages_no_tables__"]`, `schemaFilter:["information_schema"]`, and intentionally avoids Drizzle-managed public tables to mitigate false-positive DDL. This *source guard is positive*, but it **does not prove zero SQL writes** for the pinned installed `drizzle-kit` at runtime or certify the isolation of the target. Actual generated DDL, installed Drizzle binary and effective connection/permissions are **PENDING A22/A20**. Do not describe the force call as proven destructive on the current exact fixture, nor as harmless.

**Scope change required before any GO:** G3-S2 must separately enumerate/approve all 3 catalog DBs and 1 Drizzle DB plus actual `--force` effects, short-lived `CREATEDB` rights, fixture internal teardown; G4 must include entire unmodified suite; G5 must inventory all four DB names/OIDs/owners and base DB/schema independently. Previous R23G three-DB grants, if ever issued, would **not** cover the fourth. Current approvals **NONE**.

## 3. Launcher, permissions, write paths, cleanup — evidence and PENDING gates

| Item | Source/design state | Execution proof |
|---|---|---|
| C01 exact SHA, original source docs and manifest | SHA/Google branch 6/6 verified; C01 fixture fourth DB + command verified | Actual future checkout Git tree/test inventory: **PENDING** |
| Node 22/pnpm 10, Dockerfile and digest-pinned images | Node22.23.3/pnpm10.34.7 design; base digest **PENDING**; runner digest **PENDING** | Image build + OCI verification: **NOT_EXECUTED** |
| PG physical/no-host-ports namespace and source of truth | Canonical A21 Option A must be reviewed/signed; native Windows 5432 untouched | Docker/PG runtime attestation: **NOT_EXECUTED** |
| SQL authority | S1 schema drop/create/SQL migration; S2 catalog 3 DBs and Drizzle 1 DB incl `--force` | A22 full SQL/Drizzle effect review and A20 + A00 + operator distinct GO: **PENDING** |
| Launcher env/DSNs | Clear inherited `DATABASE_URL`, all `PG*`/libpq overrides, inherited `SCHEMA_COMPARE_*`; approved per-child Drizzle/S2-generated DSNs only | Fail-closed implementation + negative tests **PENDING**, no G4 permission |
| `read_only`, `tmpfs`, cache and write-path census | C01 runner sources and new Drizzle exec paths documented; missing transitive dependency/dynamic writes | Full census/dynamic evidence **PENDING**; no writable host bind, no fallback `read_only:false` |
| TAP/exit/stdout/stderr | Original design captures first real `not ok`, full Node TAP counts, process tree true exit/signal, private raw vs sanitized cloud hashes; new Drizzle child argv/cwd/exit/target evidence added | G4 **NOT_EXECUTED**; first failed API test remains **UNKNOWN** |
| Cleanup | G4 fixture-owned schema+four DB teardown individually scoped; later independent G5 owns extra exact-resource cleanup; manual-only exact ownership | Actual DB footprint/IDs/cleanup/remote readback **PENDING** |
| Independent acceptance | A23 provenance, A24 readiness, A30 updated security, A60 independent review required | All **PENDING**, no DB certification |

**Important:** The original A50 R23H write-path census was a *design catalogue*, not an exhaustive runtime/transitive filesystem audit. The Drizzle executable may access tmpfs, XDG cache or `/workspace/lib/db`; fail closed on unapproved file writes rather than weakening `read_only`. Strictly prohibit inherited host database credentials and any user/production mount. Approvals cannot be self-authenticated merely by providing URLs or JSON booleans; independent verification of signer, expiration, source SHA and exact physical resource certificate is required.

## 4. Addendum-specific operator/agent requests

- **A20 (DB architecture):** expand physical identity+privileges/retention contract to base DB + 4 dynamic S2 DBs; sign separate `G3_S2_DRIZZLE_FORCE` destructive scope only after verified SQL effect inventory; maintain G0–G5 HOLD until new approvals.
- **A23 (evidence/integrity):** independently recompute original Git blob+SHA256 6/6 and new addendum SHA; verify cloud Drive raw byte readback separately; ensure fourth DB, Drizzle child and additional force cleanup in provenance chain.
- **A24 (readiness):** mark previous three-DB G3-S2/G4/G5 readiness incomplete; add fresh STOP code `STOP_UNREVIEWED_DRIZZLE_FORCE`; no readiness GO from this document.
- **A30 (security):** update previous R23H security review on new SQL-01 P0, inherited Drizzle child env, `--force` bypass of interactive checks, and positive `drizzle.config.ts` filter as *intent not execution proof*.
- **A60 (independent QA):** inspect exact fourth fixture, pinned `drizzle.config.ts` and package lock; verify six published Git blobs and addendum, re-evaluate source-level acceptance. Runtime G0–G5 remain NOT_EXECUTED; no PG acceptance.

**Index publication truth:** Six immutable original GitHub source files were directly fetched and their Git blob digests matched the local original exactly; all eight individually published Drive raw assets (excluding separate JSON manifest, which is inside the ZIP/GitHub) were independently re-fetched and SHA256-verified **8/8 MATCH**; Windows G: client sync remains `PENDING` until host operator compares local and cloud hashes. No user data, test, Docker, PG, SQL, schema push, cleanup, CI, production, games, Unity, Replit or merge were touched by this task.

**Deliverable status:** `R23H_R2_RUNNER_ARTIFACTS_PUBLISHED_SOURCE_VERIFIED / SQL01_FOUR_DB_SCOPE_ADDENDUM_READY / A50_DESIGN_READY / A60_REVIEW_PENDING / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
