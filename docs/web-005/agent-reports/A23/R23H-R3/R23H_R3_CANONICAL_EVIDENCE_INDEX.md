# WEB-005 — A23 / R23H-R3 — Canonical Evidence & Custody Index

**Task:** `WEB-005-T023-R23H-R3-EVIDENCE-CUSTODY-FINALIZATION`  
**Date:** 2026-10-17 Europe/Warsaw  
**Mode:** READ-ONLY source/artifact verification + append-only documentary publication. No Docker, SQL, migrations, application test runs, environment changes, merge, deployment or deletion.  
**Recipients:** A00 (Implementation Lead), A60 (Independent QA); A20 (PG16 Coordination) copied.  
**Exact C01 source:** `fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60, not rewritten).
**Evidence disposition:** `R23H_R3_EVIDENCE_CUSTODY_VERIFIED_WITH_GAPS`. **Execution / acceptance:** `BLOCKED / G0_G5_HOLD / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.

## 1. Evidence classification — do not conflate

- **VERIFIED:** A23 independently obtained **raw bytes** from exact Drive file ID or GitHub immutable blob, calculated SHA-256 and compared with the author's stated digest/manifest (where available); ZIP membership/CRC and corresponding separately published Drive text bytes were also compared as specified. A file hash is **not** an execution or safety PASS.
- **AUTHOR_REPORTED:** The claim, digest, suite result, run ID, runtime state, or source verification is reported by another agent but **was not independently reproduced** here.
- **MISSING:** Required evidence was not located within the searched accessible sources or has not been provided. No claim that it cannot exist elsewhere.
- **SUPERSEDED:** Older document/version should not be used to authorize a new phase; original historical files remain preserved.
- **Google Docs:** prior A23 R23G-R2 **11/11 logical-text equivalence** to GitHub after paragraph/newline reconstruction is **not** byte-identical Google Docs raw export. Raw Drive `.md`/`.zip` files in this index were retrieved as actual bytes, with SHA-256 computed. Windows local `G:\` mirror remains **UNVERIFIED**.

## 2. A23 R23H-R2 — recovered, already published (NO re-upload needed)

**GitHub documentation-only branch:** `docs/web-005/a23-r23h-r2-evidence-publication-20261017`. **R23H-R2 frozen reference commit:** `ebe8fab4d670447a66d13f14155bd210fa76ca21`. Prior published raw Markdown/TXT files and their Git blobs were re-fetched; archive remains a *conversation artifact* only, not an uploaded ZIP.

| Version / exact artifact | SHA-256 (raw UTF-8) | Git blob SHA-1 | Link | Status |
|---|---|---|---|---|
| R23H / `R23H_CANONICAL_ARTIFACT_REGISTRY.md` | `a171f3a1a8d7691de76bfa9b5f08d72d1d422b416f4ffa89d7206409bc342bf3` | `f14fb7a905ac75486f7026a335c409986ac99f4c` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_CANONICAL_ARTIFACT_REGISTRY.md) | VERIFIED |
| R23H / `R23H_SHA256SUMS.md` | `2af627857dd17178a464d7079ec7fed37ef0194d24ccdbddbee82d7c1eb1530f` | `2d508e6956dc22d4e0d5424b718503b947b5802a` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_SHA256SUMS.md) | VERIFIED |
| R23H / `R23H_PROVENANCE_AUDIT.md` | `fe0857e690a1eef62f9ae584108b9c5fc1cce10aa54a584af29e3080c1c58979` | `1165f2c15df581daff613f1b948df99262cbd480` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_PROVENANCE_AUDIT.md) | VERIFIED |
| R23H / `R23H_SUPERSEDED_DOCUMENTS.md` | `67db7561f0f7a4016ac0b473cbb78d242888f84ade093fb292c5b349dbe56409` | `9f0a67f5a4fb552a9624372d50ed7512eba46e45` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_SUPERSEDED_DOCUMENTS.md) | VERIFIED |
| R23H / `R23H_A23_BUNDLE_SHA256SUMS.txt` | `1008d351d5b3e260829f3ab6f1daf5ce5412786f3fa67a772c9f81889489eb21` | `bb3dd6d53c6019bb74e1fed8bf96ef1d30f343ec` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_A23_BUNDLE_SHA256SUMS.txt) | VERIFIED |
| R23H-R2 / `R23H_R2_EVIDENCE_PUBLICATION_RECEIPT.md` | `72c0905b07d8da16c0f1cbcb09a50704ebf0ac8dd8c13fca13c273ef3088d301` | `4331cdb69953001c96183ac5fb694f479377f7e3` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_R2_EVIDENCE_PUBLICATION_RECEIPT.md) | VERIFIED |
| R23H-R2 / `R23H_R2_EVIDENCE_HANDOFF.md` | `ba58ebcebfc9d33a24f64b3310a78cdc206bdf82d59a6a4a5ed07b33cd73fcec` | `ce60636478f314f4941a43cc75835495d4987d65` | [GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/ebe8fab4d670447a66d13f14155bd210fa76ca21/docs/web-005/agent-reports/A23/R23H-R2/R23H_R2_EVIDENCE_HANDOFF.md) | VERIFIED (prior handoff) |
| Historical conversation-only `WEB-005_R23H_A23_EVIDENCE_AUDIT.zip` | `0384c32bcf802f4f6bd7f64f02c5d4075254aea6b4ce767a52af54534a106c34` | — | No Google Drive/GitHub ZIP link | VERIFIED locally; remote ZIP **MISSING** |

## 3. A21 R23H — canonical proposed Docker topology

**Publication folder:** [A21 Drive](https://drive.google.com/drive/folders/1OxD-jC4lzibQ69F7C9vhIRbF3ifgx5KH). Retrieved raw ZIP and all three separately published Markdown files. Original ZIP CRC passes; all three standalone Drive files are **byte-identical** to the three corresponding ZIP members. The canonical Compose is the **fourth ZIP member**, not a separately listed raw Drive file.

| Artifact | Exact SHA-256 | Link | Status |
|---|---|---|---|
| `WEB-005_A21_R23H_PACKAGE.zip` | `8ce88f7f643799d3f66ba508e85476cf050adb050aae6564e2db63682060f8b2` | [Drive](https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view) | VERIFIED |
| `R23H_CANONICAL_COMPOSE.yaml` (inside ZIP) | `3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70` | [Contained in ZIP](https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view) | VERIFIED |
| `R23H_CANONICAL_DOCKER_TOPOLOGY.md` | `a9e9d2ebecbd1062fc1b658207e287edb0b77a11f2a41085e78337aa02a67337` | [Drive](https://drive.google.com/file/d/1hEVyZ3_TmnkhI9DgGvMrygUpmFMjb28d/view) | VERIFIED |
| `R23H_COMPOSE_VALIDATION_MATRIX.md` | `7200ef2368bff078c4c4e7ae1675ac5fab541ec097413d146b07af77afb17038` | [Drive](https://drive.google.com/file/d/1wOKwnoB6yv2MXJUJ3gzybYUu0KnbZZfS/view) | VERIFIED |
| `R23H_DOCKER_RISK_REGISTER.md` | `b5fd1687fc8295b97aa88e5ef887c7e859088a2f78b6098b317ebc150fb3d8f9` | [Drive](https://drive.google.com/file/d/1Xj0XSIPsY-zX1d0BW886mtBxMlTkPXvW/view) | VERIFIED |

**Version:** A21 R23H Option A is the *proposed source topology* (PG network `none`, Node `service:pg16`, no published host ports), replacing R23G competing Compose options. It is **not an approved operational deployment**, and has no Docker runtime certification.

## 4. A22 — original SQL audit and FINAL four-DB correction

**Original R23H audit ZIP** [Drive](https://drive.google.com/file/d/1CI-YgEgemn5nPI3psMy083lI4f4RHcq0/view), raw SHA-256 `dde4a93ce176a097920e9c59e0248792c4504b1dcd28ca251ae304829843fd8e` — **VERIFIED**, ZIP CRC passes.

| Artifact (inside original ZIP) | Exact SHA-256 | Status |
|---|---|---|
| `R23H_SQL_DESTRUCTIVE_SCOPE.md` | `562b59f7c5f338cb9ec29e97702e3d2e470377a0e8ca6eee888438ec08db1a63` | VERIFIED |
| `R23H_S1_S2_PERMISSION_MATRIX.md` | `42fb896017c6b2baa9261250eb3bed17fb58cfd3895560d520feb134628b05d8` | VERIFIED |
| `R23H_MIGRATION_EXECUTION_MAP.md` | `ae15f1c84d79edea93c820c9487acf17ad487431ed15d7ab24066f8141f1ee02` | VERIFIED |
| `R23H_SQL_SAFETY_VERDICT.md` | `425c5f4b5f16358d73346b99192aff9c0bc1ed3fadba17e9eeaa8d664f742be5` | VERIFIED |

**FINAL published corrective contract, no longer missing:**

- [`R23H_R2_FOUR_DB_SQL_CONTRACT.md` — immutable source](https://github.com/C8LyNn/aplikacja-turnieje/blob/6ded14bd0ca685cff1e5fcb0d70a8dde8ca27551/docs/web-005/R23H_R2_FOUR_DB_SQL_CONTRACT.md)
- GitHub **commit** `6ded14bd0ca685cff1e5fcb0d70a8dde8ca27551`; **blob SHA-1** `9bcbd445e9583556207fa25ab8b93afa3eb42132`; raw size **19,773 bytes**.
- **SHA-256 independently recomputed by A23:** `63cd2d4c636ef03fa35cef37f378f9dd4768bc69f9310aa046457bd0f560cdf2`.
- [Author checksum sidecar `.sha256`](https://github.com/C8LyNn/aplikacja-turnieje/blob/6ded14bd0ca685cff1e5fcb0d70a8dde8ca27551/docs/web-005/R23H_R2_FOUR_DB_SQL_CONTRACT.md.sha256), Git blob `aa01af78d4a1c9be497a92502f0865f997431491`: **EXACT MATCH** with independently calculated SHA-256.
- **Document integrity: VERIFIED. Contract approval/safety: BLOCKED.** Corrects only S2 three-DB description, privileges and G3-S2/G4/G5 assumptions, not an overall SQL certification or signed mutation GO.

## 5. A24 R23H — all four standalone raw files now VERIFIED

[Dispatch on GitHub](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a24-r23h-readiness-20261017/docs/web-005/agent-reports/A24/R23H/R23H_A24_HANDOFF_DISPATCH.md) — Git blob `74dba2c46ccef87bb3691cbefbdf1cd99df2f6b2`, independently computed raw SHA-256 `50468e7626968dc3ba3981477edaf6d3b7cda67bce345423844b3819e73258b8` — **VERIFIED**.

| File | Drive publication | Exact SHA-256 | Status |
|---|---|---|---|
| `R23H_G0_G5_READINESS_MATRIX.md` | [Drive](https://drive.google.com/file/d/1m1hQfIr6lS2a4rljjjUwi1DpiQnhqeeT/view) | `7abccfb8d2909174ae4004d3f75c9dcfc69a8caea08320aec7a60942817d6e71` | VERIFIED |
| `R23H_OPERATOR_APPROVAL_TEMPLATE.md` | [Drive](https://drive.google.com/file/d/12-jnMC_TeweZkDTDDRXlJJE4pnbbaTjW/view) | `d0d56751650f5cd9742120d21f47f86f3d16063035a33850efd2fc2a606746d4` | VERIFIED |
| `R23H_EXECUTION_STOP_CONDITIONS.md` | [Drive](https://drive.google.com/file/d/1DI76OgEAZ0Sx0R4K2gJkEBUt25JUgn8u/view) | `62c2a9731add6c714ac68719630aca143efb0d21c7759ef15504e3b33e8d6ff6` | VERIFIED |
| `R23H_A50_HANDOFF_CONTRACT.md` | [Drive](https://drive.google.com/file/d/1iHTGPVWqsVW5Nu-nNz_f1DqRxTB347OG/view) | `31fdbe57f61cd85fa564e57a7588054f02c0c972c3cfc42149899a723b6c9e8f` | VERIFIED |

All four remote raw byte streams were directly downloaded on 2026-10-17 and SHA-256 checked against the dispatch. **Design-ready ≠ G0–G5 authorization.**

## 6. A50 R23H / R23H-R2 — full publication independently verified

**Cloud folder:** [A50 R23H-R2 Drive](https://drive.google.com/drive/folders/15dhDKUdahHodZias_s3LHnO8Ti61C2D3); [GitHub source folder](https://github.com/C8LyNn/aplikacja-turnieje/tree/docs/web005-a50-r23h-r2-runner-publication/docs/web-005/agent-reports/A50/R23H-R2).

| Artifact / version | SHA-256 raw bytes | Location | Status |
|---|---|---|---|
| Original R23H ZIP `WEB005_A50_R23H_NODE_RUNNER_DESIGN_ORIGINAL.zip` | `671928e46ff11aebf1fcfefb07dd727f61eeccfb3fcbe81f4769c80fe10646cd` | [Drive](https://drive.google.com/file/d/1paKE0NwPD7v9GDbdZ2ohjoyfuvoPPr6N/view) | VERIFIED; 6 members/CRC PASS |
| R23H-R2 ZIP `WEB005_A50_R23H_R2_RUNNER_HANDOFF_PACKAGE.zip` | `21f1fcee02e1c7e9dc0b9f519231ba85cc3c76e4ef5ec17d31dcb8936f7e7c7b` | [Drive](https://drive.google.com/file/d/18itz4ESZICw5KNfa6kD2IebuWtq0u4aX/view) | VERIFIED; 9 members/CRC PASS |
| `MANIFEST_SHA256.json` (ZIP member) | `dcb747a2cdb5769d93d3d775f1861d3a49bc2edfbf0ccbdc5c3def37834f2a78` | [Inside R2 ZIP](https://drive.google.com/file/d/18itz4ESZICw5KNfa6kD2IebuWtq0u4aX/view) | VERIFIED |
| `R23H_NODE_RUNNER_SPEC.md` | `e5e6a0afd3d7b60e07c6bbbbb536978b0fe28abca1a29f79cab547ae86041837` | [Drive](https://drive.google.com/file/d/12snjBHsmZi3GPG-FOimqRaQXI_pyRDsj/view) | VERIFIED |
| `R23H_RUNNER_WRITE_PATH_AUDIT.md` | `20a88487995c6a73427f16e31871f7e67e3fb11d8f270914a0b220f7e3ea3cbb` | [Drive](https://drive.google.com/file/d/16zl0Cwb_rYuEcxxniDt1sXuzGLsuKU_O/view) | VERIFIED |
| `R23H_FAIL_CLOSED_LAUNCHER_DESIGN.md` | `2e42697c027d53c96aa5352315c02a4537fe8b43975cf2c68626f71af9a7a33a` | [Drive](https://drive.google.com/file/d/1YyJV5wfVeszPzffbEV2vp2OVq77YpdZt/view) | VERIFIED |
| `R23H_DIAGNOSTIC_EVIDENCE_CONTRACT.md` | `846be2adf20d6c4844a1882509cd364431cb96858aa18a8b517efe62a5b2bf1f` | [Drive](https://drive.google.com/file/d/14CX3uxz7NONpPAlkz6-KIbHsP1UPg7ZO/view) | VERIFIED |
| `README_PL.md` | `dcf2accb5b7a60a0b52f6daf127bf5ebd835658dd3ba0225995dbc4eecff2c6e` | [Drive](https://drive.google.com/file/d/1TSFyxg6ofLaJQ61TPvd7JRsDJ21qsoKX/view) | VERIFIED |
| `R23H_R2_SQL_SCOPE_ADDENDUM.md` | `5275243e0d9f2f87873b864b69377dcda45be4df604b49dd15010910d3be83b5` | [Drive](https://drive.google.com/file/d/1LAf4buM_BeILyEFkJlUhI1YvH7qY0McN/view) | VERIFIED |
| `R23H_R2_RUNNER_HANDOFF.md` | `8ba7311e565b082845786bfc1d59db99e09e2099ae05ed863f77d58c2b103598` | [Drive](https://drive.google.com/file/d/17vf6Y8pTIIrw64757edwPyuZ9Hd247tE/view) | VERIFIED |
| `SHA256SUMS.txt` (R2 ZIP member) | `5aabc883ceb8c8cf42845091b496455f815c301611456b3016ade8533978b241` | [Inside R2 ZIP](https://drive.google.com/file/d/18itz4ESZICw5KNfa6kD2IebuWtq0u4aX/view) | VERIFIED; 8/8 listed member hashes MATCH |
| `R23H_R2_RUNNER_RECOVERY.md` (extra standalone R2 publication) | `be07b61d46f9ab0171034448f8871c9c1bf7c627e25df4e2cc73a47c7d669496` | [Drive](https://drive.google.com/file/d/1Jcpgs3vxCJ1hpqJ_pBvSChrorRiA0AS4/view) | VERIFIED |

Five original R23H documents and the R2 additions were retrieved separately from Drive. Their byte streams match corresponding archived ZIP members. R2 ZIP `SHA256SUMS.txt` validates **8/8 entries** (checksum file deliberately excluded from itself). The full package hashes and all listed file hashes above are **A23 independently VERIFIED**, no longer just A50 author reports.

## 7. A20 / A30 / A31 / A60 provenance, legacy sources and gaps

| Role | Evidence | Hash and status |
|---|---|---|
| A20 canonical A20 R23G-R2 documentation | [Immutable R23G-R2 GitHub snapshot](https://github.com/C8LyNn/aplikacja-turnieje/tree/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2); [R23H status for A00](https://drive.google.com/file/d/1i9tzQtJ3q34Mm0Lv2_7iMYZxi0PtQU1V/view) | 11/11 UTF-8 source hashes and Git blobs + 11/11 Google Docs **logical text** verified by prior A23 audit; **not cloud-native raw export bytes**. R23H owner acceptance **BLOCKED**. |
| A30 independent R23H security | [Immutable GitHub report](https://github.com/C8LyNn/aplikacja-turnieje/blob/4d97b25b07b7d667777ff0b9fb38d9c57f4d5574/docs/web-005/agent-reports/A30/WEB-005_A30_R23H_INDEPENDENT_SECURITY_RECONCILIATION.md); [native Google Docs copy](https://docs.google.com/document/d/13jZ7-O7MT4KN_TcxYx1vwsn3OOuqe5IS8zqeSrsr9mM/edit) | Git commit `4d97b25b07b7d667777ff0b9fb38d9c57f4d5574`, blob SHA-1 `7c4154abd6afc38d92a02faee48f43736b8ebdc3`, **independently computed Git source SHA-256** `87d6359cd06aa797e93c37d8d9c9b97dd33155669875e9aff3bfb4a7096a1d09`: **VERIFIED Git source only**. Google Docs text/export byte fidelity **UNVERIFIED**. Security GO not granted. |
| A31 specialized PG16 security | No exact unambiguous A31 final report + Git commit/Drive file ID + matching SHA256 located among accessible results | **MISSING**, not interpreted as failure to perform work; must receive independently verifiable source. |
| A60 acceptance | [Independent QA Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) | Full R23H-R3 acceptance document/signatures **MISSING**; previous DB-free 426/426 PASS is not PG16 integration PASS. |

## 8. Normative version order / boundaries

1. **R23G / early Option B** bridge or published-host-port Compose = `SUPERSEDED` for forward operational design. Original files retained, not renamed/deleted.
2. **A20 R23G-R2** = canonical *historical documentation-byte and logical-text source baseline*; older *three-dynamic-DB S2 scope* = `SUPERSEDED` for new authorizations.
3. **A21 R23H Option A** = current *proposed* no-host-port Compose topology, SHA-256 `3766de...`; no Docker CLI/runtime validation by A23.
4. **A22 R23H-R2 final corrective SQL contract** = latest authoritative *documentation of SQL mutation scope*, SHA-256 `63cd2d4c...`. Four dynamically generated fixture DBs (three `tm_catalog_test_*` + one `tm_drizzle_schema_test_*`) plus separate preprovisioned S1 base DB means **five run-owned user databases** may be present, excluding postgres maintenance/templates. `drizzle-kit push --force` is in scope; safety and actual SQL impact not runtime certified.
5. **A24 R23H and A50 R23H-R2** = matching documented readiness/runner contracts; preserved original R23H design files plus A50 R2 corrections. No runner image, sealed launcher or actual DB integration proof accepted.
6. **A23 R23H-R3** = current custody index. The index is additive; it does not silently replace original source files or create GO authority.

## 9. Explicit missing evidence and AUTHOR_REPORTED claims

- **MISSING:** A31 exact PG16 security report, artifact commit and SHA256, independently signed cross-agent security reconciliation.
- **MISSING:** executable owner-approved physical isolation identity certificate, trusted OCI descriptor, Node base/runner image digests, least-privilege role evidence, sealed/verified launcher, full Drizzle SQL effects, separate written signed G0/G1/G2/G3-S1/G3-S2-CATALOG/G3-S2-DRIZZLE/G4/G5 authorization, native complete TAP test receipts and exact owned-object cleanup proof.
- **AUTHOR_REPORTED:** any claims of test suite PASS, runtime isolation, Linux runner write-path completeness, OCI authentication, Docker/PG command success or Windows mirror synchronization not independently observed here. Even the original A50 source write-path audit labels the runtime/transitive path census incomplete.
- **UNVERIFIED:** Windows `G:\` sync; equivalence of native Google Docs *export bytes* with GitHub `.md` originals; cross-agent contract approval by A00/A20/A30/A31/A60. 
- **VALIDATION LIMITATION:** this handoff only checks documentary integrity and provenance. ZIP `testzip()`/CRC and SHA-256 file comparisons are **artifact checks**, not application unit/integration tests.

## 10. Handoff — A00, A60, copy A20

- **A00 (Issue #76):** accept source custody only, require explicit decision to supersede earlier 3-DB S2 baseline with A22's 4-dynamic + 1-base DB mutation model. Do not infer G0–G5 GO from artifact verification.
- **A60 (Issue #77):** use immutable source links + raw checksums above as independently inspectable inputs; request missing A31 report and actual owner cross-agent approvals. `R23H_R3_DOCUMENTATION_EVIDENCE_COMPLETE_EXCEPT_A31_AND_RUNTIME`; independent technical QA still blocked.
- **A20:** reconcile A21 no-port Compose and A22 corrected S2 grant/teardown matrix, coordinate A30/A31 acceptance, keep S1/S2 distinctions.

**Final custody verdict:** `R23H_R3_EVIDENCE_CUSTODY_VERIFIED_WITH_GAPS`. **Runtime disposition:** `BLOCKED / PG16_EXECUTION_NOT_AUTHORIZED / RELEASE_NO_GO`.
