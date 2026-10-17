# WEB-005 — A23 / R23H-R2 — Evidence Publication Receipt

**Task:** `WEB-005-T023-R23H-R2-EVIDENCE-RECOVERY`  
**Date:** 2026-10-17 (Europe/Warsaw)  
**Scope:** Publication recovery and evidence cross-reference. **No Docker, SQL, migrations, integration tests, CI, deployment or changes to historical source files.**  
**Publication destination:** GitHub, isolated documentation branch `docs/web-005/a23-r23h-r2-evidence-publication-20261017`  
**Publication status:** `A23_EVIDENCE_PUBLISHED_GITHUB / PUBLISHED_BYTES_VERIFIED_5_OF_5`  
**Overall R23H integrity/acceptance:** `BLOCKED` — A22 SQL-01 P0 and incomplete cross-agent acceptance; `PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.

## 1. Recovered originals and external publication

The prior A23 files were found at `/mnt/data/WEB-005_R23H_A23/` as **conversation artifacts, not preexisting Drive/GitHub publications**. The original ZIP `WEB-005_R23H_A23_EVIDENCE_AUDIT.zip` also exists as a conversation artifact and has SHA-256 `0384c32bcf802f4f6bd7f64f02c5d4075254aea6b4ce767a52af54534a106c34`. The five internal ZIP files match the recovered conversation files byte-for-byte. The original ZIP itself **was not uploaded** to Drive or GitHub.

The following five files were *newly published* to GitHub. A23 read them back through GitHub and verified **exact original UTF-8 text bytes** for each (including the trailing LF); the prior conversation SHA-256 values remain valid. Publication is on an isolated branch and not merged.

| Published document | SHA-256 over exact bytes | Git blob SHA-1 | Direct GitHub link |
|---|---|---|---|
| `R23H_CANONICAL_ARTIFACT_REGISTRY.md` | `a171f3a1a8d7691de76bfa9b5f08d72d1d422b416f4ffa89d7206409bc342bf3` | `f14fb7a905ac75486f7026a335c409986ac99f4c` | [Registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_CANONICAL_ARTIFACT_REGISTRY.md) |
| `R23H_SHA256SUMS.md` | `2af627857dd17178a464d7079ec7fed37ef0194d24ccdbddbee82d7c1eb1530f` | `2d508e6956dc22d4e0d5424b718503b947b5802a` | [SHA256SUMS](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_SHA256SUMS.md) |
| `R23H_PROVENANCE_AUDIT.md` | `fe0857e690a1eef62f9ae584108b9c5fc1cce10aa54a584af29e3080c1c58979` | `1165f2c15df581daff613f1b948df99262cbd480` | [Provenance](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_PROVENANCE_AUDIT.md) |
| `R23H_SUPERSEDED_DOCUMENTS.md` | `67db7561f0f7a4016ac0b473cbb78d242888f84ade093fb292c5b349dbe56409` | `9f0a67f5a4fb552a9624372d50ed7512eba46e45` | [SUPERSEDED registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_SUPERSEDED_DOCUMENTS.md) |
| `R23H_A23_BUNDLE_SHA256SUMS.txt` | `1008d351d5b3e260829f3ab6f1daf5ce5412786f3fa67a772c9f81889489eb21` | `bb3dd6d53c6019bb74e1fed8bf96ef1d30f343ec` | [Bundle manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a23-r23h-r2-evidence-publication-20261017/docs/web-005/agent-reports/A23/R23H-R2/R23H_A23_BUNDLE_SHA256SUMS.txt) |

**Readback result: 5/5 EXACT_BYTES_MATCH.** Branch history holds separate documentation-only commits; no old documents were edited, moved, renamed or deleted. **No Drive upload of A23 originals has been performed or claimed**.

## 2. Cross-agent evidence newly linked for R23H-R2

| Agent | Evidence / direct URL | Integrity/status |
|---|---|---|
| **A21 / Canonical Docker** | [Drive folder](https://drive.google.com/drive/folders/1OxD-jC4lzibQ69F7C9vhIRbF3ifgx5KH); [ZIP](https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view) | ZIP **SHA-256** `8ce88f7f643799d3f66ba508e85476cf050adb050aae6564e2db63682060f8b2`; embedded canonical Compose **SHA-256** `3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70`. Independently read original cloud ZIP bytes, recomputed hash, checked archive CRC and constituent Compose hash. **R23H_DOCKER_DESIGN_READY; NOT EXECUTED.** |
| **A22 / SQL & Migration Safety** | [Drive ZIP](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view) | ZIP **SHA-256** `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e`; embedded `R23H_SQL_SAFETY_VERDICT.md` **SHA-256** `425c5f4b5f16358d73346b99192aff9c0bc1ed3fadba17e9eeaa8d664f742be5`. Independently recalculated ZIP and member hashes; CRC PASS. **BLOCKED / SQL-01 P0**. |
| **A24 / PG16 Readiness** | [GitHub handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a24-r23h-readiness-20261017/docs/web-005/agent-reports/A24/R23H/R23H_A24_HANDOFF_DISPATCH.md); [Drive G0–G5 matrix](https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view) | GitHub handoff blob `74dba2c46ccef87bb3691cbefbdf1cd99df2f6b2`. Four complete authored artifacts have **author-reported local SHA256 in handoff**, but their full shared raw-byte publication is **UNVERIFIED**. All gates G0–G5 HOLD. |
| **A30 / Independent Security** | [GitHub immutable source](https://github.com/C8LyNn/aplikacja-turnieje/blob/4d97b25b07b7d667777ff0b9fb38d9c57f4d5574/docs/web-005/agent-reports/A30/WEB-005_A30_R23H_INDEPENDENT_SECURITY_RECONCILIATION.md); [Drive Google Doc](https://docs.google.com/document/d/13jZ7-O7MT4KN_TcxYx1vwsn3OOuqe5IS8zqeSrsr9mM/edit) | Commit `4d97b25b07b7d667777ff0b9fb38d9c57f4d5574`, source Git blob SHA-1 `7c4154abd6afc38d92a02faee48f43736b8ebdc3`; R23H security verdict **BLOCKED**. A30 review predates publication of A21/A22 and must be reconciled against their actual packages and SQL-01. |
| **A50 / Runner Design** | [Drive index](https://docs.google.com/document/d/1XLsRE-UhPCy1sp9N0RRtLCyT0NzWUAu4wJdOzRrI8_E/edit) | Index confirms documentation-only design; four specification files and full raw bytes in A50's package are **NOT verified as published**. ZIP SHA256 `671928e46ff11aebf1fcfefb07dd727f61eeccfb3fcbe81f4769c80fe10646cd` is **A50-reported only, NOT independently verified by A23**. No built image or executed test. |
| **A20 / Coordination** | [R23H status to 00](https://drive.google.com/file/d/1i9tzQtJ3q34Mm0Lv2_7iMYZxi0PtQU1V/view); [R23G-R2 baseline](https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq) | Independent status: `R23H_DOCUMENTATION_PARTIAL / A60_ACCEPTANCE_BLOCKED`. |
| **A60 / Independent QA** | [Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) | Acceptance remains **BLOCKED**; DB-free 426/426 is not PG16 integration QA. |

**Critical correction:** A22 identified an additional `tm_drizzle_schema_test_*` database, so full C01 requires accounting for **four DBs**, not merely the three `tm_catalog_test_*` scratch databases described in earlier A20 documentation. Related source is `drizzle-schema-diff.integration.test.ts`, Git blob SHA-1 `e008dbd9fe287632252d3fcfda246f60e4cc35d3`, using `drizzle-kit push --force` per the A22 report. A20/A21/A24/A30/A50 must not rely on old three-DB coverage when proposing G3/G4/G5 permissions, containment or cleanup. **No SQL or test execution was performed here.**

## 3. CANONICAL, SUPERSEDED, and hash semantics

- **Historical R23G** [Drive folder](https://drive.google.com/drive/folders/1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36) and incompatible Compose Option B (Docker bridge or host port) are **`SUPERSEDED` for future operational design**. This label is recorded **only in these newly published audit documents**; original files' Drive metadata and names are unchanged.
- **R23G-R2** [GitHub immutable baseline snapshot](https://github.com/C8LyNn/aplikacja-turnieje/tree/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2) is the canonical A20 source for the prior R23G-R2 **documentation verification**. It is not the latest final approved cross-agent runtime specification.
- **A21 R23H canonical Compose** (`R23H_CANONICAL_COMPOSE.yaml`, SHA256 `3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70`) is the current **proposed single topology** for R23H; supersedes earlier operational Compose variants for future design, **subject to A22 P0 reconciliation and formal A00/A20/A60 authorization**. It must not be executed now.
- Previous A23 audit reported **11/11 GitHub UTF-8 source SHA-256 match + Git blob match + Google Docs logical-text match** after accounting for Google Docs paragraph terminators. This validates source/text correspondence, **not raw byte identity of Google-native exports**. `GOOGLE_DOCS_LOGICAL_TEXT_VERIFIED` and `GOOGLE_DOCS_EXPORTED_RAW_BYTES_UNVERIFIED` are separate statuses.
- For the **five A23 Markdown/TXT reports newly published on GitHub**, exact bytes **were** checked via independent GitHub readback against recovered originals: `GITHUB_PUBLISHED_BYTES_VERIFIED_5_OF_5`.
- Windows local mirror `G:\\` was not observed: `LOCAL_G_DRIVE_SYNC_UNVERIFIED`.
- The previous A23 files have **preserved historical conclusions as-of their original investigation**. Where their earlier cross-agent table said A21/A22/A24 had no located reports, that historical state is now **SUPERSEDED_BY_THIS_RECEIPT** and the newly linked actual evidence above controls. No silent rewriting of that original audit was made.

## 4. Handoff to 00 / 20 / 60

**To 00:** use this receipt and the five GitHub file links as the discoverable A23 handoff. Do not interpret documentary publication as execution permission or endorsement of an unreviewed host networking/SQL scope.

**To 20/A20:** reconcile A21's exact `3766de4d...` Compose against A22's four-DB SQL-01 and update signed S1/S2 privilege matrix and teardown contract; ask A30 to re-check against the now-located A21/A22 artifacts.

**To 60/A60:** validate the exact published A23 files, inspect A21/A22 ZIPs and A24/A30/A50 source provenance, keep full R23H independent QA `BLOCKED` until complete evidence, no implicit GO on G0–G5.

**Publication caveat:** GitHub branch was created and read back by A23, but these documents are **not merged**. No cloud upload to Google Drive is claimed. A21/A22 files reside on Google Drive independently of this publication. No Docker, SQL, testing, live deployment, historical rename or deletion occurred.

**Final:** `R23H_R2_EVIDENCE_PUBLICATION_RECOVERED_AND_VERIFIED / A23_5_FILES_PUBLISHED_GITHUB / CROSS_AGENT_ACCEPTANCE_BLOCKED / PG16_EXECUTION_HOLD`.
