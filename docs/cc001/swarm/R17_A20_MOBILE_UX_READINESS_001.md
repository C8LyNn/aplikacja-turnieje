# CC-001 R17 / A20 — Mobile UX physical-device readiness — intake + pre-A70 design

**PROJECT:** CC-001  
**ROUND:** R17  
**ISSUE:** #95 — Physical phone/tablet UX readiness  
**ROLE:** A20 — UX/UI & Game Feel  
**BRANCH:** `feat/cc001-r17-a20-mobile-ux`  
**BASE:** Core Clash V149 Unity R16  
**R16 ZIP SHA256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`

## Status vocabulary

- **DESIGNED:** YES — physical-device acceptance matrix, risk register and narrow repair plan are defined.
- **IMPLEMENTED:** NO — A70 editable R16 source import is still the required source-tree gate.
- **TESTED:** PARTIAL / EVIDENCE REVIEW ONLY — R16 ZIP provenance was independently hashed; static source was inspected; 9 existing R16 WebGL emulation screenshots were manually reviewed. No physical phone/tablet run was performed by A20.
- **INTEGRATED:** NO.
- **RELEASED:** NO.

This report does **not** certify physical Android/tablet usability and does **not** claim Unity compilation or APK execution.

---

## 1. Inputs actually reviewed

Authoritative R17/R16 inputs:
- `docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md`
- GitHub Issue #95
- Drive `HANDOFF_R16_README.md`
- Drive `R16_REPORT_PL.md`
- Drive `R16_QA_PL.md`
- Drive `Evidence/R16/ability-support.json`
- `docs/cc001/swarm/R16_AUDIT_20261018.md`
- canonical R16 ZIP from Drive.

A20 independently downloaded the canonical R16 ZIP and verified:
- SHA256: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` — MATCH
- ZIP entries: **639**

Static source paths inspected from the canonical ZIP:
- `Assets/CoreClash/Input/TouchInput.cs`
- `Assets/CoreClash/Presentation/DeviceViewport.cs`
- `Assets/CoreClash/Presentation/UiViewport.cs`
- `Assets/CoreClash/Presentation/MatchLayout.cs`
- `Assets/CoreClash/Presentation/MatchView.cs`
- `Assets/CoreClash/Presentation/SetupView.cs`
- `Assets/CoreClash/Presentation/DetailsView.cs`
- `Assets/CoreClash/Presentation/Draw.cs`
- `Assets/CoreClash/Presentation/CoreClashApp.cs`
- `Assets/CoreClash/Networking/NgoLanLobby.cs`
- `Assets/CoreClash/Networking/NgoGameSession.cs`
- `Assets/Plugins/WebGL/DeviceViewport.jslib`
- `Assets/WebGLTemplates/CoreClash/index.html`
- `Tests/DeviceTests.cs`
- `Tests/SetupLayoutTests.cs`

---

## 2. Existing R16 mobile baseline — what is actually supported by evidence

R16 already contains meaningful mobile foundations:

1. **Safe-area model exists.**
   - Native: `Screen.safeArea`.
   - WebGL: CSS `env(safe-area-inset-*)` bridged through `DeviceViewport.jslib`.
   - `UiViewport.GuiMatrix` offsets/scales GUI into the safe region.

2. **Touch input has a primary-pointer ownership model.**
   - A secondary finger does not silently take over an active drag.
   - focus/pause/viewport refresh cancels presentation input.

3. **Touch target baseline exists.**
   - `UiViewport.TargetSize = 44` for touch/phone/tablet.
   - WebGL coarse-pointer toolbar buttons use min-height 44 px.
   - existing managed tests assert 44-point deck-row actions.

4. **Phone portrait already has a dedicated match tray.**
   - `RenderPhoneTray()` uses horizontal special-ball scrolling and three 44-unit actions.

5. **Reconnect/error text exists.**
   - host/client disconnect and recovery return the user to setup/lobby with explicit status text.
   - this is source evidence only; physical readability/actionability remains unverified.

R16 QA itself explicitly states:
- Web phone/tablet checks were browser emulation, not physical-device certification.
- physical Android/tablet was NOT TESTED.
- compact landscape board/text remains small and some controls require scrolling.

---

## 3. Manual review of existing R16 emulation evidence

A20 manually inspected these 9 R16 screenshots from the canonical ZIP:

1. `r6-webgl-r16-phone-portrait-04-builder.png`
2. `r6-webgl-r16-phone-portrait-08-match.png`
3. `r6-webgl-r16-phone-portrait-09-touch-aim.png`
4. `r6-webgl-r16-phone-landscape-04b-builder-info.png`
5. `r6-webgl-r16-phone-landscape-08-match.png`
6. `r6-webgl-r16-phone-landscape-08b-lower-control.png`
7. `r6-webgl-r16-tablet-portrait-08-match.png`
8. `r6-webgl-r16-tablet-landscape-08-match.png`
9. `r6-webgl-r16-phone-portrait-safe-area.png`

