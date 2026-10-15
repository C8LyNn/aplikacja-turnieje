# WEB-005 — A10 / R23B SOURCE REGISTRY CLOSEOUT

**Task:** `WEB-005-T018-A10-R23B-REGISTRY-CLOSEOUT` · **Agent:** A10 · **Date:** 2026-10-15 Europe/Warsaw · **Mode:** APPEND-ONLY DOCUMENTATION.

**Formal decision: `R23B_REGISTRY_COMPLETE / INTEGRATION_GATE_PENDING`.**

**Integration identity: `NO_COMPOSITE_SHA`.** This is a finished R23B *source registry and two scoped fixes*, not a complete WEB-005 implementation, not a signed `FINAL_HANDOFF_GO`, not a release, and not a SWARM-006 activation. All 25 PR candidates are **OPEN / DRAFT / UNMERGED** on pinned release baseline `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

## 1. Append-only source identity and exact two revisions

Original P01–P24 registry and [R23A 25-packet source registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23A_FINAL_SOURCE_REGISTRY.md) remain unchanged. The original R23A JSON blob is `c06b0ac5ef2b2c8b635cfdfcde71663893a28811`. This R23B document introduces **NO new Pxx**. R23B modifies only existing P02 / PR36 and P25 / PR58, while P05 / PR38 stays unchanged; P23 / PR56 previous P23-01 correction is historical, not a new R23B revision.

| Packet | Prior exact SHA (R23A) | R23B live HEAD | Delta | Independent A60 |
|---|---|---|---|---|
| **P02 / [PR36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36)** | `4be68fdd48ee3529029dc4dd2952780ba37853e7` | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | [2 commits, only Pack25 +53/−2](https://github.com/C8LyNn/aplikacja-turnieje/compare/4be68fdd48ee3529029dc4dd2952780ba37853e7...24fe6c399e3a4fa82c3d96703620097fa941a59a) | **PASS WITH CONDITIONS**; P36-P2-01 **SOURCE_FIXED** |
| **P25 / [PR58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58)** | `14204bc9ec24f5902fddc3deb48d7592747d450a` | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | [3 commits, both preflight files](https://github.com/C8LyNn/aplikacja-turnieje/compare/14204bc9ec24f5902fddc3deb48d7592747d450a...e8100f7b0c1071c2a98880d4eb7947514fc58185) | **PASS WITH CONDITIONS**; P58-P2-01 **SOURCE_FIXED** |
| **P05 / [PR38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38)** | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | same `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | No commit change, 7-file source proposal untouched | D01–D04 **OWNER_PENDING**, not SQL approved |

### Immutable history

- P02 historical original `85ad0b86136fc3491c9ef18663d9b01396179349`; intermediate R23A `4be68fdd48ee3529029dc4dd2952780ba37853e7`; R23B `24fe6c399e3a4fa82c3d96703620097fa941a59a`. **All preserved separately.**
- P25 originally registered in R23A at `14204bc9ec24f5902fddc3deb48d7592747d450a`; R23B current `e8100f7b0c1071c2a98880d4eb7947514fc58185`. Both preserved.
- P05 current and historical `2d36864f4d2f1c838073f387fd3c8efb3378c43b` unchanged; no invented migration reservation.
- P23 original `77707092202ca79277de7bc57cc4e37e4c033171`; P23-01 corrected `a7f71a7e7efdabd479b358a3cee80bc6359c4321`; not modified by R23B. A60 earlier 22/22 isolated transpiled tests, no full native integration.

## 2. Complete 25-candidate live PR identity ledger

This is an identity/status check, NOT 25 new independent QA approvals. Earlier per-packet source-level QA applies only to its reviewed exact SHA; changed heads require their own new A60 verdict.

