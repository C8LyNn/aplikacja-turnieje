# CC-001 R17-W13 / A10 — Authoritative launcher and first-physics-tick design contract

**Isolated DEV-only test PR**. Parent is A70 W13 DEV test stage `9f6b217a7b52e8415ec907772577f95598cbc6b3`; official W11 physical QA freeze remains `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. No changes to frozen build, Mitosis V148, Furnace FIRE+DOT, R16 HP, Protocol149, game code or main.

13 new `.NET9` C# cases run on the REAL `GameSimulation.TryCommand`, `BallPhysics.Step`, `LaunchGesture.Release`, `MatchPerspective` with canonical catalog and fixture deck: P1/P2 true launch directions, forward-cone saturation, left/right parity, mirror consistency after first physics tick, same-owner Replay preserving ball ID (not launcher angle clamped), and input authority rejection. This extends, not duplicates, A10 W12 12 wall-guide-only cases or A30 owner Mitosis/Furnace/HP tests.

```sh
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/R17W13A10/R17W13A10.csproj --configuration Release
```

**Important:** C# definitions are authored and their Git blobs/registration may be source-verified, but actual build/test PASS requires a fresh `.NET9` runtime execution on this exact source. Windows Unity build and PC1/PC2 network QA require distinct A72/A60 operators. Do not import this DEV package into QA-frozen W11 source; A70 controls admission after W11 closes.
