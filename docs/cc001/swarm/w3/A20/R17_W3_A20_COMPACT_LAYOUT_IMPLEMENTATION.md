# CC-001 — R17-W3 / A20 COMPACT PHONE-LANDSCAPE IMPLEMENTATION

**Project:** CC-001 — Core Clash Unity  
**Agent:** A20 — UX/UI & Game Feel  
**Issue:** [#122](https://github.com/C8LyNn/aplikacja-turnieje/issues/122)  
**Branch:** `feat/cc001-r17-w3-a20-compact-layout`  
**Frozen source base:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**Branch's parent dispatch commit:** `e9e235a69a04eb57727defd308918321836d7f02` (baseline ahead by one dispatch-document commit)  
**Input R16 ZIP SHA-256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**Source root:** `unity/cc001-r16/CoreClash-V149-Unity/`  
**Previous design:** [R17-W2 A20 Landscape Contract](../../w2/A20/R17_W2_A20_LANDSCAPE_UI_CONTRACT.md) and R17-W1 Issue #95 review.

## 1. Status truth

| Phase | Status | Strict interpretation |
|---|---|---|
| DESIGNED | YES | W2 contract converted into source-level rules and presentation layout |
| IMPLEMENTED | YES — UNCOMPILED | Source edited and pushed to own GitHub branch; no runtime build |
| TESTED | STATIC ONLY | 10/10 independent Python geometry fixtures, 9/9 GitHub source/path checks; C# assertions authored but **NOT RUN** |
| INTEGRATED | NO | No HQ integration / source baseline edit |
| RELEASED | NO | No merge, Unity build publication or live website change |

This is **an implementation candidate on an isolated branch**, not QA PASS or a Unity-compiled release.

## 2. Exact permitted source delta

All edits are limited to the W3 A20 exclusive ownership:

1. `Assets/CoreClash/Presentation/MatchLayout.cs` — added compact eligibility branch and explicit rectangular regions `CompactHud/CompactChoice/CompactCards/CompactActions/CompactFeedback` to permit deterministic geometry tests.
2. `Assets/CoreClash/Presentation/MatchView.cs` — renders an independent phone-landscape mode before the legacy 810-unit scrolled side panel; two HP/20 displays with status bars, turn + phase, sticky selected name and STANDARD action, horizontal nine-special selector with arrows, fixed DETAILS/INSPECT/SETUP actions, visible winner/reason when game ends, compact notice/aim feedback.
3. `Tests/PresentationTests.cs` — **written first** on an isolated commit; added 4 named groups of test expectations, including 4 short-landscape resolutions, old-board-width comparison, portrait/tablet/desktop regression, and unsafe content-fit fallback. The test-first RED phase was **not executed** because no managed .NET toolchain was available.

**No edits:** `CoreClashApp.cs`, `UiViewport.cs`, `BoardView.cs`, `NgoLanLobby.cs`, `Networking/**`, `Tests/Program.cs`, core/physics/catalog, *.meta, protected V148 HTML, three site builds.

**Commit sequence before report:**
- `5f3482836d3c6aeba5d5c2deaefdaad1c39805b1` — test-first assertions
- `763b11bf33f252bfbb03c322b91ae96efcd1f233` — compact geometry
- `65f629d49982bea75e570a960dc52095bb1dbf94` — compact renderer
- `27de3b72066f6c2082b34c813c8ce2987a355871` — narrow HUD/card legibility fix

## 3. Implementation behavior

### New match-only phone landscape activation

`MatchLayout.For(width,height,DeviceProfile.Phone)` enters compact mode when all hold:

- `width > height`;
- logical viewport `270 <= height < 440` after existing safe area / scale handling;
- resulting board height at least 190 units;
- remaining compact panel width at least 320 units.

Fallback preserves existing R16 path if conditions fail; **fallback is not a certified functional solution for extreme short/narrow devices**. Portrait phone/tablet/desktop branches remain unchanged.

### Exact hierarchy at short landscape

- Existing global **60-unit** game title bar stays untouched. Board and controls start at logical **y=64** and never obscure the header/lobby entry control.
- Tall world board `540×900` maintains `width/height = 0.6`, left x=12 and y=64, with 8-unit bottom reserve.
- Panel is adjacent, separated by 12 units and with right reserve of 12 units. There is **no dedicated vertical ScrollView** on the compact match screen.
- Rows: HUD with both HP and current turn/phase (44 high), choice+STANDARD (44), nine-ball horizontally scrollable carousel (50/74), actions (44), remaining optional hint.
- Full-card selection (106-wide cards, >=50 high); previous/next arrows 44 units; selected card shown in upper sticky row. Selecting special/standard uses unchanged `SelectBall`, `CanChoose`, stock and turn ownership logic.
- Details and inspect actions call unchanged `ShowBallDetails` and `SetBoardInspection`; SETUP calls unchanged `ReturnToSetup`. The global multiplayer/lobby button still comes from `NgoLanLobby` above the board.
- When `Over`, the carousel area becomes a visible result-reason panel; the top HUD identifies winner or DRAW and SETUP is still fixed in view.
- Aim gesture, launch command, world-to-pixel transform, ball physics, player authority and status calculation are unmodified. No new mechanic, text semantics or ability was added.

### Before → current static geometry (NOT physical measurements)

| Phone logical viewport | Baseline R16 board | W3 candidate board | Width gain | W3 candidate panel |
|---|---:|---:|---:|---:|
| `844×340` | `148.8×248` | `160.8×268` | **+8.1%** | `647.2×268` |
| `667×325` | `139.8×233` | `151.8×253` | **+8.6%** | `479.2×253` |
| `568×270` | `106.8×178` | `118.8×198` | **+11.2%** | `413.2×198` |
| `844×390` | R16 generic side panel | `190.8×318` | not compared | `617.2×318` |

W2's aspirational 30–43% board enlargement **was not achieved** because it assumed removal of the 60-unit global match header in `CoreClashApp.cs`, which is **outside W3 A20 file ownership**. Claiming the larger size without that permission would violate the task. The immediate usability gain is prioritization: elimination of mandatory vertical scroll from core match controls, not massive board enlargement.

## 4. Test evidence actually executed

### A. Source/path assertions executed using GitHub readback

Fetched the exact W3 branch's three source files and compared the branch against its pre-edit commit (`e9e235...`), with these nine programmatic static checks: permitted path scope; header clearance; compact height/panel guard; renderer runs before generic ScrollView; result panel visible without that scroll; STANDARD + nine stock path preserved; DETAILS/INSPECT/SETUP controls; added test suite assertions; untouched `Tests/Program.cs`.

**Result: STATIC SOURCE PASS 9/9.** Git compare before report returned exactly three modified files (+25 / +80 / +42 lines respectively). This is **not** a compilation or runtime correctness result.

### B. Python static arithmetic executed against transcribed R16 and W3 geometry formulas

Command: `python - <<'PY' ... PY` with explicit viewport fixtures and assertions: 0.6 aspect, nonoverlapping panel, below 60-unit header, valid screen bounds, minimum 44-unit critical action row, compact row vertical nonintersection, board wider than R16 for three target cases. Additional fallback/profile comparisons.

**Result: STATIC GEOMETRY PASS 10/10 fixtures**: 844×340, 667×325, 568×270, 844×390 and six noncompact comparisons (390×844 phone; 820×1180 tablet; 1366×1024 tablet; 1280×900 desktop; 600×250 and 400×330 phone fallback). This Python check **transcribes formulas rather than executing C#**.

### C. Suite registration/source baseline static check

Read original canonical ZIP from local disk and verified `Tests/Program.cs` invokes `ExtraTests();`, with `Tests/BoundaryTests.cs` invoking `PresentationTests();` from `ExtraTests`.

**Result: STATIC WIRING PASS.** No `Program.cs` modifications.

### Toolchain presence and missing evidence

Local shell lookup found `git` and Node, but **no** `dotnet`, `csc`, `mcs`, `mono`, `msbuild`, or Unity editor executable. An unauthenticated shell Git remote access attempt failed DNS and was not used for publication; connected GitHub API readback was used instead.

**NOT EXECUTED:** 7 new managed `PresentationTests` test invocations (4 resolution fixtures + 3 groups); Unity compilation, Unity IMGUI rendering, WebGL screenshot tests, Android APK, physical touch, real device breakpoints, actual lobby/reconnect and full match play. The words PASS in this document apply **only** to static checks above.

## 5. Known limitations and explicit follow-ups for HQ

1. **CRITICAL W4 ownership boundary:** expanding the board toward the original W2 `194.4×324` at 844×340 requires suppressing/recomposing the global 60-unit header in `CoreClashApp.cs`. That path was not authorized for W3 A20, and the visible `MULTIPLAYER` control owned by `NgoLanLobby.cs` must retain accessibility. Request a separate HQ scope if larger board is demanded.
2. **Landscape details and multiplayer overlays** remain their R16 implementations. A20 deliberately did not edit `DetailsView.cs` or `NgoLanLobby.cs`. Their vertical content may still require scroll, and short viewport keyboard/network recovery flows remain untested.
3. **Physical readability and aim comfort at 118.8–190.8 board width** are unproven. Compact row widths and 44 logical units must be measured on actual hardware; long ball names might be truncated on compact card, but full selected identity remains in the fixed choice row.
4. Phone landscape `H<270`, fit panel <320, fullscreen shrink, notch/keyboard/pinch/resizing are fallback states, **not UX PASS**.
5. `MatchLayout.CompactFeedback` can have zero height on extreme `568×270`; selected-choice subtitle and HUD carry crucial notices, and a full result reason occupies the carousel. Unexpectedly long notices/results still require rendered/manual inspection.
6. Touch swipe-vs-select event arbitration is left to R16 `Draw.ScrollView`; must be verified by UI-level interactions. Source preservation does not prove touch behavior.
7. No guarantee on layout at a different native scale until physical device tests evaluate `UiViewport` safe-area transform.
8. The branch is isolated. A60 must independently compile/test before HQ merges. The 42/51/134 R16 ability readiness registry is unchanged.

## 6. Post-commit acceptance queue (not executed)

- Managed `PresentationTests` new and existing test run **PASS** under R16 Unity-owned source, including 844×340 / 667×325 / 568×270 / 844×390; separate `DeviceTests` suite and desktop/tablet regressions.
- Unity editor `6000.4.0f1` compilation of W3 branch + any relevant build target, with logs and exact branch SHA.
- Screenshot + click-path at all four compact viewports, phone portrait and both tablet modes; initial/selection, first/middle/last special, STANDARD, touch scroll, aim/cancel, inspect/details, result and setup; verify no overlapping or dead controls.
- Android phone with safe area / gestures, and actual tablet in portrait/landscape: ten manual launches, orientation/fullscreen interruption; record model, OS, build SHA, screenshots/video.
- Independent A60 regression and parity/authority review, then HQ-only integration decision.

## 7. HANDOFF

```text
PROJECT: CC-001
WAVE: R17-W3 — PARALLEL SOURCE DEVELOPMENT
AGENT: A20 — UX/UI & Game Feel
ISSUE: #122
OWN BRANCH: feat/cc001-r17-w3-a20-compact-layout
BASE SHA: de1fe4b88fce3bd08ef383165dc2cd622af2536b
BRANCH START SHA: e9e235a69a04eb57727defd308918321836d7f02
FINAL COMMIT SHA: See GitHub Issue #122 final HANDOFF after report upload/readback
CHANGED PATHS: MatchLayout.cs; MatchView.cs; PresentationTests.cs; this A20 report
R16 SOURCE SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
RESULT: Isolated compact landscape source + test-first regression assertions; no networking/gameplay edits
TESTS ACTUALLY RUN: Python transcribed static geometry 10/10; GitHub source/readback checks 9/9; suite wiring static PASS
NOT RUN: Managed .NET/C# tests, Unity compilation, screenshots, Android/physical device, runtime lobby/reconnect, release.
DESIGNED: YES
IMPLEMENTED: YES — NOT COMPILED
TESTED: STATIC ONLY — no C# or UI runtime PASS
INTEGRATED: NO
RELEASED: NO
KNOWN LIMITATIONS: global header restriction, overlays/keyboard, device touch/fit and emergency short viewport
HANDOFF: 00/HQ, A60 independent QA; A72 toolchain/CI results; future A20 conditional W4 UI polish
```

**Do not merge, force push or deploy. Do not close prior Issue #95 physical-device readiness based on this branch.**
