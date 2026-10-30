# CC-001 R17-W11 A82 — displacement-event presentation regression

**Upstream:** A70 W11 draft #207 exact pinned source `173273122c11cbf738e8b954e32506a6196fe8ec` plus A70 subsequent 250ms update `8fce19b9fefb05fb8e781417af7455749979d93e`. This branch is an isolated corrective addon and is not merged into A70's protected candidate.

This suite compiles the **existing** `GameState.cs` and `RemoteBallSmoother.cs` directly, not copies/mocks. It checks that an explicit host event which changes a ball's physical position forces *display* to snap without inventing an interpolated travel path.

**Source-level cause** (independently inspected):
- `SpatialEffects.cs`: portal travel calls `sim.Emit("PORTAL",b,...)`.
- `AbilityResolver.cs`: Warp wall event calls `sim.Emit("TELEPORT",b,...)`.
- `RealityEffects.cs`: Time Shift/Swap swaps **both** ball positions then calls `sim.Emit("SWAP",b,...,enemy.id)`.
- The exact pinned #207 source handles only `PORTAL` before this corrective addon. This addon adds `TELEPORT` and both `SWAP` participants without changing physics/gameplay.

Run on an actual .NET 9 host after checkout:
```sh
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/R17W11A82/R17W11A82.csproj
```

Expected after minimal patch: **10/10 PASS**. Actual .NET 9 execution is pending until A60/Windows toolchain runs it; static/source checks are not runtime evidence.

Semantic requirements:
- `PORTAL` and `TELEPORT`: snap `ballId` if valid.
- `SWAP`: snap both `ballId` and `otherId` if valid, not everyone nearby.
- Event gate: only new events `id > afterEventId`. Non-displacement effects do not invent snaps. Retain normal interpolation.
- Do not alter actual positions, velocity, collisions, damage, turn, action serial, snapshot admission or Protocol149.

A82 adds the minimal fix to the presentation-only `RemoteSnapshotEvents.InstantBallIds` on this isolated #207-descendant branch. A70 owns admission to #207 and A60 owns independent C# and PC1–PC2 QA. **A60 independently runs native C#/Unity and PC1-PC2 QA**. If the current source has not emitted these events in a scenario, do not fabricate a physical PASS.

`DESIGNED=YES; IMPLEMENTED=CORRECTIVE_ADDON+10_TESTS; CSHARP_EXECUTED=NOT_RUN; INTEGRATED=NO; RELEASED=NO.`
