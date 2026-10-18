# CC-001 — R17-W4 A50 F02 Frostguard Recovery / Scoped Implementation and Hold

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W4 RECOVERY  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** [#138](https://github.com/C8LyNn/aplikacja-turnieje/issues/138)  
**OWN BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**STATUS:** SCOPED PRODUCTION CODE IMPLEMENTED; STATIC SOURCE VALIDATED; **G1/RUNTIME ACCEPTANCE HOLD**  
**INTEGRATED:** NO — **RELEASED:** NO

## 1. Exact immutable baseline and ancestry

- Original frozen A70 source SHA: `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.
- Original R16 ZIP SHA-256 independently checked: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`.
- Protected V148 reference SHA-256: `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.
- W4 dispatch/own initial HEAD: `661660d3a3dc8a4fa2c9afea489050247f64c38c`.
- W3 A50 deliberately red test commit `733878381979433f9bb4fab9ce636716eb885f88`, report final `4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5`.
- W4 test-first commit (carried W3 fixtures, plus Earth controls): `a85d74a5b75bba845713e5ec21fb677f6c8e2f5d`.
- W4 scoped source commits: `7ec08630e34b16653b51f730a28b3d2ab5ac8596` and `8f4f868f1d4a69a35961737fb75f2ed377c09132`.
- W4 follow-up specific diagnostic test: `eac6ffcc2e300b19674b4e1317df4d253aca2e48`.

This report is an additive W4 handoff. W1/W2/W3 reports remain unchanged. **No changes** were made to the immutable A70 baseline branch, original V148 reference, public Core Clash builds, protocol 149, other roles' paths or `Tests/Program.cs`.

## 2. Exact changed source paths

Only:

1. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/ElementalEffects.cs` — **+2/-1**.
2. `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Physics/CollisionResolver.cs` — **+6/-2**.
3. `unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs` — **+81/-2**.
4. `docs/cc001/swarm/w4/A50/R17_W4_A50_FROSTGUARD_F02_RECOVERY_001.md` — this report.

No `BallPhysics.cs`, `GameSimulation.cs`, `GameState.cs`, snapshot/networking, lifecycle, catalog, Unity scene/meta or CI edits were made.

## 3. Source-truth derivation from protected V148

Actual protected V148:

```js
function frostguardStop(ball) {
  ball.anchored = true;
  ball.vx = 0; ball.vy = 0;
  addBallShield(ball, 10, 15);
}
function earthForceScale(ball) {
  if (v148RootedActive(ball)) return 0;
  const stacks = Math.max(0, Math.min(3, ball.earthAnchorStacks || 0));
  if (stacks > 0) return Math.max(.34, 1 - stacks * .22);
  return ball.anchored ? .30 : 1;
}
function earthMassMultiplier(ball) {
  const stacks = Math.max(0, Math.min(3, ball?.earthAnchorStacks || 0));
  return (ball?.anchored ? 2.0 : 1) * (1 + stacks * .35);
}
```

Source anchors: `Reference/V148_reference_original.html:23619–23625,25724–25734,22101–22114`.

In V148, Frostguard is not an Earth archetype and its own STOP must not manufacture Earth stacks. The plain defensive anchor with zero real Earth stacks is **0.30 force / 2.0x mass**. Actual real Earth stacks take precedence for force and combine multiplicatively with anchored mass. Replay for non-Earth clears the defensive `anchored` flag without reducing Earth stacks.

## 4. Scoped code change — actual implementation

**ElementalEffects.cs**

Before:
```cs
source.anchorStacks = 3;
source.frostguardAnchored = true;
```

After:
```cs
// V148 Frostguard has a defensive anchor independent of
// Earth stacks. Never manufacture or overwrite those stacks.
source.frostguardAnchored = true;
```

STOP still zeroes velocities, grants 10 shield capped at 15, emits the same FROSTGUARD event; existing enemy-HIT counter-freeze, allied/weak-contact filters and FIRE/ICE handling are unchanged.

**CollisionResolver.cs**

Before:
```cs
public static float ForceScale(BallRuntime b)=>b.rooted?0:Math.Max(.34f,1-b.anchorStacks*.22f);
public static float Mass(BallRuntime b)=>b.mass*(b.anchorStacks>=3?2:1)*(1+b.anchorStacks*.35f);
```

After:
```cs
public static float ForceScale(BallRuntime b)=>b.rooted?0:b.anchorStacks>0?Math.Max(.34f,1-b.anchorStacks*.22f):b.frostguardAnchored?.30f:1f;
public static float Mass(BallRuntime b)=>b.mass*(b.frostguardAnchored||b.anchorStacks>=3?2f:1f)*(1+b.anchorStacks*.35f);
```

Thus the new defensive flag independently participates in collision mass and in `AbilityResolver.Impulse` through `CollisionResolver.ForceScale`. Real Earth-stack behavior for other existing R16 entities is deliberately preserved. Crucially, `BallPhysics` extra .90 damping for `anchorStacks>=3` no longer fires for a plain Frostguard STOP, because no synthetic stacks are created.

### Before/after scalar expectations (from static source analysis, NOT runtime measurement)

| Scenario | Frozen R16 force / mass factor | W4 code force / mass factor | Actual protected V148 |
|---|---|---|---|
| Plain Frostguard STOP | 0.34 / 4.10x | **0.30 / 2.00x** | 0.30 / 2.00x |
| Plain Frostguard replay | 0.56 / 1.70x | **1.00 / 1.00x** | 1.00 / 1.00x |
| Frostguard STOP + legitimate 2 Earth stacks | 0.34 / 4.10x | **0.56 / 3.40x** | 0.56 / 3.40x |
| Nonanchored 2 Earth stacks | 0.56 / 1.70x | **0.56 / 1.70x** | 0.56 / 1.70x |
| Rooted plain Frostguard | 0 / 4.10x | **0 / 2.00x** | 0 / 2.00x |

Unrelated R16 stack>=3 physics was intentionally left unchanged; this is **not** a general Earth-physics rebalance.

## 5. Test-first case inventory

The W3 suite was explicitly carried forward into the *new* W4 branch, without merging another agent's history. `Tests/Program.cs` already calls `ElementalTests()`; no test registration edit was needed.

**Ten new R17 F02 named test definitions** (all **NOT_RUN**, none claimed as runtime PASS):

- F02-G00: STOP at zero real stacks; defensive flag, shield, velocity and preserved zero stacks.
- F02-G01: plain-anchor helper-derived force 0.30 and mass 2x.
- F02-G04: plain replay clears defensive anchor with zero residual stacks; force1/mass1.
- F02-G08: STOP retains preexisting legitimate two Earth stacks.
- Earth-2 negative control: normal ball 0.56/1.70x unchanged.
- F02-G09: Frostguard STOP with two real Earth stacks combines 0.56 force and 3.40x mass.
- F02-G09B: **known remaining diagnostic RED** — non-Earth Frostguard replay should preserve two real Earth stacks; existing `GameSimulation.TryCommand()` decrements these to one. Not fixed in owned paths.
- F02-G10: unrelated normal ball with Earth stacks three retains R16 helper outputs.
- F02-G11: rooted Frostguard force0.
- F02-G12: unanchored Frostguard with two real Earth stacks retains normal Earth response.

Also updated pre-existing R13 STOP test (formerly expecting synthetic three stacks) and extended existing snapshot test to assert zero synthetic Earth stacks while serializing defensive flag. Historical negative controls include weak/ally TOUCH/HIT, shield cap, copy and Furnace/FIRE/ICE behavior.

**Test-first chronology:** added W3-derived tests at `a85d74a...`, *before* production modifications `7ec08630...` and `8f4f868...`. The test source is frozen-R16 **predicted red**, not observed red. The post-fix `G09B` remains source-predicted red on its out-of-scope legitimate-stack replay path.

## 6. Remaining scope blocker: GameSimulation.TryCommand replay

**Precise blocking existing source** (`Assets/CoreClash/Core/GameSimulation.cs`, not A50-owned):

```cs
ball.anchorStacks = Math.Max(0,ball.anchorStacks-1);
ball.frostguardAnchored = false;
```

This decrements a Frostguard's *real preexisting* Earth stacks as well as synthetic ones; V148 only decrements Earth stacks on Earth-archetype balls. A plain Frostguard with zero stacks is now correct because 0→0, but the edge scenario involving genuine two stacks is not.

Scenario:
- before STOP: `frostguardAnchored=false, anchorStacks=2`;
- after W4 STOP: `frostguardAnchored=true, anchorStacks=2`, force0.56, mass3.40x — correct;
- after W4 replay: R16 decrements to `anchorStacks=1`, defensive flag=false, force0.78, mass1.35x;
- protected V148 non-Earth replay: retain `anchorStacks=2`, anchored=false, force0.56, mass1.70x.

**HQ action required:** separately assign source ownership / authorize narrow `GameSimulation.TryCommand` replay semantics correction and its exact regression test, or explicitly rule that authentic non-Earth Earth stacks are impossible/unreachable and define the acceptance scope. **A50 did not modify GameSimulation.cs or disguise the edge case.**

Per W4 dispatch rule, an extra file requirement triggers STOP/escalation, not silent source expansion. **This branch is a partial, scoped repair and must not be reported as complete F02 parity PASS.**

## 7. Executed evidence, runner limits and truth

### Actually executed — isolated static source verification

Environment: local Linux container, Python 3; canonical R16 ZIP available locally. The exact patch was reconstructed in a disposable buffer from the ZIP's original source bytes and compared using actual Git blob SHA-1 semantics against committed GitHub blobs.

Command:

```sh
python /mnt/data/cc001_r17_w4_a50/verify_f02_static.py
```

**EXIT: 0 — `STATIC_SOURCE_CHECK PASS`.**

Observed checks:
- canonical R16 ZIP SHA-256 verified;
- original two C# source blob identities matched frozen baseline;
- *patched* `ElementalEffects.cs` blob `4e0ce8287e71778dc7bf647e785680ddf03a8e18` exactly matches GitHub;
- *patched* `CollisionResolver.cs` blob `d514c359d57056310eda031984f33ec316de98a6` exactly matches GitHub;
- no artificial three-stack assignment remains in STOP;
- shield and counter-freeze source branches remain untouched;
- static formula assertions cover plain STOP, plain replay, authentic Earth2 combination, normal Earth2/3 controls and rooted force0;
- source-certain out-of-scope replay mismatch was explicitly detected.

This is **static checking and arithmetic reproduction only**, not C# test execution or observed Unity physics. Its local result JSON is `/mnt/data/cc001_r17_w4_a50/F02_STATIC_SOURCE_VERIFICATION_001.json` (not committed; not a runtime artifact).

### Actual managed toolchain probe

```sh
dotnet --info
```

**EXIT: 127 — `bash: dotnet: command not found`.**

The environment lacks .NET 9 CLI and Unity Editor. Therefore:

- managed C# compilation and RED→GREEN observations: **NOT_RUN**;
- entire managed 269-test and codec 13-case suite: **NOT_RUN**;
- Unity native collision, damping/physics, Android/Windows/WebGL, device/networking and snapshots in live transport: **NOT_RUN**;
- no QA PASS, no `UNITY_READY` promotion, no playtest/release approval.

Historical R16 managed 269/269 are historical only.

### GitHub source readback

Actual remote branch and all changed file paths were checked via GitHub connector; branch is a descendant of exact W4 dispatch HEAD and source remains confined to allowed paths. The test-only commit preceded production edits. Current test file blob SHA-1: `79d868aecc2b4430f2c2572c222a7ff26f168dab`. Exact Github readback includes 10 W4 F02 test registrations and the visible G09B blocker.

## 8. Gate and next action

**F02 scoped fix source implemented:** YES.  
**Exact V148 plain-anchor arithmetic, statically:** MATCH.  
**Full F02 parity (including real Earth stacks on replay):** **HOLD — OUT-OF-SCOPE REPLAY LOGIC**.  
**Actual .NET/Unity verification:** **HOLD — TOOLCHAIN / QA EVIDENCE ABSENT**.  
**Integration candidate acceptance:** **HOLD**, pending HQ scope decision, red fixture rerun and A60 independent QA.  
**No merge, force-push, deployment or protected file modification performed.**

## 9. Mandatory HANDOFF → 00 / HQ, A60, relevant simulation owner

**PROJECT:** CC-001  
**WAVE:** R17-W4  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** #138  
**OWN BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**FROZEN R16 BASE SHA:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**W4 DISPATCH COMMIT SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**OWN START SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**FINAL HEAD SHA:** See GitHub HEAD of this report commit; read back after publishing.  
**CHANGED PATHS:** ElementalEffects.cs; CollisionResolver.cs; ElementalTests.cs; this own report.  
**DATA / V148 / PROTOCOL 149 MODIFIED:** NO.  
**TESTS ACTUALLY RUN:** isolated Python static source verification EXIT 0; `dotnet --info` EXIT 127.  
**NOT RUN:** .NET managed tests, Unity/real physics, codec, snapshots in native transport, physical devices.  
**DESIGNED:** COMPLETE (test matrix and explicit out-of-scope case).  
**IMPLEMENTED:** PARTIAL F02 — plain anchor source patch plus executable-but-unrun C# test definitions.  
**TESTED:** STATIC_SOURCE_CHECK PASS; managed and native NOT_RUN.  
**INTEGRATED:** NO.  
**RELEASED:** NO.  
**GATE:** HOLD (full F02 parity and runtime proof pending).  
**KNOWN LIMITATIONS:** existing unowned GameSimulation replay decrement; toolchain unavailable; source-derived formula validation only.  
**HANDOFF:** 00/HQ for explicit source scope/acceptance decision; A60 independently tests actual code after authorized next steps.
