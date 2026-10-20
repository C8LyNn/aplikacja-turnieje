# CC-001 / R17-W6 — A60 independent Phoenix Windows Player UI evidence gate

**Identity:** A60 — Independent QA. Existing [Issue #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139). **Review date:** 2026-10-21 (Europe/Warsaw).  
**Scope:** evidence/GUI gate review ONLY; no Unity, C#, gameplay, test fixture, merge, release or other-role file changes.  
**A60 branch:** `feat/cc001-r17-w4-a60-candidate-qa`; initial review HEAD `04d4048308398eacab3ce68506c85f35b65c1618`.  
**A20 isolated candidate:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (actual GitHub remote HEAD verified).  
**Frozen prior Stage2:** `a67a37a0e4105dd680f52ae6728e93face61f4ce` (HEAD unchanged).  
**Source R16/V148/Protocol149 remain protected.**  
**Existing A60 Phoenix W6 acceptance:** [source-bound local G1/Windows G2 evidence](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6298852194), A60 report `04d4048308398eacab3ce68506c85f35b65c1618`. Do **NOT** repeat 361 managed/13 codec/Windows build/50-turn generic smoke.

## 1. Strict new evidence verdict — RECEIPT BLOCKER

**`PHOENIX_11_PNG_ARCHIVE_INTEGRITY = WAIT_RAW_EVIDENCE`.**  
**`PHOENIX_11_PNG_VISUAL_INDEPENDENT_ACCEPTANCE = WAIT_RAW_EVIDENCE`.**  
**`PHOENIX_UI_REAL_PLAYER_FULL_ACCEPTANCE = HOLD`.**

HQ reports that it **received** 11 original user Windows Player images, then created `CC001_PHOENIX_W6_WINDOWS_UI_SCREENSHOTS_EVIDENCE_20261020.zip`, size **2,100,640 bytes** and SHA256 **`0550af88ff5b41878405396659f67b19ee369160651a2deb9b394d3e39fdc443`**; see [HQ comment in #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6300817070) and [A20 #95](https://github.com/C8LyNn/aplikacja-turnieje/issues/95#issuecomment-6300816183). These are **HQ-reported reference values**, NOT recomputed by A60.

**A60 current-thread custody:**
- Examined current mounted working files; **no 11-image Phoenix UI screenshot ZIP** available. A60's previously received `phoenix-w6-qa-20261020-204232(3).zip` is **a different 1,668,642-byte archive** (SHA256 `d6e5224bff848e9bf03881f1f4ea4f4ef69e68ee334aa51dfe8772378a02b658`) with exactly **SIX generic native smoke PNGs**, not HQ's 11 new GUI screenshots.
- Searched conversation/Library files by exact expected archive name/hash and connected Google Drive by `CC001_PHOENIX_W6_WINDOWS_UI_SCREENSHOTS_EVIDENCE_20261020` / `PHOENIX_W6_WINDOWS_UI`: **no matching accessible original ZIP**.
- GitHub HQ Issue #97/#139 and A20 Issue #95 comments **contain textual visual observations, not the raw 11-image ZIP**. Hence no A60 11/11 PNG CRC, hashes, image decoding, visual pixel/time ordering or independent image assessment; these checks are **NOT_RUN** and must not be marked PASS.
- **Required transfer:** attach exact original 11-image ZIP to this A60 conversation or publish an explicitly authorized raw-byte file link; compare outer SHA256 `0550af88...`, CRC, image count, manifest per-PNG hashes and actual pixels first.

## 2. Reported visible chronological sequence (HQ's own image review ONLY)

This table conveys **source-attributed HQ observations** and is not an A60 independent image analysis:

| Screenshot point | Reported observable content | What it suggests, NOT what it proves |
| --- | --- | --- |
| Turn 3, Player 1 | Phoenix card **OUT OF STOCK** | Stock unavailable in displayed UI; no direct State.stock read |
| Turn 5 | Phoenix **HAND READY** and **H** indicator | Local UI reflects a returned Phoenix hand opportunity; exact GameState timestamp/owner-turn conditions not directly visible |
| Turn 13, Player 1 | Phoenix highlighted, **HAND READY**, selected ball labelled **Phoenix**, PH2 at launcher | Strong evidence of a selectable Phoenix via actual Player UI. Mouse/keyboard input source **unknown** |
| Turn 14, Player 2 | P1 Phoenix PH2 displayed on battlefield, **10 HP**; BALL DETAILS P1 Phoenix **10/20 HP, Shield 0** | Strong adjacent-frame visual evidence that a Phoenix was deployed after the observed selection; no corresponding input/replay/stock/hand event trace |
| Turn 17, Player 1 | Phoenix **HAND READY** and highlighted | A later returned hand-eligible display; number of ready hand entries and source/consumption cannot be inferred |
| Turn 19 | STANDARD highlighted while Phoenix **HAND READY**; later Phoenix highlighted and `RELEASE TO LAUNCH` aim state | Evidence of selection and aiming. **No screenshot confirming release or second resulting spawn** |

**Bounded implication when original bytes are verified:** `PHOENIX_NATIVE_VISUAL_READY_SELECT_BOARD = OBSERVED` may be issued specifically for the *visual* readiness, selectable highlighting, and subsequent on-board Phoenix, not automatically for end-to-end state transitions or input modality. The HQ timeline is chronologically plausible, but image filenames/timestamps/CRC and frame-continuity remain unvalidated by A60 pending ZIP bytes.

## 3. Source-backed findings VERIFIED independently by A60 via GitHub

- A20 Phoenix branch HEAD **`10f64e4d213f17a352ed8fa83bc75884a39549f0`**, frozen old Stage2 **`a67a37a0e4105dd680f52ae6728e93face61f4ce`**, and A60 own branch **`04d4048308398eacab3ce68506c85f35b65c1618`** were re-fetched.
- GitHub exact Stage2→A20 comparison **ahead 6, behind 0**, exactly **four authorized C# paths** plus **one A20 document**; no other new source. Source hashes/methods were re-read for `BallSelection.cs`, `CoreClashApp.cs`, `MatchView.cs`, `PresentationTests.cs` and `GameSimulation.cs`.
- `BallSelection.Source / CanSelect` checks finite stock before a Phoenix hand; hand predicates include ownership, `ready`, `createdOwnerTurns<ownerTurns`, `lastProcessedOwnerTurns>=ownerTurns`. Zero-stock valid hand yields `HAND READY`, shared by `SelectBall` and both UI card variations. Core `GameSimulation.TryCommand` similarly permits legitimate ready hand only after stocked copies are consumed; source-level behavioral contract is aligned. **Source is not a substitute for real input trace.**
- Actual A20 `CoreClashApp.SelectBall` produces `Debug.Log("CORE_CLASH_SELECT "+id)` when selection passes; obtaining original Player log with `CORE_CLASH_SELECT phoenix`, method-of-input description/recorder, spawn state and subsequent hand count would resolve a substantial independent-verification gap.
- **Secondary P2 UI copy inconsistency (source confirmed):** `CoreClashApp.AbilityText` maps any `AbilitySupport.Status(id)=="DATA_ONLY"` to `"Launches and collides normally. Its special power is unavailable in this class demo."`. HQ reports this exact claim appearing in Phoenix BALL DETAILS while ready-hand Phoenix functionality operates. Class-status copy may mislead; this is **not a proven broken Phoenix implementation**, and editing registry/catalog/copy requires separate owner authorization.
- Prior A60 independent local evidence stays accepted on A20 exact SHA: **361/361 managed with PHX-UI-01..10 10/10, codec 13/13, Windows Unity BuildPipeline PASS, generic Windows 50-turn smoke PASS, four binary SHA and six legacy smoke PNG SHA verified**. Do **not** conflate those six generic PNG with the eleven later GUI screenshots.

## 4. Minimum extra proof and closure tiers

**Visual UI acceptance (limited):** Receive the original 11-image ZIP, verify its total SHA/CRC and manifest/PNG SHA/dimensions, inspect pixel progression directly. If consistent with HQ observations, accept **visual evidence** of depleted stock → READY hand label → selected Phoenix → PH2 on the next visible board state. This establishes what Windows Player displayed.

**Full end-to-end Phoenix hand/UI behavioral acceptance (still HOLD):** Either actual Player **input event/method** (mouse click vs hotkey 1 or 5) plus log containing `CORE_CLASH_SELECT phoenix` / successful spawn event and authoritative `GameState` **stock stays 0, hand entry count decreases by exactly one**, or a focused equivalent native diagnostic run with source-authorized fixture. Distinguish the first deployment around Turn13/14 from the second aim around Turn19. An image of `RELEASE TO LAUNCH` alone is **not proof of release**. The simplest controlled follow-up is one Phoenix-ready deployment capture BEFORE/AFTER showing selected card, actual input, hand/stock counts and board entity. Repeat control by keyboard separately if keyboard acceptance is requested; no screenshot can reveal which input API fired without testimony/log/recording.

**Outside this bounded gate:** new Stage2+Phoenix WebGL/Android builds NOT_RUN; touch/mobile G3 NOT_RUN; network/crossplay G3 WAIT; complete G4 and release STOP. Prior A20 source is isolated, and A70 has no approved integration merge.

## 5. Five-axis HANDOFF

- **DESIGNED:** YES — strict 11-image evidence criteria / final native-event acceptance oracle.
- **IMPLEMENTED:** A60 report ONLY; no gameplay/test/source implementation.
- **TESTED:** GitHub remote HEAD, file/scoped compare, HQ issue/comments and available-file discovery performed. **11-image ZIP byte-level/hash/CRC/visual tests NOT_RUN because the raw archive is absent from this thread.** Existing 361 managed/13 codec/Windows local acceptance remains VALID from prior A60 run (not repeated).
- **INTEGRATED:** NO by A60; A20 candidate isolated from frozen Stage2.
- **RELEASED:** NO.

**Decision:** `WAIT_RAW_EVIDENCE` for A60 independent 11-image acceptance; `PHOENIX_VISUAL_UI = HQ_REPORTED / A60_NOT_VERIFIED`; `PHOENIX_REAL_HAND_CONSUMPTION_AND_INPUT = HOLD`; `G4 = HOLD`; `RELEASE = STOP`.

**To HQ/A20:** supply the original 11-image ZIP with no renaming/alteration requirement and one concise observed input method / successful selected Phoenix spawn event, ideally with `CORE_CLASH_SELECT phoenix` and immediately-before/after stock/hand GameState. **No new managed tests or general re-audit required**.
