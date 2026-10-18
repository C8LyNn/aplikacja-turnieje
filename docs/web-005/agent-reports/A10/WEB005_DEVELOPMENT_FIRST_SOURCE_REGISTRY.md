# WEB005 DEVELOPMENT FIRST - SOURCE REGISTRY

A10 | Verified: 2026-10-18 | READ-ONLY application / APPEND-ONLY documentation

**Verdict:** `SOURCE_REGISTRY_READY / C01_DBFREE_QA_ACCEPTED / C01_API_INTEGRATION_HOLD / C02_NOT_CREATED / PG16_G0_NO_GO / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Canonical environment and integration

- C01: [Draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60+), exact SHA `fa3261b2c9510e110ac9eba21726812d3401a525`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. Six source packets: P01, P02, P07, P23, P24, P25; 14 exact blobs, zero manual conflict resolutions.
- C02: `NOT_CREATED`; no PR, commit SHA or executed C02 QA. A40 waits for A00 scope and the exact API integration failure from Issue #73.
- GitHub later release: `1db3734b8988940acc6be8b992420a58fc39624a`, differs from C01 base and includes game files. Replit published local checkpoint: `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` (not GitHub-verifiable). Dispatch drift is 140 differing paths, 90 Replit-only plus 50 differing blobs, not 140 proven bugs.
- Preserve Replit live routes/Steam/catalog/PG migration lineage. Never overwrite either tree; require source hashes, owner PRESERVE/PORT/OMIT, rollback and exact authorized hunk scope first.

## 2. Actual QA evidence at exact C01 SHA

- A50 Windows R23E-R2: **426/426 actual native DB-free PASS**. A60 independently accepted evidence: 25 complete TAP logs, 36/36 raw log SHA256 matched, BuildTypes/API typecheck exit 0. This is `DBFREE_QA_ACCEPTED`, not full integration or runtime release.
- Historic [C01 CI run #38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793): SE 23/23, domain 220/220, source 72/72, Pack17 source 12/12, helper 24/24, isolated PG16 atomic 8/8 and workspace typecheck PASS; **API integration exit 1**, overall CI FAILURE. First failing assertion unavailable and later frontend/build gates NOT_EXECUTED.
- Source [A50 Issue #73 triage](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R23D_ISSUE73_C01_API_TRIAGE.md) reports root cause UNKNOWN. A60 DB-free acceptance does not remove G0 and C02 HOLD.
- PR69: A60 narrow CSS source PASS WITH CONDITIONS but no real HTTP/browser. PR78: 13/13 synthetic localhost route probe, real Replit status NOT_EXECUTED.
- PR89 `8b1b708d4b24cd94de4d15b2beed516b21da711a`: source-only PG16 fixture, no actual SQL/PG16/CI execution, external signer/cluster trust unresolved and P0 `G0_NO_GO`.

## 3. Development first categories

**READY FOR INTEGRATION (source-only, conditional, not merge GO):** P01/P02/P07/P23/P24/P25 already in C01 and must not be copied again; pure Backup P23/P25 NOT_WIRED. P28/PR64 action-local validator and P29/PR66 preclone adapter (stacked on C01) are possible DB-free narrow candidates only after A00 and real callback/schema compatibility QA.

**NEEDS FIX (integration/conflict/security/QA, not necessarily a defect in each PR):**
- P03/PR34 Steam auth, P04/PR37 proxy: compare with live Replit security and dependencies.
- P06/PR39, P09/PR42, P11/PR44, P13/PR46, P18/PR51: shared tournament routes; global Undo LIFO, match cancel/revert, authorization and lock order must be reconciled with native tests.
- P08/PR41 plus P15/PR48: colliding Backup V3 source/test; importer/exporter, authenticated issuer, anti-downgrade, raw-before-Zod, action-local Undo, zero-write 400 and rollback missing in real transport.
- P10/PR43, P17/PR50, P21/PR54 collide in tournament-detail; P14/PR47 and P21/PR54 in stage-progress. Require stable backend API and browser regression.
- P12/PR45 RR reopening; P16/PR49 organizer writes; P19/PR52 stale modal; P20/PR53 privacy cache: semantic integration/security QA outstanding.
- P27/PR63 current SHA `04229390a7baa3ece720b186d86fe9ad07f04adc`: blocked GET privacy quarantine, duplicate initialize/GET race fix, **38 authored frontend test cases, NOT 38 native PASS**; latest exact-SHA A60 QA not confirmed, feature OFF.
- P30/PR67 is an intentionally fail-first ingress security test contract, NOT deployed enforcement. C01 original API gate failed, static missing-asset 404 and Animated Effects route fixes not verified.

**BLOCKED BY DB:** P05/PR38 D01-D04 owner signature absent, release/editor migrations 0030/0031 collision; P22/PR55 CAS test-only without persisted revision, strong ETag GET/If-Match PUT/412/428 or numbered T055; P26/PR61 destructive Swiss test requires disposable PG16; P33/PR89 fixture SOURCE ONLY with unresolved FORCE DROP/CREATEDB/S1-CASCADE/Drizzle/physical cluster P0 and G0 NO-GO.

**DEFERRED:** P31/PR69 font CSS, P32/PR78 route probe. Both based on later GitHub release and cannot be imported wholesale to C01 or Replit; require published checkpoint readback and authorized preview tests. Independent Core Clash/Unity/game PRs excluded.

## 4. All 33 exact source PR HEADs

Original P01-P31 records and SHA histories remain unchanged. P32=PR78 and P33=PR89 are new source-intake identifiers only. Every listed PR currently OPEN/DRAFT/UNMERGED.

| Packet | PR | Exact HEAD | Classification | C01 |
|---|---|---|---|---|
| P01 | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | READY FOR INTEGRATION | YES |
| P02 | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | READY FOR INTEGRATION | YES |
| P03 | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | NEEDS FIX | NO |
| P04 | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | NEEDS FIX | NO |
| P05 | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | BLOCKED BY DB | NO |
| P06 | [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee132756ca05b6f2cd1f0cabae823905387` | NEEDS FIX | NO |
| P07 | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | READY FOR INTEGRATION | YES |
| P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | NEEDS FIX | NO |
| P09 | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | NEEDS FIX | NO |
| P10 | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | NEEDS FIX | NO |
| P11 | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | NEEDS FIX | NO |
| P12 | [#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | NEEDS FIX | NO |
| P13 | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | NEEDS FIX | NO |
| P14 | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | NEEDS FIX | NO |
| P15 | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | NEEDS FIX | NO |
| P16 | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | NEEDS FIX | NO |
| P17 | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | NEEDS FIX | NO |
| P18 | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | NEEDS FIX | NO |
| P19 | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | NEEDS FIX | NO |
| P20 | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | NEEDS FIX | NO |
| P21 | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | NEEDS FIX | NO |
| P22 | [#55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | BLOCKED BY DB | NO |
| P23 | [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | READY FOR INTEGRATION | YES |
| P24 | [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | READY FOR INTEGRATION | YES |
| P25 | [#58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | READY FOR INTEGRATION | YES |
| P26 | [#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | `8c26778c94cd6c96987f3986b651066024f10d4a` | BLOCKED BY DB | NO |
| P27 | [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `04229390a7baa3ece720b186d86fe9ad07f04adc` | NEEDS FIX | NO |
| P28 | [#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | READY FOR INTEGRATION | NO |
| P29 | [#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | READY FOR INTEGRATION | NO |
| P30 | [#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | NEEDS FIX | NO |
| P31 | [#69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) | `1bc087384542b16bb82bc9ab58ec48780fc0e972` | DEFERRED | NO |
| P32 | [#78](https://github.com/C8LyNn/aplikacja-turnieje/pull/78) | `11e8d5d0bea679515a807f002724926113bdafc1` | DEFERRED | NO |
| P33 | [#89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) | `8b1b708d4b24cd94de4d15b2beed516b21da711a` | BLOCKED BY DB | NO |

## 5. Changed-file conflicts and dependencies

33 candidates; **128 unique changed-file paths**; **15 historical exact-file PR collision pairs**, all still UNRESOLVED. No new direct pair from P26-P33. No legacy overlap pair jointly resolved in C01.

| PR pair | Shared file(s) |
|---|---|
| P06/P09 (#39/#42) | artifacts/api-server/src/routes/tournaments.ts |
| P06/P11 (#39/#44) | artifacts/api-server/src/routes/tournaments.ts |
| P06/P13 (#39/#46) | artifacts/api-server/src/routes/tournaments.ts |
| P06/P18 (#39/#51) | artifacts/api-server/src/routes/tournaments.ts |
| P08/P15 (#41/#48) | artifacts/api-server/src/application/backups/backup-v3.ts; artifacts/api-server/test/stage-basket-route-execution.integration.test.ts |
| P09/P11 (#42/#44) | artifacts/api-server/src/routes/tournaments.ts |
| P09/P13 (#42/#46) | artifacts/api-server/src/routes/tournaments.ts |
| P09/P18 (#42/#51) | artifacts/api-server/src/routes/tournaments.ts; artifacts/api-server/test/revert-match.integration.test.ts |
| P10/P17 (#43/#50) | artifacts/tournament-manager/src/pages/tournament-detail.tsx |
| P10/P21 (#43/#54) | artifacts/tournament-manager/src/pages/tournament-detail.tsx |
| P11/P13 (#44/#46) | artifacts/api-server/src/routes/tournaments.ts |
| P11/P18 (#44/#51) | artifacts/api-server/src/routes/tournaments.ts |
| P13/P18 (#46/#51) | artifacts/api-server/src/routes/tournaments.ts |
| P14/P21 (#47/#54) | artifacts/tournament-manager/src/components/stage-progress-view.tsx |
| P17/P21 (#50/#54) | artifacts/tournament-manager/src/pages/tournament-detail.tsx |

Dependency DAG: C01 API first failure -> A00 GO -> C02; P24 -> P26; C01 -> P29 and P33 stacked children; P23/P25 + P28/P29 + P30 + trusted issuer -> Backup; D01-D04 + physically certified PG16 -> T055 CAS server -> P27 frontend; tournament backend Undo -> detail/stage progress; actual Replit checkpoint -> PR69 CSS / PR78 route tests.

## 6. Safe A40 integration sequence

1. Freeze all exact SHA and recover actually published Replit per-path preservation manifest; never blanket-sync 140 paths or game assets.
2. Reproduce first C01 API failure only after A00/A20/host G0 authorization for a physically isolated disposable PostgreSQL16 cluster; document first real assertion, TAP, exit, rollback and no unsafe FORCE DROP. Until then C02 HOLD.
3. After separate source GO, provisional C02: only P28/P29 DB-free pure functions on exact C01, avoiding re-copy of stacked ancestry; validate full adapter callbacks and independent A60 exact integrated SHA. Exclude P26/P27/P30/P33 and newer GitHub release.
4. Next backend batch: reconcile P06/P09/P11/P13/P18 shared routes, Undo LIFO, restore/cancel, auth, writer locks and same-path hunks with A60 QA.
5. Backup V3 batch: reconcile P08/P15, then pure strict/profile/action-local/preclone (P23/P25/P28/P29) and P30 fail-first contracts; no live importer until full auth, anti-downgrade, original legacy V2/V3 corpus, zero-write/rollback security tests.
6. Database/CAS only after D01-D04 signed policy, safe cluster proof and migration allocator; implement backend server CAS persisted monotonic revision + GET ETag + PUT If-Match, 412/428 and stage/roster lock audit.
7. Frontend: resolve P10/P17/P21 detail and P14/P21 stage progress; then P27 after new exact SHA independent source QA, native frontend TAP, real CAS backend and explicit feature-enable GO.
8. Separate app-shell lane: after Replit published checkpoint proof port only PR69 narrow CSS hunk, run PR78 against approved preview with real HTTP status/MIME, portfolio, Animated Effects, tournament deep links and byte-preserved game loaders. No deploy.
9. A00/HQ final acceptance: source + security + 15 overlap resolutions + PG16/browser QA on integrated SHA, signed per-case WEB-004 38 slots (29 secondary IDs, nine authentic originals missing). Only owner may authorize FINAL_HANDOFF_GO.

## 7. Provenance and restrictions

- [Historic R23D 31-packet source registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_REGISTRY.json) | [R23C 15-pair DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_CONFLICT_DAG.json).
- [A60 independent C01 426/426](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23E_R2_C01_WINDOWS_DBFREE_INDEPENDENT_ACCEPTANCE.md) | [A20 D01-D04](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23D_ISSUE76_D01_D04_OWNER_DECISION_GATE.md) | [A60 PG16 R23H security review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/R23H_R4_INDEPENDENT_CORRECTIVE_QA.md).
- A10 performed read-only GitHub inspection and documentation only. No app/game edits, SQL, database reset, protected merge/rebase, paid CI rerun, live deployment or SWARM006.

**Final:** `WEB005_DEVELOPMENT_FIRST_SOURCE_REGISTRY_READY / C02_NOT_CREATED / PG16_G0_NO_GO / RELEASE_NO_GO`.
