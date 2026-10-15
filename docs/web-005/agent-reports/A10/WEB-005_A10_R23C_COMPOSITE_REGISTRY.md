# WEB-005 — A10 / R23C COMPOSITE REGISTRY AND FINAL INTEGRATION MAP

**Task:** `WEB-005-T018-A10-R23C-COMPOSITE-REGISTRY` · **Date:** 2026-10-15, Europe/Warsaw · **APPEND-ONLY DOCUMENTATION ONLY**.

**Verdict:** `R23C_REGISTRY_READY / FINAL_INTEGRATION_PENDING`. **First verifiable candidate exists**: `C01 COMPOSITE_B1_SHA = fa3261b2c9510e110ac9eba21726812d3401a525`. **No final integrated WEB-005 source release**: `C01_API_INTEGRATION_BLOCKED / FINAL_HANDOFF_GO=false / SWARM006_HOLD / RELEASE_NO_GO`.

## 1. Source custody — 25 immutable old packets, five new source packets, one separate integration candidate

The preceding [R23B Markdown](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23B_FINAL_SOURCE_REGISTRY.md) and exact R23B JSON blob `a3437e0b00d922e5999fc2081e9688cb524dd0c8` are preserved. Existing P01–P25 registry identities and original SHA histories remain immutable. I verified all 25 live PRs; all were **OPEN/DRAFT/UNMERGED** and had **unchanged R23B current HEAD SHA** at check time. Unrelated Core Clash PRs #59/#62/#65/#68 are excluded by project scope.

### Historic source packets — all 25 exact HEAD SHA

