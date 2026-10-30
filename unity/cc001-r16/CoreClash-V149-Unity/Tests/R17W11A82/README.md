# CC-001 R17-W11 A82 — displacement-event presentation regression

**Upstream being tested:** A30 W11 source candidate `fix/cc001-r17-w11-a30-revision-bound-remote-state` (descended from A30 #189 / A70 #181). **This test-only PR does NOT select that candidate for integration.**

This suite compiles the **existing** `GameState.cs` and `RemoteBallSmoother.cs` directly, not copies/mocks. It checks that an explicit host event which changes a ball's physical position forces *display* to snap without inventing an interpolated travel path.

**Source-level cause** (independently inspected):
- `SpatialEffects.cs`: portal travel calls `sim.Emit("PORTAL",b,...)`.
- `AbilityResolver.cs`: Warp wall event calls `sim.Emit("TELEPORT",b,...)`.
- `RealityEffects.cs`: Time Shift/Swap swaps **both** ball positions then calls `sim.Emit("SWAP",b,...,enemy.id)`.
- Current `RemoteSnapshotEvents.InstantBallIds` handles only `PORTAL`, not `TELEPORT` or `SWAP`. Thus **two expected RED cases plus the short-teleport display case**.

Run on an actual .NET 9 host after checkout:
```sh
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/R17W11A82/R17W11A82.csproj
```

Expected after owner fix: **9/9 PASS**, while current source should fail `TELEPORT`, `SWAP`, and `small teleport`. That expectation derives from source inspection, **not from any completed C# run**.

Semantic requirements:
- `PORTAL` and `TELEPORT`: snap `ballId` if valid.
- `SWAP`: snap both `ballId` and `otherId` if valid, not everyone nearby.
- Event gate: only new events `id > afterEventId`. Non-displacement effects do not invent snaps. Retain normal interpolation.
- Do not alter actual positions, velocity, collisions, damage, turn, action serial, snapshot admission or Protocol149.

**A30/A70 source owners** must choose integration and implement the minimal fix on their own source candidate. A82 changes no production class. **A60 independently runs native C#/Unity and PC1-PC2 QA**. If the current source has not emitted these events in a scenario, do not fabricate a physical PASS.

`DESIGNED=YES; IMPLEMENTED=TEST-ONLY; CSHARP_EXECUTED=NOT_RUN; INTEGRATED=NO; RELEASED=NO.`
