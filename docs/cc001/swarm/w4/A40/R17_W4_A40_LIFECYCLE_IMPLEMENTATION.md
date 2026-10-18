# CC-001 — R17-W4 / A40 — Narrow lifecycle + RETURN implementation handoff

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W4 RECOVERY  
**AGENT:** A40 (assigned in this thread; no identity reassignment)  
**ISSUE:** #92 — https://github.com/C8LyNn/aplikacja-turnieje/issues/92  
**OWN BRANCH:** `feat/cc001-r17-w4-a40-lifecycle-return`  
**FROZEN R16 SOURCE COMMIT:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**W4 MASTER DISPATCH / OWN START SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**IMPLEMENTATION + TEST HEAD BEFORE REPORT:** `082474ef6d0c08176030004a780481913dc3ed66`  
**REPORT COMMIT AND FINAL BRANCH HEAD:** recorded in Issue #92 after commit readback (do not self-reference a Git commit from inside its own content).  
**STATUS:** PARTIAL IMPLEMENTATION; COMPILE/QA NOT_RUN; GATE HOLD; INTEGRATION/RELEASE NO.

## 1. Authority and source truth

Source: HQ R17-W4 MASTER DISPATCH, dedicated #92 comments, A10 semantic contract PR #98 / Issue #91, A70 frozen source commit and exact assigned W4 branch. The protected V148 original, R16 immutable evidence, Unity `.meta` GUIDs, source import branch, website and protocol version 149 were not edited. A50 owns `Physics/CollisionResolver.cs`; this agent did not touch it.

The five-ability batch remains **DATA_ONLY** pending executable independent A60 approval. Authored code and tests do not themselves promote UNITY_READY.

## 2. Exact changed paths (code + tests only)

Under `unity/cc001-r16/CoreClash-V149-Unity/`:

1. `Tests/AbilityTests.cs` — 13 authored contract/negative/snapshot test registrations; committed first.
2. `Assets/CoreClash/Core/GameState.cs` — serialized `PhoenixHandEntry` and `GameState.phoenixHand`, per-instance `BallRuntime.lastDenMotherTurn`, `BallRuntime.phoenixEntryTimer`.
3. `Assets/CoreClash/Core/LifecycleEffects.cs` — Den Mother observer; Phoenix entry/death hand/regeneration; subtype-aware RETURN observer; no-SPAWN helper and effects for Revenant/Soul Anchor; Dirge nearest supported repetition with V148 approved target selection.
4. `Assets/CoreClash/Core/AbilityResolver.cs` — minimal OnSpawn/OnStep/OnTurnStart/OnDeath hooks to connect scoped lifecycle logic.

This report is fifth permitted path: `docs/cc001/swarm/w4/A40/R17_W4_A40_LIFECYCLE_IMPLEMENTATION.md`.

No other file path is authorized or modified. `TurnSystem.cs` deliberately unchanged: preexisting increment of `players[owner].ownerTurns` and `Abilities.OnTurnStart(owner)` is sufficient for hand regeneration.

## 3. Implemented behavior and observed limits

**Den Mother — SOURCE IMPLEMENTED:** When a living Den Mother sees a genuine allied, non-token Beast death, serialized `lastDenMotherTurn` is committed before generation. Creates Broodling using the existing safe-placement `Generate` path: 5 HP, generated/token, normal SPAWN, no stock and no RETURN. Multiple Den Mothers use independent 1/TURN limits. On cap/placement failure the limit remains spent. Dead Den Mother does not self-observe.

**Dirge — PARTIAL:** Actual death selects globally nearest V148-approved living allied repeatable DEATH target with ID tie-break, ignoring range metadata SHORT, excluding Dirge/Phoenix/Den Mother. Only that target's death EFFECT BODY executes. No fabricated DEATH, grave entry or death observers. The V148 eligible set includes unported effect bodies (e.g. deathshield); when the nearest approved body is unported, this W4 code deliberately does not substitute a farther supported target or broaden DATA_ONLY source changes. Remaining unported bodies need separate authorized engineering scope.

**Revenant — SOURCE IMPLEMENTED WITH QA HOLD:** Actual DEATH selects among visible, nonunique, non-Mirage, non-Revenant forms via existing host `RandomIndex`/serialized `GameState.randomState`; creates a safe child with 10 HP, owner, inherited lineage, life+1 and `replayedIds`. It bypasses `GameSimulation.Spawn` to avoid a false SPAWN event, then emits exactly one RETURN with subtype REVIVE if successful; no stock consumed. No placement/cap -> no phantom child or RETURN. OnDeath and Dirge body invoke same effect. Need independent execution and reconnect QA.

**Soul Anchor — SOURCE IMPLEMENTED WITH QA HOLD:** After genuine death (or eligible living repeat), selects newest other allied grave entry, restores near recorded grave death coordinates at 10 HP with recorded max HP, inherited lineage/life+1 and reviveGeneration=1. It uses the return-only no-SPAWN helper. Grave record consumed strictly after legal placement. Emits one RETURN:REVIVE, no stock, no same-turn Replay. Existing lineage upgrade state is restored. Note R16 `GameSimulation.Kill` appends/trims grave records before emitting DEATH; changing that source order or correcting potential cap-edge eviction would require HQ permission for an unowned file.

