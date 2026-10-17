# WEB-005 — R23H / A23 — Canonical Artifact Registry

**Task:** `WEB-005-T023-R23H-EVIDENCE-INTEGRITY`  
**Date:** 2026-10-17 Europe/Warsaw  
**Audit mode:** INDEPENDENT / READ-ONLY against GitHub and Google Drive  
**Overall disposition:** `BLOCKED` (cross-agent full alignment and Windows sync not attested); **subgate** `R23G_R2_SOURCE_SHA256_AND_LOGICAL_DOCS_11_OF_11_VERIFIED`.  
**Canonical GitHub documentation snapshot SHA:** `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478`. **Do not confuse it with C01 source commit SHA** `fa3261b2c9510e110ac9eba21726812d3401a525`.

## Authoritative scope

- GitHub: [docs/web-005/agent-reports/A20/R23G-R2](https://github.com/C8LyNn/aplikacja-turnieje/tree/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2). This immutable tree snapshot is the **canonical SOURCE**, not the text/Markdown copies in R23G.
- Google Drive R2 folder: https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq. Google-native documents are **logical-text mirrors**, not raw `.md` or `.yaml` files.
- Historical R23G folder: https://drive.google.com/drive/folders/1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36 (retained read-only; superseded for canonical operational instructions).
- Authority applies to SOURCE DOCUMENTATION only. No Docker/PG16/CI/integration/Windows execution is authorized.

## Eleven canonical source documents

| # | Artifact / immutable GitHub URL | Canonical UTF-8 SHA256 | Git blob SHA1 | Native Google Docs document ID / URL | A23 evidence |
|---:|---|---|---|---|---|
| 1 | [`PG16_DOCKER_ISOLATION_PLAN.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_DOCKER_ISOLATION_PLAN.md) | `c0d87ce6a0e52ec7d6d11e360051c0b77727c11975e358f1fdea1118529493b8` | `ea2bcc674757594d64be529c22fb4a12f80f1194` | [`1pq833Ih6pBn9edaY9T3IbwnhoK5i-kPSFRjEp5rO56g`](https://docs.google.com/document/d/1pq833Ih6pBn9edaY9T3IbwnhoK5i-kPSFRjEp5rO56g/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 2 | [`PG16_RESOURCE_AND_PORT_MANIFEST.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_RESOURCE_AND_PORT_MANIFEST.md) | `84d2070f1befa92b2f509274da4472e8dddcb1958c046a2a1ee51c09829fd5e6` | `26d4999115b49e443a52aa5d20cd86f7c4f7d747` | [`1KQJ3JFlBY3IRGHtq6kETeKhaIP5sM6GsQOIYIA7ZN9E`](https://docs.google.com/document/d/1KQJ3JFlBY3IRGHtq6kETeKhaIP5sM6GsQOIYIA7ZN9E/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 3 | [`PG16_S1_S2_PERMISSION_MATRIX.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_S1_S2_PERMISSION_MATRIX.md) | `5a320b5a6f0a4f6ec8a246a337015e2e708136be3ba41c9503fffa1d2843612c` | `278a90b38be0d128f06ab2df14ea63c9cbd48700` | [`1agQ0OU8gH-RXD_2R9D94iqG7IeDbu4cUBms5cm1nJ_0`](https://docs.google.com/document/d/1agQ0OU8gH-RXD_2R9D94iqG7IeDbu4cUBms5cm1nJ_0/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 4 | [`PG16_EXECUTION_PHASES_G0_G5.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_EXECUTION_PHASES_G0_G5.md) | `426a52b42ddbdac54437558873b274db87c4eef3ed539a0539fbe54df12bed68` | `163894a6ede819f6d29f96bfc8c6591d561c5bb8` | [`1XWeAA5N6kqFy4C_eTnJ0Y0yhsipY5SvJySD-CtYZc14`](https://docs.google.com/document/d/1XWeAA5N6kqFy4C_eTnJ0Y0yhsipY5SvJySD-CtYZc14/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 5 | [`PG16_ROLLBACK_AND_CLEANUP.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_ROLLBACK_AND_CLEANUP.md) | `cd6fba55e381f9a8322decab714296877096b056a9ae6b115460148417dd466d` | `9728aea99d2b8e4138ffee32cf7c015bcca5e03c` | [`1u9gr64DJgOg_DkS9MaSwpkGq0tv718PPXYBpvu-TwC0`](https://docs.google.com/document/d/1u9gr64DJgOg_DkS9MaSwpkGq0tv718PPXYBpvu-TwC0/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 6 | [`PG16_OWNER_APPROVAL_REQUEST.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_OWNER_APPROVAL_REQUEST.md) | `fdf07e97ff58bfd53dd25045e3d0885d018f4762cdb0f6e4a460ddf2808ae961` | `1be75931953687cd736c0facaf2d3739d23cc01b` | [`12-GZZYJAW9DGJNxvzIxEV1-RnKwHJ0ajbTt88GrOe3k`](https://docs.google.com/document/d/12-GZZYJAW9DGJNxvzIxEV1-RnKwHJ0ajbTt88GrOe3k/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 7 | [`PG16_A50_EXECUTION_HANDOFF.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_A50_EXECUTION_HANDOFF.md) | `bdb0a303d64dbc0b2ec9bb6756f27b79bf6c06fd86b31b64afd150f7cd741869` | `af6bcbff742c6428328dabdd0c655a2fe39287f5` | [`1wp49MmpKcobj9roxjn207h7wGcy-YV3wnUMSE39SgRg`](https://docs.google.com/document/d/1wp49MmpKcobj9roxjn207h7wGcy-YV3wnUMSE39SgRg/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 8 | [`PG16_DOCKER_COMPOSE_EXAMPLE.yaml`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_DOCKER_COMPOSE_EXAMPLE.yaml) | `7618513028d738fd78cb1c17a9d3bf3f9d3cf61ef8df5e46470bbaba05f9a397` | `000bf75d8d456dcb4657dbf06c8c9f6274918c73` | [`1UCyuJSHx9QQnm94GTOOwHkGL0cP-hCLJQqzYU6Gqw4U`](https://docs.google.com/document/d/1UCyuJSHx9QQnm94GTOOwHkGL0cP-hCLJQqzYU6Gqw4U/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 9 | [`Dockerfile.node22-pnpm10.example`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/Dockerfile.node22-pnpm10.example) | `9e9104274c37b7c0d7c0d3c693225b6dae70bb149637222634a833c64e5fd513` | `61094e79376e0cee730c6ffdfb540ed60d4f94fa` | [`1WfhWBlHx5ECZB7j6piUrztOQzm1kfArfymrh0wUTuog`](https://docs.google.com/document/d/1WfhWBlHx5ECZB7j6piUrztOQzm1kfArfymrh0wUTuog/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 10 | [`PG16_R23G_TO_R23G_R2_DIFF_AND_QA.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_R23G_TO_R23G_R2_DIFF_AND_QA.md) | `b85c51d2a1e53404dcb18e02bb16c6a440db5ae8dd59d936313b6a8cc68ceabb` | `4559e8571ba6e75a3fc85652fba08b9a607d7232` | [`1uxq-cxqzmaqOsaUCz_auDU_5mUc8ZdtW83fWYswrOxs`](https://docs.google.com/document/d/1uxq-cxqzmaqOsaUCz_auDU_5mUc8ZdtW83fWYswrOxs/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |
| 11 | [`PG16_R23G_R2_FINAL_QA.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_R23G_R2_FINAL_QA.md) | `7090371f226a179f376d7c612dc970d4217c6eab6af4c501da97f79d88107793` | `01875975c69a7d72506fe5a1ae44378b8acb7a31` | [`1jNiDIEk5TV6WE5ocVnPBsgSVpu9cRPC-wwkI_Ng9R54`](https://docs.google.com/document/d/1jNiDIEk5TV6WE5ocVnPBsgSVpu9cRPC-wwkI_Ng9R54/edit) | **SOURCE_SHA256=PASS; BLOB=PASS; LOGICAL_TEXT=PASS** |

## Supplementary documentation (not included in the 11/11 contract)

| Source | Exact identifier | Classification |
|---|---|---|
| [R2 source SHA-256 manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_R23G_R2_SHA256_MANIFEST.md) | Git blob `98988747bcce64e350ff676a1b430d750ce7e67d`; SHA256 `8f7eac59478d604d886d2b3dccf8c74e1e0b6bc358b1a339381b6fcaa9a88afd`; Drive [ID `12N6YGxR-xphtX27gh1Pnqy4t8L4ScfE_Dk86w6XS0uc`](https://docs.google.com/document/d/12N6YGxR-xphtX27gh1Pnqy4t8L4ScfE_Dk86w6XS0uc/edit) | VERIFIED as additional GitHub raw source SHA-256 and logical Google Doc readback; self-referential exclusion from 11 |
| [A20 independent verification addendum](https://docs.google.com/document/d/1aqrBt77HygjDb9dFtutTTrkBjm75KTo_457cXWMMPj8/edit) | Drive native doc `1aqrBt77HygjDb9dFtutTTrkBjm75KTo_457cXWMMPj8` | SUPPORTING CLAIM / SOURCE CONTEXT; not among the eleven |
| [A30 R23G security audit](https://github.com/C8LyNn/aplikacja-turnieje/blob/bd57cb2ebcb17f9ac135cfb7a983eb23fb1e3f57/docs/web-005/agent-reports/A30/WEB-005_A30_R23G_DOCKER_PG16_SECURITY_AUDIT.md) | Blob `9a2a6029e9723ac939b9c30741722af663bc7f5c`, Drive [ID `1g1TfiHEl8bxka09kv_N4BZ1M8xgCyb0XZmsiaetOSks`](https://docs.google.com/document/d/1g1TfiHEl8bxka09kv_N4BZ1M8xgCyb0XZmsiaetOSks/edit) | VALID HISTORICAL R23G SECURITY FINDINGS; R2 re-review needed |

## Strict interpretation of PASS

A23 independently read 11 GitHub source files, compared their SHA-256 to the A20 manifest, verified Git blob SHA1 against GitHub metadata, and compared reconstructed full paragraph text of the 11 Google Docs to corresponding source text. Each Google Docs reconstruction uses the start/end offsets to recover inter-paragraph line breaks and restores the source's final LF. This is **logical-text matching**, not proof of byte-identical export from Google Docs. Raw `.md`/YAML cloud bytes and Windows `G:` are **UNVERIFIED**. GitHub raw file SHA-256 is verified; a cloud Doc's synthetic text SHA-256 is not an export-byte SHA-256.

The R23G root contains 26 direct files (eight filenames repeated in three MIME variants = 24, one ZIP and one A30 audit) plus the R2 subfolder. The R2 folder contains 13 native Docs: the 11 source mirrors, one SHA manifest mirror and the A20 verification addendum.

## Cross-agent canonical-version alignment

| Agent | Source inspected | Exact R2 alignment |
|---|---|---|
| A21 (Docker & Isolation) | No matching R23G-R2 report found in specified folders or available repository agent-report structure | `UNVERIFIED` — must submit exact Compose blob `000bf75d8d456dcb4657dbf06c8c9f6274918c73` |
| A22 (SQL & Migration Safety) | No matching R23G-R2 report located | `UNVERIFIED` — must cite S1/S2 source blobs and R2 permission matrix |
| A24 (PG16 Test Readiness) | No matching R23G-R2 report located | `UNVERIFIED` — must cite R2 G0–G5 and exact C01 SHA |
| A30 (Security) | Independently checked historical **R23G** security audit, source commit `bd57cb2ebcb17f9ac135cfb7a983eb23fb1e3f57`, blob `9a2a6029e9723ac939b9c30741722af663bc7f5c` | `R2_REVALIDATION_PENDING` — audit names divergent Option A/B, does not mention R23G-R2 |
| A50 (Execution) | R23D native evidence and handoff reviewed; PG16 restrictions present, no `R23G-R2` reference in those documents | `R2_PIN_UNVERIFIED` — A20's file named `PG16_A50_EXECUTION_HANDOFF.md` is a handoff *to A50*, not evidence written by A50 |

**Decision:** `BLOCKED` only on requested full evidence-chain closure; the 11/11 cryptographic-source-and-cloud-logical-text subgate is confirmed. No publication on Drive/GitHub, no historic file rename, deletion or metadata label happened in this read-only audit.
