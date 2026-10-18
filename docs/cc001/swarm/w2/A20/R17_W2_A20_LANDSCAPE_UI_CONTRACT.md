# CC-001 R17-W2 / A20 — SHORT-LANDSCAPE UNITY UI CONTRACT

**Issue:** [#107](https://github.com/C8LyNn/aplikacja-turnieje/issues/107)  
**Agent:** A20 — UX/UI & Game Feel  
**Wave:** R17-W2 (independent pre-import design)  
**Branch:** `feat/cc001-r17-w2-a20-landscape-contract`  
**Frozen branch base SHA:** `f35145085127bdbb878e8ffdcf38705be8348e45` (GitHub branch ref inspected before this document was added)  
**Input:** Core Clash V149 Unity R16 source ZIP, SHA-256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**W1 predecessor:** `docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md` on `feat/cc001-r17-a20-mobile-ux` — **preserved, not replaced**.

**Scope classification:** IMPLEMENTATION-READY PRESENTATION DESIGN, not source implementation.  
**R16 gameplay/network protocol, V148 original, repository runtime and production site:** NO CHANGES.

## 1. Design decision / why this exists

**Decision D20-W2-01: implement an isolated compact-phone-landscape match presentation after A70's source import.** Keep the exact portrait board-world mapping and game rules. Stop using the tall, generic landscape side panel for a short phone. Put HP, turn, selected ball, nine-special selector, STANDARD, INSPECT, DETAILS, SETUP and result/aim feedback in a fixed-height, high-priority surface. Allow *only secondary metadata* to scroll/expand.

This closes W1's *design ambiguity* in **UX-R17-A20-001**. It **does not** close physical-device acceptance or implement a fix.

### Owner's constraints preserved

- Gameplay arena remains a **540×900 world** rendered at **0.6 width/height aspect**. The physics collider/world rectangle does not change.
- Source launch/inspection mapping remains `world.x=(screen.x-board.x)*540/board.width` and `world.y=(screen.y-board.y)*540/board.width` (`CoreClashApp.cs:89-119`).
- Launch from the existing launcher or eligible Replay ball; do not invent tap-to-shoot, alternative aim math, swipe-to-fire, auto-target, power changes or forced orientation.
- Nine special balls plus separate unlimited STANDARD remain; deck counts, turn progression and authority are untouched.
- Browser / Android safe insets are inputs **before** calculating layout. Avoid permanent overlays occluding the arena or launch gesture.
- Do not import the website's compiled WebGL artifacts as Unity source.

## 2. Provenance, evidence type, exact R16 source anchors

The canonical ZIP was read directly from Drive in the preceding A20 wave and rechecked locally for W2. SHA-256 matched the frozen input above; ZIP contains **639 entries**. Exact source (paths relative to `CoreClash-V149-Unity/`):

| Source and line | R16 SOURCE FACT | Consequence |
|---|---|---|
| `Assets/CoreClash/Presentation/MatchLayout.cs:18-27` | Phone is portrait when `width<height`. Landscape reserves `height-92`, side width `min(360,max(280,width*.43))`, board aspect 0.6. | Short landscape board shrinks before intrinsic content density is considered. |
| `Assets/CoreClash/Presentation/MatchView.cs:12-40` | Nonportrait uses a generic side `Draw.ScrollView`, `content=810`, HUD/turn sit **inside scroll**; nine cards in 3 columns; actions and match result after cards. | Match-critical controls and outcome can scroll out of view. |
| `MatchView.cs:42-59` | Phone **portrait** already uses `RenderPhoneTray`: horizontal special deck, STANDARD and DETAILS/INSPECT/SETUP actions. | Reuse concept/controls, not a second gameplay-selection system. |
| `MatchView.cs:60-77` | `TurnText()` and `Hud()` already expose turn/player and each base HP. | Existing data can be shown in a compact fixed header. |
| `MatchView.cs:79-91` | `BallCard` selects via full-card hitbox; detail is a separate action; status stock is visible. | Horizontal cards need full-target tap without long-press dependency. |
| `CoreClashApp.cs:58-69,70-105` | Layout recomputed on viewport/profile change; active aim canceled; pointer mapped to world using board width. | Can add a display-only layout profile while retaining pointer semantics. |
| `CoreClashApp.cs:127-143` | Global title/header occupies top 60 units; multiplayer button is drawn by `NgoLanLobby.Render()`. | Compact mode must suppress/recompose the 60-unit decorative match header and **reserve** multiplayer control region. |
| `DetailsView.cs:9-23` | Info modal occupies up to `UiHeight-80`, with large header and nested scrolling. | Short landscape requires a compact modal/sheet design with fixed CLOSE. |
| `SetupView.cs:9-23,47-92` | Short view `UiHeight<440`; setup, library, builder use scrollable lists and pinned bottom CTAs. Short setup omits normal player summary cards. | Keep primary action pinned; display a terse confirmation of both chosen decks. |
| `NgoLanLobby.cs:100-135` | Lobby occupies up to screen minus 20 and uses title, TWO 44-unit tab rows, then a long scroll view. | On 270-340 logical height, form body is nearly invisible. Needs compact **visual** layout later, not changed networking. |
| `NgoLanLobby.cs:53-63,190-224` | On recovery moves to setup and shows message; connected/waiting/leave controls exist. | Keep status and a safe next action visible in short landscape. |
| `UiViewport.cs:11-50`, `DeviceViewport.cs:8-30` | Native `Screen.safeArea`; WebGL CSS inset bridge; `Width/Height=SafeArea/Scale`, touch target baseline 44 logical units. | Measure breakpoints on **logical safe area**, not raw hardware pixels. |
| `Draw.cs:26-47` | Buttons are drawn with literal rects; custom touch scrolling starts after 8-unit drag, and may consume mouse-drag/up. | Avoid nested critical-action scroll, test tap vs drag conflicts. |
| `Assets/WebGLTemplates/CoreClash/index.html:5,11-25,34-57` | `viewport-fit=cover`, `100dvh` shell, coarse toolbar min-height 50, fullscreen/profile controls, touch-action none. | Actual Unity canvas can be shorter when toolbar/browser chrome/keyboard appear. |
| `Tests/DeviceTests.cs:9-24,26-37,63-100` | Existing geometry/transform/primary touch tests; landscape threshold currently accepts 100-wide board and >=150-high panel. | Old tests are a regression baseline, **not** ergonomic acceptance. |

**Evidence type:** SOURCE REVIEW plus independent **static arithmetic check** below. R16 upstream reported WebGL **82 emulated checks / 94 screenshots**; A20 W1 reviewed 9 screenshots. **No W2 runtime, Unity compile, Android APK or physical-device testing is claimed**.

## 3. Baseline numbers and compact-proposal geometry

### 3.1 Current R16 geometry — calculated from source (logical units)

| Viewport/profile | R16 board (W×H) | R16 panel (W×H) | Decision |
|---|---:|---:|---|
| **844×340 / Phone landscape** | **148.8×248** | **360×248** | TARGET |
| **667×325 / Phone landscape** | **139.8×233** | **286.8×233** | TARGET |
| **568×270 / Phone landscape** | **106.8×178** | **280×178** | TARGET / emergency-width test |
| 390×844 / Phone portrait | 296.4×494 | 366×200 | REGRESSION-ONLY, retain portrait tray |
| 820×1180 / Tablet portrait | 456×760 | 796×270 | REGRESSION-ONLY |
| 1366×1024 / Tablet landscape | 559.2×932 | ~437.1×932 | REGRESSION-ONLY |

The source accepts landscape board width as low as 100; the visible world is still 540×900, so the center and ball identities are physically small at 106.8-wide. This is a **source-grounded risk**, not a measured finger-accuracy failure.

### 3.2 Compact geometry — PROPOSED, NOT IMPLEMENTED OR DEVICE-MEASURED

Take `W=UiViewport.Width` and `H=UiViewport.Height`, **after** safe-area handling and density normalization.

Suggested composition only for `profile==Phone && W>H && H<440` and adequate horizontal content-fit:

- outer horizontal margin `mx=12`; arena vertical margin `my=8`; gap `g=12` (all **proposed** logical units);
- `boardH = H-2*my`;
- `boardW = 0.6*boardH`;
- `Board = (mx, my, boardW, boardH)`;
- `Panel = (mx+boardW+g, my, W-(2*mx+boardW+g), boardH)`;
- make main match header 60-unit ornament **absent only in this compact match state**;
- preserve the existing `MULTIPLAYER` action at its current screen-right top position (`sw-168,10,150,44`) by treating that rectangle as **reserved** when planning the panel's first row;
- if the reserved header has insufficient width, compress labels to `P1 20/20 · P2 20/20 · T3/50` (with current-turn emphasis) before relocating any mandatory action.

Proposed calculated examples (the **numbers are arithmetic, not test screenshots**):

| Logical viewport | Proposed board | Proposed panel | Board width vs R16 |
|---|---:|---:|---:|
| 844×340 | **194.4×324** | **613.6×324** | +30.6% |
| 667×325 | **185.4×309** | **445.6×309** | +32.6% |
| 568×270 | **152.4×254** | **379.6×254** | +42.7% |

No world/collider size change: the gain comes solely from reclaiming the global title/side-panel top/bottom reservations. Main match UI no longer uses the existing 810-high side scroll.

**Important limitations.** Larger 0.6 board = more room to see/aim, not a guarantee of physical touch precision. A 12-unit inset does not certify Android gesture-navigation edge safety; later physical tests may require extra inset or a different visual offset. At extreme small viewport/split-screen sizes this design can still fail content fit.

### 3.3 Responsive eligibility — decision algorithm, not a brittle phone-model whitelist

1. Normalize to safe-area logical `W,H` through existing `UiViewport`; identify Profile `Phone/Tablet/Desktop`.
2. Phone and `W<=H`: **existing portrait** mode, unchanged in first implementation (separate regression audit).
3. Phone and `W>H`: calculate whether the proposed compact layout can fit:
   - height guard candidate: `H<440` (matches existing short-view family), **NOT yet tuned by devices**;
   - panel available width `P=W-2*12-12-0.6*(H-16)`;
   - proposed safe compact panel width: `P>=320` for three fixed primary controls and 44-target carousel arrows;
   - proposed 4-row critical fit: two 44-high rows + 64-high minimum carousel + 44-high actions + 32-high one-line/two-line status + gaps **<=H-16**. The concrete row schedule in Section 4 targets `H>=270`.
4. If compact candidate **fails**, do **not** silently clip buttons or reduce below 44: retain a bounded fallback, show visible "More space needed — portrait recommended" guidance and record a **UI NOT ACCEPTED** fixture until a distinct emergency layout is approved. Do not freeze gameplay, trigger unintended launch, lock rotation or claim accessibility at a size that cannot fit.
5. Tablets keep existing portrait/landscape layouts in first implementation. Test small tablet split-screen separately; short safe height may motivate a later content-fit layout independent of `DeviceProfile`. Forced Phone profile remains testable, not a license to call a tablet a phone.
6. Dynamic viewport change (fullscreen, WebGL toolbar, mobile browser URL bar, safe area, software keyboard, orientation/profile switch) invalidates layout and cancels active gesture via existing `CancelPointer()` path. Never re-issue pending launch.

**Proposal thresholds `H<440`, `P>=320`, `H>=270`, and 12/8/12 margins are QA hypotheses, NOT observed device cutoffs.** If height is 240-269 logical units, the emergency fallback must be assessed before shipping.

## 4. Wireframe / strict priority of gameplay content

### 4.1 Short landscape: example `844×340` (safe logical size)

```text
┌──── arena ~194 × 324 ────┬───────── fixed control surface ~614 × 324 ─────────────┐
│                          │ P1 20/20 | P2 20/20 | TURN 3/50 | MULTIPLAYER [44]   │
│                          ├───────────────────────────────────────────────────────┤
│                          │ Selected: KINDLER                  [STANDARD] [44]     │
│  one tall 540×900        ├───────────────────────────────────────────────────────┤
│  gameplay board          │ [< 44] [card][card][card][card]... [> 44]             │
│  NO fixed UI overlay     │             horizontally scrollable NINE specials     │
│  inside aim target       ├───────────────────────────────────────────────────────┤
│                          │ [DETAILS ≥44]  [INSPECT ≥44]  [SETUP ≥44]              │
│                          ├───────────────────────────────────────────────────────┤
│                          │ status: READY / DRAG / RELEASE / MOVING / RESULT      │
└──────────────────────────┴───────────────────────────────────────────────────────┘
```

Actual compact row contract (relative panel-local y, **proposed**, logical units):

| Row | `H=270` interval | `H=340` interval | Sticky? / owner |
|---|---:|---:|---|
| R0: HP P1/P2, turn, multiplayer reserved slot | 8–52 | 8–52 | YES; HP/turn from `MatchView`; reserved MP belongs to lobby renderer |
| R1: selected ball + STANDARD | 56–100 | 56–100 | YES |
| R2: nine-special horizontal carousel | 104–168 (64 high) | 104–184 (80 high) | Carousel scrolls **horizontally only**, arrows >=44; no parent vertical scroll |
| R3: DETAILS / INSPECT / SETUP | 174–218 | 190–234 | YES; each button >=44 high and width |
| R4: critical match feedback / result | 224–262 (38) | 240–332 (92) | YES; no nonessential messages allowed to displace R0–R3 |

- Board occupies y 8..H-8 and receives drag/replay/inspection; no drawer overlays it while aiming.
- `BallCard` is the whole selector hitbox. 64/80 heights are proposed card viewport sizes, not final typography sign-off.
- At 568×270, header left of reserved multiplayer region permits **very terse** P1/P2 HP and turn labels. Full readable match outcome can replace this header after `Over` instead of hiding either health or result.
- **STOCK** per special card remains mandatory; no icon-only selection without selected-name label; `STANDARD` visible at all times.
- Panel may show "touch selected ball or use DETAILS"; tooltip is not hover-only.
- Normal state uses honest copy: Aiming → `DRAG TO AIM`/`RELEASE TO LAUNCH`; Moving → `SHOT RESOLVING`; inspect → `TAP A BALL TO INSPECT`.
- No color-only communication of active player, status or stock. Labels + HP numerals + selection stroke remain.

### 4.2 Status/readability priority (must not scroll out of view)

| Rank | Always visible on match screen? | Content | May collapse? |
|---|---|---|---|
| P0 | YES | actual arena and target/aim trace | NEVER; game-world location must remain accurate |
| P0 | YES | both base HPs, active turn, turn number, current phase | Labels can abbreviate, numerical meaning cannot |
| P0 | YES | selected ball identity and its stock, STANDARD selector, nine-special access | Inactive special cards may be offscreen *inside horizontal carousel* with navigation |
| P0 | YES | DETAILS, INSPECT / CANCEL, SETUP | Never hidden below nested vertical scroll |
| P0 | YES after game over | WINNER/DRAW, reason or access to full reason, return to setup | Secondary long reason may expand |
| P1 | YES where triggered | network loss/waiting/error with actionable next step | Wrap/expand copy only, preserve status |
| P1 | YES during shot | DRAG/RELEASE/MOVING and power/feedback cue | Extended flavor wording may collapse |
| P2 | NO | lengthy ball descriptions, archetype names/keywords, tutorial copy | Put in DETAILS or scrollable secondary view |
| P2 | NO | cosmetics/event-list backlog, developer/debug detail | Collapse or omit in compact layout |

### 4.3 Aim and inspection interaction

| State / gesture | Required behavior | Forbidden failure |
|---|---|---|
| Tap special card | selects one of current turn player's nine stocks if available; visibly highlights name/stock | false launch, wrong selection, selection via unintentional carousel drag |
| Horizontal deck swipe | only changes carousel offset, **does not select** nor emit `PointerSample.up` launch | scroll registers as shot/tap |
| Tap STANDARD | selects separate unlimited standard shot | implicit depletion / hiding standard |
| Board drag from launcher/Replay candidate | existing `LaunchGesture` controls; release sends at most one command | layout-dependent power or world coordinate change |
| Board tap non-Replay ball | existing details/inspection semantics preserved | forced launch when inspect intended |
| INSPECT on | switches to board inspect; prompt and CANCEL persist | consumes aim then launches on close |
| Details opens, loses focus, screen rotates | cancel active aim and reset primary pointer on layout change | stale drag survives and launches |
| Network turn not owned locally | selection/launch disabled per `CanChoose`; still allow safe inspect and status reading | fake client-authoritative shot |
| Active match to setup | intentional SETUP command, explicit visibility; no changes to server/authority | hidden destructive action or inconsistent session exit |

**Critical implementation test:** launcher/replay source positions must still map to `x=270,y=853` or `47` and `(screen.x-board.x)*540/board.width` as before. Increased visual board size must only alter pixel-to-world scaling.

## 5. Screen-state wireframe contracts

| Screen/state | Fixed region | Scroll/overflow owner | Actions & acceptance |
|---|---|---|---|
| **Setup/showcase** | safe-area title + explicit `P1: deck name`, `P2: deck name`, bottom START / ALL DECKS action | ONLY featured-card list scrolls vertically | At short height R16 hides normal player summary; replacement must show selected deck names/which player before START. Footer never obscured. |
| **All decks** | BACK + P1/P2 current deck identity + START | deck rows scroll in **one** vertical list | Row `P1`/`P2` actions each >=44; 9 previews stay a separate row, not combined with hitboxes. |
| **Deck builder** | BACK, count `n/9`, USE THIS DECK (disabled unless 9); search focus | roster list scrolls vertically, optionally independent focused input | Search/IME must not push SAVE outside safe area; when keyboard reduces logical height, scroll selected item into view and keep BACK/USE reachable after dismissing keyboard. |
| **Match aiming** | arena, both HP, turn/phase, selected ball, special carousel, STANDARD, DETAILS/INSPECT/SETUP, compact status | carousel **horizontal only**, expanded explanations modal | All match-critical controls reachable without any vertical scroll. |
| **Match resolving** | same HP/turn/status; show `SHOT RESOLVING`, current arena | secondary feedback may truncate, never move buttons | No spurious re-aim/extra launch when moving. |
| **Ball inspection / details** | fixed `CLOSE` >=44 and ball name + concise current HP/shield/state, current target/owner as available | long ability/condition copy only **within** one explicit scroll region | At short H, modal can be near full safe area; title/CLOSE pinned, no reliance on OS Back/Escape. Close returns to same match state and cancels drag. |
| **Result / draw** | prominent WIN/DRAW, base HP, match result reason if short; SETUP action remains pinned | optional full result details expandable | R16 `Over` result currently sits at end of scrolling side panel; new result must be visible at zero scroll. No invented rematch button. |
| **Multiplayer lobby create/join** | fixed CLOSE, create/join choice, INTERNET/LAN choice, STATUS and intended primary JOIN/CANCEL action | long invites/advanced fields in **single** scroll region | Short modal must not leave only ~34px content view as R16 can; reposition UI only later with A41 ownership coordination. |
| **Connecting/reconnect/recovery** | status `CONNECTING / WAITING / RECOVERY / FAILED` + next action (CANCEL / RETURN / JOIN as actually offered by existing code) | diagnostics/details expandable | Do not imply authenticated same-player rejoin or seat ownership; R16 returns to setup on failure. Keep error visible until acknowledged/retry. |

### Mini-wireframe: short landscape DETAILS

```text
┌───────────────── safe-area width / height ──────────────────┐
│ [ball icon/name] [HP / shield / owner]        [CLOSE 44]     │
├─────────────────────────────────────────────────────────────┤
│ ability / trigger / condition / current statuses             │
│       ONE scrollable content region ONLY                     │
└─────────────────────────────────────────────────────────────┘
```

No forced two-panel modal if `H<440`; vertical display of title+CLOSE and content remains more reliable. Focus/rotation closes or reflows safely, never converts a tap to launch.

### Mini-wireframe: short landscape LOBBY / reconnect

```text
┌─────────────────────────────────────────────────────────────┐
│ PLAY TOGETHER              [status if critical]  [CLOSE 44] │
│ [CREATE / JOIN]                 [INTERNET / LAN] (44 high)  │
│ ┌───────────── one scrollable form region ─────────────────┐ │
│ │ code/address + help + advanced only on demand           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [CURRENT NEXT ACTION: JOIN / CANCEL / RETURN]        [44]   │
└─────────────────────────────────────────────────────────────┘
```

This is a **future presentation coordination note**, not A20 authorization to edit `NgoLanLobby.cs` now, nor a reconnection protocol redesign. If the existing one-modal layout cannot fit a keyboard-visible state, allow its form region to scroll *while* keeping dismiss/CLOSE and next action reachable after keyboard dismissal; no fake success indication.

## 6. Overflow and hitbox acceptance rules

- **44 logical-unit touch target baseline** follows R16 `UiViewport.TargetSize`. For each physical device also record actual rendered target size; 44 logical is not automatically identical to 44 Android dp on all scales.
- Gap between adjacent critical buttons **proposal**: 6–8 logical units; no overlapping rects, no full-screen invisible overlays intercepting launch.
- Horizontal nine-ball selector must have explicit >=44 previous/next buttons plus swipe support and a visual indication of more cards. All nine remain reachable with repeated arrows.
- Do not lower below 44 for compact by shrinking the text/borders; abbreviate **copy** instead.
- Do not place selectable deck cards in a parent vertical `ScrollView` on the compact match screen.
- INSPECT toggling, DETAILS close and lobby entry must cancel pending gesture; verify no accidental double-command on up event.
- The safe area belongs to `UiViewport`; don't double-apply native `Screen.safeArea` and CSS `env(safe-area-inset-*)`. Toolbar reduces the Unity canvas separately; fullscreen may increase it.
- If on-screen keyboard opens in builder/lobby, layout follows **actual reduced canvas safe height** when available; test alternate behavior when browser overlays keyboard instead of resizing. Required text fields cannot be permanently obscured.
- Text minimum proposals: critical HP and turn >=14 logical; selected name >=14; smaller card labels may be 11–12 if full name remains in sticky selected row. Color contrast and real px legibility need screenshots/physical review.
- Do not let multiplayer overlay steal board pointer when closed; when open, modal consumes taps, launch canceled.
- Preserve R16 two-touch primary-pointer ownership and `CancelPresentationInput` behavior.

## 7. Future A20 implementation boundary / smallest code surface

**First, narrow implementation batch — only after A70 source import and HQ R17-W3 authorization:**

1. `Assets/CoreClash/Presentation/MatchLayout.cs`  
   Add a source-tested compact eligibility flag/geometric builder; keep old portrait/tablet/desktop branches and world aspect invariant.
2. `Assets/CoreClash/Presentation/MatchView.cs`  
   Render fixed compact HUD/turn + horizontal special tray (extract/reuse portrait `RenderPhoneTray` patterns) + sticky DETAILS/INSPECT/SETUP + result/notice priority. Avoid unnecessary duplicate selection logic.
3. `Assets/CoreClash/Presentation/CoreClashApp.cs`  
   Suppress/decorrelate 60-unit **decorative match header** in compact mode while reserving lobby button; preserve existing `Layout()`, `CancelPointer()`, `HandlePointer()` and network ownership. No gameplay command edits.

**Conditional follow-up after physical QA**, not a prerequisite of compact match batch:
- `DetailsView.cs`: compact information sheet if details are physically inaccessible;
- `SetupView.cs`: short landscape selected-deck visibility/IME;
- `NgoLanLobby.cs`: **presentation-only** compact modal *after coordinating file ownership with A31/A41/HQ* (networking/recovery logic untouched);
- `Tests/DeviceTests.cs` plus new presentation-level geometry/interaction assertions. Test files only when source-import gate is open.

No edit proposed for `Assets/CoreClash/Core/*`, `Physics/*`, network protocol 149, `Reference/V148_reference_original.html`, catalog JSON, or hosted website.

**Agent file-ownership condition:** This W2 wave edits ONLY `docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md`. The above C# paths are **future ownership candidates**, not W2 changes.

## 8. Before/after evidence plan and physical-device QA

### Fixture / screenshot matrix for R17-W3 (not executed in W2)

| ID | Surface + logical viewport **fixture** | Screens to capture before/after | Acceptance goal |
|---|---|---|---|
| L01 | WebGL emulated Phone **844×340** | match idle, selected special, aim, released, inspect modal, result | target board >R16 148.8 and controls not in vertical scroll |
| L02 | WebGL emulated Phone **667×325** | same plus last of 9 cards and STANDARD | 9 specials reachable; all 3 main actions always visible |
| L03 | WebGL emulated Phone **568×270** | match, result, details, multiplayer | smallest target; board/content fit, no hidden exit |
| L04 | WebGL emulated Phone **390×844** | setup, match, aim/cancel, details, result | portrait regression remains usable; preserve ~296.4×494 board baseline |
| L05 | WebGL emulated Tablet **820×1180** | setup, match, inspect, roster | tablet portrait unchanged |
| L06 | WebGL emulated Tablet **1366×1024** | same | tablet landscape unchanged |
| L07 | WebGL fullscreen/window + toolbar and simulated safe insets | resized match, interrupted aim, lobby | pointer canceled, one layout transform, no double insets |
| L08 | Android physical phone with cutout/gesture navigation, portrait+landscape | same as L01–04 + 10 real-world aims | **PHYSICAL** QA required, not fulfilled by emulation |
| L09 | Android physical tablet portrait+landscape | setup/build/match/inspect/result/reconnect | **PHYSICAL** QA required |
| L10 | Physical mobile browser WebGL, URL-bar/keyboard/fullscreen changes | builder search, join code, canvas resizing | **PHYSICAL** QA required |

**Capture manifest fields for each screenshot/video:** R17 candidate commit SHA, source-import SHA, Unity version, build target/build SHA, device manufacturer/model/OS, real/emulated classification, browser, raw dimensions, safe insets, logical `W×H`, `Scale`, Profile, orientation, current screen state, screenshot path SHA256, observer and timestamp. Without these fields do not call evidence PHYSICAL or RELEASE-READY.

### Deterministic click-path and behavior tests for later A60

- **T01:** 9 specials + STANDARD: tap first/middle/last special via arrows; stock/selected label match source, no launch.
- **T02:** horizontally drag special tray then lift: carousel moves, selected ball unchanged, **0** unintended shot commands.
- **T03:** drag from own launcher, release: **1** legal command, world vector/power equals old transform under same initial world endpoints.
- **T04:** launch gesture then rotate/resize/fullscreen/profile switch: canceled, **0** commands after interruption.
- **T05:** INSPECT → tap both teams' existing balls → DETAILS → CLOSE → CANCEL INSPECT: no gameplay mutation or accidental launch.
- **T06:** turn passes from P1 to P2: active turn text, both HP and selection/disabled client ownership stay synchronized.
- **T07:** result DRAW/P1/P2: winner, reason, HP and SETUP accessible without vertical scroll; no invented rematch path.
- **T08:** setup choose P1/P2 decks and confirm visible chosen identities; start match with correct two selections.
- **T09:** builder search focus brings software keyboard; edit/close/USE THIS DECK reachable, no clipped mandatory CTA.
- **T10:** multiplayer JOIN/CREATE tabs, code-entry, error, CANCEL, reconnect notice: correct message and next step pinned; **no** claim of identity-bound seat recovery.
- **T11:** safe area insets on notch left/right/top and gesture bar: all critical UI/touch regions inside safe interactive surface.
- **T12:** real device 10 legal aims in both orientations: observer logs mis-aim/finger occlusion, accidental exit, wrong selection; **no** PASS based merely on command count.
- **T13:** small-screen fallback below proposed fit: explanatory guidance, no clipping/false button activation; label NOT_ACCEPTED if gameplay cannot be played reliably.
- **T14:** after all other tests, regression desktop and tablet, WebGL and Android, including when toolbar shrinks the canvas.

**Test layers:**
- Pure C# `MatchLayout` fixture tests and source-equivalence pointer assertions first.
- Unity IMGUI/screenshot UI audit second.
- Physical Android phone/tablet/manual target checks third.
- A60 independent verification before HQ integration. **TEST_DESIGNED != TEST_EXECUTED**.

## 9. Static arithmetic smoke actually executed in W2

**Commands executed on canonical local ZIP**:

```sh
sha256sum /mnt/data/CoreClash-V149-R16-Source-Candidate.zip
unzip -Z1 /mnt/data/CoreClash-V149-R16-Source-Candidate.zip | wc -l
```

Results: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` (MATCH) and `639` entries.

A local **Python static arithmetic check** transcribed `MatchLayout.For` formulas and evaluated the 6 viewports in Section 3; for 3 compact landscape proposals it asserted:
- proposed board aspect = 0.6;
- all rectangles remain within logical viewport and board/panel do not intersect;
- proposed board width > R16 width;
- minimum proposed panel width across the three reference landscapes: **379.6** units.

Results: 3/3 compact **arithmetic fixtures satisfy those assertions**; 3/3 portrait/tablet reference viewports remain outside the proposed mode. This is **STATIC CALCULATION ONLY**, not C# execution, layout pixel comparison, render correctness or touch certification.

**NOT RUN in W2:** Unity editor/import/compile, managed C# tests, WebGL runtime test, Android APK installation, on-device aim/reconnect/lobby, before/after screenshots of implementation, human comprehension study.

## 10. Acceptance gate and unresolved questions

**Design contract accepted for later coding** if:
- after A70 exact R16 code import the compact branch touches only approved presentation sources;
- after implementation `MatchLayout` asserts 0.6 board world aspect, no overlap or critical clipping in L01/L02/L03;
- existing portrait/tablet/desktop device tests remain passing;
- T01–T14 executed with measured evidence and negative controls;
- a physical Android phone and tablet complete the named critical journeys;
- A60 independently gates before 00/HQ integration.

**OPEN / no silent resolution:**
1. The `H<440` eligibility, `P>=320` fit and minimum `H>=270` are proposals; target hardware and safe-inset/gesture-region tests must calibrate.
2. Extreme short layout `H<270` remains an unresolved emergency presentation; never claim universal phone-landscape support.
3. Physical readability at arena width 152–194 and on-screen aim finger occlusion are unverified.
4. Lobby and Android keyboard behavior may require isolated presentation updates to a file also maintained by networking. HQ to coordinate future source ownership; **no dependency on A41 W2 output is needed for this design**.
5. Whether physical Android WebGL toolbar/safe areas leave enough height is an implementation QA condition, not proven by current 82 browser checks.
6. No new UX action changes network seat recovery/authentication semantics. Show current failure accurately until A31/A41 introduce a separately authorized contract.

---

# HANDOFF → 00/HQ

**PROJECT:** CC-001  
**WAVE:** R17-W2  
**AGENT:** A20 — UX/UI & Game Feel  
**ISSUE:** #107  
**BRANCH:** `feat/cc001-r17-w2-a20-landscape-contract`  
**BASE COMMIT:** `f35145085127bdbb878e8ffdcf38705be8348e45`  
**FINAL COMMIT:** GitHub commit of this file (reported in Issue comment and separate response after write/readback).  
**FILES:** `docs/cc001/swarm/w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md` ONLY  
**INPUT R16 SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`

**DELIVERED:** R16-anchored implementable compact-phone-landscape contract, source-arithmetic before/proposed layout matrix (6 viewports), fixed-priority gameplay wireframe, setup/details/result/lobby/reconnect states, adaptive breakpoint process, safe-area/IME/scroll policy, narrow post-A70 code ownership candidates, future screenshot/click-path matrix, physical-device acceptance.

**ACTUAL TESTS:** ZIP SHA-256 MATCH; ZIP 639 entries; local Python static geometry calculation (3 compact arithmetic fixtures pass + 3 noncompact comparisons). No runtime tests.

**NOT RUN:** Unity/C# tests, builds, rendered before/after, Android APK/device, physical mobile WebGL, networking/reconnect.

- **DESIGNED:** YES — W2 scope delivered as an implementation-ready design contract.
- **IMPLEMENTED:** NO — W2 expressly prohibits Unity source changes.
- **TESTED:** STATIC SOURCE/CALCULATION ONLY; runtime + physical NOT TESTED.
- **INTEGRATED:** NO.
- **RELEASED:** NO.

**OPEN QUESTIONS:** thresholds, edge gestures, finger occlusion, emergency narrow viewport, keyboard effects, later lobby UI source ownership.

**HANDOFF TO:** 00/HQ for R17-W3 scope sequencing; A20 future source implementation after A70; A60 future independent GUI/device regression gate. Do not close Issue #95 physical readiness based on this W2 document. Do not merge/deploy from W2.