| Packet | Source PR | Current verified HEAD | C01? |
|---|---|---|---|
| **P01** | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | **YES** |
| **P02** | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | **YES** |
| **P03** | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | NO |
| **P04** | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | NO |
| **P05** | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | NO |
| **P06** | [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee132756ca05b6f2cd1f0cabae823905387` | NO |
| **P07** | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | **YES** |
| **P08** | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | NO |
| **P09** | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | NO |
| **P10** | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | NO |
| **P11** | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | NO |
| **P12** | [#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | NO |
| **P13** | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | NO |
| **P14** | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | NO |
| **P15** | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | NO |
| **P16** | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | NO |
| **P17** | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | NO |
| **P18** | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | NO |
| **P19** | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | NO |
| **P20** | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | NO |
| **P21** | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | NO |
| **P22** | [#55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | NO |
| **P23** | [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | **YES** |
| **P24** | [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | **YES** |
| **P25** | [#58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | **YES** |

### Newly registered independent R23C source packets — append P26–P30

| Packet | Agent / source | Exact HEAD | Git base | Independent A60 |
|---|---|---|---|---|
| **P26** | A80 / [PR#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) (Swiss two-stage caller) | `8c26778c94cd6c96987f3986b651066024f10d4a` | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | **PASS_WITH_CONDITIONS_TEST_SOURCE_ONLY** |
| **P27** | A110 / [PR#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) (Basket CAS frontend draft client) | `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **BLOCKED_FOR_ENABLEMENT** |
| **P28** | A70 / [PR#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) (Strict action-local provenance validator) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **PASS_WITH_CONDITIONS_PURE_SOURCE_ONLY** |
| **P29** | A90 / [PR#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) (Raw-to-validated preclone adapter) | `7490c974b7c84404559fd590bd09817a71c2134f` | `fa3261b2c9510e110ac9eba21726812d3401a525` | **PASS_WITH_CONDITIONS_PURE_SOURCE_ONLY** |
| **P30** | A30 / [PR#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) (Backup ingress security fail-first contract) | `880824f18b8913602955578dfd76eeac7976e32a` | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | **PASS_WITH_CONDITIONS_TEST_CONTRACT_ONLY** |

**Important stacked parents:** P26/PR61 branches from P24/PR57 SHA, and P29/PR66 branches from **C01**; they are not independent branches from the release base. C01/PR60 is the **integration artifact**, not P26 or any other new source ID. The five new source packets are **all outside** the first composite.

## 2. First real composite — immutable source vs integration commit

- **[Integration Draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60)**, branch `integration/web-005/r23c-composite-b1-20261015`, **HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`**, one parent `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Source release tree `5cc19d23cb42cdd09b11f82ad201c56303c9d87c`, constructed composite tree `c19fff1d6b8538dee731ea0daad75bfe568714c3`.
- **Exactly six old source packets:** P01/PR#35 `7cb283aa82273a1e22daf9051a82311eef53760c` (1 files); P02/PR#36 `24fe6c399e3a4fa82c3d96703620097fa941a59a` (4 files); P07/PR#40 `9a8287271299a59fc9291b8d253299a8d109a35d` (3 files); P23/PR#56 `a7f71a7e7efdabd479b358a3cee80bc6359c4321` (2 files); P24/PR#57 `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` (2 files); P25/PR#58 `e8100f7b0c1071c2a98880d4eb7947514fc58185` (2 files).
- **14/14 Git blob SHA-1 matches** exact source-owner heads; **14/14 SHA-256** recalculated on exact composite HEAD bytes, 0 omitted paths, 0 unexpected hunks, **0 manual conflict resolutions**, no dependency/route/schema/SQL modifications or source PR merges.
- **19/25 original source packages absent from C01**: P03/#34, P04/#37, P05/#38, P06/#39, P08/#41, P09/#42, P10/#43, P11/#44, P12/#45, P13/#46, P14/#47, P15/#48, P16/#49, P17/#50, P18/#51, P19/#52, P20/#53, P21/#54, P22/#55.
- **Five additional R23C packets absent from C01**: P26/#61, P27/#63, P28/#64, P29/#66, P30/#67.
- [Composite exact-blob & CI manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_C01_MANIFEST.json) · [A40 source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R23C_COMPOSITE_B1_HANDOFF.md) · [A60 independent composite matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_INTEGRATION_QA_MATRIX.json).

## 3. Native automatic composite CI — actual results, not synthetic

| GitHub CI activity at exact C01 SHA | Measured receipt |
|---|---|
| [Automatic workflow run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) | **FAILURE overall**; no manual rerun by A10 |
| SE safety | **23/23 PASS** |
| Pack19–26 domain Node TAP | **220/220 PASS** |
| Pack19–26 source contracts Node TAP | **72/72 PASS** |
| Pack17 source / fail-closed helpers | **12/12 PASS**, **24/24 PASS** |
| Pack17 PG16 atomic correction | **8/8 PASS** in CI ephemeral PostgreSQL16 (not Basket/Backup PG16) |
| Workspace typecheck | **PASS within C01 workflow** |
| API integration | **EXIT 1 / cause NOT_ISOLATED**; hard blocker `B1-QA-01` |
| Subsequent frontend tests and API/frontend builds | **NOT_EXECUTED** |
| Individually named Backup Strict/Profile and Swiss target suites | **NOT_VERIFIED** |
| A50 locally executed application tests | **0**; runner published, no authorized complete host |

**Independent A60:** 14 source blobs individually checked vs original source PRs; no new transfer defects verified; **SOURCE_INTEGRITY_PASS_WITH_CONDITIONS**, **COMPOSITE INTEGRATION BLOCKED**, release NO_GO. No speculative assignment of API integration exit 1 to Swiss, Backup, PG schema or environment without diagnostic evidence. The C01 success counters do **not** imply whole CI PASS.

## 4. New source QA: conditional scopes and hard P2 safety

- **P26/PR61 (A80):** two Swiss caller stage-scope HTTP/PG16 cases authored, **NOT_EXECUTED**. Test accesses destructive test-schema reset; requires A00/A20 physically approved isolated PG16. A60 PASS WITH CONDITIONS for test source only.
- **P27/PR63 (A110):** six new frontend files, **28 tests AUTHORED but native NOT_EXECUTED**. A60 **BLOCKED_FOR_ENABLEMENT** for P2: refreshRemote GET 401/403 leaves privileged draft and ETag after permission revoked. Currently feature-gated disabled and unmounted; fix before any enablement.
- **P28/PR64 (A70):** 18 provenance tests authored, no native receipts. A60 source PASS WITH CONDITIONS; action-local closure is pure, not wired to importer or P29 real validation ports.
- **P29/PR66 (A90):** 15 preclone adapter cases authored, no targeted native TAP. A60 PASS WITH CONDITIONS for pure adapter, NOT_WIRED; PR66 CI run 38742658793 fails at API integration exit 1; base is C01.
- **P30/PR67 (A30):** 13 fail-first pure and six PG16 contract cases authored (intentionally future RED or default PG16 SKIP), **NOT_EXECUTED** as approved native. Independent A60 accepts the bounded security contract design only, not issuer/raw-ingress implementation.

## 5. Exact Git blob SHA-1 and SHA-256 files (C01 14 + new source 16)

All 30 digests were read from exact pinned GitHub file refs. Git blob SHA-1 was checked through GitHub file metadata; SHA-256 was calculated from exact UTF-8 bytes and a standard `abc` self-test. These checksum rows certify source bytes, not behavior/test execution. The 13-byte-source P05 migration-ledger data from R23B remains preserved by reference, not overwritten.

| Origin | File at source/composite exact SHA | Git blob SHA-1 | SHA-256 | Bytes |
|---|---|---|---|---:|
| C01 / PR35 | [`qa/pack19/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack19/source-contract.test.mjs) | `5726986dca6a6fd7309bb883eb1106d2d19fb14e` | `4654b7f7e8facaa9ef2028e98d188b89c51d927042415dd9512f509e7ffa42f8` | 2375 |
| C01 / PR36 | [`qa/pack20/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack20/source-contract.test.mjs) | `42359d5116038f515a4b8504bad2fcc0f0df5b26` | `9e9b2ce252e3364457d7b99884fb633e13bb4f430cc040e99756d03913ba1f65` | 5131 |
| C01 / PR36 | [`qa/pack21/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack21/source-contract.test.mjs) | `38d8a96870b31c604b86d010d53b5f40dbd359d6` | `cc850a71cb3f3e2025ba70fae0a10de6bf34cb980870b1c7bc2db1a04fd870d1` | 2593 |
| C01 / PR36 | [`qa/pack25/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack25/source-contract.test.mjs) | `f38fe8b7af53a43ae560fe26fed1682ddcb7f608` | `58323720dbd8af2878e46baf237982c6b443d2122ea096f495f05825d2170274` | 8595 |
| C01 / PR36 | [`qa/pack26/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack26/source-contract.test.mjs) | `dd06d0cfba9db9c772e5559e0fbe1915e8e51385` | `7f502ac443299cc4924a22bcd8c3c9b26fd3c3015f39611f40eb7209a0dbedff` | 3940 |
| C01 / PR40 | [`qa/pack17/gate-contract.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack17/gate-contract.mjs) | `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` | `bccf617eb0d16fba0389da944723924c00e0f9e11a81fd8b1c4b0ef80cd6fa52` | 3738 |
| C01 / PR40 | [`qa/pack17/gate-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack17/gate-contract.test.mjs) | `f59a65509009fbdf74a38239693238704b1af583` | `ffa8b6056bf0ebd3ab0426b9960330c5b3e1dda496ca56b7d2e2b0abcd622e14` | 3963 |
| C01 / PR40 | [`qa/pack17/run-gates.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/qa/pack17/run-gates.mjs) | `8779ab2c1588cc62a2f3c5f63c57be9b55e86043` | `182376fd3ed91151a96940aa311c5307cf25863b914c648be8f4a591b5fe02a5` | 4748 |
| C01 / PR56 | [`artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts) | `595c68b87a5361623bef6293519ed668e9d4e493` | `98530f871f27a9851fe89571f56fd6c9313816f1b8f0c4baea8986ca9350c2d6` | 13944 |
| C01 / PR56 | [`artifacts/api-server/test/backup-v3-strict-policy.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/backup-v3-strict-policy.test.ts) | `d1242b84c9b2db269ab6864459d8d11656d4fe8c` | `11aa4c9754829771ab40ad39bbbdd4e100591f958bad7407ba42f137b9eac59f` | 14470 |
| C01 / PR57 | [`artifacts/api-server/src/domain/tournament/swiss.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/src/domain/tournament/swiss.ts) | `5e7fa424371c10a0360e471bb050afa7096d361b` | `984c9cff786260b3b3501f69326e8c113c4c47be200b5f8358a85aa05b7d1775` | 7944 |
| C01 / PR57 | [`artifacts/api-server/test/swiss.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/swiss.test.ts) | `150d34619abb83d12bb351a7aedb6e377d5d1332` | `cc5ab1af1b8a6cbfd715c4374b8a900aead89edb3a5e04350fae815d9ca3effc` | 8901 |
| C01 / PR58 | [`artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts) | `518526d8d9ff2cef368261788e12c9f8290754f5` | `ea18355c76d38b7e8c521fdf59dfe51d636c48e3f34bc513987525ff5c3c419d` | 18827 |
| C01 / PR58 | [`artifacts/api-server/test/backup-v3-profile-gate.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/backup-v3-profile-gate.test.ts) | `04f6dc8834f11d63f1b3710ae75c4ad7f6419f19` | `1273c0a144a4a4d08ba2679c5857f87bc7824c7769f7ee80294d9327802c3261` | 16848 |
| P26 / PR61 | [`artifacts/api-server/test/swiss-caller-stage-scope.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/8c26778c94cd6c96987f3986b651066024f10d4a/artifacts/api-server/test/swiss-caller-stage-scope.integration.test.ts) | `7a15d5aa14d394eede4b54aed87ec109064ea479` | `fc7de663b2160d311376e10764c9f43ec0ce4ca48606faca3d7bde6c0deb92d0` | 12462 |
| P27 / PR63 | [`artifacts/tournament-manager/src/components/basket-cas-conflict-review.test.tsx`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/components/basket-cas-conflict-review.test.tsx) | `4920d1bb4ac5d67a76241391c07cb373d3343eab` | `6d709da4a37fd7012610df61165f01ea18cc8b0d435beb1b2ef129d44341200e` | 3952 |
| P27 / PR63 | [`artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx) | `f8010619ba9da4d358d40d2def621b56189f6193` | `4fdc68facd5225b54b9f7aa46ad1cc0a36db20604502457fccd2be5a33aba37e` | 4142 |
| P27 / PR63 | [`artifacts/tournament-manager/src/lib/stage-basket-cas-client.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-client.test.ts) | `1d1473901d68db148a100079c96f3ca2c5e80adb` | `59ec9c97dce8d3c266e85beca9acf994f15c66d35ec56fa3b7d72af122dc44f8` | 7994 |
| P27 / PR63 | [`artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts) | `4fca09e22ef58fc38a2ca34a8386a6fadad06ae8` | `d612dbffe6c9ae14af44df67a2416a9733ae547aca5acfeaa54581f17af79ac6` | 8759 |
| P27 / PR63 | [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts) | `c81b3d76dc6d68d284c4aadd6ac6d14ac7f07612` | `e02d497033e9e7b61f6081d6ad63f092839df1df0a597b30f16ce55713595706` | 12417 |
| P27 / PR63 | [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts) | `1bfb8deeb06fc8f501176e8757810f7f8936202e` | `edf1bb2f63bf0061a878aadc407076662dedf1126d879e0ed5918216388dcf13` | 9748 |
| P28 / PR64 | [`artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/7837e412626e88761c70f1a2ceeb822d7ed101e1/artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts) | `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c` | `065addd4593ee646a249033565947fa7cef37caf9c3b609bb02126ed298de0c7` | 27228 |
| P28 / PR64 | [`artifacts/api-server/test/backup-v3-action-provenance.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/7837e412626e88761c70f1a2ceeb822d7ed101e1/artifacts/api-server/test/backup-v3-action-provenance.test.ts) | `f65d0be0fec76a7daca2331e5bbd6d6fdbf79a6c` | `a2e22881c37f2144e25a92faa26be590d24e949937a783b803f8feb73ed655eb` | 13098 |
| P28 / PR64 | [`docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/7837e412626e88761c70f1a2ceeb822d7ed101e1/docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md) | `308c6a57363a99358803f6b81b9696423ce0e934` | `1be8644416887292e5078376b711b5976d54b2b51a538dfbe83b8d78e4b188e0` | 13288 |
| P29 / PR66 | [`artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/7490c974b7c84404559fd590bd09817a71c2134f/artifacts/api-server/src/application/backups/backup-preclone-adapter.ts) | `c02ca0aa877017456142f081eff9e9f877522ca2` | `5d307cf4ef86b17ce7c0ad766d73bc8ca3ec86e04c3d785b7ef04ccba3c550c2` | 6471 |
| P29 / PR66 | [`artifacts/api-server/test/backup-preclone-adapter.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/7490c974b7c84404559fd590bd09817a71c2134f/artifacts/api-server/test/backup-preclone-adapter.test.ts) | `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d` | `b307dccf3fb2bf2036ef8e5240d01c7f168838fcca2e0c75157c9c92cfb88992` | 11658 |
| P30 / PR67 | [`artifacts/api-server/test/backup-v3-ingress-security.contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/artifacts/api-server/test/backup-v3-ingress-security.contract.test.mjs) | `957141164ab45a9a9bca0b92cb33ae99b964fefb` | `7ef216d0fb5b7f8c826406f0640baa6a5df73f190f9c6abc3481d348e5a983b3` | 10278 |
| P30 / PR67 | [`artifacts/api-server/test/backup-v3-ingress-security.pg16.contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/artifacts/api-server/test/backup-v3-ingress-security.pg16.contract.test.mjs) | `110fcc827eac46d77f4bfd52d77e572ccd31c81f` | `f29310971d0ad3695f2fc5eb8f136836688f4c0292fe9b1ef3afd69a46eacee3` | 6924 |
| P30 / PR67 | [`artifacts/api-server/test/fixtures/backup-v3-ingress-security.v1.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/artifacts/api-server/test/fixtures/backup-v3-ingress-security.v1.mjs) | `69ee72d246f3b4d49219e62f43ce4d5e911a96f4` | `13c83d4c84b14a4d5c69e8e52b4ca1bcd26631bbc37f1c904fc03ab91319924e` | 5857 |
| P30 / PR67 | [`docs/web-005/agent-reports/A30/WEB-005_A30_R23C_BACKUP_INGRESS_SECURITY_CONTRACT.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/docs/web-005/agent-reports/A30/WEB-005_A30_R23C_BACKUP_INGRESS_SECURITY_CONTRACT.md) | `85541cad621231a3077b384b9c54f479cc2bf260` | `1e2a80b747e0f3aba54cbdf0df43668092911b209f63e6e2cfa0143513914cb3` | 16737 |

## 6. Conflicts and integration dependency DAG

**15 historical direct file-conflict pairs** are still `UNRESOLVED`; **0 resolved by C01** because neither side of an old overlapping pair was jointly composed and independently tested. The first 6-source integration deliberately used disjoint source paths. New R23C PRs have zero direct changed-file collisions in their own 16-path set; inherited Git ancestry for stacked PR61/PR66 is an **integration dependency**, not a new source-file conflict.

Detailed 15-pair matrix with touched paths, owners and semantic edges: [WEB-005_A10_R23C_CONFLICT_DAG.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_CONFLICT_DAG.json).

Priority conflict clusters: `routes/tournaments.ts` (P06/P09/P11/P13/P18); `backup-v3.ts` and basket-route integration test (P08/P15); `tournament-detail.tsx` (P10/P17/P21); `stage-progress-view.tsx` (P14/P21); and global Undo `revert-match.integration.test.ts` (P09/P18). Mark RESOLVED only after joint exact-composite SHA + native/semantic tests and A60 independent hunk review. Do not claim merely because a candidate PR exists.

## 7. Execution-ready integration roadmap (not an integration authorization)

**B02 — CI & API integration repair:** lead A40/A50/A60; stage inputs C01 PR60 exact failed integration TAP root cause isolate, A50 exact full source checkout Native runner and per-suite TAP, Pack17 full fail-closed parser review. Requires C01. STOPs: B1-QA-01.
**B03 — Tournament API routes + Undo:** lead A70/A100/A30/A60; stage inputs P06 PR39, P09 PR42, P11 PR44, P13 PR46, P18 PR51, P28 PR64. Requires domain acceptance, routes/tournaments.ts joint conflict handling, exact history and LIFO semantics. STOPs: 7 pairwise routes path overlaps + shared Undo test.
**B04 — Backup V3 qualification, transport, action provenance:** lead A90/A70/A30/A20/A60; stage inputs P08 PR41, P15 PR48, C01 P23 PR56/P25 PR58, P28 PR64, P29 PR66, P30 PR67. Requires real issuer/anti-downgrade, raw-before-Zod, full V2/V3 validators, clone-local action ID closure, zero-write HTTP 400/rollback. STOPs: same backup-v3.ts and integration test conflict; not-wired modules; unexecuted fail-first security.
**B05 — Basket CAS + DB schema/migrations:** lead A20/A110/A00/A60; stage inputs P05 PR38, P22 PR55, P27 PR63. Requires A00 D01-D04 signed, physical PG16 ledger verification, T055 numeric id reserved only after graph, server ETag/If-Match D1-D5, writer lock order and deadlock tests. STOPs: A110 P2 auth-revoked draft; schema migration absent.
**B06 — Frontend tournament detail, stage progress, standings:** lead A110/A120/A80/A60; stage inputs P10 PR43, P17 PR50, P21 PR54, P14 PR47, P24 PR57, P26 PR61, P27 PR63 (only after FIX). Requires tournament-detail.tsx 3-way reconciliation, stage-progress-view.tsx reconciliation, Swiss stage caller/Undo API stabilization, auth revocation client fix, native/browser tests. STOPs: frontend overlap pairs; disabled client privacy P2.
**B07 — Security, auxiliary and release packaging:** lead A00/A30/A100/A50/A60; stage inputs P03 PR34, P04 PR37, P16 PR49, P19 PR52, P20 PR53. Requires independent HTTP checks, session/private cache, security regression, remaining original P01-P25 tasks, WEB004 38-case closure. STOPs: no full CI/browser integrated SHA.

Detailed executable gate ordering and no-overlap/staging rules: [Future integration batches](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_FUTURE_INTEGRATION_BATCHES.md). The next action is A50/A00 diagnosis of current API integration exit 1, not a speculative merge.

## 8. Test debt / owner gates / security nontransferability

**Mandatory WEB-005 source:** isolate B1 API failure, fix P27 revoked-auth draft P2 before activation, implement trusted Backup security and actual ingress/Undo/rollback with A70/A90 compatibility, implement verified server Basket CAS, reconcile remaining P01–P30 source behavior/conflicts.

**Potential EXEC-B debt ONLY after approved WEB-005 completion:** full integrated exact composite native CI, owner-certified disposable PG16 end-to-end, browser/rendering regression, performance/deploy rehearsal and explicit rollback acceptance. Never waive a known failing gate by labeling it future work without signed owner disposition.

**A00/HQ:** D01–D04 pending approvals, physical DB/safe test GO, authorized integration branch actions, original WEB004 38-case provenance (29 derived identifiers, **nine authentic IDs missing**, zero signed per-case dispositions), and explicit only-owner FINAL_HANDOFF_GO.

**Nontransferable security:** P27 401/403 draft leak, modern→legacy downgrade, untrusted issuer, raw-before-Zod anti-stripping, cross-tenant or action-local Undo mismatch, import/rollback authority and any P0/P1 security/integrity defects. These must be fixed or owner-dispositioned under a documented refusal to transfer; never silently deferred.

Full classification and conditions: [test debt report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_TEST_DEBT_AND_TRANSFER_GATES.md).

## 9. Explicit future FINAL_HANDOFF_GO gate list

- **G01 [MANDATORY_WEB005_SOURCE] — A00/A50:** Resolve B1-QA-01 API integration exit 1 at exact SHA; no green inference.
- **G02 [MANDATORY_WEB005_SOURCE] — A110/A60:** Fix P27 GET 401/403 revoked-auth privileged draft retention, test fail-first, new exact-SHA QA before enablement.
- **G03 [MANDATORY_WEB005_SOURCE] — A90/A70/A30:** Implement and independently QA real Backup ingress/importer/issuer/anti-downgrade, strict/legacy full validation, action-local Undo, raw-before-Zod, preclone no-write and rollback; pure modules alone not enough.
- **G04 [MANDATORY_WEB005_SOURCE] — A20/A110/A00:** Finalize Basket CAS server persistence, lock/revision/epoch D1-D5, stage/roster writer coverage, frontend D6 guarded enablement; migration source planning.
- **G05 [MANDATORY_WEB005_SOURCE] — A00/owners:** Reconcile all 19 omitted P01-P25 packets and P26-P30 source work, 15 overlap pairs in an authorized integration sequence with QA of resolutions.
- **G06 [HQ_OWNER] — A00/HQ:** Sign migration D01-D04 with physical ledger read scope and exclusive allocator; no number guessed.
- **G07 [HQ_OWNER] — A00/HQ:** Original WEB004 38-case matrix 9 missing canonical identifiers handled only via verified source or owner-signed dispositions, not invented PASS.
- **G08 [EXEC_B_TRANSFERABLE_DEBT_AFTER_SOURCE_GATE] — EXEC-B/A50/A60:** Full integrated CI rerun, approved disposable PG16 end-to-end, frontend browser matrix, cross-package performance/rollback after exact source composite pinned, only if risk/ownership accepted by HQ.
- **G09 [SECURITY_NONTRANSFERABLE] — A30/A90/A70/A00:** No unresolved privilege/auth-bypass, modern→legacy downgrade, unsafe Undo ID, tenant scope, unauthenticated importer, 401/403 stale privileged drafts before transfer.
- **G10 [FINAL_APPROVAL] — A00/HQ:** Owner-approved backlog and limits, immutable full source registry/composite and rollback provenance, A60 source QA + documented EXEC-B scope; explicit signed FINAL_HANDOFF_GO only by owner.

**No A10 grant of FINAL_HANDOFF_GO.** A00/HQ must sign the scope disposition and execute a separate authorization; the current composite is an integration candidate with a FAILED CI.

## 10. A10 → A00 handoff and immutable deliverables

- [R23C central registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_REGISTRY.json) — 25 original source SHAs + P26–P30 + C01 exact source/CI.
- [C01 composite SHA manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_C01_MANIFEST.json).
- [15-conflict DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_CONFLICT_DAG.json).
- [Test debt/security transfer](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_TEST_DEBT_AND_TRANSFER_GATES.md).
- [Future batch integration order](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_FUTURE_INTEGRATION_BATCHES.md).

**Final:** `R23C_REGISTRY_READY / FINAL_INTEGRATION_PENDING / COMPOSITE_B1_EXISTS / C01_INTEGRATION_BLOCKED / ALL_15_CONFLICT_PAIRS_UNRESOLVED / FINAL_HANDOFF_GO=false / RELEASE_NO_GO / SWARM006_HOLD`.

No application code change, merge, rebase, SQL/DDL, database reset, deployment, manual paid workflow or SWARM-006 activation by A10.