These are **before/evidence references only**. They are not physical-device results.

Observed from the emulated captures:
- phone portrait is materially more usable than landscape;
- tablet portrait/landscape use the available board area substantially better;
- phone landscape allocates a very narrow board beside a scroll-heavy control panel;
- landscape ball-details overlay consumes most of the short vertical surface;
- the safe-area emulation path visibly preserves the main UI inside the tested inset.

---

## 4. Concrete layout finding: phone landscape is the R17 A20 priority

`MatchLayout.For(..., DeviceProfile.Phone)` uses the landscape branch when width > height.

For the R16 tested short-landscape fixtures, source arithmetic yields approximately:

| logical viewport | board | side panel |
|---|---:|---:|
| 844 × 340 | 149 × 248 | 360 × 248 |
| 667 × 325 | 140 × 233 | 287 × 233 |
| 568 × 270 | 107 × 178 | 280 × 178 |

The existing managed test intentionally accepts board width >=100, which protects against collapse but is not a physical comfort certification.

The same landscape match path uses the generic side panel with nominal content height **810**, therefore scrolling is expected on short phones. This matches the R16 QA limitation and the reviewed screenshots.

### UX-R17-A20-001 — HIGH
**Phone landscape board is functional but physically high-risk for precise aiming and quick state reading.**

Not yet a certified defect because no physical device was used in this A20 run.

### Proposed narrow repair after A70
Create a phone-landscape-specific presentation path, without gameplay changes:
- compact top/HUD reservation;
- horizontal special-ball tray instead of the desktop-style 3×3 vertical deck;
- sticky DETAILS / INSPECT / SETUP actions;
- reduce mandatory vertical scrolling;
- use reclaimed vertical pixels to increase board size;
- preserve exact 540×900 board/world coordinate mapping.

No code change is authorized from this report until the editable R16 source baseline exists in Git.

---

## 5. Device acceptance matrix

| Device/surface | Orientation | Required checks | Current R17 A20 status |
|---|---|---|---|
| Android native phone with cutout/gesture nav | portrait | safe area, deck select, details, board inspect, aim/release, scrolling, lobby, result, reconnect | **NOT TESTED physically** |
| Android native phone with cutout/gesture nav | landscape | same + board precision + compact controls + modal fit | **NOT TESTED physically / highest risk** |
| Android native tablet | portrait | safe area, deck density, board size, scroll, touch targets, inspect | **NOT TESTED physically** |
| Android native tablet | landscape | same + side-panel density | **NOT TESTED physically** |
| physical mobile WebGL phone | portrait/landscape | viewport-fit, safe insets, touch capture, browser chrome resize, fullscreen | **NOT TESTED physically**; R16 emulation only |
| physical tablet WebGL | portrait/landscape | same + profile selection/resizing | **NOT TESTED physically**; R16 emulation only |
| orientation change during aim | both | active drag must cancel; no unintended launch | source/tests support design, **physical NOT TESTED** |
| background/foreground during aim | both | active drag must cancel; no unintended launch | source supports cancellation, **physical NOT TESTED** |

### Physical PASS criteria

A device/orientation is not PASS until a real device demonstrates:
- no consequential control under cutout/system gesture region;
- no clipped mandatory action;
- touch action size and spacing are comfortable and do not produce adjacent accidental activation;
- deck selection and info inspection are usable without hover;
- aim/release can be performed repeatedly without finger occlusion causing systematic mis-aim;
- orientation/focus interruption does not launch accidentally;
- required match controls are reachable without ambiguous nested scrolling;
- lobby/reconnect status and next action are readable and actionable;
- result state can be read and exited without hidden controls;
- screenshots/video + device model/OS/build identifier are retained.

---

## 6. Risk / issue register

### UX-R17-A20-001 — HIGH — phone landscape density
Evidence: R16 QA + source arithmetic + reviewed emulation captures.  
Action after A70: dedicated compact landscape match path.

### UX-R17-A20-002 — HIGH — physical safe-area behavior unverified
The architecture exists and has emulated/logical tests, but real cutout/status/navigation bars were not exercised.  
Action: physical Android phone portrait + landscape, including rotation.

### UX-R17-A20-003 — HIGH — physical aiming/release precision unverified
Coordinate-equivalence tests exist, and touch aim is shown in emulation. This does not establish finger comfort or precision.  
Action: repeated real-device launch set; record cancellation/mis-launch observations.

### UX-R17-A20-004 — MEDIUM — deck selection / horizontal tray physical ergonomics unverified
44-unit controls exist, but thumb reach, scroll inertia and accidental selection are not certified.  
Action: real-device deck selection and tray navigation sequence.

