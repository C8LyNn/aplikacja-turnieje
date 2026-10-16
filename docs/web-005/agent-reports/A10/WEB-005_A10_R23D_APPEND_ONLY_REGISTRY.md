# WEB-005 — A10 / R23D Append-only Source Registry and QA Closeout

**Date:** 2026-10-16 · **Role:** A10 — Source Registry & Governance · **Assignments:** [Issue #75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) and [Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77). **Mode:** APPEND-ONLY / DOCS ONLY.

**Verdict:** `R23D_A10_SOURCE_REGISTRY_PUBLISHED / C02_NOT_CREATED_DEPENDENCY_73 / A60_R23D_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Canonical dispatch, immutable past, current 31 packets

- Source [R23D dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), exact Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.
- Frozen [R23C source registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_REGISTRY.json) Git blob `1152a307dad45572a7fa22bbbc9cdd8cfbaa9ec5`. No edits, rewritten historical SHA or new ID for revised P27.
- Original P01–P30 were checked against current GitHub PR heads. All 30 remain open/draft/unmerged; only **P27 / PR63** advanced to a new HEAD. New **P31 = PR69** is a *single CSS-only source packet*, **not C02**.
- Independent historical changed-path comparison yields 31 source packets, 110 unique exact paths, 15 original direct collision pairs, **zero newly overlapping paths**, zero resolved collision pairs. This is a file-path result, NOT a semantic compatibility guarantee.

### Exact current identities for old P01–P30

| Packet | PR | Original/current R23C SHA | Current R23D HEAD | Status |
|---|---|---|---|---|
| P01 | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | `7cb283aa82273a1e22daf9051a82311eef53760c` | UNCHANGED |
| P02 | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | `24fe6c399e3a4fa82c3d96703620097fa941a59a` | UNCHANGED |
| P03 | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | UNCHANGED |
| P04 | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | UNCHANGED |
| P05 | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | UNCHANGED |
| P06 | [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee132756ca05b6f2cd1f0cabae823905387` | `16053ee132756ca05b6f2cd1f0cabae823905387` | UNCHANGED |
| P07 | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | `9a8287271299a59fc9291b8d253299a8d109a35d` | UNCHANGED |
| P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | UNCHANGED |
| P09 | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | UNCHANGED |
| P10 | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | UNCHANGED |
| P11 | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | `2f0187b7242681c394c09058b5ef647667206bd6` | UNCHANGED |
| P12 | [#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | UNCHANGED |
| P13 | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | UNCHANGED |
| P14 | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | UNCHANGED |
| P15 | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | UNCHANGED |
| P16 | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | `99298b81501c3e7764d653604923522a19b9f05c` | UNCHANGED |
| P17 | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | `5457a74187edc263730c3a4b25a663bdf5531ee9` | UNCHANGED |
| P18 | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | UNCHANGED |
| P19 | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | UNCHANGED |
| P20 | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | UNCHANGED |
| P21 | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | UNCHANGED |
| P22 | [#55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | UNCHANGED |
| P23 | [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | UNCHANGED |
| P24 | [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | UNCHANGED |
| P25 | [#58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | UNCHANGED |
| P26 | [#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | `8c26778c94cd6c96987f3986b651066024f10d4a` | `8c26778c94cd6c96987f3986b651066024f10d4a` | UNCHANGED |
| P27 | [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` | `a4119b29a78b72d400947d8dd5bd100c59d6444e` | **R23D REVISION / QA PENDING** |
| P28 | [#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | UNCHANGED |
| P29 | [#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | `7490c974b7c84404559fd590bd09817a71c2134f` | UNCHANGED |
| P30 | [#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | `880824f18b8913602955578dfd76eeac7976e32a` | UNCHANGED |

## 2. P27 / PR #63 — new R23D revision, not another package number

- Historical P27 SHA `3ddcfea2ba47f4314fced3022d00922f8cedb0e3`; first intermediate `5469dde23931cad8b87316831328fbb8ded13dbb`; **latest verified `a4119b29a78b72d400947d8dd5bd100c59d6444e`**, 5 commits relative to original (4 before + 1 additional test), all preserved.
- Exact current PR diff retains **six frontend files**. Relative to the previous R23C SHA, only four existing files changed. Two client files remained byte-identical.
- Static source behavior: GET 401/403 transitions draft session to `authorization-blocked`, redacts `view().localDraft` and remote, blocks edits/saves, retains a private in-memory draft for reauthorization in same scope. Scope switch destroys the old private draft. This follows Issue #74's preserve-without-leaking intent, but prior A60 R23C requested clearing; **A60 exact-new-SHA review is not published**. The source is inactive/unmounted and C02/activation remain HOLD.
- Test bodies counted in exact new source: **10 client + 19 draft + 6 UI = 35 AUTHORED**, **NATIVE NOT_EXECUTED**. Current automatic workflow [38876069415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38876069415) **FAILURE**, not an independently verified targeted CAS suite.

**P27 exact current file SHA-1 and SHA-256** (calculated from exact GitHub file contents; `abc` SHA-256 self-test passed):

| File | Git blob SHA-1 | SHA-256 (UTF-8) | Bytes |
|---|---|---|---:|
| [`artifacts/tournament-manager/src/components/basket-cas-conflict-review.test.tsx`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/components/basket-cas-conflict-review.test.tsx) | `d45de50175038e50d43a78f44c09f84e5bbc856a` | `2f1bbf2accd33387f6c91fca2cafdb2aec5118215428b71e150038a6f38bc8e6` | 4987 |
| [`artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx) | `8a6b96ec1c0918571291f66056cc9b574f421214` | `389ebab19f8ce8d26a53524826f85439e828f42d3f8d464f5685d4cb66332def` | 4972 |
| [`artifacts/tournament-manager/src/lib/stage-basket-cas-client.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/lib/stage-basket-cas-client.test.ts) | `1d1473901d68db148a100079c96f3ca2c5e80adb` | `59ec9c97dce8d3c266e85beca9acf994f15c66d35ec56fa3b7d72af122dc44f8` | 7994 |
| [`artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts) | `4fca09e22ef58fc38a2ca34a8386a6fadad06ae8` | `d612dbffe6c9ae14af44df67a2416a9733ae547aca5acfeaa54581f17af79ac6` | 8759 |
| [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts) | `5802405c4e34956a997dc1b54eb701b1e0b73512` | `e01f9cbf2b205335917c3425f12e112a509bbf23f88ae15588eb3879d93f469e` | 19562 |
| [`artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a4119b29a78b72d400947d8dd5bd100c59d6444e/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts) | `1176e4ded08b297133163a3c2481939df2015e33` | `19a098a58da96407ec434685a312aa899773f2ec713dac7fac31a5f9bc3763f6` | 11318 |

## 3. P31 / PR #69 — source-only font correction, different GitHub release base

- [DRAFT PR69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69), HEAD `1bc087384542b16bb82bc9ab58ec48780fc0e972`, base `1db3734b8988940acc6be8b992420a58fc39624a` (not C01 original release). **One changed path only:** `artifacts/tournament-manager/src/index.css`.
- Git blob SHA-1 `c1699af3d05b63edd85f6a2a3d7e006036c56f07`; UTF-8 SHA-256 `04f2a64f5225cb94f2e0089becad02a6b84f786235844682635cb24547b3b26b` (38971 bytes).
- Direct PR diff only removes the defunct `@font-face` for `/fonts/valvepulp-bold.ttf`, preserving the fallback stacks; no game file, canvas, loader or minigame content changed by this PR. **A10 static diff scope PASS**; no A60 independent signoff or browser/live QA.
- Automatic [workflow 38823508396](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38823508396) completed **FAILURE** at inherited **Pack19 source/snapshot step**, *not a proven CSS regression or font test PASS*. Numeric child exit not independently retrieved; no tests run by A10.
- Critical ancestry: C01 parent `1fdc401d…` and GitHub release `1db3734b…` are different; that newer release is +1 commit over the old parent and changes 23 paths including game files. **Do not merge/rebase/copy the whole release into C02**. Treat the one CSS hunk as independent patch subject to Replit 140-path preservation audit and owner GO.

## 4. C01/C02 integration and issue #75

- **C01 PR60** exact HEAD `fa3261b2c9510e110ac9eba21726812d3401a525`, six source packets P01/P02/P07/P23/P24/P25, 14 exact blobs; A60 previous source integrity PASS WITH CONDITIONS. Automatic [C01 workflow 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) had scoped 23/23 SE, 220/220 domain, 72/72 source, Pack17 12/12 source and 24/24 helper, ephemeral PG16 atomic 8/8 and workspace typecheck PASS; **API integration EXIT 1**, full job FAILURE, later frontend/build NOT_EXECUTED.
- [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) first independent failing test/root-cause report not present at check. **C02 has no SHA, branch, PR or executed suite**. A40 cannot use this registry as approval to compose, bypass failure or create false PASS.

| Future source | Exact HEAD | A10 provisional selection | Why |
|---|---|---|---|
| P26/[#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | `8c26778c94cd6c96987f3986b651066024f10d4a` | **HOLD** | Stacked PR57, test invokes schema reset; no certified PG16 |
| P27/[#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `a4119b29a78b72d400947d8dd5bd100c59d6444e` | **EXCLUDE_PENDING_A60_SECURITY_AND_BACKEND** | Authorization-blocked source changed, A60 unreviewed; server CAS not wired |
| P28/[#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | **PROVISIONAL_ONLY_AFTER_73_AND_A60_NEW_COMPOSITE_QA** | Pure isolated action-local validator; no importer privileges |
| P29/[#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | **PROVISIONAL_ONLY_AFTER_73_CALLBACK_COMPAT** | Stacked C01, stub callbacks, not wired |
| P30/[#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | **SEPARATE_EXPECTED_RED_SECURITY_TEST_LANE** | Fail-first ingress tests, six PG16 default skip |
| P31/[#69](https://github.com/C8LyNn/aplikacja-turnieje/pull/69) | `1bc087384542b16bb82bc9ab58ec48780fc0e972` | **EXCLUDE_FROM_C02_BASE_DIVERGENCE** | New release base includes games; only CSS hunk review after Replit preservation |

**Only hypothetical non-overlapping pure source candidates P28/P29** may be evaluated after #73 root cause and real callback/native QA, under A00's *separate* disposable C02 authorization. Their mere source-only PASS does not authorize a release or wired Backup import.

## 5. Replit/GitHub provenance and game freeze

- Dispatch states: [GitHub release `1db3734b8988940acc6be8b992420a58fc39624a`](https://github.com/C8LyNn/aplikacja-turnieje/commit/1db3734b8988940acc6be8b992420a58fc39624a) and Replit local published checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` (**local-only, cannot dereference through GitHub**).
- **140 differing paths** = 90 Replit-only + 50 blob-different. This is an unverified *aggregate lineage claim* from dispatch/#72, not 140 confirmed bugs, not 140 file blobs independently fetched and not proof every change originated Oct 15.
- [Issue #72](https://github.com/C8LyNn/aplikacja-turnieje/issues/72) owns the complete preservation manifest and migration/auth source reconciliation. Before a promotion/deploy branch, require per-path source blob, intended preservation, owner, exact CSS hunk, dependency/route impact and rollback; never auto-overwrite Replit `App.tsx`, portfolio rewrites, migration 0032–0040, lockfile or game asset trees.
- A10 did **not** change any game code or assets, local Replit code, production database, GitHub protected branches, release or live website.

## 6. R23D QA matrix / SWARM-004M intake / WEB-004 historical cases

Machine statuses: [R23D registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_REGISTRY.json) and [R23D QA/intake matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23D_QA_MATRIX.json).

- Source-only static file scope is not independent A60 review. CI FAILURE is not feature-target failure without corresponding targeted test trace. All native, PG16, browser, C02 and Replit runtime A10 tests **NOT_EXECUTED**; no invented TAP or exits.
- [Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77) will accept SWARM-004M findings with exact affected build, repro, evidence/logs, severity, path/route, owner, duplicate fingerprint and independent QA. **No verified incoming SWARM-004M defect was retrieved by A10**; don't invent entries, and don't wait for future findings before addressing confirmed issues.
- WEB-004 remains **38 historical slots**, only 29 secondary derived IDs and **nine authentic original IDs unavailable**, zero signed per-case dispositions; old aggregate 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN. This registry creates no missing case IDs or PASS flags.

## 7. A00 handoff and STOP

- Require first-error case and authoritative diagnosis for #73, A60 independent SHA QA for revised PR63 and PR69, A00 privacy policy (retained-but-redacted draft vs cleared draft), A40 authorized disposable C02 scope, A20/A30 Replit preservation manifest, independent static routes/portfolio/Animated Effects testing, D01–D04 owner decisions and final WEB004 reconciliation.
- `FINAL_HANDOFF_GO=false / RELEASE_NO_GO / SWARM006_HOLD`. **No game changes, no live deploy, no protected merge/rebase, SQL/reset, secrets or paid CI rerun by A10**.
