# CC-001 R17-W3 — A50 Frostguard F02 Test-First Parity

**PROJECT:** CC-001 — Core Clash Unity  
**WAVE:** R17-W3 — Parallel Source Development  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** [#124](https://github.com/C8LyNn/aplikacja-turnieje/issues/124)  
**BRANCH:** feat/cc001-r17-w3-a50-frostguard-parity  
**BASE BRANCH:** feat/cc001-r17-a70-source-import  
**FROZEN A70 BASE SHA:** de1fe4b88fce3bd08ef383165dc2cd622af2536b  
**W3 BRANCH START SHA:** e9e235a69a04eb57727defd308918321836d7f02  
**R16 SOURCE ZIP SHA-256:** b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4  
**RAW R16 SOURCE TREE Git SHA-1:** 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6  
**V148 PROTECTED REFERENCE SHA-256:** bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e  

## Result: IMPLEMENTATION HOLD — REQUIRED PHYSICS SCOPE

**Test fixtures have been committed to the allowed ElementalTests.cs. A complete V148 faithful gameplay repair is impossible through the only permitted production file, ElementalEffects.cs. No production gameplay changes were made.**

This HOLD is required by the explicit W3 A50 rule: if fidelity requires editing a shared physics file, **STOP and request HQ separate scope instead of a partial workaround**. This is a scope blocker, not an observed C# test run failure.

The branch intentionally contains **source-proven red fixture expectations**, not a shippable green fix. It must not be merged/published without HQ's new authorization and real RED→GREEN evidence.

## 1. Previously approved parity oracle

Inputs reviewed:
- A50 W1 Issue #93 review (all 19 PARTIAL, no promotions).
- A50 W2 Issue #109 golden F02-G00/G01/G04/G08 oracle.
- A51 W1 unexecuted fixture definitions.
- A70 byte-exact imported R16 Unity source at the frozen baseline.
- Protected V148 executable semantics for Frostguard, plain anchor with no synthetic Earth stack.

The F01 two-hit misconception was already corrected in W2: **not in scope W3**. No construction source or tests were changed.

## 2. Exactly changed source paths

1. unity/cc001-r16/CoreClash-V149-Unity/Tests/ElementalTests.cs — **test-only changes** (+40 lines/−2 against W3 branch start).
2. docs/cc001/swarm/w3/A50/R17_W3_A50_FROSTGUARD_F02_IMPLEMENTATION.md — this report.

**Not changed:** ElementalEffects.cs, CollisionResolver.cs, BallPhysics.cs, GameSimulation.cs, network/snapshot files, Test/Program.cs, data/catalog, V148 reference, website, Unity scenes/meta, source-import baseline.

Test file readback in GitHub after first commit:
- Test-only commit: 733878381979433f9bb4fab9ce636716eb885f88
- Test file Git blob: fea0865492727be32ef6e271ad597ed02435aaea
- Git compare against W3 branch start: exactly ElementalTests.cs, 40 additions / 2 deletions.

## 3. New test-first fixtures — source-proven expected results, NOT_RUN

The existing ElementalTests() group is called from Tests/Program.cs; **Program.cs was not changed**.

| Fixture | V148 expected | Frozen R16 source prediction | Runtime status |
|---|---|---|---|
| Existing R13 STOP assertion corrected | zero synthetic Earth stacks after STOP | 3 | NOT_RUN; expected RED |
| F02-G00 new STOP state | anchor flag=true, stacks=0, vx/vy=0, shield=10 | flag=true, stacks=3, vx/vy=0, shield=10 | NOT_RUN; expected RED |
| F02-G01 scalar physics | ForceScale=0.30, CollisionMass=2.00×base | ForceScale=0.34, CollisionMass=4.10×base | NOT_RUN; expected RED |
| F02-G04 replay | anchored=false, stacks=0, force=1.00, mass=1.00× | anchored=false, stacks=2, force=0.56, mass=1.70× | NOT_RUN; expected RED |
| F02-G08 preexisting Earth stacks | STOP preserves a legitimate initial 2 stacks | STOP overrides them to 3 | NOT_RUN; expected RED |
| Earth-status negative control | unrelated ball with 2 Earth stacks retains 0.56 force/1.70× mass | matches current R16 helper behavior | NOT_RUN; expected GREEN |
| Existing snapshot assertion extended | host serialization preserves Frostguard flag and no synthetic stacks | serializes anchorStacks=3 | NOT_RUN; expected RED |

Previously existing tests already cover:
- STOP shield10 capped at15;
- enemy qualifying HIT counter-freeze, weak TOUCH/ally negatives;
- anchored flag clears on successful replay;
- copy and host snapshot round trip;
- FIRE/ICE status behavior and Furnace zone.

These are historical R16 managed tests. **Not rerun now**; test state must not be presented as verification.

The new tests deliberately check both stored anchor stacks and the helper-derived physical outcomes. A test that only checks frostguardAnchored or shield would incorrectly pass on frozen R16.

## 4. Why ElementalEffects.cs alone cannot deliver V148 parity

For any alive, unrooted Frostguard in the frozen R16 source:

**CollisionResolver.ForceScale(b) = max(0.34, 1 - 0.22 × b.anchorStacks)**

Thus for any nonnegative integer anchorStacks, ForceScale >= 0.34. A rooted ball instead returns 0. Neither result can equal protected V148's **0.30** for the plain anchored status. No assignment confined to ElementalEffects.cs can change that helper behavior without editing shared physics.

**CollisionResolver.Mass(b) = b.mass × (anchorStacks>=3 ? 2 : 1) × (1 + 0.35 × anchorStacks)**

The calculation never examines frostguardAnchored. For stacks 3 the mass is **4.10×** with additional BallPhysics stack-damping 0.90 per 1/60 second. For stacks 0 the mass is **1.00×**, not V148's **2.00×**.

| anchorStacks | R16 force (unrooted) | R16 mass/base | Note |
|---:|---:|---:|---|
| 0 | 1.00 | 1.00× | plain flag ignored by physics |
| 1 | 0.78 | 1.35× | Earth stack |
| 2 | 0.56 | 1.70× | residual after current replay |
| 3 | 0.34 | 4.10× | current Frostguard STOP |
| 4 | 0.34 | 4.80× | higher Earth stack |

R16 GameSimulation.TryCommand on replay subtracts one anchor stack then clears frostguardAnchored. From a synthetic 3-stack STOP this leaves 2 residual stacks. Removing the stack write from ElementalEffects.cs would address only that part, **but would worsen the active STOP physics to ForceScale=1.00 and Mass=1.00×**. This is not an acceptable complete patch.

Other narrow hacks—marking rooted, overwriting intrinsic mass, retaining fake stacks, or adding compensating velocity changes—also cannot preserve both the exact .30 force and 2.00× mass under all collision/impulse paths, and could alter unrelated mechanics or serialization. None was applied.

### Required HQ authorization (future)

Permit a separately owned shared-physics change after establishing the intended interaction with legitimate Earth stacks:
- CollisionResolver.ForceScale — honor defensive frostguardAnchored separately from Earth anchor stacks.
- CollisionResolver.Mass — honor defensive frostguardAnchored separately from Earth anchor stacks.
- BallPhysics damping — confirm no synthetic stack-3 friction is applied for plain Frostguard.
- ElementalEffects — remove synthetic anchorStacks=3 **together with** physics correction, preserving shield/counter-freeze semantics.
- GameSimulation replay — existing clearing of frostguardAnchored should then remove the plain Frostguard effect without leaving synthetic Earth stacks; verify through tests.
- Snapshot/host — verify serializable boolean and genuine Earth stacks survive independently.

This is a **proposal for HQ scope assignment, not implemented work**, and is not permission to touch other agents' files. No registry promotion, balancing or protocol change.

## 5. Actually executed checks

Against the exact original canonical R16 ZIP, an independent disposable static source script checked these seven source facts:

1. ElementalEffects sets anchorStacks=3 on Frostguard STOP.
2. ElementalEffects also sets frostguardAnchored=true.
3. CollisionResolver ForceScale clamps to minimum 0.34.
4. CollisionResolver Mass ignores frostguardAnchored.
5. BallPhysics applies extra damping for 3+ stacks.
6. GameSimulation replay subtracts one stack and clears flag.
7. Historical ElementalTests asserted three synthetic stacks.

**RESULT: STATIC SOURCE CHECK 7/7 PASS**.

The static script enumerated the actual helper values for stacks 0–4 and verified mathematically that ForceScale cannot reach 0.30 while non-rooted. This is **static reasoning and source inspection**, not measured Unity forces or executable C# tests.

The GitHub post-commit readback confirmed test names, zero malformed file-path changes and Git compare +40/−2.

The environment's actual toolchain probe:

    dotnet --info
    bash: dotnet: command not found
    exit 127

No Unity executable or Mono compiler was found. **C# compilation and managed test execution: NOT_RUN**. Consequently no actual failing C# fixture traces, no successful repairs, and no native-physics/visual/replay/device claims exist in this W3 branch.

## 6. Before/after truth and limitations

**Before:** frozen R16 ElementalEffects.cs sets 3 anchor stacks; full R16 physics and replay exhibit source-predicted divergence from V148.

**After this W3 A50 change:** ElementalEffects.cs is **byte-identical to the frozen import**. Only targeted ElementalTests.cs assertions/fixtures exist. The predicted physics divergence remains. No production behavior changed.

**Observed actual runtime red/green:** NONE.  
**Source-predicted red fixtures:** yes.  
**Required runtime evidence before an implementation PASS:** observe baseline RED, authorize physics path, make narrow synchronized repair, rerun managed and native controlled collision/drag/snapshot tests, preserve the actual traces, obtain A60 independent sign-off.

## 7. Requested HQ decision

**HOLD F02 PRODUCTION IMPLEMENTATION.** Approve or reject explicit ownership of the required shared-physics files and semantics in the next isolated implementation wave. Do not merge an intentionally RED test-only branch as a completed fix. Do not force a partial ElementalEffects-only edit.

If HQ cannot authorize a shared physics change, retain Frostguard as PARTIAL and record the known V148-parity divergence as an open issue.

This HOLD is exactly the approved W3 A50 stopping condition, **not failure to execute an available complete scoped implementation**.

## HANDOFF → 00/HQ, A60 QA, authorized physics owner

**PROJECT:** CC-001  
**WAVE:** R17-W3  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** #124  
**OWN BRANCH:** feat/cc001-r17-w3-a50-frostguard-parity  
**BASE SHA:** e9e235a69a04eb57727defd308918321836d7f02 (contains frozen A70 base de1fe4b88fce3bd08ef383165dc2cd622af2536b)  
**TEST-ONLY COMMIT:** 733878381979433f9bb4fab9ce636716eb885f88  
**R16 SOURCE SHA256:** b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4  
**RESULT:** Scoped, source-proven test-first RED oracle fixtures committed; F02 full production repair stopped due non-owned CollisionResolver requirement.  
**DESIGNED:** COMPLETE — baseline, negative controls, derived expected values, future scope proposal.  
**IMPLEMENTED:** TARGETED TEST SOURCE ONLY; production source UNCHANGED (HOLD).  
**TESTED:** STATIC SOURCE PASS 7/7; dotnet unavailable (exit127); C#/Unity/native NOT_RUN.  
**INTEGRATED:** NO.  
**RELEASED:** NO.  
**KNOWN LIMITATIONS:** no compiled test result; no actual observed RED/GREEN; mandatory shared physics scope not authorized; no cross-device/Unity native proof.  
**NEXT OWNER:** 00/HQ for scope decision; A60 for independent evidence review after actual executable tests.  
**NO MERGE, NO FORCE-PUSH, NO DEPLOY, NO V148 CHANGE.**
