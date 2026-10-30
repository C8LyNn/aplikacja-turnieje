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
