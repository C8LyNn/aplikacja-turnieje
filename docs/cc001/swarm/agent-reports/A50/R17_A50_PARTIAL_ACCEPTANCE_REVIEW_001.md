# CC-001 R17 — A50 PARTIAL Acceptance Review 001

**PROJECT:** CC-001  
**VERSION:** V149 / R17  
**ISSUE:** #93 — A50 19 PARTIAL acceptance matrix and targeted fixes  
**AGENT:** 50 — Simulation / Acceptance  
**BRANCH:** `feat/cc001-r17-a50-partial-acceptance`  
**STATUS:** PARTIAL — DESIGN/AUDIT COMPLETE; EXECUTABLE FIXTURE/IMPLEMENTATION PHASE BLOCKED ON A70 SOURCE IMPORT  
**V148 MODIFIED:** NO  
**PUBLIC DEPLOY:** NO

## Executive verdict

A50 reviewed all 19 R16 PARTIAL entries assigned by R17.

**UNITY_READY promotions in this review: 0 / 19.**

Two concrete protected-V148 parity defects were found by comparing the exact R16 source with the protected V148 runtime reference:

1. **Construction durability mismatch** — Wallmaker, Barricade and Engineer structures are 5-hit objects in R16 but 2-hit objects in V148. RepairPulse acceptance depends on correcting/validating this durability scale.
2. **Frostguard anchor-physics mismatch** — R16 injects three Earth anchor stacks, producing different force, effective mass and friction from V148's plain anchored Frostguard state.

Additionally:

- **Mitosis** remains blocked on an explicit semantic decision for physical-contact surface scope beyond ball-ball.
- **Furnace** R16 mechanics match the protected V148 runtime; the “+5 direct fire damage” wording is catalog/presentation debt, not justification for a gameplay patch.

Per Issue #93, the defect fixtures are specified **before any mechanics repair**. They are not claimed as executed C# or Unity fixtures yet because A70 has not imported the exact R16 editable source into Git.

## 1. Intake and provenance

Read and used:

- R17 Master Dispatch
- GitHub Issue #93
- Drive `HANDOFF_R16_README.md`
- Drive `R16_REPORT_PL.md`
- Drive `R16_QA_PL.md`
- Drive `Evidence/R16/ability-support.json`
- `R16_AUDIT_20261018.md`
- exact R16 source ZIP from Drive
- exact C# source/test files from that ZIP
- protected `Reference/V148_reference_original.html`
- A51 R17 support files already committed on this branch:
  - `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md`
  - `docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json`

Canonical R16 source:

```text
CoreClash-V149-R16-Source-Candidate.zip
SHA-256:
b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
```

A50 independently re-hashed the downloaded ZIP and obtained the same SHA.

Protected V148 reference inside R16:

```text
Reference/V148_reference_original.html
SHA-256:
bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e
```

No protected V148 bytes were edited.

## 2. What A50 actually executed now

### Static source/data verifier

```text
node --version
v22.16.0

node Tools/verify-data.cjs

PASS: 227 records / 224 specials / 12 archetypes /
36 canonical + 4 provisional decks;
runtime HP/size/contracts and source hash verified.
```

### Managed rerun attempt

```text
dotnet run --project Tests/CoreClash.Tests.csproj --no-restore

bash: dotnet: command not found
exit 127
```

Therefore:

- R16's reported 269/269 managed PASS is historical evidence reviewed by A50;
- A50 did **not** independently rerun those 269 tests in this environment;
- A50 did **not** run Unity/native collision acceptance in R17;
- A50 does not transform historical R16 PASS claims into new R17 execution evidence.

A70 Issue #90 remains open and its source-import branch had not delivered the exact Unity tree when this report was prepared. R17 explicitly forbids pretending compiled/source work exists before that gate.

## 3. Existing R16 coverage is not enough for promotion

The 19 assigned IDs are all PARTIAL in the R16 support registry:

```text
wallmaker, barricade, repairpulse, engineer, bastion,
commander, quartermaster, armorer, splitter,
hatchery, replicator, mitosis, swarmcore, conscriptor,
firebrand, chainfrost, ashcore, furnace, frostguard
```

Managed tests exist for these families, but the missing R17 acceptance dimension is exactly the one called out by R16:

- real/native collision and physics for relevant mechanics;
- generated-token placement/cap/ownership edge cases;
- deterministic event ordering where generated units appear during a turn;
- snapshot/network state where the mechanic introduces persistent state;
- semantic closure where V148 contact scope is ambiguous.

A51's 42 fixture definitions are useful coverage design, but they are explicitly `NOT_RUN` and do not promote readiness.

## 4. Confirmed defect F01 — construction durability parity

### Protected V148

Exact V148 runtime creates:

```text
Wallmaker wallOrb:    hits:2
Barricade wallOrb:    hits:2
Engineer engineerWall hits:2
```

