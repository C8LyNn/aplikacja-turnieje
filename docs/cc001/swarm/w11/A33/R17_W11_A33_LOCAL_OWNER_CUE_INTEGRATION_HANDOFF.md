# CC-001 R17-W11 / A33 — Local Owner Inspection Integration Patch

**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**Role:** A33 — Presentation/UI Implementation
**Base:** exact A70 W10 PR #181 SHA `3d377767e72473cebd90e49293a0cd5dada70464`; no mutation to that integration branch.
**Our isolated branch:** `feat/cc001-r17-w11-a33-local-owner-integration`
**RC1 protected:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`

## Implemented
- Connected multiplayer inspector displays canonical ball owner P1/P2 with **(YOU)** or **(OPPONENT)** relative to `NetworkLink.LocalOwner`, not `Simulation.State.turn`.
- Offline, invalid-seat or disconnected inspection stays neutrally P1/P2.
- Existing HP, inspected owner, ball preview, simulation state and network send paths preserved.
- F1 read-only LOCAL SEAT and ACTIVE SEAT labels for P2 corrected `RED` → `PINK` to match existing `Draw.Owner(1)=Draw.Pink`. No artwork/actual color changed.
- Existing A33 F1 diagnostics from W9 #176 remain present unchanged except two color words.

## Files
1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs` — minimal UI.
2. `scripts/cc001/w11/a33/owner-cues.test.cjs` — 14 test cases.
3. This document.

## Evidence and status
- GitHub exact `DetailsView.cs` blob `e945b82baa66ed8459f9f7ca36e43cf75c4b5a00`.
- `Draw.cs` blob `8944b0389a66d0f169f9ff2a071c2a15f420223e`, `BallInspection.cs` blob `89d7b5d7f18b928a8ed63de9e4b030a32bc69b86`.
- Test blob `c676884c88fab7ca5aae849edbded3850308cb73`.
- Exact committed Node test body executed in V8 against those exact GitHub-fetched C# texts: **14/14 PASS**. Tests are synthetic/source-contract, **not** compiled Unity or actual PC1/PC2.
- GitHub source comparison against exact A70 #181: two modified/additional paths before this report. A30 conditional PR #189 at `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193` changes 18 files from same A70 base; **zero overlaps** with our two code/test paths.
- **NOT RUN:** Node CLI on full checkout, .NET9, Unity PlayMode/Editor, native Windows build, two Windows PCs, independent A60 evaluation. No G3/G4 acceptance.

## Integration routing and supersession
- Previously authored W10 A33 draft PR #187 `869d6e4baa450ec541872ebff33a2860e8b3868c` is now **ALT_HOLD** (stacked on W9 A33 #176). Do not merge both owner-cue implementations.
- A70 #181 already incorporated W9 A33 F1 #176 source. Do **not** duplicate that PR's parent changes.
- This W11 PR is the **preferred scoped A33 addition** to A70 #181 or A70-approved #189; A70 must select and integrate, no author self-merge.
- A30 #189 includes A41 size-bounded snapshots and A34 wired smoother, P2 player view and bar removal; these are outside A33 scope and **not independently accepted by A60**.
- If A70 selects and integrates a new SHA, A72 must update its Windows kit pin. A60 independently verifies local P1/P2 inspection, F1 colors, correct turn/aiming and synchronized PC1/PC2 output.

**RESULT:** DESIGNED=YES / IMPLEMENTED=YES / TESTED=V8 14/14 STATIC+SYNTHETIC / INTEGRATED=NO / RELEASED=NO.

Protected RC1/R16/V148/Protocol149/main/release untouched.
