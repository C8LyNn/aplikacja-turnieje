# CC-001 R17-W9 — A34 P2 Snapshot Visual Smoothing Implementation

**Owner:** A34 Performance / Technical Systems
**HQ:** #97
**Base:** frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`
**Scope:** non-authoritative Unity V149 Player 2 renderer. NO main merge, NO release.

## Implemented
- New `RemoteBallSmoother`: tracks ball IDs on **admitted Protocol149** GameState snapshots; interpolates render positions for at most 200ms while `phase=Moving`. Uses smoothstep from current on-screen position (never the previous target), avoiding reverse jumps across successive packets.
- Hard reset on action serial change, frame/time rewind, >600ms snapshot silence, non-moving phases, match reset/disconnect; instant snap on >220-unit displacement (preserve obvious teleports/warps). Despawned and banished IDs are removed; never extrapolate without authoritative updates.
- `CoreClashApp.ReceiveNetworkState` feeds this visual filter **after** successful NGO state admission. `BoardView` and `BallView` only read a smoothed display X/Y; `Simulation.State`, physics, damage, turn ownership, event ordering and PlayerCommand are untouched. Only non-host P2 uses the filter.
- Adds eight C# regression tests to managed runner (first snapshot, interpolation convergence, overlapping snapshots, large warp, new action/silence, no authority mutation, disposal, clock/frame rewind).

## Why this addresses the symptom
RC1 `NgoGameSession.LateUpdate` dispatches a full host snapshot at 0.2s intervals during Moving; the client previously rendered every new packet immediately and did not step client-side physics. This made even valid authoritative 5Hz positions appear to jump. The filter makes the P2 presentation more continuous while preserving network authority.

## Known limits
This does **not** correct an actual network desync, packet loss/reordering, aim/P2 perspective, owner HUD, or insufficient server update bandwidth. Those are separately owned by A30/A31/A33. This change must not be used as evidence of PC1–PC2 synchronization PASS. Since the slowest-case motion may still stutter, native PC1–PC2 QA is mandatory.

## Tests / verification
- Source changes committed on an isolated branch rooted at RC1; compare SHA/path allowlist required.
- **Managed C# 8 regression tests: CREATED, NOT_EXECUTED** (no dotnet/Mono in A34 environment).
- Unity build / native PC1–PC2 / 60fps profiling: **NOT_EXECUTED**.
- A60 performs independent functional+visual QA. A70 reconciles any overlap with concurrent presentation work and integrates only after acceptance.
- Preserve V148, R16, RC1 source identities and Protocol149 / existing serialize/deserialize paths.

## QA requests
1. Run `dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/CoreClash.Tests.csproj -- unity/cc001-r16/CoreClash-V149-Unity`.
2. Build Unity project; host PC1 and join PC2; record PC2 video / profiler and `Player.log` with normal balls + Cosmos teleports.
3. Confirm host trajectory unaffected, correct P2 turn/owner UI handled by separately scoped patch; stable action serial transitions and reconnect resets.
4. Reject any unintended smoothing through gameplay teleports; request telemetry by A31 if observed.


## R17-W10 extension — integration and collision-routing (2026-10-30)

A34 has added **five tests** to the original eight, plus type/owner snap guards and malformed/duplicate ID hardening:
`RemoteBallSmoother.cs` should never interpolate an object that changes owner or ball type while retaining its ID. The independent 20Hz fixture specifies 50ms packet cadence and bounded final pose (not yet executed in C#). Two further fixtures cover null/invalid/duplicate remote IDs. Current A34 total **13 authored C# regression tests, NOT EXECUTED**. Eight additional GitHub-fetched source-bound V8 contract checks PASS (not C# compilation).

**One implementation decision:** use **A34 `RemoteBallSmoother` + A34 visual wiring** as the sole client interpolation implementation, not a second concurrent `RemoteBallPoseSmoother` (A50 PR #169). A50's identity/revision guards were reviewed; A34's active-action reset/phase reset and wired draw path remain essential. The two smoothing classes must not both process the same P2 draw. A70 approves the final selection.

**Critical integration conflicts (A70-owned, no merge performed):**
- **PR #175 A30** (P2 vertical orientation): `BoardView.Render` adds `int localOwner=0`, A34 adds `RemoteBallSmoother remoteVisual=null`. They require a **single** final method such as `Render(..., int localOwner=0, RemoteBallSmoother remoteVisual=null)`; the final call from `MatchView` must pass **both** `ViewOwner` and the P2 smoother, not either alone. Avoid two overloads with ambiguous default arguments.
- A30 `BoardView.Point/Box` already applies `MatchPerspective.ViewY` for the P2 viewport. Feed them **unflipped authoritative world X/Y** from A34's smoother; **do not double-flip**. For `BallView.Render` combine A30's view-owner transform and A34's optional display coordinates in one implementation: `viewY=MatchPerspective.ViewY(displayY,localOwner)`; wake direction still reverses velocity for local P2. P2 pointer input uses A30's inverse `MatchPerspective.SimulationY` unmodified.
- **PR #168 A20** (arrow draw) and **PR #173 A32** (local deck content) also touch `BoardView`/`MatchView`. A70 must take only one turn-label implementation (A20/A21/A30/A83) and reconcile the view-specific deck-heading/stock behavior without overwriting A32. A33 PR #176 diagnostic overlay is disjoint.
- **Networking cadence conflict PR #175 A30 vs PR #163 A41:** A30 sends fixed 20Hz snapshots regardless of size, while A41 uses **size-aware 12/8/4Hz** moving (compressed payload). A34 performance recommends **A41 adaptive transport budget** as conservative default for dense-board CPU/queue safety, *conditional on A60 measured throughput/latency*. Keep A41 stale ACK handling. Do not merge both schedulers or assume either cadence is proven to eliminate stutter.
- **No W9 PR is automatically a G3 PASS.** A72 owns the Windows build, A60 independent PC1–PC2 quality gate, A70 integration.

**Source-static checks on A34 current branch:** 20/20 source/changed-path contracts after correcting one false-positive comment match; separate 8/8 source-bound readback checks PASS; 13 C# cases **only authored**, managed suite NOT_RUN, Windows native NOT_RUN, 2-PC NOT_RUN. No Protocol149, gameplay, RC1, R16 or V148 changes.

**W10 acceptance matrix:** host PC1 and client PC2 at representative HIGH ball density; measure actual compressed bytes, snapshot revisions/arrivals, render frame pacing p50/p95/p99, upstream packet gaps, client CPU+GC, observed ball displacement across normal collisions vs legal portal warp, direction/perspective and owner label; guard against disconnected P2 or action switch leaving stale visual poses. **A60** performs independent G3, **A72** builds, **A70** stages one integrated candidate.


### A34 W10 executable-environment verification

Actual available commands: `node --version` = v22.16.0, `git --version` = 2.47.3. `dotnet`, `mono`, `csc`, `mcs`, `msbuild`, and Unity binaries: **UNAVAILABLE**, so the managed/Unity/native tasks were **not executed**. On exact GitHub HEAD before this documentation-only update, a **24/24 source-static** contract suite executed via the GitHub connector (read back 8 actual source/test files); checks included no authority/physics mutation, no extrapolation, stale action/gap/frame guards, owner/type snaps, null/duplicate ball handling, P2-only rendering, source wiring, test registration and test-case count. These are **not** 24 managed tests and do not certify live PC1–PC2. Exact source Git blobs: smoother `bbf1dc828158af7a2bf6e1c110f9cacdd6228e5a`, 13-case regression file `bf81e6b192b6cdd55f4d0788aae00a508d4bc235`.
