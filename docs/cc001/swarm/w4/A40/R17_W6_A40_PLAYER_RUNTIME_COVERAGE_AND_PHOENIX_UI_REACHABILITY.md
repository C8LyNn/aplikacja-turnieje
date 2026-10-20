# CC-001 — R17-W6 / A40: Player runtime coverage, reproducible probes and Phoenix UI reachability

**Agent:** A40 — Gameplay / Lifecycle + RETURN (identity from original user-assigned thread)  
**Existing issue:** [#92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92)  
**Mode:** Independent W6 gameplay review / NO UNAUTHORIZED SOURCE EDITS  
**Own branch:** `feat/cc001-r17-w4-a40-lifecycle-return`  
**A40 gameplay source HEAD:** `bfa9bd4f86c60c7bd528a6d03581179e405be3aa`  
**Frozen R16 source:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b` (unchanged)  
**Immutable Stage2 integration commit:** `e58ba23a9f20e7a0865668655bd1e819845474bc`  
**Exact Stage2 final candidate:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**A72 executable runner source:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`  
**HQ W6 authority:** [Issue #97 comment 6288003274](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6288003274)  
**A60 evidence intake:** [Issue #139 comment 6288004428](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6288004428)  
**STATUS:** Runtime scenarios specified, new source-level UI reachability defect identified. Unity behavioral probes NOT_RUN. **DO NOT infer a new native PASS.**

## 1. What the available W6 evidence proves — and what it does not

According to HQ's published evidence receipt (not independently parsed by A40): Windows 11 / .NET 9.0.313 with the corrected A72 runner returned **351/351 managed C# PASS**, **13/13 codec PASS**, all seven runner stage exits zero, and `PASS_MANAGED_CODEC_ONLY` on exact Stage2. Unity Editor 6000.4.0f1 produced a fresh `StandaloneWindows64` build (0 errors, 1 warning) with reported EXE SHA256 `97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3`. The Windows native automated smoke returned `passed=true`, exit0, 50 turns / 51 launches, 6 rendered and checksummed PNGs. These are **user/HQ-reported and HQ-verified local results**; independent A60 raw-archive receipt is a separate, still-required gate.

A40 did **not** obtain, open, or hash `handoff-20261020-030137.zip` in this thread. Reported archive SHA256: `20a16c90f4997c40959081d45f6a451834e8983e590a3ec38247da8747815c31`. Do not claim personal access or independent acceptance. R16 WebGL/Android material in that archive is historical only.

Stage2 `PresentationSmokeDriver.AdvanceSimulation` selects special-ball actions via `simulation.Stock()>0` and calls `simulation.TryCommand` **directly** after the initial pointer-based Gatekeeper shot; it does not assert `phoenixHand`, Phoenix ready-hand selection, Soul Anchor/Dirge-specific DEATH payload or replay/defensive Earth2 native outcomes. Passing native 50-turn match is valuable player-render/match-flow evidence **but not case-by-case A40 lifecycle runtime parity**.

## 2. NEW W6 FINDING P1 — Phoenix returned hand is executable in GameSimulation but not selectable in Unity UI

**Class:** SOURCE-PROVEN REACHABILITY DISCREPANCY; Unity Player reproduction NOT_RUN.  
**Impact:** A legal Phoenix return can become impossible to play via normal UI once finite Phoenix stock is exhausted, even though the gameplay core accepts a deliberate Spawn with an eligible ready hand. This defeats the intended Phoenix hand lifecycle in the playable Unity frontend; passing managed `TryCommand` tests cannot detect the bridge problem.  
**Reproduction confidence:** High from exact Stage2 source predicates, not an observed user interaction.

Exact source chain, pinned to immutable Stage2:

1. `Assets/CoreClash/Core/GameSimulation.cs`, blob `25f5a18de4df3942626f0245c9b1be77eee73106`: `Stock(owner,id)` reports only `StockEntry.remaining`, **not** `phoenixHand`. Yet `TryCommand(CommandKind.Spawn, "phoenix")` explicitly accepts `hasStock==false` with a ready owner hand, creates ordinary SPAWN, transfers pending HP/shield and consumes the hand.
2. `Assets/CoreClash/Presentation/BallSelection.cs`, blob `d22033df0dc5ba9717262e2540b4f9e6ad1bfe6c`: `ForTurn(...,selected)` reverts to `normal` whenever `Stock(turn,selected)<=0`.
3. `Assets/CoreClash/Presentation/CoreClashApp.cs`, blob `5b70a4631829c8355472d9d3aa83e4107428717f`: `SelectBall(id)` requires `Simulation.Stock(...,id)>0`. Keyboard number shortcuts and normal UI selections route through this method.
4. `Assets/CoreClash/Presentation/MatchView.cs`, blob `7f9631a3fb272d312e253b15d2d4627f9d79d05f`: both `BallCard` and `CompactBallCard` set `available=stock>0`, disable the card and show 0/EMPTY when exhausted; phone-tray cards share this gate.
5. R16 catalog defines Phoenix as a finite **one-copy** stock ball; one ordinary launch uses the last copy. `LifecycleEffects.PhoenixDeathEffect` creates the hand; `LifecycleHandTurn` marks it ready after a later owner turn. **No existing UI availability gate checks this ready hand**.

**Minimal Stage2 Windows Player reproduction** (natural gameplay when practical, otherwise a *test-only staged fixture* using the existing public `app.Simulation`; the staging helper itself requires HQ authorization and is not added here):
- Select a deck including Phoenix (custom nine-ball deck is available), start a local match as player 1; launch the one stocked Phoenix using the normal UI.
- Arrange legal damage until that ball dies, then advance to the next own turn. Confirm as fixture/state evidence `stock(0,"phoenix")==0`, `phoenixHand(owner0).ready==true`, `phase==Aiming`, `turn==0`, `bonusPending==false`. Separately ensure a ready hand exists; a still-cooling hand is a *negative control*, not the positive case.
- Attempt to choose Phoenix with the visible card and with its keyboard number shortcut; record its disabled/0 card state and selected type remaining `normal`.
- **Positive engine control, separate from UI run:** a correctly formed authorized `TryCommand(Spawn,"phoenix")` under identical valid state should succeed and consume hand; compare `SPAWN` count, HP/shield and unchanged finite stock. Do not mistake this direct-core control for proof the player UI works.
- **Expected V148/A10 gameplay contract:** once ready and finite stock is empty, Phoenix must be selectable and launchable as a normal deliberate SPAWN, using hand payload once, without making stock or a second RETURN. The UI must not promise a ready hand while making the action unreachable.
- **Actual source-predicted Stage2 behavior:** all deck/keyboard selectors reject the hand because they check finite stock only; no legal Phoenix selection through those normal entrypoints.

**Minimal proposed correction domain — NOT AUTHORIZED TO A40 HERE:** read-only availability predicate `HasPlayableBall(owner,id)`/equivalent, true for ordinary stock OR valid owner Phoenix hand; reuse in `BallSelection.ForTurn`, `CoreClashApp.SelectBall`, `MatchView` card variants and correct hand/stock visual hint. Keep authoritative `GameSimulation.TryCommand` unchanged; no stock minting, no special runtime command, no protocol/catalog/V148 change. Presentation file ownership / HQ decision required before any source edit. Also `AbilitySupport.Status("phoenix")` remains `DATA_ONLY` and `CoreClashApp.AbilityText` says the power is unavailable; treat that as a **separate user-facing status/wording issue**, not permission to promote an ability or override QA gates.

**Required verdict:** `P1_SOURCE_CONFIRMED / RUNTIME_UNVERIFIED / HQ_SCOPE_REQUIRED`, not `UNITY_RUNTIME_FAIL_OBSERVED` and not `UNITY_READY`.

## 3. Bounded Stage2 Unity Player behavioral probes — reproducible acceptance oracles

Each scenario must be run on a **fresh immutable Stage2 Windows Player / explicitly approved opt-in test fixture**; record actual state and native render frames. Manual play alone can vary death position/turn timing, so scripted *staging* may create starting positions or kill fixtures, but the positive player path must use the **actual UI/event loop / Player Build** when relevant. Any new fixture under `Assets/CoreClash/Testing/**` needs separate HQ source authorization and a new candidate SHA. None has been committed by A40.

| ID / Priority | Deterministic initial state and action | Required observable pass / negative controls | Scope not covered by 351 managed |
|---|---|---|---|
| **W6-A40-01 P0/P1 Phoenix UI** | Phoenix stock 0, one ready owner hand HP10+ (shield5 with surviving Packheart), player in Aiming. UI card/shortcut → drag from own launcher | Card enabled, deliberate normal SPAWN, hand count 1→0, HP/shield transferred, finite stock remains0; 1 new SPAWN, 0 additional RETURN. Cooling hand must stay unavailable. | Player selection/interactivity and visual hand affordance |
| **W6-A40-02 P1 Phoenix death/turn** | Phoenix in combat, enemy within its blast/entry region, ally Packheart, sufficient HP and no premature match over; kill with `Damage`; advance natural turns, Replay without turn change as control | DEATH then REPLAY_RETURN; blast/fire native visuals, hand created once; +5 HP per **own** turn capped max, no +5 on same-turn Replay; shield accrued from Packheart exactly once; no second stock | Step-driven order, render timing, visual feedback, natural turn lifecycle |
| **W6-A40-03 P1 Soul Anchor return** | At least two dead eligible allied Booster graves at distinct positions, no blocking placement; kill Soul Anchor | Newest *other* grave consumed on successful RETURN:REVIVE; body starts HP10 near recorded grave, no synthetic SPAWN, no collisions/teleport outside safe placement; older grave and Soul Anchor's own eligible record preserved | Native body placement, visible avatar, interference with physics |
| **W6-A40-04 P1 grave cap** | 18 eligible Booster grave records then kill Standard (`normal`), Cascade and Genesis; finally a new eligible Booster death and Soul Anchor death | Excluded types consume **zero slots** and cannot evict legal records; extra eligible record evicts oldest while capped 18; Soul Anchor selects newest other legal record; record membership/lineage exact | Native trigger + event/log rollover with >100 historical events |
| **W6-A40-05 P1 Dirge death payload** | Dirge plus nearest legal ally Bonfire at a known near position, one farther supported DEATH-capable ally; kill Dirge by native damage | Exactly one DEATH for actual Dirge, repeat Bonfire DEATH **body** only (heal/burn) without synthetic DEATH for live Bonfire; no generated fake corpse, no out-of-order feedback. **Separate known blocker**: if nearest legal DEATH type is unported DATA_ONLY, current source intentionally refuses farther substitution; log as gap, do not mark V148 parity. | Death payload visuals/ordering and unresolved unported nearest body |
| **W6-A40-06 P1 Replay/turn/physics** | Replayable friendly Frostguard in home zone, real Earth anchorStacks2, defensive flag true; separate Earth-archetype Anchor with stacks2; include wrong-owner attempt | Valid Frostguard Replay releases defensive flag and keeps Earth2; effective force0.56/mass1.70x using A50 combined physics; genuine Earth Replay spends exactly one stack; wrong-owner rejected unchanged; successful Replay does not switch turn or advance Phoenix hand regeneration | Pointer Replay path, movement/physics, A50 F02 positive/negative controls |
| **W6-A40-07 P2 Den Mother** | Two same-owner Den Mothers and eligible non-token Beast death, then token/enemy/non-Beast deaths in same turn; second own-turn cycle | Each Den Mother emits at most one allied Broodling SPAWN per own-turn budget, 5HP, no RETURN, no response to token/enemy; limited population and placement failure do not fabricate success | Native death-observer effects, generated ball render, per-turn parity |
| **W6-A40-08 P2 snapshot recovery** | During ready Phoenix hand, Soul Anchor lineage/grave, and Den Mother per-turn cooldown, capture/apply host Unity `JsonUtility` snapshot through supported network adapter | Owner/hand ready flag/HP/shield, grave fields, lineage, cooldown, eventSerial preserved; replayed command rejected on stale turn; no additional SPAWN/RETURN purely from snapshot restore | Real Unity serializer and host/client state transition (not real cross-device G3) |

**Implementation-independent native instrumentation / output contract:** record exact `candidateSha`, `runnerSha`, Windows EXE SHA256 (independently measure actual binary), Unity version, OS, display size, renderer, test id, setup mode `manual|staged`, UTC start/end, error/exception count, process exit code, `State.turnNumber`, `ownerTurns[]`, `actionSerial`, `eventSerial`, compact before/after JSON snapshot, relevant `GameEvent` sequence numbers/ball IDs, player-rendered before/after PNG and SHA256, player.log excerpt and explicit `pass/fail/not_run` with reason. Use an **absolute outside-repository evidence directory** and record its hash manifest. `GameSimulation.Emit` retains only the most recent 100 events: capture deltas continuously; do not rely on reconstructing all 18-grave events at the end. Event-based assertions must distinguish `RETURN` from `SPAWN` and not infer either from animation alone.

**Safety against false positives:** record an independent managed acceptance fact for each behavior, but only native probes close native behavior. Do not run a direct `TryCommand` fixture and then label its results "UI path". Do not use R16 historical WebGL/Android evidence as Stage2. Avoid `-batchmode -nographics` for any test claiming real rendered PNG evidence. Native Unity runner source must be opt-in and unrelated to production scenes once HQ approves it.

## 4. A40's actual W6 checks

- Connected GitHub fetched Stage2 integration HEAD and read back eight source/test files from that **exact SHA**. The eight source Git blob IDs used for this review:
  - `CoreClashApp.cs` `5b70a4631829c8355472d9d3aa83e4107428717f`
  - `BallSelection.cs` `d22033df0dc5ba9717262e2540b4f9e6ad1bfe6c`
  - `MatchView.cs` `7f9631a3fb272d312e253b15d2d4627f9d79d05f`
  - `AbilitySupport.cs` `ad073522333ad9e43f1df809a44ad2955968cee3`
  - `GameSimulation.cs` `25f5a18de4df3942626f0245c9b1be77eee73106`
  - `LifecycleEffects.cs` `65d48932a4b547a5673888d7d0e228fda68f3b58`
  - `PresentationSmokeDriver.cs` `b4bb3ededd3ac97d7199651990a2b048a975cb3b`
  - `AbilityTests.cs` `62fd2ea17d0972bc67d4a356632c442250d69f07`.
- 14 exact-source static predicates checked in-memory against pinned GitHub bytes: **14/14 TRUE** for core hand path, UI stock-only gates including desktop/compact/hotkeys, status copy, native smoke nature. These are **source inspections**, no OS exit codes, no compiled test result.
- Locally checked for availability of executables: `dotnet`, `Unity`, `unity-editor` all **NOT_FOUND**; `/opt/unity` absent (directory existence test exit 1). There is no Windows Unity Player executable in this thread. **All eight new Stage2 native scenario executions NOT_RUN**.
- Did NOT access the raw W6 ZIP, did NOT rerun the 351 managed/13 codec tests, did NOT modify any gameplay/UI/test C# source, candidate SHA or default branch.

## 5. Gate decision / minimal next moves

**A40 DESIGN:** YES (bounded native acceptance matrix, source-bound reproduction).  
**A40 IMPLEMENTATION:** No W6 C# changes; earlier gameplay fixes already included in immutable Stage2. A40's earlier overall lifecycle remains **PARTIAL** relative to full V148 feature parity.  
**A40 TESTED:** STATIC 14/14 checked; **new native probes 0/8 actually run, NOT_RUN**. **G1/G2 local PASS is HQ-reported, A60 acceptance pending, not an A40-run test.**  
**INTEGRATED:** Existing A40 five C# source paths **YES in A70 Stage2 development candidate only**; W6 report on A40 isolated branch is not integrated into candidate.  
**RELEASED:** NO.  
**GATE:** W6 A40 source-gap analysis **COMPLETE**, **HOLD** for runtime replayability, A60 independent acceptance and any HQ-authorized UI correction. **RELEASE STOP**.

**Handoff:** 
1. HQ/A00 + likely A20 presentation owner: assign exclusive permission for minimal Phoenix hand availability UI fix, or explicitly hold; do not modify A40/A50 authoritative gameplay physics or stock logic.
2. A70/A72: if HQ approves, create **separate disposable** opt-in behavioral fixture for Stage2; preserve source commit and hash evidence; no silent code inclusion, no main merge.
3. A60: independently admit raw G1/Windows build/smoke evidence with exact SHA; then classify which above Player scenario assertions remain untested.
4. A50: review W6-A40-06 physics with its native F02 probe; A10 adjudicates any *real* semantic conflict involving Dirge nearest unported effect body.
5. A40 retains Issue #92, unchanged existing feature branch for any later **explicitly authorized** corrective work.

**No implicit QA promotion; no hidden merge, force push, release or protected source modification.**