### R16

`ConstructionEffects.cs` creates:

```text
Wallmaker row: hp = 5
Barricade:     hp = 5
Engineer wall: hp = 5
```

`BallPhysics` routes fresh hostile strong structure collisions to:

```text
Structures.Damage(g, 1, b)
```

so current R16 structures survive five such hit stages rather than V148's two.

This is a gameplay-semantic mismatch, not just missing test evidence.

Affected:

- `wallmaker` — parity fail
- `barricade` — parity fail
- `engineer` — parity fail
- `repairpulse` — dependent acceptance blocker because +2 repair is evaluated on the wrong durability scale

### Required pre-fix fixture — R17-A50-FX01

Create each structure through the real ability/event path and apply two distinct valid hostile strong structure-collision episodes through production physics.

Expected from V148:

1. after first hit: live, one hit-stage remains;
2. after second hit: broken/dead;
3. no third live collision target remains.

**Expected current R16 result: FAIL.**

After source import, this fixture must be committed and observed failing before any repair to construction durability.

## 5. Confirmed defect F02 — Frostguard anchor physics parity

### Protected V148

`frostguardStop`:

```text
anchored = true
vx = 0
vy = 0
shield +10, cap 15
```

With no Earth anchor stacks:

```text
earthForceScale = 0.30
earthMassMultiplier = 2.0x
```

### R16

`ElementalEffects.cs`:

```text
anchorStacks = 3
frostguardAnchored = true
vx = vy = 0
```

R16 physics then yields:

```text
ForceScale = max(0.34, 1 - 3*0.22) = 0.34
Mass = base * 2 * (1 + 3*0.35) = 4.10x base
plus 3-stack anchor friction in BallPhysics
```

This is materially stronger/different anchoring than protected V148.

### Required pre-fix fixture — R17-A50-FX02

After production STOP on an otherwise unanchored Frostguard, validate:

- anchored state active;
- zero initial velocity;
- shield +10 capped at 15;
- Frostguard alone does not inject Earth anchor stacks;
- controlled force response equivalent to 0.30;
- effective mass multiplier equivalent to 2.0x;
- replay launch removes the anchor.

**Expected current R16 result: FAIL.**

This fixture must be observed failing before any Frostguard mechanics repair.

## 6. Semantic blocker S01 — Mitosis

R16 implements and managed-tests ball-ball contact:

- first eligible contact splits;
- 15 + 15 HP;
- one-time only;
- Jam blocks;
- live-ball cap blocks;
- split occurs before identity-theft ordering.

R16 does not certify first-contact behavior for every other physical surface.

Required post-ruling matrix:

- weak ball-ball contact;
- strong ball-ball HIT;
- wall/edge;
- base;
- generated structure;
- trap/zone where physically applicable.

**A50 does not invent the expected result for unresolved surfaces.**

Disposition: remain PARTIAL until HQ/A10 closes the semantic surface contract and the applicable native fixture runs.

## 7. Furnace semantic debt — no mechanics defect established

R16 Furnace:

- creates or refreshes one source/owner-bound zone;
- radius 104;
- 3 ticks;
- applies FIRE at TURN END;
- does not duplicate its field;
- uses normal FIRE/ICE cancellation.

This matches the protected V148 runtime implementation.

The catalog prose that sounds like “5 fire damage + burn” is not evidence that a separate direct 5-damage callback should exist.

Disposition: keep mechanics unchanged unless a separate authority changes the contract; track wording as presentation/catalog debt.

## 8. 19-entry acceptance matrix

