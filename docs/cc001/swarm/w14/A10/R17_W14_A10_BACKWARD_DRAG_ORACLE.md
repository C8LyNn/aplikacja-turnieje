# CC-001 — R17-W14 / A10 — Backward launcher drag oracle

**SHA QA W11 — LOCKED:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` on `integration/cc001-r17-w11-qa-freeze-20261030`, not this optional source. **W14 source parent:** A10 W13 draft PR #247 `27805d84cda272c071887993c039f401b457dfe1`, on top of A70 W13 DEV #239.

## Confirmed source-level problem (not a native game test)

`GameSimulation.TryCommand` in untouched protected core calculates launcher angle:
```cs
float angle=(float)Math.Atan2(c.dx,c.owner==0?-c.dy:c.dy);
angle=Clamp(angle,-1.53589f,1.53589f);
float vx=(float)Math.Sin(angle)*c.power;
float vy=(float)Math.Cos(angle)*c.power*(c.owner==0?-1:1);
```

A **30-world-unit straight backward drag**, entirely inside the board (local view launcher Y853→Y883), produces world dx=0 and negative forward-axis drag. `Atan2(0,-30)=PI`, clamped to `+1.53589`, so spawned velocity is ~99.94% rightward and ~3.49% forward despite neutral horizontal input. A horizontal jitter of just ±0.001 world units behind the launcher flips near-max vx from left to right. This occurs for either P1 or P2. The unchanged gesture requires ≥18 units and yields about 101.4 power, so the input is legal under the existing mechanism. It is **not** evidence of a physical PC1–PC2 test or cause of PC2 packet teleports.

## Actual new code and how to test

In A10-owned `Tests/R17W13A10/A10SpawnPhysicsContract.cs`, 5 new `A10-W14-01..05` cases invoke the **real `LaunchGesture.Release` + `GameSimulation.TryCommand`** with the authentic R16 catalog and 9-slot fixture. The first four are **EXPECTED RED** until owner/project design decides whether a backward launch is rejected or mapped to a safe near-forward vector. They deliberately allow either remedy and require no specific physics rewrite. Fifth case is a **positive control**: a tiny left/right jitter while aiming forward must stay nearly vertical. Earlier 13 W13 cases remain intact.

```sh
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/R17W13A10/R17W13A10.csproj --configuration Release
```

**C# result:** NOT_RUN without SDK9. The existing 13-case suite will report nonzero while the four W14 regressions fail under current core; this is an intentional HOLD, **not a false C# PASS**. A70 should review this design defect; **no protected GameSimulation/V148/R16 source change is authorized by this test**. A72 Windows build and A60/A31 physical PC QA still target unchanged frozen W11 SHA. No main merge or release.
