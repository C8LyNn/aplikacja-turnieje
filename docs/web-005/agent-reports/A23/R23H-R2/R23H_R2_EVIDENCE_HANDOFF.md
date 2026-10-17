# WEB-005 — A23 / R23H-R2 — Evidence Handoff

**Task:** `WEB-005-T023-R23H-R2-EVIDENCE-HANDOFF`  
**Date:** 2026-10-17 (Europe/Warsaw)  
**Priority:** P0  
**Mode:** EVIDENCE RECOVERY / DOCUMENTATION ONLY; no Docker, SQL, test, deployment, source edits, or removal of historical documents.  
**Recipients:** A00 / Implementation Lead; A20 / PG16 Coordination; A60 / Independent QA.  
**Handoff status:** `A23_HANDOFF_PUBLISHED`. **Technical acceptance:** `BLOCKED / PG16_EXECUTION_HOLD / G0_G5_HOLD / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.

## 1. Recovered and republished A23 source of truth

**Published document branch:** `docs/web-005/a23-r23h-r2-evidence-publication-20261017`, isolated documentation branch, **not merged**.  
**GitHub directory:** https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2

| A23 artifact | SHA-256 exact original bytes | Verified Git blob SHA-1 | Direct location |
|---|---|---|---|
| R23H_CANONICAL_ARTIFACT_REGISTRY.md | `a171f3a1a8d7691de76bfa9b5f08d72d1d422b416f4ffa89d7206409bc342bf3` | `f14fb7a905ac75486f7026a335c409986ac99f4c` | [Registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_CANONICAL_ARTIFACT_REGISTRY.md) |
| R23H_SHA256SUMS.md | `2af627857dd17178a464d7079ec7fed37ef0194d24ccdbddbee82d7c1eb1530f` | `2d508e6956dc22d4e0d5424b718503b947b5802a` | [SHA256SUMS](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_SHA256SUMS.md) |
| R23H_PROVENANCE_AUDIT.md | `fe0857e690a1eef62f9ae584108b9c5fc1cce10aa54a584af29e3080c1c58979` | `1165f2c15df581daff613f1b948df99262cbd480` | [Provenance audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_PROVENANCE_AUDIT.md) |
| R23H_SUPERSEDED_DOCUMENTS.md | `67db7561f0f7a4016ac0b473cbb78d242888f84ade093fb292c5b349dbe56409` | `9f0a67f5a4fb552a9624372d50ed7512eba46e45` | [SUPERSEDED inventory](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_SUPERSEDED_DOCUMENTS.md) |
| R23H_A23_BUNDLE_SHA256SUMS.txt | `1008d351d5b3e260829f3ab6f1daf5ce5412786f3fa67a772c9f81889489eb21` | `bb3dd6d53c6019bb74e1fed8bf96ef1d30f343ec` | [Bundle checksums](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_A23_BUNDLE_SHA256SUMS.txt) |
| R23H_R2_EVIDENCE_PUBLICATION_RECEIPT.md | `72c0905b07d8da16c0f1cbcb09a50704ebf0ac8dd8c13fca13c273ef3088d301` | `4331cdb69953001c96183ac5fb694f479377f7e3` | [Prior publication receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_R2_EVIDENCE_PUBLICATION_RECEIPT.md) |

**Verification scope:** All six paths have been successfully refetched from GitHub during this handoff. The prior publication receipt and original recovered files prove 5/5 exact source text/byte agreement. Original conversation ZIP `WEB-005_R23H_A23_EVIDENCE_AUDIT.zip` SHA-256 `0384c32bcf802f4f6bd7f64f02c5d4075254aea6b4ce767a52af54534a106c34` is **conversation-only** (not a public Drive/GitHub ZIP). Do not claim that the ZIP was uploaded.

## 2. Unified evidence index — A20–A24, A30–A31 and A50

**Status definitions:** `RAW_SHA_VERIFIED` = exact bytes were hashed by A23/previous independent receipt. `SOURCE_PRESENT` = link was fetched, SHA may still be reported-only. `CLAIMED_SHA_UNVERIFIED` = digest appears in author report, not independently verified here. `MISSING` = required source not discovered, not proof of nonexistence.

| Agent | Primary evidence and canonical reference | Integrity status and pending item |
|---|---|---|
| **A20 — Coordination** | [R23H_STATUS_AND_HANDOFF_TO_00.md](https://drive.google.com/file/d/1i9tzQtJ3q34Mm0Lv2_7iMYZxi0PtQU1V/view); [A20 R23G-R2 source snapshot](https://github.com/C8LyNn/aplikacja-turnieje/tree/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2); [Drive R23G-R2](https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq) | `SOURCE_PRESENT`. Baseline 11/11 Git UTF-8 SHA-256, blob and Google Docs **logical text** verified by prior A23; A20 18:32 report says `R23H_DOCUMENTATION_PARTIAL`. A20's earlier S2 three-DB scope is `SUPERSEDED_FOR_SQL_SCOPE` by A22 P0 and A50 R2 addendum. New four-DB physical/grants/teardown contract still requires acceptance. |
| **A21 — Docker & Isolation** | [R23H folder](https://drive.google.com/drive/folders/1OxD-jC4lzibQ69F7C9vhIRbF3ifgx5KH); [A21 original package ZIP](https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view); [canonical design](https://drive.google.com/file/d/1hEVyZ3_TmnkhI9DgGvMrygUpmFMjb28d/view) | `RAW_SHA_VERIFIED` original ZIP `8ce88f7f643799d3f66ba508e85476cf050adb050aae6564e2db63682060f8b2`; proposed `R23H_CANONICAL_COMPOSE.yaml` SHA-256 `3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70` as independently verified in A20 receipt. Option A only; `DESIGN_READY / NOT_EXECUTED`. |
| **A22 — SQL & Migration Safety** | [R23H SQL Safety ZIP](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view) | `RAW_SHA_VERIFIED` ZIP `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e`; member `R23H_SQL_SAFETY_VERDICT.md` SHA-256 `425c5f4b5f16358d73346b99192aff9c0bc1ed3fadba17e9eeaa8d664f742be5` (prior A20 independent calculation). `BLOCKED / SQL-01 P0` — fourth fixture DB `tm_drizzle_schema_test_*`, `drizzle-kit push --force`; no SQL execution approval. Later corrected SQL contract R23H-R2 full source/hash `NOT_INDEPENDENTLY_VERIFIED`. |
| **A23 — Evidence & Integrity** | [This handoff directory](https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2) and six linked documents above | `PUBLISHED_GITHUB` with original checksums and blobs; full new handoff checksum should be established by GitHub readback. Original ZIP remains conversation-only. |
| **A24 — PG16 Readiness** | [GitHub dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a24-r23h-readiness-20261017/docs/web-005/agent-reports/A24/R23H/R23H_A24_HANDOFF_DISPATCH.md) (blob `74dba2c46ccef87bb3691cbefbdf1cd99df2f6b2`); now published individual Drive raw files: [readiness matrix](https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view), [approval template](https://drive.google.com/file/d/12-jnMC_TeweZkDTDDRXlJJE4pnbbaTjW/view), [STOP conditions](https://drive.google.com/file/d/1DI76OgEAZ0Sx0R4K2gJkEBUt25JUgn8u/view), [A50 handoff contract](https://drive.google.com/file/d/1iHTGPVWqsVW5Nu-nNz_f1DqRxTB347OG/view) | `SOURCE_PRESENT / FOUR_RAW_FILES_NOW_DISCOVERED`. Four SHA-256 values `7abccfb8...`, `d0d56751...`, `62c2a973...`, `31fdbe57...` remain **CLAIMED_SHA_UNVERIFIED by A23** until raw remote byte comparison. `R23H_READINESS_DESIGN_COMPLETE / G0_G5_HOLD`. |
| **A30 — Security Coordination** | [R23H independent security reconciliation, immutable GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/4d97b25b07b7d667777ff0b9fb38d9c57f4d5574/docs/web-005/agent-reports/A30/WEB-005_A30_R23H_INDEPENDENT_SECURITY_RECONCILIATION.md); [Google Docs copy](https://docs.google.com/document/d/13jZ7-O7MT4KN_TcxYx1vwsn3OOuqe5IS8zqeSrsr9mM/edit) | `SOURCE_PRESENT`, blob SHA-1 `7c4154abd6afc38d92a02faee48f43736b8ebdc3`; exact SHA-256 `NOT_INDEPENDENTLY_VERIFIED`. Original audit predates A21/A22 publication and must be reconciled with SQL-01. `BLOCKED`. |
| **A31 — PG16 Security Review & SQL Isolation** | No unambiguous completed A31 PG16 report or SHA-256 manifest found in accessible Drive title searches, GitHub code search or relevant branch search in this handoff | `MISSING / UNVERIFIED`. Do not mistake A30 for A31, or unrelated files starting `31_` for agent A31. Require exact immutable GitHub file/commit or Drive file ID and the matching hash; scope the independent audit to four fixture DBs **plus separate base test DB**. |
| **A50 — Node Runner** | [A50 R23H-R2 publication folder](https://drive.google.com/drive/folders/15dhDKUdahHodZias_s3LHnO8Ti61C2D3); [original ZIP](https://drive.google.com/file/d/1paKE0NwPD7v9GDbdZ2ohjoyfuvoPPr6N/view); [updated handoff](https://drive.google.com/file/d/17vf6Y8pTIIrw64757edwPyuZ9Hd247tE/view); [GitHub sources](https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2); [four-DB SQL addendum](https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view) | `SOURCE_PRESENT`. Original ZIP SHA-256 `671928e46ff11aebf1fcfefb07dd727f61eeccfb3fcbe81f4769c80fe10646cd` is **A50-reported / NOT rehashed independently in this handoff**. A50 claims 6/6 Git blob and 8/8 Drive byte checks; this is an **author attestation**, not A23 validation. Corrected count: four dynamically created fixture DBs **plus one separately provisioned S1 base DB** = up to five run-owned user DBs. Launcher, full write census and G4 execution are **PENDING**. |

## 3. Current authoritative corrections and SUPERSEDED design

1. **R23G historical variants** (including host-port/bridge Compose Option B) are `SUPERSEDED` in the **audit index**, not renamed/removed in cloud or Git.
2. **R23G-R2 A20 baseline** remains the accepted *source-document equivalence* snapshot (11/11), but its earlier **three-catalog-DB scope is insufficient** for full C01. A22 P0 and A50 R23H-R2 four-DB addendum take precedence for new risk review.
3. **A21 R23H Option A** (`network_mode:none` for PG16, `service:pg16` runner, no published host port, namespace-local 55432) is the latest *proposed* topology, not an authorized installation. The exact Compose checksum must be included in any future signed owner-approved plan.
4. **Four dynamic test databases vs five run-owned:** catalog generates 3 (`tm_catalog_test_<nonce>_{dev,prod,fresh}`), Drizzle generates 1 (`tm_drizzle_schema_test_<nonce>`), and S1 base test database is a separate preprovisioned fifth database. Four ≠ total cluster database count. Approvals for S1, S2 catalog and S2 Drizzle must be explicit and separate.
5. **Cloud hash semantics:** R23G-R2 Google Docs logical-text equivalence is **not byte-identical Google Docs export**. Conversely, the GitHub-published raw UTF-8 A23 Markdown files have independently verified source bytes/manifest. Windows `G:\` sync remains `UNVERIFIED`.

## 4. Missing or unverified evidence for owner/QA

- **P0 A31:** independently authored report, immutable source identity, SHA-256 and security disposition — **MISSING**.
- **P0 A22/A20/A30 reconciliation:** full updated, owner-reviewed, signed four dynamic DB + S1 base DB and `drizzle-kit push --force` mutation/grants/cleanup contract — **not accepted**; no runtime execution.
- **P1 A24:** four remote raw SHA-256 **not independently rehashed by A23** against published local values; full docs currently discovered, correcting previous “not published” observation.
- **P1 A30:** current R23H report Git blob known, raw SHA-256 not independently recomputed; updated A31/A22 review required.
- **P1 A50:** original ZIP, six Git files, current four-DB addendum and reported remote 8/8 source verification **not independently rehashed in this handoff**.
- **P1 A23 ZIP:** original package remains **conversation-only**; individual audited files are on GitHub.
- **Runtime gates:** OCI manifest trust, Node base and runner digests, physical Windows/Docker/PG identity, secret roles, exact writable paths, approvals G0–G5, full test TAP and exact-ID cleanup — **all HOLD / NOT_EXECUTED**.

## 5. Distribution / handoff routing

- **A00 + A20:** link this report into [owner Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) and prioritize corrected 4+1 DB contract and A31 security proof.
- **A60:** link this report into [Independent QA Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) for independent acceptance intake. Earlier DB-free 426/426 PASS does NOT prove PG16 integration success.
- **A23:** preserve all original hashes, histories and SUPERSEDED labels as audit *annotations*, not changes to source files. Do not claim cloud ZIP upload or Windows G: sync without hard evidence.

**Final evidence-discovery disposition:** `A23_EVIDENCE_HANDOFF_READY_FOR_A00_A20_A60`. **Project gate remains** `BLOCKED / PG16_EXECUTION_NOT_AUTHORIZED / RELEASE_NO_GO`.
