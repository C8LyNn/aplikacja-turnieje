# WEB-005 A20 R23G — FINAL DOCKER PG16 ISOLATION DESIGN QA / A00 HANDOFF

**Task:** WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION. **Date:** 2026-10-17 Europe/Warsaw. **Exact C01 PR60 SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` (OPEN DRAFT). **State:** `PG16_DOCKER_ISOLATION_PLAN_READY_FOR_A00_REVIEW / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.

**Evidence read:** A00 [Docker preflight decision](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6232716514), Google Drive [WEB005_DOCKER_FINAL_PREFLIGHT.txt](https://drive.google.com/file/d/1nNSTAcsJWTPyUTm6YGz-oGAOENLTAdW-/view). Docker Linux Engine 29.8.2 available; no objects listed in sampled active context; Windows `postgresql-x64-16` running on 127.0.0.1 and ::1 port 5432. **No Docker image pull/run/compose or PostgreSQL SQL performed** by A20. A50 DB-free 426/426 and A60 DBFREE_QA_ACCEPTED remain *only DB-free acceptance*. GH run 38736073793 API Integration exit 1 first actual failing test unknown.

**Repo R23G planning documents:** [isolation](./PG16_DOCKER_ISOLATION_PLAN.md), [resources](./PG16_RESOURCE_AND_PORT_MANIFEST.md), [S1/S2](./PG16_S1_S2_PERMISSION_MATRIX.md), [G0–G5](./PG16_EXECUTION_PHASES_G0_G5.md), [cleanup](./PG16_ROLLBACK_AND_CLEANUP.md), [owner signature request](./PG16_OWNER_APPROVAL_REQUEST.md), [A50 handoff](./PG16_A50_EXECUTION_HANDOFF.md), [Compose design](./PG16_DOCKER_COMPOSE.example.yaml).

**Full detailed local package uploaded to connected Drive**: [WEB005_A20_R23G_DOCKER_ISOLATION_DESIGN.zip](https://drive.google.com/file/d/1gN1vJZlWtm-X3U_lZrESrfbA8h2W1gHX/view). Exact ZIP SHA256 **`28e92c5094a89d7d1b5d0d9e09c20a9c100469501ecd9b6b235adb6c9122d335`**, 19,690 bytes; contains 7 full detailed Markdown designs, Compose proposal, file-hash JSON and QA final report. **Remote Drive download explicitly performed; downloaded 19,690-byte archive SHA256 matched local original 1:1, ZIP CRC test PASS. CLOUD_UPLOAD_AND_REMOTE_BYTE_SHA_VERIFIED.** Windows G: desktop mirror sync **NOT VERIFIED**, because this runtime has no access to operator's Windows G: mount. Drive folder ID `1aZxxG11bF4QtmQyZQpiqSdUAHtWUJi36` confirmed as upload target by provider; operator must separately verify local mirror path `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION`.

**Full local-file SHA256 (not the separate shorter GitHub summary bytes):**
- `PG16_DOCKER_ISOLATION_PLAN.md` `7cc65563ffa5cc8a1b2e5f1142a50a9deea1f19fe26fbf02a7bb88bda6797f2a`
- `PG16_RESOURCE_AND_PORT_MANIFEST.md` `8d1025815f04dd713ddd66a9626110fec5de22b8095e4e83473edb9012261e0d`
- `PG16_S1_S2_PERMISSION_MATRIX.md` `ea83b9aa9c61117014cf3409836a03c4fd99f1a440c3ecb981dc7ed428066cbf`
- `PG16_EXECUTION_PHASES_G0_G5.md` `23e344a5b8bbccfab9e818c6d342d2db1343d6ce4f8b84246951d147c15f06a0`
- `PG16_ROLLBACK_AND_CLEANUP.md` `a240365e084c74bb645817b8c90165c124fd0bdd3b5084eb3fb1fd381785701b`
- `PG16_OWNER_APPROVAL_REQUEST.md` `b17e288383f7557c06fa1a987dd8244e1e3741666f00829f0d17ef5119c14d76`
- `PG16_A50_EXECUTION_HANDOFF.md` `5befb0a39621fd5af2f57576cbc58cc2d79793b57974bbea416c7f159c81c2fa`
- `PG16_DOCKER_COMPOSE.example.yaml` `14b100861b028413cbb13342b960cc38a35d4eae0c4dc258c4a0ff2b66fd96aa`

**Important concurrent architectural difference requiring A00 design selection:** the GitHub [owner request](./PG16_OWNER_APPROVAL_REQUEST.md) was already present and was **not overwritten**. It prefers *no Windows host port*, network namespace shared by PG16 and runner and PG internal nondefault 55432. A20 alternative proposes an explicitly loopback-only Windows host port **55439** to preserve existing Windows A50 runner C01, because catalog fixture needs localhost and port not 5432. **Neither topology has been executed; do not mix the two Compose/networking models.** A00 must choose Option A (containerized runner, no port) or Option B (Windows A50 + signed loopback port exception) before any G1. Both need immutable image digest, actual no-production route proof, volume/PGDATA ownership and validated test-role configuration.

**Destructive scopes:** S1 exactly owned `tm_test_<nonce>` schema DROP/CREATE+test 0001–0028. S2 separately `CREATEDB` + 3 `tm_catalog_test_<16hex>_{dev,prod,fresh}` CREATE and DROP DATABASE WITH (FORCE). PostgreSQL CREATEDB is **cluster-wide**, thus only an exclusively disposable data-free instance is acceptable. G0 docs only; G1 image/container, G2 read-only catalog, G3-S1/G3-S2 distinct DDL approval, G4 exact full API test and evidence, G5 exact-ID cleanup. Each state-changing phase needs **three independently signed permissions (A00/HQ, A20, host operator)**. R23G documentation and A00's infrastructure preflight **do not** provide any of those permissions.

**QA limitations:** source PR SHA read through GitHub; local full document hashes through local Python; upload to Drive then remote byte readback and ZIP CRC; **no native Docker config/Compose runtime, host Windows loopback, source API or PostgreSQL integration test executed**. The Compose has an intentionally invalid digest placeholder and cannot be deployed as-is. No games/Unity/Replit/CI, merge, SQL, DB reset, Docker cleanup or production action.

**Decision:** `PG16_DOCKER_ISOLATION_PLAN_READY_FOR_A00_REVIEW`. **Execution:** `PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
