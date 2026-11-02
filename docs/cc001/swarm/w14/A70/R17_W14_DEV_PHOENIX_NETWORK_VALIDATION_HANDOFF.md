# CC-001 — A70 R17-W14 post-freeze Phoenix snapshot validation + owner tests

## Identity / source boundary

**W11 selected physical QA source ONLY:** `integration/cc001-r17-w11-qa-freeze-20261030` → `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Keep that ref immutable. No source, build, QA or native Windows evidence from the new development candidate may be attributed to W11. RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, original V148, R16 values and Protocol149 protected.

**New DEV parent:** A70 W13 [PR #239](https://github.com/C8LyNn/aplikacja-turnieje/pull/239), `9f6b217a7b52e8415ec907772577f95598cbc6b3`. This parent was itself based on #207 development branch, NOT QA freeze.

## Canonical implementation selected without competing code

Selected exactly one networking fix from author A41 [#258](https://github.com/C8LyNn/aplikacja-turnieje/pull/258), source head `e885d4161eef37b294d5a6bf37746824de93ff33`, itself on the same #207 development base as #239. No A31 alternative source fix was merged. Preserve exact source author Git blobs:

- `Assets/CoreClash/Networking/NetworkGameSession.cs` blob `a57bdbfb184895dedf9784135c3cdbb611028409`: `NetworkGameStateAdapter.IsValidState` rejects malformed `phoenixHand` null list / entry, invalid owner 0..1, nonpositive maxHP, negative or overflow HP, negative shield, without mutating last accepted state/revision. No on-wire schema change, no GameSimulation or ability/physics change.
- `Tests/NetworkSeatTests.cs` blob `fd62d5fa5ce861f8fdc145cf21e94128bf5a047f`: exact three A41 managed tests to accept valid zero HP, reject malformed data while preserving revision, and reject duplicate Protocol149 revision.

Selected supporting **original A40 tests**, not another implementation: [#242](https://github.com/C8LyNn/aplikacja-turnieje/pull/242) negative scenarios + [#251](https://github.com/C8LyNn/aplikacja-turnieje/pull/251) positive P1/P2 same-time hand scenarios. A70 inserted **exact six test method bodies** extracted from A40 #251 `Tests/AbilityTests.cs` Git blob `7f7ed6cacf9b247b2d80968c94df3d77b1a5a363` immediately before the single `RealityTests();SpatialTests();` runner call on A70 W13 dev `AbilityTests.cs`. Only the historical RED explanatory comment was corrected to clarify the selected A41 patch should make those negative tests green. The six tests include three malformed network packet rejections and three positive owner-specific hand/replay/ready/replace cases. A40 original branch/PR source is untouched.

No changes to Mitosis V148, Furnace (FIRE zone + periodic DOT only), R16 HP catalog, Protocol149 fields, Unity metadata, R16, RC1, QA freeze or main. Owner balance invariants remain enforceable by five A30 cases in the parent #239 and P2 aim by 12 A10 cases. No wholesale merge of diverged owner branches.

## Executable test instructions on authorized .NET 9 / Unity Windows host

From repo root at exact commit HEAD of this W14 PR:

```powershell
$project = Resolve-Path 'unity/cc001-r16/CoreClash-V149-Unity'
dotnet --version
dotnet run --project "$project/Tests/CoreClash.Tests.csproj" --configuration Release -- "$project"
dotnet run --project "$project/Tests/R17W12A10/R17W12A10.csproj" --configuration Release
```

Record exact source commit SHA, .NET9 version, process exit codes, raw reports and logs; new C# test definitions are NOT a test execution. This development branch cannot substitute for the separate frozen W11 native build from A72 #188. Any future standalone Windows Player with this W14 source must be fresh and independently verified by A60/A31 on two physically distinct PCs.

## Current acceptance / handoff

A70 GitHub-authenticated 2/2 A41 exact original blob readback and 6 selected A40 original test bodies verified, single correct `RealityTests();SpatialTests();` maintained; no unrelated file changes. **C# compilation NOT_RUN; Unity Windows Player NOT_BUILT; real two-PC QA NOT_RUN; G3/G4 HOLD.** Source review status only. Keep PR draft/dev-only until formal W11 G3 closure and new integration authorization.