| Ability | Implemented in R16 | Managed evidence present | Native/runtime acceptance | Serialization/network | A50 R17 disposition |
|---|---|---|---|---|---|
| Wallmaker | yes | placement/cap | missing exact collision durability | structures snapshot | **PARTIAL — F01 parity defect** |
| Barricade | yes | count/geometry | missing exact collision durability/relocation | structures snapshot | **PARTIAL — F01 parity defect** |
| RepairPulse | yes | repair/filter/shield cap | must validate against corrected 2-hit structures | structures + shield | **PARTIAL — F01 dependent** |
| Engineer | yes | repair-before-build/cap | missing exact collision durability/ownership lifecycle | structures snapshot | **PARTIAL — F01 parity defect** |
| Bastion | yes | nearest ally/self shield | dedicated native TURN/range missing | shield state | **PARTIAL** |
| Commander | yes | Standard shields incl generated token ordering | native ordering/cap/token acceptance missing | shield/generated state | **PARTIAL** |
| Quartermaster | yes | every-2-turn spawn/retry/no graveyard | native placement/cap/ownership missing | counters + generated token | **PARTIAL** |
| Armorer | yes | range/cap/Echo/Jam | dedicated native STOP/range missing | shield state | **PARTIAL** |
| Splitter | yes | 2/1/0 capacity, no DEATH | native placement/replacement/cap missing | generated/dead state | **PARTIAL** |
| Hatchery | yes | cap3/retry | native placement/cap/ownership missing | counters snapshot | **PARTIAL** |
| Replicator | yes | current HP/cap3/timer reset | native clone placement/ownership missing | counters + clone state | **PARTIAL** |
| Mitosis | ball-ball yes | contact/Jam/cap/order | other physical surfaces unresolved | mitosisSplit state | **PARTIAL — S01 semantic blocker** |
| SwarmCore | yes | DEATH spawn/repeat | native death placement/cap missing | generated children | **PARTIAL** |
| Conscriptor | yes | nearest Standard/repeat/generated token | native target selection/ownership missing | Veteran fields | **PARTIAL** |
| Firebrand | yes | range/filter/ICE cancel/Echo | dedicated native STOP/status missing | standard FIRE state | **PARTIAL** |
| ChainFrost | yes | 4 hops/ranges/filter | native sequential target/status missing | standard ICE state | **PARTIAL** |
| AshCore | yes | once/turn/cap/filter | native turn/status missing | shield/FIRE + turn lock | **PARTIAL** |
| Furnace | yes | zone/lifetime/cancel/snapshot | dedicated native TURN-END zone fixture missing | zone state | **PARTIAL — runtime parity, copy debt** |
| Frostguard | yes | shield/counter/ally/launch/copy/snapshot | controlled native physics missing | anchor fields snapshot | **PARTIAL — F02 parity defect** |

## 9. Source fingerprints for the defect audit

```text
Assets/CoreClash/Core/ConstructionEffects.cs
225081072e2a18d515b001672f504658ba161a2a49705ba56b5575b732328cef

Assets/CoreClash/Core/ElementalEffects.cs
67e519db3640f3713ee94cfb632d06a20cdb54acfda06017bfa4ee1e21a1b0aa

Assets/CoreClash/Physics/CollisionResolver.cs
0997f17e667653eb026bf58b172a64ccca0573529f0bef9eecd854314079992d

Tests/ConstructionTests.cs
f86d648a7d94a23829b8b6204b8e33945dc44a055afe6b9e77fa30cc27839215

Tests/ElementalTests.cs
e5b46b858121d78d521cacd0a526b77394085296ad4d524d93687569cccf5ca7
```

## 10. Required next sequence

After A70 publishes the exact source-import baseline:

1. rebase/update the A50 branch without losing A51's fixture-support artifacts;
2. implement executable `R17-A50-FX01` against the imported source;
3. execute it and preserve the failing pre-fix result;
4. implement executable `R17-A50-FX02`;
5. execute it and preserve the failing pre-fix result;
6. obtain semantic ruling for Mitosis non-ball physical surfaces;
7. only then make narrowly authorized mechanics changes;
8. rerun managed + required Unity/native acceptance;
9. promote individual entries only from observed acceptance evidence.

No broad rebalance is authorized.

## 11. Status vocabulary

**DESIGNED:** COMPLETE — 19/19 matrix, two pre-fix failing fixture contracts, Mitosis semantic blocker and Furnace runtime/copy distinction documented.

**IMPLEMENTED:** NOT STARTED FOR R17 MECHANICS — A70 source import is still the hard gate. Existing R16 implementations were inspected, not rewritten.

**TESTED:** PARTIAL — A50 actually executed R16 `Tools/verify-data.cjs` and obtained PASS. Managed rerun was attempted but blocked by missing `dotnet`. No R17 Unity/native acceptance was executed. Historical R16 evidence remains historical.

**INTEGRATED:** NO.

**RELEASED:** NO.

## HANDOFF → 00 — HQ / ORCHESTRATION

- Assigned Issue: #93
- Branch: `feat/cc001-r17-a50-partial-acceptance`
- Reviewed: 19/19 assigned PARTIAL entries
- UNITY_READY promotions: **0**
- Confirmed parity defects:
  - **F01:** construction durability — Wallmaker / Barricade / Engineer; RepairPulse dependent
  - **F02:** Frostguard anchor physics
- Semantic blocker:
  - **S01:** Mitosis physical-target scope beyond ball-ball
- Non-mechanics debt:
  - Furnace catalog text vs protected runtime
- A51 fixture-support artifacts: retained and not overwritten
- Gameplay modified by A50: **NO**
- Protected V148 modified: **NO**
- Public deployment: **NO**
- Next hard dependency: **A70 Issue #90 exact R16 source import**

**FINAL STATUS:** PARTIAL — A50 DESIGN/AUDIT DELIVERABLE COMPLETE; EXECUTABLE FIXTURE/IMPLEMENTATION PHASE BLOCKED ON A70 SOURCE IMPORT.
