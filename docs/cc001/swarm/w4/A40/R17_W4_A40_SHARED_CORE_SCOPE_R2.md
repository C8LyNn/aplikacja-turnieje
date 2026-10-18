# CC-001 — R17-W4 / A40 / Shared GameSimulation scope R2

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W4 RECOVERY  
**AGENT:** A40 — Unity Gameplay Implementation / Lifecycle + RETURN  
**ISSUE:** [#92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92)  
**DECISION:** HQ [#92 comment 6254802189](https://github.com/C8LyNn/aplikacja-turnieje/issues/92#issuecomment-6254802189), exclusive A40 `GameSimulation.cs` targeted ownership  
**OWN BRANCH:** `feat/cc001-r17-w4-a40-lifecycle-return`  
**FROZEN SOURCE BASE SHA:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**DISPATCH SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**R1 / OWN FOLLOW-UP START HEAD:** `22b1d1b005ce494f7dd980a4602a9172c754cac0`  
**R2 SOURCE / TEST HEAD BEFORE REPORT:** `f6fc42e3f5d1c938fb0c9090f7033845b3e30c2a`  
**R2 REPORT COMMIT:** see linked Issue handoff (self-referential commit SHA cannot be embedded in its own blob).  
**CONCLUSION:** NARROW SOURCE FIX PUBLISHED, MANAGED/UNITY QA NOT_RUN; overall A40 implementation PARTIAL, GATE HOLD.  

## 1. Source-truth and scope verification

A40 #92 was an existing role from the active thread; no role reassignment. HQ's newest comment grants A40, exclusively, narrow method-scoped permission to edit `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/GameSimulation.cs` for (1) Phoenix hand in TryCommand, (2) investigated Kill grave cap/death order, and (3) A50-oracled F02 replay stack preservation. A50 retains `ElementalEffects.cs`, `CollisionResolver.cs`, `Tests/ElementalTests.cs` exclusively.

A40 analyzed the exact certified V148 HTML file independently available in Project resources (`CC001_T011_A30_candidate_copy1.html`, SHA-256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`). The V148 source shows `consumeStock(owner,type)` decrements regular available copies first and falls back to a ready `phoenixHand` only after stock exhaustion. It shows `prepareBallForAction` decrements `earthAnchorStacks` only when `hasArchetype(ball.type,'earth')`, otherwise deactivating the defensive `anchored` flag. This also aligns with A50 issue #138 F02-G09B oracle.

No file from A50, A60, A70 or another agent's ownership was changed. No protocol 149, V148 source, original frozen A70 branch, .meta, data/catalog, site, main, deployment or release modifications.

## 2. Test-first sequence

1. Commit `0b5f4820da2ecc0a1a557b62461b7749483336f6` added **7** new A40 test definitions under existing `Tests/AbilityTests.cs` before editing `GameSimulation.cs`:
   - ready Phoenix hand consumption via deliberate SPAWN; initial cooling denial, no duplicate stock, normal SPAWN not RETURN;
   - retained hand Shield applied once to spawned Phoenix;
   - normal Phoenix stock spent before using ready hand;
   - non-Earth Frostguard replay retains genuine preexisting 2 Earth stacks;
   - Earth-archetype Anchor replay decrements genuine stacks by exactly one;
   - invalid/other-owner Phoenix command does not consume hand;
   - 18-record bounded grave cap, newest other grave selection, DEATH before RETURN.
2. Commit `0f8b8d05b4ab8d516b20bb2d47f5a49f595b7427` implemented two narrowly authorized changes in `GameSimulation.TryCommand`.
3. Commit `281a64bbc9c9f9e390eb475969315f3d3de57578` corrected the grave-cap test oracle to 17 **remaining** entries after Soul Anchor's own record is added and an allied entry successfully consumed.
4. Commit `f6fc42e3f5d1c938fb0c9090f7033845b3e30c2a` removed a redundant eligibility branch without changing semantics.

Before this follow-up the R1 branch already carried **13 authored A40 tests**. Current total: **20 A40 test definitions authored; NONE executed as managed C# in this environment**. Tests/Program.cs unchanged; the suite was already called through Program's ExtraTests/AbilityTests registration.

## 3. Exact source diff intent (GameSimulation.TryCommand only)

**Phoenix Spawn branch**:
- Look up ordinary finite `stockEntry` and eligible owner `PhoenixHandEntry` (ready, own turn passed, regeneration for that turn processed).
- Reject absent/unavailable non-Phoenix stock or a cooling hand, without state changes.
- On valid Spawn call the canonical `Spawn` method to get its ordinary board `SPAWN` event and aura hook.
- If finite stock is still positive, decrement stock and **keep hand unchanged** (this is exact V148 priority).
- Otherwise transfer the ready hand's bounded HP, max HP and pending Shield to the newly spawned Phoenix and consume that hand entry **exactly once**.
- No invented stock, RETURN duplication, protocol change or extra command type. Host validation of owner, stale turn, power and aim stays in place. After launch the existing action semantics are preserved.

**Earth stack branch**:
- Previous: `ball.anchorStacks=Math.Max(0,ball.anchorStacks-1)` executed for all ball types.
- New: that decrement executes **only if** `Catalog.Ball(ball.type).archetype=="earth"`; `ball.frostguardAnchored=false` still executes for both.
- Preserves A50 F02-G09B legitimate non-Earth Frostguard Earth stacks and retains Earth-archetype decrement; makes no A50-owned collision/elemental change.

## 4. Kill investigation — no speculative code rewrite

Reviewed:
- R16 `GameSimulation.Kill`: mark dead, append eligible grave entry, cap at 18 per owner, then emit DEATH event and invoke `Abilities.OnDeath`.
- Protected executable V148 `killBall`: declares death trigger and marks dead, invokes death observers, records eligible grave through `registerGraveyardDeath`, then runs own death effect after normal cleanup. The current V148 grave function caps per-owner records at 18.
- A10 contract: Soul Anchor's own newly created grave must exist before selection but must not be chosen; consume the newest other eligible ally only on successful resurrection.

For this batch, moving R16's grave append to AFTER `Abilities.OnDeath` would break Soul Anchor's own-death contract. Emitting DEATH before inserting grave is not required to fix any demonstrated event sequence; grave insertion itself emits no GameEvent, and externally observed R16 event ordering remains DEATH then a successful RETURN. A40 therefore **did not modify Kill**, preserving existing behavior and avoiding a global reordering of unrelated death hooks. The new cap/lineage/order test is authored for independent executable verification. Any broader observer-phase parity remains **QA HOLD**, not an inferred PASS.

## 5. Evidence (observed vs predicted vs NOT_RUN)

**Actually checked with connected GitHub:**
- Read back current source/test blob identities after write:
  - `GameSimulation.cs` blob `d4e44b35e6ba89b49a804a4adb6b00daefaa29ed`.
  - `AbilityTests.cs` blob `a515e27e3fedd17d5b172cd8aa75ab5d27c3bb11`.
- Both source modifications on A40 own branch; compare from R1 SHA showed **4 new commits**, **two code/test paths only**. Test commit precedes production edit.
- Static lexical balancing for five relevant changed code/test files: **5/5 structurally balanced**, no parse proof.
- Nine narrowly scoped source-presence assertions: **9/9 TRUE**, covering genuine stock priority, single hand consumption, cooldown, transferred Shield, Earth-only decrement, cleared defense, preserved Kill method, separate RETURN/SPAWN and test definitions. **These are source inspections, NOT C# test execution.**

**Environment probe actually run:**

```text
COMMAND=dotnet --info
EXIT_CODE=127
bash: line 1: dotnet: command not found
CSC_AVAILABLE=NO
```

No GitHub Actions workflow runs were found for the A40 branch or the A72 CI branch when checked in this session (Actions runs endpoint returned 0 for each query). **Managed .NET 9 compilation, all 20 new tests, 269 historical managed cases, codec 13, Unity 6000.4.0f1 native compile/physics, WebGL/Android/Windows builds and physical devices = NOT_RUN.** No runtime PASS or RED→GREEN claims.

**Source-predicted outcomes (not executed):** V148 stock-first ready-hand Phoenix replay; Frostguard 2 preexisting stacks remain 2 on replay; Earth-archetype 2 stacks decrement to 1. A50 must independently verify F02-G09B together with A50-owned Frostguard physics patch on the combined disposable candidate. A60 verifies gameplay/runtime afterward.

**Disposable-run reproduction after A72 .NET 9 runner readiness:**

```powershell
git status --short --branch
git rev-parse HEAD
dotnet --info
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/CoreClash.Tests.csproj -- unity/cc001-r16/CoreClash-V149-Unity
```

Runner writes `Evidence/*`, so run in a disposable checkout, never in the frozen source import. Capture real stdout/stderr, exit, test counts and artifacts before claiming tested.

## 6. Current remaining gates

- A40 lifecycle/RETURN still **PARTIAL** beyond this narrow shared-core fix (notably Dirge's approved nearest unported DATA_ONLY effect bodies and end-to-end Unity QA).
- No independent .NET 9 test result or Unity browser/native proof. No host-client snapshot/reconnect verification.
- A50 exact F02 oracle is source-supported, but combined candidate G09B remains **UNVERIFIED** until A70 selectively integrates and A60/A50 run real regression.
- A70 candidate assembly remains separate authorization and does not mean runtime PASS. A60's earlier G0 PASS is source baseline admission, not later G1/G2/G3/G4 proof.

## 7. Mandatory five-axis HANDOFF

**DESIGNED:** YES — A10 contract and V148 source parity inspected.  
**IMPLEMENTED:** PARTIAL overall; narrow A40 `GameSimulation.TryCommand` source fix committed.  
**TESTED:** STATIC SOURCE/BRACE CHECKS ONLY, `dotnet --info` exit 127; managed/Unity NOT_RUN.  
**INTEGRATED:** NO.  
**RELEASED:** NO.  
**GATE:** HOLD pending independent managed / Unity QA, A50 G09B confirmation on combined candidate and separate Dirge scope acceptance.

**HANDOFF →** A00/HQ, A60 independent QA, A72 managed runner, A50 F02 oracle and A70 disposable integration. Retain Issue #92 OPEN until independently accepted.