| Packet | PR | Original registered HEAD | Live HEAD on 2026-10-15 | State |
|---|---|---|---|---|
| **P01** | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | `7cb283aa82273a1e22daf9051a82311eef53760c` | OPEN / DRAFT / UNMERGED |
| **P02** | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136fc3491c9ef18663d9b01396179349` | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | OPEN / DRAFT / UNMERGED · revised |
| **P03** | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | OPEN / DRAFT / UNMERGED |
| **P04** | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | OPEN / DRAFT / UNMERGED |
| **P05** | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | OPEN / DRAFT / UNMERGED |
| **P06** | [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee132756ca05b6f2cd1f0cabae823905387` | `16053ee132756ca05b6f2cd1f0cabae823905387` | OPEN / DRAFT / UNMERGED |
| **P07** | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | `9a8287271299a59fc9291b8d253299a8d109a35d` | OPEN / DRAFT / UNMERGED |
| **P08** | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | OPEN / DRAFT / UNMERGED |
| **P09** | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | OPEN / DRAFT / UNMERGED |
| **P10** | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | OPEN / DRAFT / UNMERGED |
| **P11** | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | `2f0187b7242681c394c09058b5ef647667206bd6` | OPEN / DRAFT / UNMERGED |
| **P12** | [#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | OPEN / DRAFT / UNMERGED |
| **P13** | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | OPEN / DRAFT / UNMERGED |
| **P14** | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | OPEN / DRAFT / UNMERGED |
| **P15** | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | OPEN / DRAFT / UNMERGED |
| **P16** | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | `99298b81501c3e7764d653604923522a19b9f05c` | OPEN / DRAFT / UNMERGED |
| **P17** | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | `5457a74187edc263730c3a4b25a663bdf5531ee9` | OPEN / DRAFT / UNMERGED |
| **P18** | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | OPEN / DRAFT / UNMERGED |
| **P19** | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | OPEN / DRAFT / UNMERGED |
| **P20** | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | OPEN / DRAFT / UNMERGED |
| **P21** | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | OPEN / DRAFT / UNMERGED |
| **P22** | [#55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | OPEN / DRAFT / UNMERGED |
| **P23** | [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `77707092202ca79277de7bc57cc4e37e4c033171` | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | OPEN / DRAFT / UNMERGED · revised |
| **P24** | [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | OPEN / DRAFT / UNMERGED |
| **P25** | [#58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `14204bc9ec24f5902fddc3deb48d7592747d450a` | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | OPEN / DRAFT / UNMERGED · revised |

## 3. Exact-SHA source manifest — all 13 independently read files

Git blob SHA-1 values were read from GitHub's exact-HEAD file metadata. SHA-256 was calculated over the exact fetched UTF-8 source content, with the standard `abc` SHA-256 self-test passing. These are **source digests**, not test/build/artifact attestations. P02 has three byte-identical files carried forward and one changed file; P25 has two R23B modified files; P05 is an unchanged seven-file validator proposal.

| Packet | Exact-HEAD file | Git blob SHA-1 | UTF-8 SHA-256 | Size (bytes) |
|---|---|---|---|---:|
| P02 | [`qa/pack20/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/24fe6c399e3a4fa82c3d96703620097fa941a59a/qa/pack20/source-contract.test.mjs) | `42359d5116038f515a4b8504bad2fcc0f0df5b26` | `9e9b2ce252e3364457d7b99884fb633e13bb4f430cc040e99756d03913ba1f65` | 5131 |
| P02 | [`qa/pack21/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/24fe6c399e3a4fa82c3d96703620097fa941a59a/qa/pack21/source-contract.test.mjs) | `38d8a96870b31c604b86d010d53b5f40dbd359d6` | `cc850a71cb3f3e2025ba70fae0a10de6bf34cb980870b1c7bc2db1a04fd870d1` | 2593 |
| P02 | [`qa/pack25/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/24fe6c399e3a4fa82c3d96703620097fa941a59a/qa/pack25/source-contract.test.mjs) | `f38fe8b7af53a43ae560fe26fed1682ddcb7f608` | `58323720dbd8af2878e46baf237982c6b443d2122ea096f495f05825d2170274` | 8595 |
| P02 | [`qa/pack26/source-contract.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/24fe6c399e3a4fa82c3d96703620097fa941a59a/qa/pack26/source-contract.test.mjs) | `dd06d0cfba9db9c772e5559e0fbe1915e8e51385` | `7f502ac443299cc4924a22bcd8c3c9b26fd3c3015f39611f40eb7209a0dbedff` | 3940 |
| P25 | [`artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/e8100f7b0c1071c2a98880d4eb7947514fc58185/artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts) | `518526d8d9ff2cef368261788e12c9f8290754f5` | `ea18355c76d38b7e8c521fdf59dfe51d636c48e3f34bc513987525ff5c3c419d` | 18827 |
| P25 | [`artifacts/api-server/test/backup-v3-profile-gate.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/e8100f7b0c1071c2a98880d4eb7947514fc58185/artifacts/api-server/test/backup-v3-profile-gate.test.ts) | `04f6dc8834f11d63f1b3710ae75c4ad7f6419f19` | `1273c0a144a4d08ba2679c5857f87bc7824c7769f7ee80294d9327802c3261` | 16848 |
| P05 | [`lib/db/migration-ledger-validator/README.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/README.md) | `d68102bf577b6e78216032efb0cd996097cf34d8` | `3c35c6c55dc6cd7bb0a8a43ca8105d1b07732c5224f63b774d5b7203b02e79c6` | 3221 |
| P05 | [`lib/db/migration-ledger-validator/manifest.proposal.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/manifest.proposal.json) | `28f493263a2cbfb919db1f99b220058175b46ba0` | `261efafcb8bebbc9c98631a99c9410e4e6e2751480bd7d6ba7e9c773661dc51b` | 14712 |
| P05 | [`lib/db/migration-ledger-validator/source-snapshots.editor.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/source-snapshots.editor.json) | `d73453363928c31bd452c1fa30ac726613708e17` | `6f5cd72fb6a072133d622b3d77fa1ff98e532f515cb7309d9ef5d07d82cfb026` | 11978 |
| P05 | [`lib/db/migration-ledger-validator/synthetic-fixtures.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/synthetic-fixtures.json) | `55ba08be665b12158205473fabe16901d7926667` | `2c2be4ae115fbcd18c62ed45bcb7c1e67f26e198a9af6c641eda1b90cf0dd55c` | 2846 |
| P05 | [`lib/db/migration-ledger-validator/synthetic-history.json`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/synthetic-history.json) | `f7898bdec530e91ec5215f464e1461512c4233be` | `0b59d6fc3eb0db564c92c87b8be0438914e61ccf11494944651d7fa025448ef1` | 171 |
| P05 | [`lib/db/migration-ledger-validator/validate.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/validate.mjs) | `430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e` | `0f16bcc92fdc219441546ebc8712cd56ce78f011c7ec441077893cc4d26c2e6d` | 13863 |
| P05 | [`lib/db/migration-ledger-validator/validate.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/2d36864f4d2f1c838073f387fd3c8efb3378c43b/lib/db/migration-ledger-validator/validate.test.mjs) | `96c3d6b5d3f7ff9c10c154de0dc7c04374f61917` | `c07cdb50f22c29ecb499536f1cd0ab32574dca05a6674130e6edddf3d92139ab` | 9141 |

[Downloadable machine source SHA manifest as GitHub JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23B_EXACT_SHA_MANIFEST.json). Older P01–P24 digest history is referenced in the immutable earlier manifest; it was not silently recomputed or overwritten.

## 4. Independent A60 QA vs execution provenance — non-interchangeable statuses

| Scope | SOURCE QA | SYNTHETIC / bounded execution | NATIVE exact-head | Current exact-head GitHub CI | PG16 |
|---|---|---|---|---|---|
| **P02 / PR36 Pack25** | **SOURCE_ACCEPTED_SCOPED / PASS WITH CONDITIONS** on `24fe6c…`; old P36-P2-01 fixed | A40 RED 3 expected FAIL / exit 1; A40 GREEN 20/20, prior 19/19. A60 independent subset **16/16 PASS, exit 0** | **NOT_EXECUTED** Pack25 / combined PR35+PR36; no native TAP | **NO_CURRENT_HEAD_PR_RUN_RETURNED**, not CI PASS | **NOT_EXECUTED** |
| **P25 / PR58 legacy preflight** | **SOURCE_ACCEPTED_SCOPED / PASS WITH CONDITIONS** on `e8100f…`; old P58-P2-01 fixed | A90 isolated V8 TypeScript-erasure shim **26/26**, *not native Node*. A60 synthetic subset **13/13 PASS, exit 0** | **NOT_EXECUTED** 26 authored Node tests; `pnpm` and typecheck no exit/TAP | [Actions run 38728665362](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38728665362) **FAIL**, inherited Pack19 **7 PASS/1 FAIL**, actual new feature tests skipped | **NOT_EXECUTED** |
| **P05 / PR38 migration ledger** | `PROPOSAL_ONLY_NOT_APPROVED`; original 14 SQL-source identity SHA1+SHA256 reviewed by A20 | Prior author report 37/37 source-only validator tests; **not executed anew by A10** | Current R23B native verification **NOT_EXECUTED** | An older GitHub failure not an R23B success or SQL proof | **UNKNOWN applied history / NOT_EXECUTED** |
| **Entire WEB-005** | All current source documents not equivalent to integrated signoff | A60 combined single synthetic execution **29/29 PASS** = 16 Pack25 + 13 Backup; **count once, not 29 per PR** | **NO comprehensive native PASS**, no verified full typecheck | **NO integrated green CI** | **NO executed integrated PG16** |

**QA terminology:** `SOURCE_ACCEPTED` = bounded review at an exact SHA. `SYNTHETIC_PASS` = actually executed representative fixtures, without installed full source execution. `QA_PASS` and `NATIVE_PASS` for the composite are **NOT_ATTAINED**, not inferred from 29 synthetic checks. `NOT_EXECUTED` is distinct from actual code FAIL; `BLOCKED` applies to release/integration and physical environment gates.

## 5. A20 migration ledger: D01–D04 pending owner policy, no SQL

[A20 R23B A00 decision packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md) records **D01_D04_DECISION_PACKET_READY** but **all four choices remain PENDING_OWNER_APPROVAL**; no A00 signoff was found in the checked control document and PR38 discussion. These are proposals, not approvals:

| Decision | A20 proposed option | Current effective status |
|---|---|---|
| **D01** | `APPROVE_SOURCE_GRAPH_ONLY` | **`PENDING_OWNER_APPROVAL`** — 14 immutable source identities SQL0027–0040, no adopted applied DB history |
| **D02** | `RELEASE_FIRST_EDITOR_SECOND` | **`PENDING_OWNER_APPROVAL`** — release 0030/0031 precede editor canonical proposed 0032/0033; policy order not hard SQL dep |
| **D03** | `SOURCE_AND_RUNTIME_RECEIPT_REQUIRED / UNKNOWN_FAIL_CLOSED` | **`PENDING_OWNER_APPROVAL`** — source+runner exact executed-input/ledger/catalog/physical PG16 evidence policy; read-only GO separate |
| **D04** | `A00_CONTROLLED_SERIALIZED_ALLOCATOR` | **`PENDING_OWNER_APPROVAL`** — logical WEB-005-T055-BASKET-CAS-PERSISTENCE-V1 only; numeric ID=null; reservation REQUESTED_NOT_ALLOCATED |

Original release versus editor SQL migration names/numbers `0030` and `0031` collide. The 14-entry canonical 0027–0040 graph is an A20 source proposal with checksum evidence, not a physically adopted history. **T055 numeric migration ID is `null`**, request `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` is `REQUESTED_NOT_ALLOCATED`; **no PG16 applied ledger or runner executed-input checksum**. Database writes and SQL/DDL remain STOP.

## 6. Direct file collision ledger (15 historical pairs) and dependency DAG

PR36 R23B only changes its existing Pack25 test file. PR58 R23B only changes two existing PR58-owned files. PR38 source is unchanged. **Zero new direct overlapping PR file pairs**; nevertheless the 15 previous pairs require semantic reconciliation. No overlap does not prove runtime/type/API compatibility.

| Packet conflict | PRs | Shared exact paths |
|---|---|---|
| P06 ↔ P09 | #39 / #42 | `artifacts/api-server/src/routes/tournaments.ts` |
| P06 ↔ P11 | #39 / #44 | `artifacts/api-server/src/routes/tournaments.ts` |
| P06 ↔ P13 | #39 / #46 | `artifacts/api-server/src/routes/tournaments.ts` |
| P06 ↔ P18 | #39 / #51 | `artifacts/api-server/src/routes/tournaments.ts` |
| P08 ↔ P15 | #41 / #48 | `artifacts/api-server/src/application/backups/backup-v3.ts`; `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts` |
| P09 ↔ P11 | #42 / #44 | `artifacts/api-server/src/routes/tournaments.ts` |
| P09 ↔ P13 | #42 / #46 | `artifacts/api-server/src/routes/tournaments.ts` |
| P09 ↔ P18 | #42 / #51 | `artifacts/api-server/src/routes/tournaments.ts`; `artifacts/api-server/test/revert-match.integration.test.ts` |
| P10 ↔ P17 | #43 / #50 | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` |
| P10 ↔ P21 | #43 / #54 | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` |
| P11 ↔ P13 | #44 / #46 | `artifacts/api-server/src/routes/tournaments.ts` |
| P11 ↔ P18 | #44 / #51 | `artifacts/api-server/src/routes/tournaments.ts` |
| P13 ↔ P18 | #46 / #51 | `artifacts/api-server/src/routes/tournaments.ts` |
| P14 ↔ P21 | #47 / #54 | `artifacts/tournament-manager/src/components/stage-progress-view.tsx` |
| P17 ↔ P21 | #50 / #54 | `artifacts/tournament-manager/src/pages/tournament-detail.tsx` |

**Updated dependency DAG** (integration concept only; full structured DAG in JSON):

- `WEB004_38_CASE_DISPOSITIONS+R23B_SOURCE_CLOSURE+NATIVE_CI_PG16_QA` → `FINAL_HANDOFF_GO`: owner/HQ signed final release/transfer gate; no SWARM006 now.
- `P02 PR36 R23B SOURCE_FIXED` → `A50 EXACT-SHA PACK25 NATIVE`: A60 PASS WITH CONDITIONS not native; requires PR35 Pack19 overlay separately authorized.
- `P25 PR58 R23B SOURCE_FIXED` → `A50 EXACT-SHA BACKUP TEST 26 + TYPECHECK`: A90 V8-erasure 26/26, A60 synthetic13/13 not native.
- `A20 D01 D02 D03 D04 APPROVALS` → `T055 MIGRATION ALLOCATOR AND AUTHORITATIVE LEDGER`: no numeric key; source-graph ≠ physical applied state.
- `A30 RAW_ISSUER POLICY+A70 ACTION_LOCAL` → `P23+P25 FUTURE IMPORTER`: no trusted old producer; no strict downgrade and Zod evidence.
- `A50-NATIVE+EXACT_SHA_COMPOSITE+PG16+WEB004_38` → `EXEC-B FINAL INTEGRATION REVIEW`: plan only, no SWARM006 authorization.

Hotspots include backend `routes/tournaments.ts`, Backup `backup-v3.ts`, UI `tournament-detail.tsx`, `stage-progress-view.tsx`, and `revert-match.integration.test.ts`. Ownership of API payloads, action remapping, SQL execution history, frontend migration and composite merge conflicts must be explicitly resolved before constructing any integration candidate.

## 7. R23C blocker matrix and owners

The separate [machine-readable R23C blocker matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_BLOCKER_MATRIX.json) carries all items, closure criteria, owner responsibility, migration selections, historic conflicts and dependencies. **The two prior source defects are closed only on their current source HEADs**; native/integration blockers persist.

| Blocker | Area / owner | Current gate | Required completion |
|---|---|---|---|
| **R23C-01** | CI Pack25 — A40/A50/A60 | `SOURCE_FIXED_NATIVE_PENDING` | A00-authorized clean checkout, exact-head Pack19-26 source contracts and domain tests; A60 on integrated SHA |
| **R23C-02** | Backup preflight — A90/A30/A70 | `SOURCE_FIXED_INTEGRATION_PENDING` | Full V2/V3 semantic validators and verified archived fixtures; standalone native TAP/typecheck before importer GO |
| **R23C-03** | Migration D01-D04 — A00/A20 | `PENDING_OWNER_APPROVAL` | A00 explicit signed decision for each D01-D04; physical applied-history read-only preflight separately authorized; T055 numeric ID remains null |
| **R23C-04** | Native infrastructure — A50/A00 | `NOT_EXECUTED` | Independent environment and non-destructive source-unit QA; later individually approved PG16 suite with recorded exit/TAP/DB identity |
| **R23C-05** | CI Pack19 upstream — A40/A50/A00 | `CI_FAILURE` | Authorized composite overlay Pack19+Pack20–26, verified TAP, then trusted CI; no paid reruns now |
| **R23C-06** | Integration DAG — A00/EXEC-B | `NO_COMPOSITE_SHA` | Owner-sign integration scope/order and file collision resolutions in disposable workspace; pin composite commit & independent merged-source QA before promotion |
| **R23C-07** | T055 Basket CAS — A20/A110 | `NOT_IMPLEMENTED` | After ledger decision separate migration+lock graph/ORM QA and API/UI implementation under exact GO |
| **R23C-08** | Backup V3 — A90/A70/A30/A00 | `NOT_WIRED` | Owner security choice, strict/legacy provenance, action-local ID closure, typed raw ingress, auth/zero-write/rollback and isolated PG16 integration tests |
| **R23C-09** | Sport & Undo — A70/A80/A120 | `CONTRACT_ONLY` | Separate source integration choices, native sport+API tests and independent A60 functional review |
| **R23C-10** | WEB-004 38 cases — A00/HQ | `UNRESOLVED` | Authentic original artifact or risk/owner-signed per-case resolution; never invent identifiers or mark unresolved PASS/WONT_FIX |
| **R23C-11** | Other owner/security — A00/A30/A100 | `POLICY_OPEN` | Explicit backlog-based owner dispositions, security reviews, tests and file conflict resolution |
| **R23C-12** | Release/transfer — A00/HQ/EXEC-B | `RELEASE_NO_GO` | Complete WEB-005 scope and owner review first; independent composite acceptance in later separately authorized EXEC-B/Swarm-006 phase |

## 8. WEB-004: unchanged historic 38-case audit obligation

Original signed `WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv` is not available in the verified GitHub evidence: **38 aggregate slots**, **29 secondary derived case IDs**, **9 true original IDs missing**, **0 owner-signed per-case dispositions**. Old aggregate **0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN** is historical only. **Do not manufacture missing identifiers, source claims, case PASS or WONT_FIX.** A00/HQ must resolve the original artifact or sign precise accountable dispositions.

## 9. Proposed future EXEC-B / composite integration order — no current authorization

1. **A00/HQ** — Confirm WEB-005 final-only policy, owner decisions D01-D04 and R23C backlog dispositions; preserve isolated source PRs.
2. **A40/A50/A60** — Test PR35 Pack19 + P02/PR36 Pack20-26 in separately authorized clean disposable source overlay, no PR merges; capture exact sha/exit/TAP.
3. **A90/A30/A70/A50** — Run P25 26-case native suite/typecheck; authenticate historical V2/V3 fixture evidence; decide trust/issuer, legacy restricted Undo and action-local provenance.
4. **A20/A00** — Approve canonical migration graph/order and read-only physical receipts policy; assign exclusive allocator; review SQL writer/lock DAG before any numeric T055 reservation or PG16 reset.
5. **A00/A70/A80/A100/A110/A120** — Close remaining approved sport, security, lifecycle and Host/UI feature source contracts with owner-signed dispositions; no speculative code.
6. **EXEC-B (future only, after separate GO)** — Choose dependency-aware composite integration order, resolve 15 direct overlaps (backend tournaments, backup-v3, test, UI) and API contracts; compute and publish a NEW_COMPOSITE_SHA.
7. **A50/A60/EXEC-B (future)** — Native Node/pnpm typecheck, Pack19–26/17, DB-free unit, API and sport, approved disposable PG16 migration/rollback, browser/manual flows; independent integrated SHA QA.
8. **A00/HQ (future)** — Verify full 38-case WEB004 dispositions, composite release receipts/rollback and approve or refuse FINAL_HANDOFF_GO; only then decide any SWARM-006 transfer/deploy.

**Remaining test debt:** native pinned Pack25 and Pack19–26; PR58 complete 26-case Node suite; frozen pnpm/full semantic `tsc`; independent exact-head logs/exits; Pack17 full; isolated verified PG16 DB/rollback/legacy fixtures; T055 CAS race/ETag/428/412; Backup real HTTP import/export + Zod raw signature/downgrade/Undo clone remap; Swiss >16/fairness; browser Host/bracket/view; cross-PR integrated CI and signed rollback evidence. See machine JSON for scope/priorities.

## 10. Final A10 → A00 decision

**Register `R23B_REGISTRY_COMPLETE / INTEGRATION_GATE_PENDING`.** A60 independently accepted P36-P2-01 and P58-P2-01 as `SOURCE_FIXED` at exact new SHAs. **Do not register `FINAL_HANDOFF_GO`**: A00 owns migration D01–D04; physical runtime/CI remain incomplete, cross-PR integration conflicts unresolved and original WEB-004 cases unclosed. WEB-005 remains **`NO_COMPOSITE_SHA / BACKUP_V3_NOT_WIRED / NATIVE_NOT_EXECUTED / PG16_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`**.

[R23B full machine registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23B_FINAL_SOURCE_REGISTRY.json) · [R23B exact SHA manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23B_EXACT_SHA_MANIFEST.json) · [R23C blockers](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_BLOCKER_MATRIX.json).

No app source changes, historic manifest rewrite, merge/rebase, migration/SQL, PostgreSQL test/reset, deployment, paid CI rerun or SWARM-006 were performed by A10.
