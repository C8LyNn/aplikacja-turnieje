# CC-001 R17-W4 / A50 — F02-G09B Replay Oracle & Combined-Candidate Gate 002

**PROJECT:** CC-001 / CORE CLASH UNITY  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** #138; dependent shared-core owner: A40 / Issue #92  
**OWN BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**STATUS:** A50 replay-oracle handoff COMPLETE; full F02 parity and G1 validation remain **HOLD / NOT_RUN**.

## 1. Live branches when checked

- A50 original W4 patch/report: `a9548d044047b8bfbbfd28285222512573e6b51c`.
- A40 branch `feat/cc001-r17-w4-a40-lifecycle-return`: `22b1d1b005ce494f7dd980a4602a9172c754cac0` — no A40 `GameSimulation.cs` replay correction observed yet.
- A70 disposable integration branch `integration/cc001-r17-w4-disposable-candidate-20261018`: `74a3438b03cdd8891315734c98fc1e8dafc6ba45` — coordination memo only, no combined gameplay candidate available.
- Frozen R16 baseline: `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.
- W4 dispatch/start: `661660d3a3dc8a4fa2c9afea489050247f64c38c`.

HQ's later decision [Issue #138 comment 6254802518](https://github.com/C8LyNn/aplikacja-turnieje/issues/138#issuecomment-6254802518) and [Issue #92 comment 6254802189](https://github.com/C8LyNn/aplikacja-turnieje/issues/92#issuecomment-6254802189) assign **sole** ownership of `Assets/CoreClash/Core/GameSimulation.cs` to A40. A50 edits no A40-owned file. This document supplies the semantic oracle/negative controls and required later combined review.

## 2. Exact observed baseline defect

In frozen `GameSimulation.TryCommand`, the success path after either SPAWN or REPLAY has the unconditional statement:

```cs
ball.anchorStacks=Math.Max(0,ball.anchorStacks-1);
ball.frostguardAnchored=false;
```

That spends an existing real Earth stack on **every** successful REPLAY, even when the actor is a non-Earth archetype. A50's W4 `ElementalEffects.cs` now ensures Frostguard STOP creates no synthetic Earth stacks; `CollisionResolver.cs` treats the independent `frostguardAnchored` flag correctly. Hence a **zero-stack** Frostguard replay is statically correct, but a Frostguard starting with legitimate 2 Earth stacks loses one erroneously in the unmodified shared `GameSimulation.cs`.

Authoritative expected behavior comes from the protected V148 executable-semantic oracle reviewed in W2/W3, ratified by HQ W4 scope decision: on successful REPLAY, clear the Frostguard defensive anchor, but decrement a genuine Earth stack **only when the launched ball is of Earth archetype**. An invalid/rejected command must not mutate either property. A50 does not prescribe other replay changes to A40.

## 3. Precise acceptance matrix

| ID | Setup | Success path | Expected anchor flag and Earth stacks | Force / mass factor after |
|---|---|---|---|---|
| G00 + G01 | owner-0 Frostguard, 0 Earth, STOP | STOP | `frostguardAnchored=true`, `anchorStacks=0` | **0.30 / 2.00×** |
| G04 | plain Frostguard STOP, 0 Earth | valid owner-0 REPLAY | `false`, **0** | **1.00 / 1.00×** |
| G09 | Frostguard, true Earth stacks=2 | STOP | `true`, **2** | **0.56 / 3.40×** |
| **G09B** | Frostguard STOP, genuine Earth stacks=2 | valid owner-0 REPLAY | `false`, **2** | **0.56 / 1.70×** |
| **G09C** | Earth-archetype `anchor`, genuine Earth stacks=2 | valid owner-0 REPLAY | `false`, **1** | **0.78 / 1.35×** |
| **G09D** | Frostguard STOP, Earth stacks=2 | REPLAY from wrong owner → REJECT | `true`, **2**; replayedIds unchanged | defensive state preserved |
| **G09E** | non-Earth `normal`, real Earth stacks=2, not Frostguard anchored | valid owner-0 REPLAY | `false`, **2** | **0.56 / 1.70×** |

All success-case scenarios use a controlled fixture at (270,805), owner 0, `MatchPhase.Aiming`, turn 1, no bonus pending, unused replay ID and a valid power/direction; the ball is inside its own replay zone. R16 `Catalog` independently identifies `anchor` as `archetype="earth"`. The positive/negative controls are designed to reject either (a) preserving *all* Earth stacks including actual Earth archetypes or (b) decrementing *all* stacks including non-Earth Frostguard.

**Do not falsely fix G09B by forcing `anchorStacks=0` in STOP, by skipping all stack decrement including Earth archetypes, or by editing `CollisionResolver` to mask a bad runtime counter.** The shared correction should be confined to A40-authorized TryCommand semantics.

### Evaluation on current individual A50 branch — source-predicted only

- G00/G01/G04/G09 and ordinary Earth helper controls: match A50 patched source expectations.
- **G09B and G09E are source-predicted RED** against shared `GameSimulation.cs` before A40's change: 2→1 instead of 2→2.
- G09C Earth-decrement control: **source-predicted GREEN** (2→1).
- G09D invalid-owner command: **source-predicted GREEN** (validation exits before mutations).
- No executable C# results were produced in this review. **TEST_DESIGNED / COMMITTED ≠ TEST_EXECUTED.**

## 4. A50-owned test addition in this checkpoint

Changed file:

`unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs`

New fixture names:
- `R17 F02-G09C Earth archetype replay decrements one genuine stack`
- `R17 F02-G09D rejected Frostguard replay cannot change anchor state`
- `R17 F02-G09E non-Earth replay preserves genuine stacks without Frostguard flag`

These supplement the existing `R17 F02-G09B` test, without touching `Tests/Program.cs`. The file now contains **13 named F02 registrations**. No gameplay production sources were changed in this checkpoint.

## 5. Actual checks, exact evidence distinction

**Actually performed:** GitHub authenticated branch reads, current Issue/HQ comment reads, GitHub file readback, and **13/13 source-only assertion checks** against exact F02 test source, frozen `GameSimulation.TryCommand`, patched `CollisionResolver`, patched `ElementalEffects` and catalog identifying Earth archetype.

**Toolchain probe (local Linux container):**

```sh
dotnet --info
# exit 127: dotnet: NOT_INSTALLED
```

Unity Editor unavailable. **No managed C# tests, C# build, Unity native physics, codec suite, combined-candidate G09B run, device or network tests** were executed. Thus there is **no observed RED→GREEN**, nor an independent Unity pass.

## 6. Required combined-SHA admission test

Once A40 publishes a real `GameSimulation.cs` diff and A70 assembles a permitted disposable combined candidate, A50 should:

1. Record **exact A40 HEAD**, **exact A50 HEAD**, **exact combined candidate SHA**, selected file blob SHAs for `GameSimulation.cs`, `ElementalEffects.cs`, `CollisionResolver.cs`, `ElementalTests.cs`, and preserve immutability of the source baseline.
2. Independently inspect combined `TryCommand` ordering and archetype predicate. Confirm the guard is evaluated only after legal command validation, remains correctly scoped to successful launch, and does not change stock/replay/turn/ownership semantics.
3. Check **G09B** against the actually **combined** `GameSimulation` and the actually **combined** A50 F02 physics helpers. Then run **G09C** Earth decrement, **G09D** rejected-command non-mutation and **G09E** generic non-Earth retention.
4. Run the rest of the carried F02 tests and relevant historical element, shield, ICE/FIRE, clone, network snapshot and ownership regressions; capture real `dotnet` runner command, exit and logs if .NET 9 is available.
5. Keep Unity native physics/drag and cross-device results **NOT_RUN** unless a real Unity build/runner exists. Forward combined SHA and actual evidence to A60; do not self-certify QA or `UNITY_READY`.
6. If combined code is incomplete or tests cannot run, return **HOLD** with exact failing rows/paths. Never impute a pass from standalone A40 or standalone A50 commits.

**Current combined candidate SHA:** NOT AVAILABLE. **Current combined G09B status:** NOT_RUN / HOLD.

## 7. HANDOFF to A40, 00/HQ and later A60

**DESIGNED:** COMPLETE — authoritative replay truth table with three newly authored negative/positive controls.  
**IMPLEMENTED:** Test source only in A50-owned `ElementalTests.cs`; A40 shared source NOT MODIFIED by A50.  
**TESTED:** 13/13 source assertions PASS; `dotnet` exit127; C#/Unity/combined NOT_RUN.  
**INTEGRATED:** NO.  
**RELEASED:** NO.  
**GATE:** **PARTIAL / HOLD** pending A40 owned TryCommand fix, real combined SHA and independent .NET/Unity execution.  
**DATA / V148 / PROTOCOL149:** NO MODIFICATIONS.  
**MERGE / FORCE-PUSH / PUBLIC DEPLOY:** NONE.

**NEXT:** A40 applies/records shared delta under Issue #92. A70 may assemble only when its own integration gates permit. A50 then independently checks G09B and controls on the exact combined SHA. A60 final QA remains a separate mandatory gate.
