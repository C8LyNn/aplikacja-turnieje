# WEB-005 — A120 / WAVE 3 — Presentation Acceptance Matrix

**Role:** A120 — Presentation & Bracket Views  
**Task:** `PRESENTATION ACCEPTANCE MATRIX` (read-only / test-only)  
**Dispatch:** [WAVE3 common Google Doc](https://docs.google.com/document/d/10cKgkk3XZTwudRMIQ620Q5DAYEsMZIb8zmqgBoRnmEE/edit), revision observed on 2026-10-18: `AHj4eMTrCpik1b_34kpVSOeHszrwCE6CsDl3e897_AOfhRJsYsAgc0fwqYIGmreQVVhjFasL8HaT_S3G2QoM_KPkkVm3YmuqqYRxdXrx6XE`.  
**Status:** `ACCEPTANCE_MATRIX_READY / AUTHOR_STATIC_SOURCE_INSPECTED / REPLAY_SYNTHETIC_HTTP_12_PASS_4_SKIP / BROWSER_NOT_EXECUTED / INTEGRATION_NOT_EXECUTED / RELEASE_NO_GO`.

## 1. Exact pinned inputs — separate branches, NO merged composite

| Candidate | Verified status / exact Git commit |
|---|---|
| Release | `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a` |
| [PR #103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) | OPEN DRAFT, HEAD `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`, base release. Two source/test files under `scripts/deployment/`; pure `resolveStaticRoute` **UNWIRED** |
| [PR #120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | OPEN DRAFT, HEAD `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab`, base PR103 exact HEAD. Exactly two test-only files |
| [PR #47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | OPEN DRAFT, HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`. Selected-stage DE Upper/Lower/GF/Reset graph & public labels/hero source |
| [PR #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | OPEN DRAFT, HEAD `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`. RR history detail 401/403 local private-cache hiding; parent canonical RR refresh |
| [PR #116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | OPEN DRAFT, HEAD `a0f1d8066bbcf4e4b602cb587aebf599e327d067`. A140-owned Replit preservation files. **No A120 edits** |
| [PR #101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | OPEN DRAFT, HEAD `a5bfd07b822c223fd995604dc2e228935ab81498`. A40-owned C02. **No A120 edits** |

**Critical separation:** PR120 is **stacked on unmerged PR103**, so its synthetic HTTP tests do not establish a deployed Replit static-router integration. PR47 and PR54 each modify `stage-progress-view.tsx` on older release-derived branches; their sources are NOT together in PR120 or any accepted composite. The test matrix below is a contract for an authorized future integration, not a retroactive claim of coverage.

## 2. Original baseline and source identifiers

Verified GitHub release source blobs:

- `artifacts/tournament-manager/src/App.tsx`: `298f94ac19dbbdc6df775543e720ec250a1de82a` — Wouter routes for bracket/audience/projector, experimental counterparts, Stream and OBS-style overlays.
- `src/components/tournament-organizer-navigation.tsx`: `cc2cc6cc16592ec39666a13f2245742cef122200` — organizer standings is **`/tournaments/:id?tab=standings`**, organizer bracket `?tab=bracket`; no invented standalone `/standings` Wouter route.
- `src/pages/tournament-audience.tsx`: `432ffc7623cd510acbb86a9e9a2aca14a25ef196` — public standings `/tournaments/:id/audience?section=standings`; audience `section=bracket`, section nav `overflow-x-auto`, long-header `flex-wrap`, standings table `overflow-x-auto` with `min-w-[680px]`.
- `src/components/bracket-view.tsx`: `7f1548ce272973ee251591540081caa016d8ef49` — SE labeled `Drabinka eliminacyjna`, keyboard focus `tabIndex=0`, `overflow-x-auto`, explicit winner card. Static presence is **not** proof of viewport rendering.
- `src/components/double-elimination-bracket.tsx`: `93954f1f183da5b061d5f3de8c09961f6920eb7d` — labeled DE graph, `overflow-x-auto`, `sm:grid-cols-2` and `lg:grid-cols-3`; actual Grand Final Reset correctness must use canonical DE fixture and PR47 selected-stage graph, not inferred from Tailwind classes.
- PR47 selected child `stage-progress-view.tsx`: `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6`: dedicated `useGetDoubleEliminationStage`, `DoubleEliminationBracket`, `canManage={false}`, `canReset={false}`; PR47 source tests `stage-progress-view.test.tsx` blob `ced3edc0bcd1c2d44948f2e9760f427b0eda493e`.
- PR54 selected child `stage-progress-view.tsx`: `2c50b5915572ec3721ad709ffd18ec58a597273f` — `selectedRrDenied`, `visibleDetails`, selected-only `detailQuery.refetch()`. PR54 `stage-progress-view.rr-denied.test.tsx` blob `eb282e0812c6daf9db8a2de04e5e9aca6308fe0b`.
- PR120 tests: `scripts/deployment/presentation-route-refresh.integration.test.mjs` blob `226cbdbbec79a8ec5618f73bb3bef0110563451f`; `presentation-route-source-contract.test.mjs` blob `ced088958019504b231f9c6c87c59a4bd9fe2d0d`. PR103 policy blob `69ad72d85858ea43f8d61cd0b0770026650e23a3`.

## 3. Acceptance matrix — no invented E2E PASS

**Legend:** `SIM_PASS` means an actual Node HTTP fixture test was executed, **not** UI behavior; `STATIC` means only source-inspected, not runtime; `UNEXECUTED` means no browser/frontend/production test result. `BLOCKED_COMPOSITE` requires a separately authorized integrated SHA and approved test environment. IDs are proposed Wave3 acceptance IDs, not claims that these cases already exist in the app test runner.

| ID | Area / priority | Synthetic stimulus / exact URL and viewport | Required observable acceptance | Evidence / next gate |
|---|---|---|---|---|
| **A120-W3-01** | **SE bracket P0** | `/tournaments/42/bracket`, populated SE 8/16 entrants | Correct round columns, winners/walkovers and champion, scrollable on narrow viewport, no offscreen inaccessible card | `SIM_PASS` HTTP only; actual bracket rendering `UNEXECUTED` |
| **02** | **DE bracket P0** | Selected active DE stage: Upper/Lower/GF/GF Reset from canonical DE GET, then refresh | Exactly the correct read-only graph, no score mutation/reset buttons, stage ID isolation, no stale prior-stage graph | PR47 `STATIC`; `BLOCKED_COMPOSITE` with PR54 |
| **03** | **DE late/error P0** | DE canonical response 403/500, delayed prior ID response; retry200 | Denied/errored DE does not show stale/private graph; selected-only retry, correct current-stage graph | PR47 source tests authored; `UNEXECUTED` |
| **04** | **RR privacy + DE availability P0** | History RR31 GET401 **and** GET403 (two runs), selected DE32 GET200 | Old authorized RR participant and winner not visible; legal DE32/Overview still reachable | PR54 `STATIC`; `BLOCKED_COMPOSITE`, no current browser proof |
| **05** | **Organizer standings P0** | `/tournaments/42?tab=standings`; direct-load → F5 | Query tab retained, actual standings section active, standings from canonical API; no invented `/standings` route | `SIM_PASS` document shell; actual selected tab/API `UNEXECUTED` |
| **06** | **Organizer bracket P1** | `/tournaments/42?tab=bracket` and Host `/host?tab=drabinka` | Bracket tab active and round graph matches same canonical tournament | `SIM_PASS` first URL; Host `STATIC`; browser `UNEXECUTED` |
| **07** | **Public standings P0** | `/tournaments/42/audience?section=standings` direct-load → F5 | Public `Tabela` active, rankings readable and no unauthorized owner data; no split from detail standings | `SIM_PASS` document; data `UNEXECUTED` |
| **08** | **Audience bracket P1** | `/tournaments/42/audience?section=bracket`, DE tournament | Correct selected format/stage graph, read-only Upper/Lower/GF/Reset presentation | `SIM_PASS` document; graph `UNEXECUTED` |
| **09** | **Audience final hero P0** | Tournament completed, official `winnerId`, stale `featuredMatchId` | Winner hero/overlay uses official winner, not standings leader or stale live match | PR47 audience tests authored `STATIC`; browser `UNEXECUTED` |
| **10** | **Stream / OBS P1** | `/stream`, `/stream/overlay/camera-chat`, `/developer/overlay/camera-chat` | Direct-load and reload keep correct route, stream/overlay visible without duplicate SPA shell | `SIM_PASS` documents only; overlay rendering `UNEXECUTED` |
| **11** | **Experimental aliases P1** | `/experimental/tournaments/42/bracket` and `/audience?section=standings` | Experimental mode retained after F5; same tournament ID and safe public state | `SIM_PASS` transport; browser `UNEXECUTED` |
| **12** | **SPA transport P0** | Two independent GETs (direct-load and simulated reload) with query string | HTTP 200 HTML root both times, raw requested path/query unchanged; no surprise redirect | `SIM_PASS` Wave2 test, no actual browser F5 |
| **13** | **Missing assets P0** | Missing `/fonts/*.ttf`, `/assets/*.js`, `/prototypes/*.wasm` | Real server must return **HTTP 404** non-HTML, never SPA 200 shell | `SIM_PASS` only; PR103 unwired, live `UNEXECUTED` |
| **14** | **Existing assets P0** | Static portfolio indexes, Animated Effects build JS/CSS, existing Unity WebGL loader/WASM | Actual file 200 correct MIME, 0 game-byte changes; no fake `/dev/animated-effects` target | `SIM_PASS` fixture status/MIME; real byte parity `UNEXECUTED` |
| **15** | **Responsive SE P1** | Width **320/360/390px**, portrait | Graph scroll container keyboard accessible, scrollable rounds, no clipped winner card; page not forcibly wider than viewport except controlled internal scroll | `STATIC` SE overflow and tabindex; viewport `UNEXECUTED` |
| **16** | **Responsive DE P1** | **360×800**, **800×360** landscape and **768×1024** | Upper/Lower/GF/Reset discoverable, bracket can scroll, header/actions do not mask score labels, no hidden essential result | `STATIC` DE overflow/grid; viewport `UNEXECUTED` |
| **17** | **Responsive standings P1** | **360×800** and **768×1024** audience standings | Horizontal scroll inside standings table with `min-w-[680px]`, header/nav accessible, name/rank/score still legible | `STATIC` source class; viewport `UNEXECUTED` |
| **18** | **Responsive audience/stream P1** | **320/390**, **1440×900**, **1920×1080** projector/OBS | Nav active item reachable/focusable, long title wraps without trapping navigation; overlay unobstructed; no unwanted body horizontal overflow | `STATIC` nav overflow/flex-wrap; actual viewport/OBS `UNEXECUTED` |
| **19** | **Auth/live denial P0** | Whole private tournament GET401/403 and stale older cached data after login change | No protected matches/ranks/player info on public page or stale tabs; successful authorized retry repopulates only canonical data | A100/PR53-dependent; `UNEXECUTED` |
| **20** | **Combined post-merge P0** | PR47 + PR54 + PR103/120 actual authorized composite, 2 sessions and live-ish preview | SE/DE/RR/standings/stream & assets all behave simultaneously without regressions or private-cache leaks | **BLOCKED_COMPOSITE**, no integration GO / no composite SHA |

**High priority gaps:** `02,04,05,07,09,13,15,16,17,18,19,20` cannot be closed by running only Node transport fixtures. Real React/browser viewport and preview HTTP evidence plus exact integrated-source signoff is required. No body-width measurements, element bounding boxes or screenshots were executed in Wave3.

## 4. Actual Wave3 non-destructive replay

**SHA/byte preflight on local file copies:** `git hash-object` matched all three fetched GitHub blobs exactly:
`static-route-policy.mjs@69ad72d85858ea43f8d61cd0b0770026650e23a3`,
`presentation-route-refresh.integration.test.mjs@226cbdbbec79a8ec5618f73bb3bef0110563451f`,
`presentation-route-source-contract.test.mjs@ced088958019504b231f9c6c87c59a4bd9fe2d0d`.

**Actual local command executed in `/mnt/data/wave2`, Node v22.16.0:**

    node --check scripts/deployment/static-route-policy.mjs
    node --check scripts/deployment/presentation-route-refresh.integration.test.mjs
    node --check scripts/deployment/presentation-route-source-contract.test.mjs
    node --test scripts/deployment/presentation-route-refresh.integration.test.mjs scripts/deployment/presentation-route-source-contract.test.mjs

**Observed exit:** syntax checks 0, combined tests **exit 0 / TAP 16 total / 12 PASS / 0 FAIL / 4 SKIP**. Those 4 skips are full-checkout source tests. A real source-based test/React/browser pass has NOT been observed. Local replay log `/mnt/data/wave3_baseline_replay.log`; not independently uploaded as a CI log.

**Additional read-only GitHub source checks:** verified matching source patterns (SE scroll/winner/focus, DE scroll/grid, Audience scroll/flex wrap/standings table, organizer `?tab=standings`, PR47 read-only DE, PR54 RR private denial, registry URLs). This is authored inspection, **not** a signed independent A60 review.

## 5. Conflict and ownership / test-only STOP

- No source edits to PR120/PR103; **NO CODE CHANGES**, no Draft PR necessary for this additive acceptance contract. The acceptance matrix is an **own-agent documentation addendum**, not a source patch or an authorized release/host test.
- **A40 #101 and A140 #116** active on their own branches, with source-protection/Replit manifest and 140-path parity obligations. No overlap or new A120 Replit branch. A40/A140 own host/real checkpoint; do NOT assert real 404 fix.
- **A60** independently reviews PR120/103 exact SHA and executes full-checkout Source-01..04. A60 and authorized browser QA owner should perform viewport matrix and real SE/DE/RR/standings tests after an approved composite. All source acceptance requires exact new SHA.
- **A10/A00** register matrix and link in manifest, not as another changed feature PR; maintain independent PR47/54 collision and separately authorized future composition. Do not assume previous A60 conditional source QA extends to a future integrated SHA.
- No game/Unity assets or logic, no shared branch collision, no SQL/PG16/Docker, merge, deployment, live Replit modification, paid CI or SWARM-006.

**FINAL:** `A120_WAVE3_MATRIX_READY / SYNTHETIC_REPLAY_12_PASS_4_SKIP / NO_CODE_CHANGES / A60_BROWSER_QA_PENDING / RELEASE_NO_GO`.
