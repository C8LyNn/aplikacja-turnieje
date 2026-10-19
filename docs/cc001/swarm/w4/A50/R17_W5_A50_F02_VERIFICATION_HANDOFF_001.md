# CC-001 — R17-W5 A50 / Frostguard F02 isolated source verification handoff

**PROJECT:** CC-001 — CORE CLASH UNITY  
**WAVE:** R17-W5 — Integration & Verification  
**AGENT:** A50 — Balance / Simulation / Acceptance (direct pre-existing thread assignment)  
**ISSUE:** [#138](https://github.com/C8LyNn/aplikacja-turnieje/issues/138) (continued existing issue; no W5 duplicate)  
**BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**STATUS:** PARTIAL — F02 standalone source ready for diagnostic staging; **G1/G2 and combined G09B remain HOLD**.

## 1. Current-source refs and branch roles

Exact refs verified via GitHub connector during this review:

| Role/source | Commit SHA | Gate |
|---|---|---|
| Frozen A70 R16 | `de1fe4b88fce3bd08ef383165dc2cd622af2536b` | G0 SOURCE PASS only |
| A70 Stage 1 disposable DEV candidate | `ab624c2789b6efda015e742e8bd9bcbb86766735` | A40/A50 **excluded**; G1/G2 NOT_RUN |
| A40 own W4 branch | `46980bff1e6074853fb18567c142a92088e3fb93` | TryCommand Earth-only gate present; no combined tests |
| A50 own branch before W5 | `947f9b03a81268fee15c06f43942aa2bbbb10ef5` | F02 scoped source + 13 test definitions |
| A50 syntax-hardening commit | `d3d4d448bbd05e957068a9aad7f033d9aa0888e3` | one authorized source-line update, no behavioral retune |

The baseline SHA, 13 F02 test registrations and existing W4 handoffs remain preserved; this is not a new balance campaign or a new task.

## 2. Actual W5 A50 change — one source line, no gameplay retune

**Modified path:**

`unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Physics/CollisionResolver.cs`

Original A50 branch line contained the lexically ambiguous ternary suffix:

```cs
:b.frostguardAnchored?.30f:1f;
```

Now made explicit:

```cs
:b.frostguardAnchored ? 0.30f : 1f;
```

**Old file Git blob SHA-1:** `d514c359d57056310eda031984f33ec316de98a6`  
**New file Git blob SHA-1:** `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e`  
**Commit:** `d3d4d448bbd05e957068a9aad7f033d9aa0888e3`  
**Diff:** 1 line added / 1 line removed; exact single-file GitHub compare PASS.

This is **syntax disambiguation** and source-level hardening, not measured or approved new physics. No assertion that the previous source was proven to fail compilation is made because a C# compiler remains unavailable. The intended conditional values for all F02 branches are unchanged. Nothing belonging to A40 was edited.

## 3. F02 source-static and scalar verification (ACTUALLY PERFORMED)

Verified exact GitHub readback, source field predicates and arithmetic cases against the current A50 branch and latest A40 branch:

- **8/8 source checks passed**: explicit conditional, absence of old joined token, no synthetic Frostguard STOP Earth-stack injection, defensive mass formula unchanged, G09B/C/D/E cases present, A40 Earth-gated replay still present, A70 Stage1 excludes A50 source, and own branch diff stays inside A50's `CollisionResolver.cs`.
- **7/7 scalar-check scenarios passed** in a V8 calculation faithfully reproducing the committed source formulas. **These are NOT executed C# physics tests.**

| Scenario | Force scale | Effective mass / base |
|---|---:|---:|
| Frostguard STOP, 0 genuine Earth stacks | 0.30 | 2.00× |
| Frostguard REPLAY, 0 genuine stacks | 1.00 | 1.00× |
| Frostguard STOP, 2 genuine Earth stacks | 0.56 | 3.40× |
| Frostguard REPLAY, 2 genuine stacks | 0.56 | 1.70× |
| Earth archetype, 2→1 stack on replay | 0.78 | 1.35× |
| Unrelated Earth-stack=3 control | 0.34 | 4.10× |
| Rooted Frostguard, zero Earth stacks | 0 | 2.00× |

Rechecked `GameSimulation.TryCommand` in latest A40 HEAD `46980bff...`. Source still uses the successful-branch predicate:

```cs
if(Catalog.Ball(ball.type).archetype=="earth")
    ball.anchorStacks=Math.Max(0,ball.anchorStacks-1);
ball.frostguardAnchored=false;
```

This is aligned at **source level** with A50 G09B/C/D/E. The **new A40 HEAD** additionally changes `GameSimulation.Kill` to exclude Standard/Cascade grave entries; its changes do not alter the Earth-gated replay line. The separate lifecycle/graveyard change is A40-owned and must be independently tested; A50 makes no lifecycle acceptance claim.

Selected exact Git blobs at time of review:
- A50 `CollisionResolver.cs`: `92b0d7fa45fb35262f9d77af8d3b466b25fcc62e`.
- A50 `ElementalEffects.cs`: `4e0ce8287e71778dc7bf647e785680ddf03a8e18`.
- A50 `ElementalTests.cs`: `f846df155ef95128bc04d58a04f6852f58f3b2be`.
- A40 `GameSimulation.cs` at latest HEAD: `25f5a18de4df3942626f0245c9b1be77eee73106`.
- A70 Stage1 original `CollisionResolver.cs`: `03753b8814d4503737e229aeebd22cd8488b9aa2` — **not integrated**.

## 4. Actual toolchain execution and missing proof

Commands in local Linux environment:

```sh
dotnet --info
# exit 127 — bash: dotnet: command not found

node --version
# exit 0 — v22.16.0
```

**NOT_RUN:** C# compilation; managed baseline 269 tests; F02's 13 C# registrations; codec 13; Unity Editor 6000.4.0f1 compile; real physics/drag/collision; snapshot/network protocol sessions; native builds, devices, crossplay and G09B RED→GREEN on a combined candidate. Node presence and V8 checks are not a managed/Unity PASS.

No red/green runtime assertion is being manufactured from source-static checks.

## 5. Combined candidate gate

As of this review, A70 Stage1 candidate `ab624c2...` does **not** include A40 `GameSimulation.cs` or A50 `ElementalEffects.cs`/`CollisionResolver.cs`/`ElementalTests.cs`. G09B/C/D/E have only cross-branch source-level agreement, not a single executable candidate SHA. No A50 authority exists to merge these branches or edit A40's source.

Required next distinct responsibilities:

1. **A70**: under explicit HQ isolated diagnostic assembly authority, select **exact** current A40/A50 file blobs and create a disposable **UNVERIFIED F02 diagnostic** candidate SHA, never label it green/release.
2. **A72**: execute actual .NET9 and codec checks on the exact candidate/runner when available, preserving commands, exit codes, logs and hashes. Do not replace with historical R16 269/269.
3. **A50**: independently inspect exact combined SHA G09B (Frostguard non-Earth retaining real stacks), G09C (Earth reduces one stack), G09D (invalid owner no mutation), G09E (generic non-Earth retains), and plain-anchor scalar/mass/drag, with negative controls.
4. **A60**: independent G1/G2 (and later QA) gates; no self-certification from A50 source audit.

A40 lifecycle/RETURN and Kill corrections remain A40-owned and not certified by A50. F01 structures remain at actual V148 runtime HP5; no HP2 change. Protected V148 and canonical R16, Protocol149, source manifest and live website untouched.

## 6. Mandatory five-axis status & HANDOFF → 00/HQ

**DESIGNED:** COMPLETE — existing F02 golden oracles, tests and explicit combined-candidate gating.  
**IMPLEMENTED:** COMPLETE for W5's one-line A50-owned syntax hardening; prior **scoped F02** implementation still isolated. Full combined gameplay implementation **NOT INTEGRATED**.  
**TESTED:** 8/8 static source checks + 7/7 arithmetic scenarios PASS; `node --version` exit0; `dotnet --info` exit127; managed/codec/Unity/F02 runtime NOT_RUN.  
**INTEGRATED:** NO — A70 Stage1 candidate excludes A40/A50.  
**RELEASED:** NO.

**OVERALL GATE:** **PARTIAL / HOLD**, not G1, G2, G3, G4 or V148/Unity balance certification.

**OWN BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`  
**OWN W5 CODE COMMIT:** `d3d4d448bbd05e957068a9aad7f033d9aa0888e3`  
**FINAL HANDOFF REPORT COMMIT:** to be read back after publishing this document.  
**NO MERGE TO MAIN / NO FORCE PUSH / NO DEPLOY / NO OTHER AGENT FILE EDITS.**
