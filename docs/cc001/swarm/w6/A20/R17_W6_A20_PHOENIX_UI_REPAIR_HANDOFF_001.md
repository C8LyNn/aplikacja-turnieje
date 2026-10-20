# CC-001 — R17-W6 / A20 Phoenix-Hand UI Repair — implementation handoff

**Agent / role:** A20 — UX/UI & Game Feel  
**Issue:** [#95](https://github.com/C8LyNn/aplikacja-turnieje/issues/95)  
**HQ scoped authority:** [#95 comment 6288434576](https://github.com/C8LyNn/aplikacja-turnieje/issues/95#issuecomment-6288434576)  
**Branch:** `feat/cc001-r17-w6-a20-phoenix-ui-repair` — new *A20-owned isolated* development branch directly forked from exact frozen Stage 2 because the previous A20 W3/W6 documentation branch predates A40's PhoenixHand model. Original A20 branch and all its work remain unchanged. No merge from A40/A50 branches was performed.  
**START SHA (frozen Stage 2):** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**Base Stage 2 source commit:** `e58ba23a9f20e7a0865668655bd1e819845474bc`  
**PRE-REPORT SOURCE HEAD:** `24d916f25d775ffd746bec7e04be8c7b0f7c5a84`  
**FINAL SHA:** see exact commit in A20 issue #95 handoff after this report is committed/read back.  
**A72 original passing runner:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`.

## Source-confirmed defect

`GameSimulation.TryCommand(CommandKind.Spawn)` admits a Phoenix at stock zero if `State.phoenixHand` contains an eligible entry, then consumes **that hand entry** without creating a stock copy. The presentation formerly rejected the same Phoenix at three layers: `BallSelection.ForTurn`, `CoreClashApp.SelectBall`, and `MatchView` desktop/phone/compact cards.

**Core admission contract (copied semantically, not by changing gameplay):**
- relevant hand applies only to `type=="phoenix"`;
- exact `owner` matches current player;
- `ready==true`;
- `createdOwnerTurns < State.players[owner].ownerTurns`;
- `lastProcessedOwnerTurns >= State.players[owner].ownerTurns`;
- genuine positive stock is evaluated **before** any hand entry;
- no eligible stock or hand: selection reverts to unlimited Standard.

A20 adds an explicit current-turn owner guard for presentation selection; `TryCommand` independently enforces current owner, phase, turn number and command validity.

## Implemented files — EXCLUSIVE W6 A20 allowlist

Root: `unity/cc001-r16/CoreClash-V149-Unity/`.

1. `Assets/CoreClash/Presentation/BallSelection.cs`:
   - adds `BallSelectionSource` enum: `None`, `Stock`, `Hand`;
   - adds one **shared** `Source(simulation,owner,type)` predicate with the *same* hand timing and owner conditions as exact Stage 2 gameplay;
   - adds `CanSelect` and `StockLabel` returning `xN`, `HAND READY`, `EMPTY`;
   - `ForTurn` preserves Phoenix selected when ready in hand with stock0, otherwise keeps normal fallback.
2. `Assets/CoreClash/Presentation/CoreClashApp.cs`: `SelectBall` uses `BallSelection.CanSelect`. Existing keyboard 1–9 path calls `SelectBall`, so it inherits the fix; `CanChoose` still enforces active phase and local authority. No pointer or input logic changes.
3. `Assets/CoreClash/Presentation/MatchView.cs`: both `BallCard` (desktop and phone tray) and `CompactBallCard` (phone compact landscape) use `BallSelection.Source` for click enabled/disabled and `StockLabel` for status. Ready stock0 Phoenix is no longer faded/disabled. `HAND READY` appears in card status; no counterfeit stock count. Standard and all other depleted specials preserve original behavior.
4. `Tests/PresentationTests.cs`: **10 additional managed regression tests**, authored first on a test-only commit, with a test-only synthetic ready Phoenix hand fixture; tests also drive the unchanged `GameSimulation.TryCommand` for stock-first and hand consumption.

**No changes:** `Core/GameSimulation.cs`, `Core/GameState.cs`, A40/A50 mechanics/physics, catalog, network, Protocol 149, protected R16/V148, Stage 2 ref, `.meta`, existing website or other projects.

### Exact A20 source commit sequence

- `2222a7a0ad42e2edb2fb3e82064eba8aaf26f0cd` — test-first PHX-UI-01..10 (tests **not run** at RED).
- `f148d7c7c4e46aecab0a944e3d8cd57b9c2bb25a` — stock-first shared availability/label.
- `04946961a6de455452d6fb5d81c79c399a87bd04` — route UI selection through shared predicate.
- `6dfd8f55de5908979fd62d846a3e07b78d752c36` — route desktop, compact and phone cards through shared predicate.
- `24d916f25d775ffd746bec7e04be8c7b0f7c5a84` — stronger negative fixtures for other-ball and wrong-turn cases.

## PHX-UI test manifest — SOURCE AUTHORED, EXECUTION NOT_RUN

| Test | Scenario / expected oracle | Result this A20 session |
|---|---|---|
| PHX-UI-01 | stock0 + ready hand => selectable, `ForTurn` retains Phoenix and `HAND READY` | NOT_RUN |
| PHX-UI-02 | stock0 + no hand => disabled, fallback `normal` / `EMPTY` | NOT_RUN |
| PHX-UI-03 | stock1 + ready hand => Stock precedence; real `TryCommand` consumes stock before hand | NOT_RUN |
| PHX-UI-04 | stock0 + unready hand => disabled | NOT_RUN |
| PHX-UI-05 | stock0 + opponent-owned ready hand => disabled | NOT_RUN |
| PHX-UI-06 | same-turn-created and stale-processed entry => disabled; qualifying later processing accepted | NOT_RUN |
| PHX-UI-07 | real `TryCommand` consumes last ready hand and UI falls back to `normal` | NOT_RUN |
| PHX-UI-08 | other ball stock0 stays disabled **even while a Phoenix hand exists** | NOT_RUN |
| PHX-UI-09 | opponent's stock is not selectable on another player's current turn | NOT_RUN |
| PHX-UI-10 | invalid earlier hand does not hide a separate later eligible hand | NOT_RUN |

The tests are source-committed; NONE was executed in managed C# or Unity Player by A20 in this session.

## Checks actually executed vs. tests missing

### GitHub source/readback checks: 13/13 static PASS

Read the exact branch's 4 C# files and compared with the frozen Stage 2 SHA:
- exactly four authorized files differ before report;
- source branch is linear descendant of Stage 2 (`behind=0`);
- stock-first order and four hand readiness predicates match core;
- non-Phoenix and fallback guard preserved;
- `ForTurn`, `SelectBall`, both card functions use the shared API;
- both card functions show `StockLabel`;
- no `available=stock>0` gates remain in card functions;
- 10 explicit named `PHX-UI` tests present;
- at least one test calls genuine `TryCommand` hand consumption;
- selection code has no stock increment or spawn.

**Important:** these are read-only structural assertions, *not* a C# compile, managed test execution, or pixel-level UX validation. GitHub connector calls do not return a CLI exit code.

### Toolchain probe performed in shell

```text
command -v dotnet       EXIT 1 (not installed)
dotnet --version        EXIT 127: bash: dotnet: command not found
command -v csc          EXIT 1
command -v mcs          EXIT 1
command -v mono         EXIT 1
command -v msbuild      EXIT 1
```

Thus **.NET9 compile/PHX-UI-01..10 execution NOT_RUN**; Unity 6000.4.0f1 Player and GUI manual tests **NOT_RUN**. Earlier accepted Stage 2 managed 351/351, codec 13/13, Windows G2 build/native smoke are evidence **for the frozen older SHA ONLY**, not for this new source repair.

### Remaining verification (not executed)

1. A40: independent semantics match to `TryCommand` and returned Phoenix hand precedence.
2. A72 / Windows managed runner: compile and execute **all existing tests plus PHX-UI-01..10**, verify exit 0 and exact new candidate/source pins. Do not count these new tests inside old 351.
3. A60: independently check branch changed-paths, tests, false-positive/negative availability, source provenance and actual runtime result.
4. A20 physical/GUI: new rebuilt Unity Windows Player selection via mouse and keyboard; phone portrait tray and compact landscape via physical mobile build; after last hand use status changes to `EMPTY`; 44-target and compact `HAND READY` readability. These are **NOT_RUN**, especially physical Android/WebGL.
5. A70/HQ: separately authorize subsequent disposable candidate assembly; no auto integration into frozen Stage 2.

## UX risks and implementation limitations

- Small `CompactBallCard` has a 50-high constrained case, `HAND READY` rendered at 9pt in the card status area; visual readability on physical phone **unverified**.
- Deck selection keyboard shortcuts enumerate current deck stock entries; a normal Phoenix hand is created from a Phoenix originally in that deck and remains reachable even at remaining 0. Unusual synthetic states with hand but no deck stock entry are spawn-legal in core but have no numbered shortcut/card; this does **not** justify changing catalog/deck or input roster in the authorized narrow fix.
- Managed source tests cannot simulate Unity IMGUI mouse/touch or screen pixels. Those require real build and A20 physical testing.
- Upstream G1/G2 Windows acceptance does not automatically transfer to new SHA; Stage 2 is frozen, G3/G4/release remain gated.

## Five-axis status and HANDOFF

```text
IDENTITY_CHECK | CC-001 | A20 | ISSUE #95 | PHOENIX_UI_REPAIR
DESIGNED: YES — narrow hand-aware UI selection rule
IMPLEMENTED: YES — isolated A20 branch C# source, not integrated into Stage2
TESTED: STATIC SOURCE/DIFF 13/13 only; PHX-UI C# 01..10 NOT_RUN
INTEGRATED: NO — repair not integrated, frozen Stage2 unchanged
RELEASED: NO
GATE: IMPLEMENTED_FOR_QA / MANAGED_TESTS_HOLD / UNITY_PLAYER_NOT_RUN
HANDOFF: A40 semantic co-review; A72 managed compile+tests; A60 independent QA; A70/HQ separately authorize any new candidate
NO main merge / Stage2 modification / force push / deploy / protected R16/V148/Protocol149 edits.
```
