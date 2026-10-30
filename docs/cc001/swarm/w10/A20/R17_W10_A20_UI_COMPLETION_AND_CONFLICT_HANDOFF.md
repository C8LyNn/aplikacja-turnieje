# CC-001 — R17-W10 / A20 — UX finalization, selection matrix and QA handoff

**Own role:** A20 UX/UI & Game Feel · **Own issue:** #95 · **HQ:** #97.  
**Existing Draft PR:** [#168](https://github.com/C8LyNn/aplikacja-turnieje/pull/168) — not merged.  
**Isolated branch:** `feat/cc001-r17-w9-a20-network-ux`.  
**Immutable START RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.  
**FINAL SHA:** use the exact live branch ref and issue handoff after this report-only commit.  
**Design authority:** [A10 approval, HQ #97 / 6529281715](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6529281715) and [A10→A20 #95 / 6529289849](https://github.com/C8LyNn/aplikacja-turnieje/issues/95#issuecomment-6529289849).

## Code delivered in W9+W10 (on A20 branch only)

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BallSelection.cs`
   - Pure `LocalTurnPresentation` helpers for the real local seat, network connection and authoritative turn. `ActionHint` now refuses to instruct P2 to drag/fire while P1 is active or the connection is absent.
   - Pure `AimUiStatus`: uses original **18 world units** readiness threshold, finite dx/dy, and textual `DRAG TO BUILD POWER` vs `RELEASE TO LAUNCH`.
2. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/MatchView.cs`
   - All desktop, compact landscape and phone actionable hint routes depend on local P1/P2 seat and connection; owner-relative turn labels remain; local player is marked `(YOU)`.
   - Removes the redundant post-shot `lastPower` progress bar. No gameplay/command power mutation.
3. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BoardView.cs`
   - W9 P2 aim-line fragments: field-local matrix-free stroke for guide/wings; original trajectory wall trace, physics and input unchanged.
   - **W10:** removes A10-approved floating power HUD, numeric `NN%` and field overlay. Power/readiness is represented by arrow length/tint; textual status lives in MatchView. Does **not** alter LaunchGesture.Release's power, spawn, replay, protocol or world coordinates.
4. `unity/cc001-r16/CoreClash-V149-Unity/Tests/PresentationTests.cs`
   - `NET-UX-01…08` W9 turn/aim geometry assertions; W10 `NET-UX-09…11` aim readiness/no meter semantics and invalid finite inputs, `NET-UX-12…14` remote P2 / disconnected / active P2 hints.
5. Own existing W9 documentation and this W10 report; **no** edits to Networking, Physics, CoreClashApp, GameSimulation, GameState, frozen source, V148 or Protocol149.

### Actual checks and gate honesty

- GitHub compare frozen RC1→branch: ancestor exact, no unrelated source files; previous 14/14 source/static assertions **PASS** validating no bar/percent overlay, core preview-length formula, owner-relative text, all 3 viewport ActionHint routes, 18-unit threshold, proper finite guard, 14 unique test cases.
- **C# .NET9 compile:** NOT_RUN (A20 toolchain: `dotnet`, `csc`, `Unity` absent, probe code1), **exit code: NOT_AVAILABLE**.
- **NET-UX-01…14 runtime tests:** AUTHORED / NOT_RUN.
- **Unity Windows build and actual P1/P2 PC1↔PC2 UI:** NOT_RUN on W10 modified SHA. Old RC1 361/361, codec13/13, Windows Player native smoke do NOT certify new source.
- **A60 independent QA:** REQUIRED on exact integrated source; **A72 build:** REQUIRED by build owner. No claims that P0 teleport/stutter fixed here.

## Conflict resolution for A70 (OWNER EXCLUSIVE — no automatic code merge)

All listed Draft PRs start from frozen RC1 and affect the same Unity project. **Do not merge all PRs blindly**; A70 must assemble a disposable candidate after HQ go and resolve by feature-owner choice, then get A60 acceptance.

| Feature and overlapping PRs | A20 recommendation and exact conflict |
|---|---|
| **Seat-relative turn/action text:** A20 [#168](https://github.com/C8LyNn/aplikacja-turnieje/pull/168) vs A21 [#170](https://github.com/C8LyNn/aplikacja-turnieje/pull/170) vs A30 [#175](https://github.com/C8LyNn/aplikacja-turnieje/pull/175). | **Select one implementation**. Prefer **A20 `LocalTurnPresentation` with W10 `ActionHint`**; it covers connected/disconnected, P1/P2, offline and all viewports. Do not also import A21 `TurnPerspective` and A30 `MatchPerspective.TurnText` as competing copy oracles. |
| **Local player's deck/stock:** A20 #168 currently renders active-turn deck in at least some layouts; A32 [#173](https://github.com/C8LyNn/aplikacja-turnieje/pull/173) independently fixes local deck selection. | Prefer A32 local deck data presentation after QA; manually reconcile its `BallSelection.cs` and `MatchView.cs` with A20's text/helpers. **Do not replace A20's Phoenix selection or local-seat action copy.** |
| **P2 own launcher at bottom / pointer transform:** A30 #175 touches `CoreClashApp.cs`, `MatchLayout.cs`, `BoardView.cs`, `BallView.cs`, `MatchView.cs`. | **A30 has the only available end-to-end view/input candidate**; its `MatchPerspective.ViewY=900-y` is a vertical mirror, NOT mathematically full 180-degree `x→540-x, y→900-y`. It brings own P2 launcher down; requires explicit A10 contract interpretation and A60 real P2 hit-test, replay, ballistic direction, wall bounce and text orientation checks before acceptance. A20 did **not** create a second camera-transform patch. Retain A20 matrix-free aim stroke and no-meter overlay when composing. |
| **P2 visual smoothing / telemetry:** A34 [#174](https://github.com/C8LyNn/aplikacja-turnieje/pull/174) vs A50 [#169](https://github.com/C8LyNn/aplikacja-turnieje/pull/169) vs A41 [#163](https://github.com/C8LyNn/aplikacja-turnieje/pull/163) and A30 #175. | Choose **one** render-only smoothing producer after A60/owner review; A34 is a UI-wired candidate, A50 is an **unwired** math helper. Do not stack two interpolators. A31/A41 own revision/transport fixes. Align data authority before presentation; A20 **did not touch** physics/network. |
| **Aim renderer:** A20 #168 vs A30 #175 and A34 #174 all modify `BoardView.cs`. | Retain A20's **group-local matrix-free aim stroke** and A10-approved no-power-meter design. Manually compose with selected view transform and selected smoothing; source conflict != automatic functional compatibility. New exact candidate needs Unity compile + real P2 screenshots. |
| **Tests:** A20 #168 `PresentationTests.cs` vs A30 #175; also A32/A34 add separate tests/Program registration. | Retain each nonduplicate test and use ONE final test registry. No unverified test count on integration. |

### A20 scope and dependencies

**P0 PC2 teleporting and latency:** NOT RESOLVED BY A20. A31/A41/A34 owners must produce accepted revision/pose trace and independent actual two-PC improvement; do not hide genuine world-state desync with rendering.

**P1 P2 own-bottom view:** A10 conditionally approved, but A20 defers to already-authored A30 candidate for single implementation; **NO physical acceptance** yet. Full 180-degree vs Y-only reflection is a precise open design/geometry difference, not proof of A30 failure.

**P1 aim arrows + P2 labels and action hints / P2 power meter:** source patches IMPLEMENTED in isolated A20 branch. Actual two-PC outcome requires integrated candidate and A60.

**GATE:** DESIGNED=YES / IMPLEMENTED=YES_ISOLATED / TESTED=STATIC14/14_ONLY, MANAGED_NOT_RUN, UNITY_NOT_RUN, PC1-PC2_NOT_RUN / INTEGRATED=NO / RELEASED=NO. **G3/G4 HOLD**, main/release STOP.

**Handoff:** A70 #137 owns disposable integration, A72 #113 build provenance, A60 #139 independent code and two-PC UX QA, A10 design contract, A31/A41 gameplay network. A20 #95 and HQ #97 receive exact branch SHA and selected conflict matrix. No merge or release authorization conferred by this report.
