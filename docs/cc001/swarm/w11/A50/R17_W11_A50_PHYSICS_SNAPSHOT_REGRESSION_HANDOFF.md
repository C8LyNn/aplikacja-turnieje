# CC-001 R17-W11 — A50 Physics / Snapshot / Visual Regression Implementation

**Agent**: A50 — Simulation, Physics, Balance (fixed thread identity)  
**Issue**: A50 #138 and HQ #97  
**Wave**: R17-W11 / INTEGRATION & QA  
**Status**: `IMPLEMENTED_TEST_ONLY / QA_HOLD / RELEASE_STOP`  
**Own branch**: `feat/cc001-r17-w11-a50-physics-snapshot-regressions`  
**Selected parent**: `fix/cc001-r17-w10-a30-on-a70-candidate` at **`3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`** (A30 draft #189, not integrated into A70's frozen candidate).
**Test code commit**: **`609a4409a85038a312ed2707c9c8ac97a7d1a1d0`**.
**Draft PR**: [#197](https://github.com/C8LyNn/aplikacja-turnieje/pull/197), based on A30 #189, **NOT MERGED**.

## Purpose and exact scope

Reconcile A50 physics parity with the **one selected** PC2 visual interpolation implementation and host snapshot path, avoiding a second rendering engine. W10 had already disposed of A50 #169/#185 as SUPERSEDED in favor of A34 #174. A30 #189 combines a candidate A41 network payload-size cadence (20/12/8/4Hz), A34 display-only smoother with fresh `PORTAL` snap, P2 view/UI and A10-approved meter cleanup. **A70—not A50—retains sole integration selection authority**.

A50's added tests go beyond the A34 isolated pose tests by connecting:

```text
GameSimulation.Step(1/120f) / CollisionResolver.Resolve
  -> NetworkGameSession.Capture (protocol 149)
  -> NetworkGameStateAdapter.Apply (revision + state admission)
  -> RemoteBallSmoother.Observe + TryGetPosition (view only)
  -> assertions: host x, vx, HP, shield, iceStacks are unaffected
```

No production physics, networking, UI, rendering, permissions, saved data, V148, R16, Protocol149 or RC1 files have been modified by A50.

## Implemented C# regressions

**One actual modified code file**:

`unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs`

**Git blob SHA-1**: `7b5d99e46871b6714a8df1b1334c606e63894a65`.  
**Diff against exact parent**: +82 lines, -0, no other modified source.

| ID / Test title | Behavior tested | Execution |
|---|---|---|
| W11 A50 moving host physics survives two 20Hz snapshot visual samples | Real 6× 120Hz host simulation ticks; two captured/admitted snapshots; position and velocity parity; client interpolation bounded/convergent; out-of-order packet rejected | **NOT_RUN C#** |
| W11 A50 kinetic collision authoritative HP and impulse remain unchanged by P2 drawing | Real `CollisionResolver.Resolve` hostile normal hit; both HP to25 as preexisting oracle; 10 visual samples cannot modify impulse/HP/host position | **NOT_RUN C#** |
| W11 A50 defensive Frostguard collision state is preserved after visual sampling | Frostguard `OnStop`, force 0.30, mass 2×, true Earth stacks0; live collision and host→client state capture retain shield, HP, ICE and velocities under renderer sampling | **NOT_RUN C#** |

All are registered in the existing `ElementalTests()` suite; `Tests/Program.cs` already invokes it and `CoreClash.Tests.csproj` includes the A34 `RemoteBallSmoother.cs`. **Do not import the old A50 alternative `RemoteBallPoseSmoother.cs` from closed #169.**

## Executed verification, precisely scoped

- GitHub authenticated exact SHA/parent/branch readback: **PASS**.
- GitHub base→head diff: **one A50-owned test path**; no production code or protected changes.
- **12/12 source/test registration/physics-and-snapshot contract checks PASS**: test registration, correct 120Hz step, actual capture+adapter, modified-host invariants, kinetic and Frostguard cases, parent ancestry, projects includes smoother. This validates the authored test source only.
- **C#/.NET 9 execution**: **NOT_RUN**. Current Linux environment has no `dotnet` (`dotnet --info` -> exit **127**).
- **Unity Player/Windows build**: **NOT_RUN**. Unity executable unavailable.
- **PC1↔PC2 physical test**: **NOT_RUN**. No independent input/snapshot/latency or actual rendered-frame evidence.
- **A60 independent QA**: **PENDING**. Old RC1/Stage2 C#/Unity results are not accepted as W11 candidate test results.
- GitHub combined commit statuses for exact parent #189: **0 statuses observed**, not a CI PASS.
- Tested code is tied to **one exact A30 source candidate**; if A70 selects a different integrated SHA, compare its actual files and rerun these tests against that SHA.

### Known remaining boundaries

1. The A30 #189 addon is not yet accepted/assembled into A70's official disposable candidate. Its draft status alone is not integration.
2. Short-range `PORTAL` snap is implemented in #189's remote snapshot event selection, but real cross-PC teleport vs visual-jitter behavior is unverified.
3. A41 adaptive cadence is data-size-dependent; a 20Hz small snapshot schedule does not guarantee smooth visuals if reliable transport queues or rendering lag.
4. A60 needs synchronized full host/client evidence, accepted exactly-once P2 intent, P2 relative turn/camera/aim and no authority-side gameplay rewrites. The A72 Windows build must pin the **final** A70 approved candidate, not the older PR181 SHA.
5. Don't treat these tests as fixing the UI, power meter, networking stack or physical devices. Those remain with A20/A30/A31/A41/A70/A72/A60 as dispatched.

## A50 W11 HANDOFF → HQ #97 / A70 / A72 / A60

| Axis | Current result |
|---|---|
| DESIGNED | COMPLETE — physics-to-snapshot-to-display regression contract |
| IMPLEMENTED | YES — 3 new managed C# tests, +82 lines on own branch |
| TESTED | PASS only source/registration/allowlist 12/12; managed/Unity NOT_RUN |
| INTEGRATED | NO; dependent draft PR #197 |
| RELEASED | NO |
| **GATE** | **TEST-SOURCE READY / RUNTIME HOLD** |

**Next specific action**: A70 either selects #189 (or reconciles its author-source hunks) into a new disposable candidate; A72 compiles and runs this additional three-test suite against the exact candidate source and produces a fresh Windows build; A60 verifies actual host/client physics and UI parity on PC1 and PC2 before any G3/G4 PASS. No merge to main, protected ref rewrite, force push or public deployment.