**Phoenix — PARTIAL / COMMAND PATH BLOCKED:** From protected executable V148, own entry aura is 1.05 s, radius 230, one fire hit per target per entry; short fire death explosion radius 118 (SHORT 100+18), base damage 12 and impulse 390. Existing engine damage/physics semantics are reused. Actual death creates one owner hand entry at 5 HP, emits REPLAY_RETURN after DEATH, progresses +5 HP each subsequent own turn to catalog max (20 in R16 data), and records observer-granted pending Packheart Shield on hand rather than on a dead ball. State is serialized. **Consumption of a ready Phoenix hand entry on deliberate Spawn/replay is NOT INTEGRATED**, because the authoritative `GameSimulation.TryCommand` stock check and Spawn consumption live outside the W4 A40 file allowlist. No bypass, fake normal stock or unauthorized change made. PHX-06 and full Phoenix completeness HOLD.

**Shared event differences:** RETURN and SPAWN are separate for new Revenant/Soul Anchor forms and Den Mother Broodling; legacy unrelated `Revive/Generate` paths are deliberately not broadened. Existing R16 `GameSimulation.Kill` grave-before-DEATH event ordering is untouched. The source keeps specVersion=149; added serializable state must undergo independent A41/A60 JSON/network compatibility QA before admission.

## 4. Test-first record and evidence

1. `f1d30b304ce607e0626fca142e6956cbb59a3573` — write first 7 A40 contract assertions to `Tests/AbilityTests.cs`.
2. `22564b2847e964ac245149a89757be57c09e1da4` — add host-serialized lifecycle state.
3. `176845e72a6fbaf2fbc2bcf834a1bdb35f5105a7` — add lifecycle handlers.
4. `7c3ea7a712cc567b358526c4f142933cfd1ba8f0` — add Phoenix timer state.
5. `8367cc7784825c39cd75a456a0cd7e0bfae7dfc6` — wire owned lifecycle hooks.
6. `031c71e7dbfa5b886de540cabf2ac3eb5b5c7bdb` — correct Dirge target search to V148 eligibility even for unported bodies.
7. `082474ef6d0c08176030004a780481913dc3ed66` — add six more capacity/selection/aura/snapshot negative and positive cases.

**Test definitions authored = 13** under `Tests/AbilityTests.cs`: Den Mother 1/TURN, multiple observers, target filters, cap failure; Dirge remote repeated body and non-substitution; Revenant return and cap failure; Soul Anchor correct grave/record preservation on failure; Phoenix hand and aura; JSON snapshot retention.

**Actual executable tests:** NOT_RUN. The available container is Linux 6.18.55 without .NET SDK:
```
$ dotnet --info
bash: line 1: dotnet: command not found
EXIT_CODE=127
```

No Unity 6000.4.0f1 Editor, mobile/desktop target or executable managed runner was available in this working container. Therefore managed 269 historical cases, 13 codec cases, 13 new A40 tests, Unity compile, scene/device tests are all **NOT_RUN**, not PASS. Historic R16 green counts are not repeated as W4 verification.

**Static review actually performed:** connected GitHub read-back of all 4 updated files; a minimal lexeme-aware balanced-brace scan returned balanced for each. This is NOT C# compilation or runtime logic validation. GitHub compare from exact dispatch SHA showed changes only in A40 allowlisted paths at code head.

**Reproduction after toolchain gate (must run from DISPOSABLE checkout, never frozen source checkout):**
```powershell
git status --short --branch
git rev-parse HEAD
dotnet --info
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/CoreClash.Tests.csproj -- unity/cc001-r16/CoreClash-V149-Unity
```
Runner `Tests/Program.cs` writes into project Evidence/, so avoid execution against frozen read-only source; capture actual exit, test counts, logs and produced Evidence JSON. Source-managed runtime requires .NET 9.

## 5. Explicit scope requests / blockers

**HQ-SCOPE-REQUEST A40-01 (P1):** Allow a separate owner-authorized change to `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/GameSimulation.cs` only for stock-gated Phoenix hand replay integration via `TryCommand`. Must preserve normal stock and later normal SPAWN and consume one ready hand opportunity; no V148 changes. Until authorized, do not claim PHX-06.

**HQ-SCOPE-REQUEST A40-02 (P1):** Clarify whether `GameSimulation.Kill` grave insertion/cap trimming and death-order corrections are required before G1, since it is outside ownership; do not modify unowned file. A10's target ordering differs from R16 Kill hook sequence.

**HQ-SCOPE-REQUEST A40-03 (P1):** Nearest Dirge targets that are V148-eligible but DATA_ONLY currently cannot have effect bodies executed; approve precise later scope/owner or accept corresponding known gap as HOLD. A40 must not silently add other ability ports or substitute a farther eligible target.

**Runner:** A72 to provide actual .NET 9 and CI; A60 independent review/managed+Unity regression after gates; A70 candidate work only after G0/A73 authorization. Any failure or incompatibility to be handled in a new owned corrective change, not described as passed.

## 6. Five-axis disposition and handoff

- **DESIGNED:** YES — A10 contract accepted; A40 mapping to owned implementation paths documented.
- **IMPLEMENTED:** PARTIAL — source changes pushed to own isolated branch, no full Phoenix play-command path.
- **TESTED:** STATIC STRUCTURAL CHECK ONLY; new managed cases authored but NOT_RUN; Unity/device NOT_RUN.
- **INTEGRATED:** NO — no candidate merge, A70 gate not met by this work.
- **RELEASED:** NO — no website, V148/reference, production, deployment or public release action.

**GATE:** HOLD pending HQ scope disposition, .NET 9 / Unity runner and A60 independent QA. Do not change ability-support status DATA_ONLY.

**HANDOFF TARGET:** A00/HQ, A60 independent QA, A72 managed runner, A70 integration, and A10 for any semantic clarification. Issue #92 remains OPEN until owner acceptance.
