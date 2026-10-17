# WEB-005 / A20 — R23G-R2 SHA256 source and Google Docs logical-readback manifest

**Task:** `WEB-005-T020-A20-R23G-R2` | **Date:** 2026-10-17 Europe/Warsaw | **C01 SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525`. **Verdict:** `PG16_R23G_R2_READY_FOR_INDEPENDENT_QA`; **Execution:** `PG16_EXECUTION_NOT_AUTHORIZED`.

**Hash contract:** These SHA256 are calculated over *canonical GitHub UTF-8 source string bytes* (exact Markdown/YAML/Dockerfile content, no BOM or newline transformation). Git blob SHA1 identifies the immutable source. Google Drive stores corresponding material as **native Google Docs**, not raw `.md` or YAML objects. For **11/11** Drive Docs, direct `get_document` paragraph text returns **exact GitHub source + one Google Docs terminal newline**; remove that one editor-appended character, and the logical UTF-8 source SHA256 equals the listed SHA. This is text fidelity, **not raw cloud file byte equality**. Native Docs `text/plain` export can add BOM and extra line breaks; exported raw byte digest differs; `RAW_CLOUD_BYTES_VERIFIED=NO`. Actual Windows `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION` mirroring was NOT inspected and remains `LOCAL_G_DRIVE_SYNC_UNVERIFIED`.

**Google cloud folder:** https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq

| Artifact | Canonical SHA256 UTF-8 | Git blob SHA1 | Drive native document |
|---|---|---|---|
| `PG16_DOCKER_ISOLATION_PLAN.md` | `c0d87ce6a0e52ec7d6d11e360051c0b77727c11975e358f1fdea1118529493b8` | `ea2bcc674757594d64be529c22fb4a12f80f1194` | [Verified text](https://docs.google.com/document/d/1pq833Ih6pBn9edaY9T3IbwnhoK5i-kPSFRjEp5rO56g/edit) |
| `PG16_RESOURCE_AND_PORT_MANIFEST.md` | `84d2070f1befa92b2f509274da4472e8dddcb1958c046a2a1ee51c09829fd5e6` | `26d4999115b49e443a52aa5d20cd86f7c4f7d747` | [Verified text](https://docs.google.com/document/d/1KQJ3JFlBY3IRGHtq6kETeKhaIP5sM6GsQOIYIA7ZN9E/edit) |
| `PG16_S1_S2_PERMISSION_MATRIX.md` | `5a320b5a6f0a4f6ec8a246a337015e2e708136be3ba41c9503fffa1d2843612c` | `278a90b38be0d128f06ab2df14ea63c9cbd48700` | [Verified text](https://docs.google.com/document/d/1agQ0OU8gH-RXD_2R9D94iqG7IeDbu4cUBms5cm1nJ_0/edit) |
| `PG16_EXECUTION_PHASES_G0_G5.md` | `426a52b42ddbdac54437558873b274db87c4eef3ed539a0539fbe54df12bed68` | `163894a6ede819f6d29f96bfc8c6591d561c5bb8` | [Verified text](https://docs.google.com/document/d/1XWeAA5N6kqFy4C_eTnJ0Y0yhsipY5SvJySD-CtYZc14/edit) |
| `PG16_ROLLBACK_AND_CLEANUP.md` | `cd6fba55e381f9a8322decab714296877096b056a9ae6b115460148417dd466d` | `9728aea99d2b8e4138ffee32cf7c015bcca5e03c` | [Verified text](https://docs.google.com/document/d/1u9gr64DJgOg_DkS9MaSwpkGq0tv718PPXYBpvu-TwC0/edit) |
| `PG16_OWNER_APPROVAL_REQUEST.md` | `fdf07e97ff58bfd53dd25045e3d0885d018f4762cdb0f6e4a460ddf2808ae961` | `1be75931953687cd736c0facaf2d3739d23cc01b` | [Verified text](https://docs.google.com/document/d/12-GZZYJAW9DGJNxvzIxEV1-RnKwHJ0ajbTt88GrOe3k/edit) |
| `PG16_A50_EXECUTION_HANDOFF.md` | `bdb0a303d64dbc0b2ec9bb6756f27b79bf6c06fd86b31b64afd150f7cd741869` | `af6bcbff742c6428328dabdd0c655a2fe39287f5` | [Verified text](https://docs.google.com/document/d/1wp49MmpKcobj9roxjn207h7wGcy-YV3wnUMSE39SgRg/edit) |
| `PG16_DOCKER_COMPOSE_EXAMPLE.yaml` | `7618513028d738fd78cb1c17a9d3bf3f9d3cf61ef8df5e46470bbaba05f9a397` | `000bf75d8d456dcb4657dbf06c8c9f6274918c73` | [Verified text](https://docs.google.com/document/d/1UCyuJSHx9QQnm94GTOOwHkGL0cP-hCLJQqzYU6Gqw4U/edit) |
| `Dockerfile.node22-pnpm10.example` | `9e9104274c37b7c0d7c0d3c693225b6dae70bb149637222634a833c64e5fd513` | `61094e79376e0cee730c6ffdfb540ed60d4f94fa` | [Verified text](https://docs.google.com/document/d/1WfhWBlHx5ECZB7j6piUrztOQzm1kfArfymrh0wUTuog/edit) |
| `PG16_R23G_TO_R23G_R2_DIFF_AND_QA.md` | `b85c51d2a1e53404dcb18e02bb16c6a440db5ae8dd59d936313b6a8cc68ceabb` | `4559e8571ba6e75a3fc85652fba08b9a607d7232` | [Verified text](https://docs.google.com/document/d/1uxq-cxqzmaqOsaUCz_auDU_5mUc8ZdtW83fWYswrOxs/edit) |
| `PG16_R23G_R2_FINAL_QA.md` | `7090371f226a179f376d7c612dc970d4217c6eab6af4c501da97f79d88107793` | `01875975c69a7d72506fe5a1ae44378b8acb7a31` | [Verified text](https://docs.google.com/document/d/1jNiDIEk5TV6WE5ocVnPBsgSVpu9cRPC-wwkI_Ng9R54/edit) |

**Implementation/source evidence:** R2 source files under [GitHub folder](https://github.com/C8LyNn/aplikacja-turnieje/tree/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/R23G-R2), C01 PR60 exact HEAD unchanged. All 11 text copies passed normalized readback. Google export `PG16_DOCKER_COMPOSE_EXAMPLE.yaml` additionally passed **static PyYAML parse** with both ports empty, `network_mode:none` / `service:pg16`, two pinned-platform declarations, `pull_policy:never`, two secrets and one PGDATA volume. Export formatting changed bytes, so this does **not** assert exact original source YAML parser pass by Docker Compose CLI (not run). OCI digest primary registry confirmation and Node image digest are pending; all G0-G5 approvals missing.

**Manifest self-hash:** intentionally excluded from table to avoid self-referential checksum; its GitHub blob SHA1, commit and SHA256 can be recorded externally in Issue #76 or A60 QA after readback.

**No host Docker, SQL, PostgreSQL service, CI, game, merge or live action occurred.**
