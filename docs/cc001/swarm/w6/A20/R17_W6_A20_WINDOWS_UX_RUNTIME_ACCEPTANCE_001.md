# CC-001 — R17-W6 / A20 — Windows UX Review Contract & Physical Device Validation Matrix

**Project:** CC-001 — Core Clash Unity  
**Agent:** A20 — UX/UI & Game Feel  
**Issue:** [#95 — Physical phone/tablet UX readiness](https://github.com/C8LyNn/aplikacja-turnieje/issues/95)  
**Wave:** R17-W6 / Evidence acceptance & runtime validation  
**Own existing branch:** `feat/cc001-r17-w3-a20-compact-layout` (no new branch)  
**Frozen candidate:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**Integrated Unity source commit:** `e58ba23a9f20e7a0865668655bd1e819845474bc`  
**A72 runner:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`  
**Prior A20 W3:** `1f87595a9d73de30179e5158a5848eae3b965885`  
**Historical issue handoffs:** #95 W1, #107 W2, #122 W3, #95 W4/W5.

## 1. Evidence acceptance boundary — NO image access in A20 conversation

HQ states that `handoff-20261020-030137.zip` is present in the **HQ chat only**, SHA-256
`20a16c90f4997c40959081d45f6a451834e8983e590a3ec38247da8747815c31`.

HQ reports:
- G1 **local**: managed C# 351/351, codec 13/13, seven stages exit 0.
- G2 **local Windows**: Unity Editor 6000.4.0f1 StandaloneWindows64 build succeeded; 0 errors, 1 warning; Windows EXE SHA-256 `97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3`.
- Windows **local native automated smoke**: 50 turns, 51 launches, winner P1 (0), HP 11:3, player exit 0 and six PNG captures reportedly hash-validated by HQ.
- Stage 2 **fresh WebGL and Android**: NOT_RUN.
- A60 independent admission of these raw bytes: PENDING at time of this report.

**A20 did not receive this archive, screenshots or EXE.** At this report's preparation:
- local working-container search for `*handoff-20261020*` and `*r6-native*.png`: **zero matching files**;
- current Project/Library filename search and Google Drive filename search for the exact ZIP: **no matching usable raw archive**;
- six actual screenshot pixels: **NOT INSPECTED** by A20.

**Therefore:** no screenshot image-quality score, visual regression PASS, Windows manual interaction PASS or physical device PASS is claimed here. These local HQ results are important upstream evidence, not independent A20 observations.

For A20 image review, hand off the **actual ZIP bytes** or all six original PNGs plus the native runtime manifest and original screenshot hash list. No fabricated image names or screenshots.

## 2. Source-grounded A20 findings on exact Stage 2

Fetched and inspected the following exact-source paths at candidate SHA `a67a37a0e4105dd680f52ae6728e93face61f4ce`:
- `Assets/CoreClash/Presentation/MatchLayout.cs` — blob `88b53c6c10d33fb5e0d5e29a621ddea27f6b8916`;
- `Assets/CoreClash/Presentation/MatchView.cs` — blob `7f9631a3fb272d312e253b15d2d4627f9d79d05f`;
- `Tests/PresentationTests.cs` — blob `7dc53a2c32db97375d6846fac418a4ca89a6feaf`;
- `DeviceViewport.cs`, `UiViewport.cs`, `CoreClashApp.cs`, `DetailsView.cs`.

### F-R6-A20-01 — IMPORTANT: Desktop Windows smoke does not prove mobile compact layout

**Observed in source:** `DeviceViewport.Create` selects `DeviceProfile.Desktop` when `touchCapable=false` under Auto profile. `MatchLayout.CompactLandscape` requires explicitly `profile==DeviceProfile.Phone` plus height/fit gates. `UiViewport.Refresh` reads `Application.isMobilePlatform`; standard Windows Player runs desktop profile in Auto.

**Interpretation:** an automated Windows screenshot pass using normal Desktop profile does **not** exercise the new phone landscape branch merely because the Windows resolution is wide/short.

**Follow-up test:** on actual Android/mobile WebGL device or an explicitly documented, testable forced Phone profile, capture the compact layout with effective profile, logical viewport W/H, scale, safe insets and SHA. Do not call an unrecorded native Windows forced profile a tested phone.

### F-R6-A20-02 — SHORT landscape details scrolling risk (UNCONFIRMED)

**Observed in source:** `DetailsView.RenderInfo` draws a fullscreen-darkened modal, calculates height `min(700,UiHeight-80)`, then reserves 154 or 192 additional logical units for content depending on modal width. In a short-height landscape this leaves a narrow scroll viewport.

**Risk hypothesis:** long ability/state copy and CLOSE may compete in visually small landscape. No screenshot or player interaction was examined here. Test rendering at logical 844x340 / 667x325 / 568x270, modal close after scroll, and orientation change.

### F-R6-A20-03 — 16–44+ logical UI size ≠ physical device certification (UNCONFIRMED)

**Observed in source:** new compact match rows use 44-high critical action buttons, 44-high selector arrows, 50- or 74-high cards; card names use size 10 and per-card stock uses size 11. `UiViewport.TargetSize` uses 44 for touch/Phone/Tablet, but GUI scale is derived from device DPI/safe area.

**Risk hypothesis:** cards may be technically tappable but visually cramped or hard to recognize at physical phone density. Confirm real rendered hit rectangles, glyph readability and accidental selection rate. Do not infer Android physical PASS from logical rect tests.

### F-R6-A20-04 — Fallback is not compact acceptance (UNCONFIRMED)

**Observed in source:** `CompactLandscape` applies to Phone only when logical `270 <= H < 440`, board H >=190 and panel W >=320. Below these thresholds, R16's generic landscape panel is reused. The test suite verifies fallback selection, not its ergonomic quality.

**Follow-up:** explicitly test near threshold boundaries including inset/toolbar/keyboard-induced safe viewport changes, never claim universal short-landscape support.

### Preserved boundaries

- exact simulated 540x900 world board, 0.6 aspect and existing aim/world transform;
- 9 special balls + standalone STANDARD;
- source-controlled `SelectBall`, `CanChoose`, INSPECT/DETAILS/SETUP and runtime result state;
- original R16/V148, Protocol149, catalog, published website untouched by A20.

All F-R6-A20 findings are **code-grounded test priorities, NOT confirmed visual/UI defects**.

## 3. Six-screenshot Windows review rubric — WAIT ORIGINAL PIXELS

For each of the six authentic Windows native captures, after obtaining bytes:

| Criterion | What to inspect | Acceptance signal | Failure signal |
|---|---|---|---|
| Frame and source | native screenshot dimensions, manifest SHA, scenario/timepoint | exact Stage 2 native manifest; no historical R16 substitution | unmatched SHA or uncertain source |
| Readable gameplay state | board contents, P1/P2 HP, active player, phase, labels | key status understandable without dev overlay | hidden/clipped/contradictory status |
| Spatial priorities | balance of board, deck panel, empty space | playable board visibly dominant; actions reachable | clipped action or excessive scroll |
| Ball readability | distinction of different balls in board/deck | unique recognizable identity at displayed size | visually indistinguishable / icon-only ambiguity |
| Feedback | aim/release, collision, turn change, winner result | no confusing jump/occlusion; clear winner/reason | stale status, misleading feedback |
| Contrast and layout | text, colors, alpha, safe area | readable in normal and grayscale where available | crucial information color-only |
| View consistency | screenshot sequence relative to declared state | HUD/HP/turn coherent with source state | visual contradictions |

Use **PASS / FAIL / INCONCLUSIVE / NOT_AVAILABLE** per capture and criterion; do not downgrade unknowns into PASS. HQ's six verified PNG hashes prove byte consistency with its runtime manifest, **not visual quality**.

## 4. Windows manual UX protocol — AUTHORED / NOT EXECUTED

**Preflight:** acquire exact EXE/build artifact, build manifest and SHA-256; record actual OS and monitor scaling. Verify screenshots are genuinely Stage 2; identify Auto/Phone profile and logical viewport. Save a before/after (if any bug is fixed) at same build and same scenario.

| ID | Steps on real Windows Player | Required observation | Evidence |
|---|---|---|---|
| WIN-01 | Launch fresh build; start local match | no fatal overlay; both P1/P2 base HP, turn and selected ball readable | capture + build SHA |
| WIN-02 | Select STANDARD then first/middle/last of nine specials | selected identity and stock update without launching shot | sequence capture + logs |
| WIN-03 | Navigate deck control/scroll when present | every special accessible; no invisible mandatory action | capture before/after scroll |
| WIN-04 | Drag from valid launcher, release; repeat 10 times | aim trace usable; at most one legal launch per complete gesture | screen recording + command log |
| WIN-05 | Switch INSPECT, click friendly/enemy ball, open DETAILS and CLOSE | source ball, owner, HP/shield/state readable; inspect does not accidentally launch | screenshots + step log |
| WIN-06 | Change window/fullscreen/resolution mid-aim if supported | drag canceled; no unintended shot; no clipped critical control | recording + exact dimensions |
| WIN-07 | Observe turn change and moving state | new owner/phase visible; selected ball validity and stock correspond to turn | pair of screenshots + log |
| WIN-08 | Complete match (including draw fixture if available) | WIN/DRAW, reason and return to SETUP visible and actionable | result capture + log |
| WIN-09 | Open setup/deck builder and details with long ball names | no control hidden behind scrolling or modal; selection names consistent | capture with selected deck |
| WIN-10 | Open LAN/lobby, exit; simulate disconnection only in controlled test | accurate connection/error copy + next action; no false reconnect promise | screenshots + network fixture |
| WIN-11 | Compare 1280x900, 960x600 and short 844x390 when supported | usable desktop layout; unchanged input world transform; no stray offscreen panel | per-resolution capture |
| WIN-12 | Review six HQ-native PNGs against manifested smoke states | visual legibility and consistency rubric above, source verified | 6 adjudicated records |

**Do not claim any WIN-XX was executed** until a native run or raw screenshot is observed and logs exist. `WIN-06` resolution changes may require runtime/window settings not present in the shipped build; if unsupported, mark NOT_RUN rather than invent a control.

## 5. Mobile/tablet matrix — test after actual Stage 2 builds

Physical acceptance needs independently identifiable **fresh Stage 2 Android and/or mobile WebGL builds** tied to the same candidate SHA; R16's historical Android/WebGL logs do not qualify.

| ID | Device / orientation | Target UX surfaces | Critical observable |
|---|---|---|---|
| MOB-01 | Android phone portrait with cutout | deck, HUD, STANDARD, aim, inspect | no clipped actions under notch/gesture area |
| MOB-02 | Android phone landscape (logical 844x340 class) | compact HUD, 9-ball carousel, DETAILS/INSPECT/SETUP | `CompactLandscape=true`, no mandatory vertical scroll |
| MOB-03 | narrow Android phone landscape (~667x325 logical) | arrows, card names/stock, aim accuracy | 44-equivalent real target comfortably usable |
| MOB-04 | extreme phone landscape (~568x270 logical) | compact/fallback and result | all buttons reachable; label/feedback not misleading |
| MOB-05 | phone rotate mid-drag | pointer identity/focus cancellation | 0 unintended launches after rotation |
| MOB-06 | phone background/foreground mid-drag | cancellation and state recovery | no stale pointer activation |
| MOB-07 | Android tablet portrait | board/side/tray setup + builder + inspect | portrait sizing and scrolling |
| MOB-08 | Android tablet landscape | board and side panel density, result | controls/status visible without clipping |
| MOB-09 | real mobile WebGL portrait | browser toolbar/safe insets, deck, launch | correct coordinate mapping after chrome resize |
| MOB-10 | real mobile WebGL landscape | safe-area, carousel, fullscreen | reliable touch gesture and card scroll |
| MOB-11 | mobile WebGL with virtual keyboard | builder search, lobby join/code input | focused input visible; dismiss/cancel accessible |
| MOB-12 | separate-device client when authorized by A31 | network status/reconnect feedback readability only | error/status actionable; no invented seat-resume promise |

Mandatory in each device record: candidate SHA, target build SHA, OS, model, orientation, effective `UiViewport.Profile`, physical screenshot W/H, safe insets, logical W/H, DPI/scale, 44-target measurement, selected ball/turn, step list, observed actual result, screenshots/video SHA-256, tester and timestamp.

**MOB-01 .. MOB-12: ALL NOT_RUN**. Neither a Windows automated smoke nor a browser viewport emulation certifies physical phone/tablet usability.

## 6. Prioritization and QA handoff gates

**P0** once original PNGs arrive: verify raw pixels and complete six-capture visual rubric; flag any actual clipped/misleading HUD immediately to HQ/A60 with screenshot/timepoint, no new code changes.

**P1** once Windows EXE is accessible: execute WIN-01..WIN-12 with reproducible player evidence. Windows autoplay smoke does not substitute for human inspection/interaction.

**P1** once fresh Stage 2 Android/WebGL build is available: execute MOB-01..MOB-11 on real hardware; A31 owns actual crossplay test execution, A20 only reviews its UI status/feedback.

No new A20 source edits are authorized by this W6 report; any true defect gets a reproduction, observed-vs-expected contrast, exact SHA and separately requested HQ code scope.

## 7. Actual work, tests and handoff

**Performed in R17-W6 A20:**
- read current HQ #97 W6 local-evidence decision and R17-W6 dispatch;
- read current #95 role/gate and Stage 2 A70/A60 context;
- verified exact Stage 2 branch and read relevant Unity presentation source paths;
- inspected W3 A20 GUI/geometry code and prior role deliverables;
- searched Project/Library/Drive/local working folder for raw six native images and `handoff-20261020-030137.zip`, with no matching usable raw archive;
- authored the executable-minded Windows review rubric, WIN-01..WIN-12 manual protocol, MOB-01..MOB-12 mobile/tablet matrix and source-derived risk ledger.

**Tests actually executed by A20:** read-only connector/source inspection. Local `sed` and `find` shell commands on the pasted dispatch and working directory completed, but **no game-under-test process** was run; these are not native/UI test exits. No new player screenshot was decoded/visually reviewed here.

**NOT_RUN:** Stage 2 managed C# 351 suite and codec 13 rerun; Unity compile; Windows EXE execution; Windows manual UI; six PNG visual acceptance; Android/WebGL fresh build; device touch / physical phones/tablets; multiplayer.

**Five axes:**
- DESIGNED: YES — documented runtime UX acceptance protocol.
- IMPLEMENTED: YES — previous A20 W3 source preserved in Stage 2; NO new GUI code.
- TESTED: SOURCE/DOCUMENT REVIEW ONLY by A20; genuine physical/manual tests NOT_RUN.
- INTEGRATED: YES — previous code in isolated Stage 2 development candidate ONLY.
- RELEASED: NO.
- GATE: **PARTIAL — WINDOWS SOURCE-REVIEW READY; RAW PNG VISUAL REVIEW WAIT_EVIDENCE; MOBILE/WEBGL G2/G3 WAIT**.

**OWN NEW W6 COMMIT:** exact SHA is recorded in #95 issue comment after GitHub write/readback.  
**OWN FILE CHANGED:** only this `docs/cc001/swarm/w6/A20/**` document; no 13 Stage 2 C# paths touched.  
**Handoff:** #95 → HQ #97 / A60 #139 (independent evidence admission) / A70 #137 (build linkage) / A72 #113 (runner); A31 #94 only for coordinated network-display checks. Do not close #95 from this report.

No merge into main, force push, release, public deployment, protected R16/V148 or Protocol149 modifications.
