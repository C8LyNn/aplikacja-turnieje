# WEB-005 — R23H / A23 — SHA256SUMS

**Task:** `WEB-005-T023-R23H-EVIDENCE-INTEGRITY` | **Date:** 2026-10-17  
**Hash semantics:** SHA-256 over *raw GitHub UTF-8 source bytes*, at pinned documentation snapshot `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478`, **not** the exported bytes of Google Docs.  
**Validation:** eleven source digest matches, eleven corresponding Git blob SHA1 matches, eleven logical Google Docs text matches. The Google Docs raw export digest and Windows `G:` copy are NOT verified.

## Canonical R23G-R2 source SHA256

Compatible with `sha256sum -c` after checking out the pinned GitHub tree and moving into `docs/web-005/agent-reports/A20/R23G-R2/`:

```text
c0d87ce6a0e52ec7d6d11e360051c0b77727c11975e358f1fdea1118529493b8  PG16_DOCKER_ISOLATION_PLAN.md
84d2070f1befa92b2f509274da4472e8dddcb1958c046a2a1ee51c09829fd5e6  PG16_RESOURCE_AND_PORT_MANIFEST.md
5a320b5a6f0a4f6ec8a246a337015e2e708136be3ba41c9503fffa1d2843612c  PG16_S1_S2_PERMISSION_MATRIX.md
426a52b42ddbdac54437558873b274db87c4eef3ed539a0539fbe54df12bed68  PG16_EXECUTION_PHASES_G0_G5.md
cd6fba55e381f9a8322decab714296877096b056a9ae6b115460148417dd466d  PG16_ROLLBACK_AND_CLEANUP.md
fdf07e97ff58bfd53dd25045e3d0885d018f4762cdb0f6e4a460ddf2808ae961  PG16_OWNER_APPROVAL_REQUEST.md
bdb0a303d64dbc0b2ec9bb6756f27b79bf6c06fd86b31b64afd150f7cd741869  PG16_A50_EXECUTION_HANDOFF.md
7618513028d738fd78cb1c17a9d3bf3f9d3cf61ef8df5e46470bbaba05f9a397  PG16_DOCKER_COMPOSE_EXAMPLE.yaml
9e9104274c37b7c0d7c0d3c693225b6dae70bb149637222634a833c64e5fd513  Dockerfile.node22-pnpm10.example
b85c51d2a1e53404dcb18e02bb16c6a440db5ae8dd59d936313b6a8cc68ceabb  PG16_R23G_TO_R23G_R2_DIFF_AND_QA.md
7090371f226a179f376d7c612dc970d4217c6eab6af4c501da97f79d88107793  PG16_R23G_R2_FINAL_QA.md
```

## Supplemental GitHub SHA-256 (excluded from A20 11/11 table to avoid self-reference)

```text
8f7eac59478d604d886d2b3dccf8c74e1e0b6bc358b1a339381b6fcaa9a88afd  PG16_R23G_R2_SHA256_MANIFEST.md
```


**Manifest blob (Git SHA1):** `98988747bcce64e350ff676a1b430d750ce7e67d`. GitHub source: https://github.com/C8LyNn/aplikacja-turnieje/blob/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2/PG16_R23G_R2_SHA256_MANIFEST.md. Google Docs logical mirror: https://docs.google.com/document/d/12N6YGxR-xphtX27gh1Pnqy4t8L4ScfE_Dk86w6XS0uc/edit.

## Integrity domains — do not conflate

- `GITHUB_SOURCE_SHA256`: **VERIFIED** for 11 canonical sources and supplemental A20 manifest. Raw GitHub bytes and Git blob identities are fixed to snapshot `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478`.
- `GITHUB_GIT_BLOB_SHA1`: **VERIFIED** for eleven sources; blob SHA1 is a Git object identity, not a SHA256 checksum.
- `GOOGLE_DOCS_LOGICAL_TEXT`: **VERIFIED 11/11** using paragraph index reconstruction. A20 manifest mirror was separately checked for logical readback.
- `GOOGLE_DOCS_EXPORTED_RAW_BYTES_SHA256`: **UNVERIFIED**. Native Google Docs may add BOM/line endings/formatting. No assertion that cloud export bytes equal original markdown/YAML source.
- `HISTORICAL_R23G_RAW_COPIES`: **NOT_HASHED_AS_CANONICAL**; retain until explicit separate archive policy. Duplicate filenames do not prove duplicate bytes.
- `WINDOWS_G_LOCAL_SYNC_SHA256`: **UNVERIFIED — no authenticated Windows file readback**.
- `PG16_OCI_IMAGE_MANIFEST_SHA256`: **EXTERNAL CLAIM ONLY** pending independently authenticated registry descriptor/architecture; do not treat as a source-document SHA.
- `NODE_BASE_IMAGE_DIGEST`, `RUNNER_IMAGE_DIGEST`: **PENDING**.

## R23H outputs

The hashes of the four **new R23H report files** are recorded in the external sidecar `R23H_A23_BUNDLE_SHA256SUMS.txt`, computed **after** writing the four UTF-8 LF files. This avoids a self-referential checksum in this Markdown report. Only the sidecar hashes verify the generated R23H Markdown bytes; they do not authenticate an upstream author/signature or remote publication.

## Reverification instructions (Windows PowerShell)

Use an approved clean clone at the pinned documentation SHA; this command computes hashes and does **not** run Docker or SQL:

```powershell
git checkout --detach cf60d1c047d1aed0b718ae0cf25ac6568bb6b478
Set-Location docs/web-005/agent-reports/A20/R23G-R2
Get-FileHash -Algorithm SHA256 -Path .\PG16_DOCKER_COMPOSE_EXAMPLE.yaml
Get-FileHash -Algorithm SHA256 -Path .\PG16_R23G_R2_SHA256_MANIFEST.md
```

`git checkout` modifies the working tree; run only inside an approved separate disposable clone, never an existing dirty worktree. A23 itself did not run these Windows commands.
