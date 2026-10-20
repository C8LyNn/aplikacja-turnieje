# CC-001 — R17-W6 / A40 independent semantic co-review of A20 Phoenix UI repair

**PROJECT:** CC-001 — CORE CLASH UNITY  
**ROLE:** A40 — Gameplay / Lifecycle + RETURN; role fixed by prior explicit user assignment in this thread  
**ISSUE:** [#92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92)  
**WAVE:** R17-W6 / PHOENIX FINAL QA & INTEGRATION READINESS  
**MODE:** READ-ONLY source review; A40-owned documentation report only. No gameplay/UI modification, integration or release.  
**OWN BRANCH:** `feat/cc001-r17-w4-a40-lifecycle-return`  
**OWN BEFORE REVIEW HEAD:** `3ee83b126414b2d1f66801d9080595ebef053ff8`  
**STAGE2 FROZEN BASE:** `a67a37a0e4105dd680f52ae6728e93face61f4ce`  
**A20 ISOLATED PHOENIX UI REPAIR EXACT SHA:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`  
**A72 runner source:** `1d9be1b1cd39b5b768036ef4d711bf15e4088318`  
**FROZEN R16:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**Authority:** HQ [#97 comment 6298600804](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6298600804); A20 [#95 comment 6289675893](https://github.com/C8LyNn/aplikacja-turnieje/issues/95#issuecomment-6289675893); A60 [#139 comment 6298599187](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6298599187).  
**RESULT:** `A40_PHOENIX_SEMANTIC_SOURCE_PASS / PLAYER_UI_NOT_RUN / A60_NEW_ARCHIVE_PENDING`. Narrow invalid-state robustness caveat below. Final A40 Git SHA comes from accompanying Issue comment because a Git document cannot refer to its own commit hash.

## 1. Independent repository/source checks

Connected GitHub directly verified that A20 exact head remains `10f64e4d213f17a352ed8fa83bc75884a39549f0`, linear descendant of frozen Stage2 (ahead6/behind0), with exactly **five** changed paths: `Presentation/BallSelection.cs`, `Presentation/CoreClashApp.cs`, `Presentation/MatchView.cs`, `Tests/PresentationTests.cs`, and one `docs/cc001/swarm/w6/A20/**` handoff. The A20 branch does not modify A40 gameplay, A50 physics, data/catalog, reference V148, protocol149, R16 or Stage2 branch.

Exact Git blob SHA-1s read from A20 commit:

| Scope / file under Unity root | Git blob |
|---|---|
| A20 `Assets/CoreClash/Presentation/BallSelection.cs` | `c18d6dc342da868b71a043c3bcc0a524aa9c611a` |
| A20 `Assets/CoreClash/Presentation/CoreClashApp.cs` | `33be4b892d85bd3b68d08a1a79d5aab39d256600` |
| A20 `Assets/CoreClash/Presentation/MatchView.cs` | `27ea11641dd0caf59fee80599f973e693856c0c5` |
| A20 `Tests/PresentationTests.cs` | `08e74174997aaaa01013b4ae0e0cd07b19ba69d2` |
| UNCHANGED A40 `Assets/CoreClash/Core/GameSimulation.cs` | `25f5a18de4df3942626f0245c9b1be77eee73106` |
| UNCHANGED A40 `Assets/CoreClash/Core/LifecycleEffects.cs` | `65d48932a4b547a5673888d7d0e228fda68f3b58` |
| UNCHANGED A40 `Tests/AbilityTests.cs` | `62fd2ea17d0972bc67d4a356632c442250d69f07` |

**19/19 static source-invariant checks evaluated TRUE** on exact fetched code: stock-first, hand-only Phoenix, hand owner/current turn, `ready`, created-turn less than current ownerTurns, processed-turn greater/equal, active Aiming/authority UI gate, ForTurn persistence, keyboard/mouse path, desktop/compact/phone card path, HAND READY label without stock minting, depleted other-ball fallback, read-only UI selector, core single hand consumption, canonical normal SPAWN, death-only REPLAY_RETURN, hand HP/shield transfer, ten named PHX-UI tests and retained earlier A40 core tests. These are GitHub file/readback and in-memory source assertions **without process exit codes**, not compiled tests.

## 2. Exact gameplay-semantic parity verdict — legal, reachable states

| V148 / A10 required behavior | A20 UI presentation at 10f64e… | Authoritative Stage2 gameplay (unchanged) | A40 judgment |
|---|---|---|---|
| Real stock precedence | `BallSelection.Source` returns `Stock` immediately for positive `Stock(owner,type)`; label `xN` | `TryCommand` decrements real `stockEntry.remaining` before attempting hand use | **MATCH — SOURCE PASS** |
| Ready-hand eligibility | `type=="phoenix"`, matching current owner, ready, createdOwnerTurns less than current owner turn, processedOwnerTurns greater/equal | Same four checks and owner filter in `FirstOrDefault`; TryCommand separately validates command owner/phase/turn | **MATCH — SOURCE PASS** |
| Invalid/stale/opponent hand | `None`, fallback Standard; click disabled | No qualifying hand means Spawn denied if stock exhausted | **MATCH — SOURCE PASS** |
| Intent / launch authority | `CoreClashApp.SelectBall` requires `CanChoose` plus catalog definition and `CanSelect`; keyboard shortcuts and both card implementations call same path | `TryCommand` validates live owner, turnNumber, phase, finite aim and legal power | **MATCH — SOURCE PASS**; actual input device path NOT_RUN |
| REPLAY_RETURN on Phoenix death | UI does not emit lifecycle events | `PhoenixDeathEffect` enqueues one PhoenixHandEntry and `EmitReturn(b,b,"REPLAY_RETURN",hand)` | **UNCHANGED**; local native observation NOT_RUN |
| Normal SPAWN when returned from hand | UI only selects ball type; no special command or new stock | `TryCommand(Spawn,"phoenix")` invokes canonical `Spawn` and consumes one hand | **MATCH — SOURCE PASS** |
| HP, Shield and regeneration | UI does not change payload; `HAND READY` label is state-only | `LifecycleHandTurn` adds +5 HP each own turn, bounded by max; replay Spawn transfers bounded HP and pending Shield; Packheart can add Shield to hand on RETURN | **UNCHANGED**; native visual/runtime semantics NOT_RUN |
| No extra RETURN or minted stock | Selector/source label is read-only | `TryCommand` removes hand exactly once; Spawn emits SPAWN; REPLAY_RETURN remains death-only in lifecycle | **MATCH — SOURCE PASS** |
| Other depleted balls | Fallback Standard or `EMPTY`; only Phoenix gets hand exception | No other special gets Phoenix-hand fallback | **MATCH — SOURCE PASS** |

**A20 managed test mapping:** PHX-UI-01 through PHX-UI-10 individually found in exact `PresentationTests.cs`; they cover eligible, absent, stock first, cooling, wrong owner, same-turn/stale, consumption/fallback, other-ball, wrong active turn and invalid-prior hand cases. The original A40 `AbilityTests.cs` covers Phoenix returning HP/Shield and event semantics; A20 did not edit these tests.

**A40 semantically accepts the A20 repair for LEGAL game states at the SOURCE LEVEL.** There is no newly demonstrated mismatch requiring an A40 gameplay source change. Do NOT conflate that with native UI execution or formal A60 evidence acceptance.

## 3. Bounded robustness caveat — malformed imported snapshot only (not an ordinary legal game state)

A20's `BallSelection.Source` safely ignores a `null` member of `State.phoenixHand`, but unchanged core `GameSimulation.TryCommand` uses `State.phoenixHand?.FirstOrDefault(x=>x.owner==...)` and dereferences `x.owner` without checking `x!=null`.

Exact hypothetical C# reproducer for **invalid/malformed state**, **NOT EXECUTED**:

```csharp
// In a disposable test only; not achievable via normal PhoenixDeathEffect.
var h = new PhoenixHandEntry {
    owner=0, ready=true,
    createdOwnerTurns=s.State.players[0].ownerTurns-1,
    lastProcessedOwnerTurns=s.State.players[0].ownerTurns,
    hp=10, maxHp=20
};
s.State.players[0].stock.First(e=>e.id=="phoenix").remaining=0;
s.State.phoenixHand.Insert(0, null);
s.State.phoenixHand.Add(h);
// A20 Source(...) ignores null and returns Hand.
// Existing TryCommand(legal Spawn,"phoenix") evaluates x.owner on the
// null first list item, predicting a NullReferenceException.
```

This is a **SOURCE-PREDICTED ROBUSTNESS EDGE**, not a proven corruption path or observed Unity Player bug. Normal producer `PhoenixDeathEffect` writes valid non-null entries; the ten PHX-UI managed tests exercise non-null fixture entries. **Severity unclassified / low-priority invalid-state-only; no source mutation requested or authorized.** If QA later establishes that the network/snapshot admission path can accept such malformed list entries, request a separate narrow HQ core/snapshot scope and executable negative fixture. It should **not** block A20 UI semantic acceptance for valid native states without evidence of real reachability.

## 4. Existing W6 execution evidence and strict limits

Per current HQ [#97 evidence](https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6298600804), user's Windows 11 environment: .NET SDK9.0.313, **361/361 managed tests PASS** (including ten PHX-UI cases), 13/13 codec PASS, exit0, Unity 6000.4.0f1 `StandaloneWindows64` successful build exit0, Windows Direct3D11 50-turn/51-launch native accelerated smoke exit0, 6 PNGs. HQ verified 19/19 ZIP CRC, 18/18 manifest hashes and four actual binary hashes. Assembly-CSharp.dll reported SHA256 `909D71C3C2641657B887C496CBC7CDBB817070BCA22250F758F334C0811B4698`. Outer ZIP `phoenix-w6-qa-20261020-204232.zip` reported SHA256 `D6E5224BFF848E9BF03881F1F4EA4F4EF69E68EE334AA51DFE8772378A02B658`.

**A40 has NOT received or hashed the ZIP bytes.** These are verified-local-by-HQ / reported by user, not this agent's independent byte verification, and A60's new independent formal acceptance for this newer candidate remains pending at checked Issue #139. The Windows native smoke tests a different deck pair and **does not prove real mouse/keyboard/touch Phoenix selection**, even though Unity compiled the actual presentation methods. Separate direct managed C# tests use `BallSelection`, not the real Unity IMGUI player-event loop.

**NOT_RUN by A40:** any .NET 9 re-execution, native Unity Player ready-hand UI interactions, desktop keyboard/mouse click, Phoenix UI screenshot/exit, Android/WebGL builds, physical phone/tablet, full G3/crossplay or G4.

**A40 checks in THIS review:** connected GitHub fetch_issue/comments, exact refs, compare, seven C# text readbacks and static 19/19 predicates; no process shell commands, hence **A40 own exit codes N/A**. HQ's listed Windows process exit0 is an external input, not an A40 command.

## 5. Mandatory handoff and gates

**DESIGNED:** YES — independent semantic and boundary review.  
**IMPLEMENTED:** NO new A40 gameplay/Unity C# changes. A20 repair implemented on its own isolated branch.  
**TESTED:** A40 static/source checks 19/19 TRUE; managed 361/361 + codec13/13 LOCAL PASS per HQ (A40 did not rerun); Unity Windows local build/native smoke PASS per HQ; Phoenix real UI actions NOT_RUN.  
**INTEGRATED:** NO — A20 branch remains isolated; frozen Stage2 not modified. Earlier A40 gameplay remains in existing Stage2.  
**RELEASED:** NO.  
**A40 DECISION:** `PHOENIX_SEMANTIC_SOURCE_PASS` for legal states; `PHOENIX_UI_NATIVE_NOT_RUN`; `G4_HOLD / RELEASE_STOP`.  
**NEW OWN COMMIT:** documentation report only; exact Git commit to be recorded after remote readback in Issue #92.  
**NEXT AGENTS:** A20 real desktop keyboard/mouse/touch UI and HP/shield observable ready-hand scenarios; A60 independent receipt of exact new Phoenix QA ZIP; A70 awaits HQ integration authorization. No merge/force push/main/publication.
