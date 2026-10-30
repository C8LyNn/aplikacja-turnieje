# CC-001 R17-W13 / A70 — selected owner gameplay and P2 aim tests (DEV ONLY)

**Owner:** A70 Integration / Release. **Purpose:** compose independently authored A30 and A10 C# regressions without merging their diverged branches or altering the W11 QA freeze.

**Development baseline:** `87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c` (draft #207, NOT frozen QA).
**Immutable W11 QA:** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Remains untouched and is the ONLY approved source for A72 native W11 build / A60 PC1-PC2 QA.

## Exact selected source, no reimplementation
- A30 [draft #219](https://github.com/C8LyNn/aplikacja-turnieje/pull/219), author SHA `0c94696cf29b6ae86b8a9b226ac961fc2a703a0c`:
  - `Tests/R17W11A30OwnerDecisionsTests.cs`, Git blob `f79763b5eef8084456f03a27c7717da63dfb283a`. Five real GameSimulation C# regression test definitions for V148 Mitosis (wall and structure are NOT splitting triggers), Furnace (only FIRE zone with delayed DOT), all 227 R16 catalog HP hash `0x9A374EFDD08C0CAA` and six representative R16 values.
  - `Tests/Program.cs`, Git blob `c7a606d642a9f52ea7b965d7be1cc14b3826fe29`, one registration `R17W11A30OwnerDecisionsTests();`. Baseline `87b718...` Program blob `49d9860cec074e7d1612babacf01f8d63ed238b4`; ONLY this registration differs (no lost test runners).
- A10 [draft #224](https://github.com/C8LyNn/aplikacja-turnieje/pull/224), author SHA `051b3b26fee7a50bc4284eb3208893e953ca6ea8`:
  - `Tests/R17W12A10/A10AimGuideContract.cs` Git blob `2910f61770e0636769874b29ba95f3ca2d6d533b`: 12 independent P1/P2 aim/viewport/LaunchGesture/wall-bounce/preview tests.
  - `Tests/R17W12A10/R17W12A10.csproj` Git blob `a77b6eb6d4f1604cf9cf2bb3c2f614f1724fbde1`: standalone net9.0 test executable referencing the existing CoreClash managed test project.
  - A10 original guide report Git blob `9d16b00e79805a615ccee53d99fa03f0cae81ce6`, unchanged.

**Git ancestry note:** #219 HEAD is NOT a linear descendant of current #207 HEAD (independent ancestor/historical PR base). Do not merge its entire branch. A70 imports only the above exact five blobs onto one isolated W13 dev branch, retaining all current #207 networking/presentation fixes. The A10 author branch is independently based on frozen W11; likewise copied exact blobs only.

## Execution gates (on host with .NET SDK 9)
Run in a clean checkout of the EXACT W13 draft HEAD, from repository root:

```powershell
$project = Resolve-Path 'unity/cc001-r16/CoreClash-V149-Unity'
dotnet run --project "$project/Tests/CoreClash.Tests.csproj" --configuration Release -- "$project"
dotnet run --project "$project/Tests/R17W12A10/R17W12A10.csproj" --configuration Release
```

**Acceptance requires:** both process exit codes 0, original managed test JSON and console logs, independently pinned W13 source SHA, A60 independent results if any Windows Player is ever built from W13. Source-integrated test definitions are **NOT equivalent to executed C# tests**. They do not prove P2 multiplayer smoothness, legal P2 action on two PCs or G3.

**Promotion policy:** `W13_DEV_ONLY`, `W11_QA_FREEZE_UNCHANGED`, `W13_FINAL_MERGE=HOLD_UNTIL_W11_G3_AND_HQ`, no changes to Mitosis/Furnace/HP gameplay, V148/R16/Protocol149, main, release or deployment.
