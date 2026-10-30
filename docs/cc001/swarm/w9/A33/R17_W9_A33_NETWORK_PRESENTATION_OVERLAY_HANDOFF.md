# CC-001 R17-W9 / A33 — PC1–PC2 presentation & instrumentation handoff

**Role:** 33 / Gameplay Engineering — Presentation & Instrumentation  
**Scope:** strictly read-only developer F1 network overlay; no gameplay/network transport change  
**Base:** `integration/cc001-r17-w8-phoenix-rc1` / `10f64e4d213f17a352ed8fa83bc75884a39549f0`  
**Branch:** `feat/cc001-r17-w9-a33-network-presentation-20261030`  
**HQ:** #97

## Implemented (not an independent G3 acceptance)

- F1 readout explicitly separates **LOCAL SEAT** (P1/P2), **ACTIVE SEAT**, connection readiness, HOST/CLIENT role and whether local aiming is possible.
- Displays existing host-authoritative state revision or client received-snapshot count / applied revision / current revision.
- Exposes existing accepted/rejected LOCAL and REMOTE intent counters. Counters are not interpreted as ping, latency, smoothness or PC1–PC2 state convergence.
- Makes the existing F1 content scrollable so diagnostics do not clip on compact viewports.
- Phase-gates control text: after the shot begins resolving it no longer claims `YOUR TURN / AIMING`.
- All values come from `NetworkLink`, `Simulation.State` and public `NgoGameSession` read-only properties. No new network calls, no mutation, no additional polling, no packet-size change.

## Files

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs` — changed F1-only presentation.
2. `scripts/cc001/w9/a33/verify-network-overlay.cjs` — 11 static source-integrity / string-contract checks; execute on full checkout using `node scripts/cc001/w9/a33/verify-network-overlay.cjs`.
3. This report.

## Non-overlap / ownership

- No changes in `MatchView.cs` / `TurnPerspective.cs`: A21 and A83 own local-turn copy.
- No changes in `BoardView.cs` or `BallSelection.cs`: A20 owns aim/deck UX in W9.
- No changes in `NgoGameSession.cs` / `NetworkGameSession.cs`: A41 owns snapshot/ack work.
- No changes in physics / remote smoothing: A34 and A50 own interpolation.
- No changes to `RC1`, `R16`, `V148`, `Protocol149`, `main`, game balance, AI, abilities or match turn authority.
- Power meter P2 unchanged pending A10 approval.

## Checks and limits

- GitHub authenticated post-write source readback: syntax anchors, public field names, phase-gated owner label, scroll view and exact file scope: PASS, static only.
- GitHub branch diff against exact base: three files, presentation-only.
- `dotnet` unavailable in execution container: managed test suite NOT RUN, Unity native build NOT RUN, PC1–PC2 live tests NOT RUN.
- Run the committed Node source-contract test and native Unity build/PlayMode smoke in an A60-controlled disposable checkout. F1 overlay must be verified on both PCs with distinct local owners and with an actual accepted P2 move before G3 can pass.
- P0 ball stutter/teleport and physical synchronization are **NOT FIXED** by this overlay; they remain with A31/A34/A41/A50 and A60.
- P1 arrow orientation and P2 camera remain outside this non-overlapping A33 patch and require A20 acceptance.
- No merge/release/public deploy authorized.

## Five-axis status

| Axis | Value |
|---|---|
| DESIGNED | YES (read-only diagnostic UI) |
| IMPLEMENTED | YES (GitHub isolated branch) |
| TESTED | STATIC READBACK ONLY; NO UNITY / PHYSICAL QA |
| INTEGRATED | NO — PR only |
| RELEASED | NO |

**Verdict:** A33 IMPLEMENTED / NEEDS A60 NATIVE + PHYSICAL QA, NOT G3 PASS.  
**Handoff:** A00 #97, A60 for independent acceptance, A70 for controlled integration.