### UX-R17-A20-005 — MEDIUM — ball-details modal on short landscape
Emulated landscape capture shows the modal occupying most of the short surface with internal scroll.  
Action after A70 only if physical evidence confirms friction: compact safe-area sheet with always-visible close/primary navigation.

### UX-R17-A20-006 — MEDIUM — lobby/reconnect feedback physical actionability unverified
Source contains explicit messages and recovery-to-setup flow.  
Action: network interruption on a physical client; verify that status and next action remain visible without confusing scroll state.

### UX-R17-A20-007 — MEDIUM — result screen physical verification absent
R16 has desktop/native evidence, but no physical phone/tablet acceptance.  
Action: complete match or test fixture on physical device in both orientations.

---

## 7. Planned fix order once A70 opens the source gate

1. **F1 — phone-landscape compact match composition**  
   Highest expected value; presentation-only.

2. **F2 — safe-area physical regression fixes**  
   Implement only if a real device exposes clipping/inset defects.

3. **F3 — touch hitbox/spacing corrections**  
   Preserve >=44 logical-unit baseline; adjust only observed undersized/overlapping controls.

4. **F4 — short-landscape ball-info presentation**  
   Only if physical test confirms modal/scroll friction.

5. **F5 — lobby/reconnect/result visibility corrections**  
   Only from reproducible physical evidence; no networking semantics changes.

No broad HUD redesign, gameplay edit, balance edit or V148 change is proposed.

---

## 8. Before / after evidence state

### BEFORE
Available:
- R16 browser-emulated 82 checks / 94 screenshots;
- 9 screenshots manually inspected by A20 in this run;
- static source inspection;
- R16 reported managed/build evidence.

### AFTER
**NOT AVAILABLE YET.**

Reason:
- A70 has not yet published the editable R16 source baseline in Git;
- no A20 source fix was made;
- no physical Android/tablet device was run.

A20 will not manufacture “after” evidence from browser emulation or the compiled website artifact.

---

## 9. Tests actually performed by A20 in this run

Performed:
- canonical R16 ZIP SHA256 verification — **MATCH**;
- ZIP entry count — **639**;
- static source review of viewport/touch/layout/match/setup/details/network-recovery paths;
- manual review of 9 named R16 WebGL emulation screenshots;
- branch/source-gate inspection confirming the repository still points to Drive for editable R16 source.

Not performed:
- Unity editor import;
- Unity compilation;
- managed test rerun;
- Android APK install/launch;
- physical phone/tablet test;
- physical WebGL mobile test;
- reconnect test on a real device;
- before/after source-diff QA.

Existing R16 test results are treated as upstream evidence and are **not re-certified by A20**.

---

# HANDOFF

**PROJECT:** CC-001  
**ROUND:** R17  
**SUBTASK:** A20 — Physical phone/tablet UX readiness  
**AGENT:** 20 — UX/UI & Game Feel

**STATUS:** PARTIAL — DESIGN/EVIDENCE INTAKE COMPLETE; IMPLEMENTATION + PHYSICAL ACCEPTANCE BLOCKED

**BASE:** V149 R16 candidate, SHA256 `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`

**DESIGNED:** YES  
**IMPLEMENTED:** NO  
**TESTED:** PARTIAL — static/evidence review only; physical devices NOT TESTED  
**INTEGRATED:** NO  
**RELEASED:** NO

**WYKONANO:**
- R17 dispatch / Issue #95 intake;
- R16 Drive handoff/report/QA intake;
- canonical ZIP provenance verification;
- static mobile UX architecture review;
- 9-screen manual emulation review;
- device acceptance matrix;
- prioritized R17 A20 issue/fix plan.

**NIE WYKONANO:**
- Unity source modifications;
- physical-device fixes;
- physical phone/tablet acceptance;
- Unity/build rerun;
- public deployment.

**RYZYKA:**
- phone landscape remains the strongest known usability risk;
- safe area, touch comfort, modal fit and reconnect actionability are not physically certified;
- browser emulation must not be promoted to physical PASS.

**ZALEŻNOŚCI:**
- A70 exact R16 Git source import is required before source implementation;
- real Android phone/tablet hardware is required for physical acceptance evidence;
- A60 should independently verify any later A20 code and provenance.

**USER DECISION REQUIRED:** none for pre-gate work. Physical-device execution requires access to actual target hardware/build installation path.

**RECOMMENDED NEXT STEP:**
1. A70 publishes exact R16 source baseline and commit SHA.
2. A20 rebases `feat/cc001-r17-a20-mobile-ux`.
3. Implement F1 test-first and rerun managed/build checks.
4. Install on real Android phone + tablet and collect before/after evidence.
5. Hand off to A60 for independent verification.

**INFORMATION FOR HQ:** Do not close Issue #95. A20 has produced a truthful pre-A70 readiness package only; implementation and physical certification remain open.
