# CC-001 — R17-W2 A50 Golden Parity Oracles (F01/F02)

**PROJECT:** CC-001 — Core Clash Unity  
**WAVE:** R17-W2 / PRE-A70  
**AGENT:** A50 — Balance / Simulation / Acceptance  
**ISSUE:** [#109](https://github.com/C8LyNn/aplikacja-turnieje/issues/109)  
**BRANCH:** \`feat/cc001-r17-w2-a50-parity-oracles\`  
**DOCUMENT STATUS:** **TEST_DESIGNED / SOURCE REVIEW + STATIC SCRIPT PASS**; **NOT RUNTIME TESTED**  
**OWNER PATH:** \`docs/cc001/swarm/w2/A50/R17_W2_A50_PARITY_ORACLES.md\`  
**R16 SOURCE ZIP SHA-256:** \`b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4\`  
**PROTECTED V148 REFERENCE SHA-256:** \`bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e\`

## 0. Scope, authority and W1 reconciliation

This W2 document is a **source-grounded parity oracle**, not code, an executed Unity test, a balance-tuning proposal, or an ability-status promotion. It uses the exact R16 source ZIP and protected \`Reference/V148_reference_original.html\`, the prior [A50 W1 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a50-partial-acceptance/docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md) and [A51 W1 42-fixture definitions](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a50-partial-acceptance/docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md). All prior files remain unchanged.

**Critical W2 correction to W1 F01:** the W1 claim that protected **V148 runtime** Wallmaker, Barricade, and Engineer constructions have two actual hit stages is **not supported by the V148 executable constructor**. Their callers pass \`hits:2\`, but \`createStructure()\` reads \`extra.hp ?? 5\`; it never reads \`extra.hits\` when initializing hit stages, and explicitly forces \`engineerWall\` to 5. Consequently the **runtime** initial hit-stage count is **5**, just as R16's constructors set \`hp=5\`. \`defaultHits\` lists \`wallOrb:2\` and \`engineerWall:2\`, but that local map is not used by the constructor. The visible two-hit *intent/configuration* conflicts with the actual V148 behavior.

Do **not** create or use a “structure must break after hit #2” parity test as a migration oracle. It would fail against V148 itself. Do **not** change R16 durability to 2 to “fix” F01 without an explicit HQ/A10 **design-change** ruling. This finding **supersedes only W1's F01 runtime-durability interpretation**, not the historical report or any W1 evidence.

However, another **real source-level divergence** exists in F01: V148 collision damage gate uses \`impact > 32\` and same-ball/structure hit cooldown \`state.time-last > .28\`, whereas R16's \`BallPhysics.ResolveStructures\` requires a **fresh contact episode** and inward normal speed \`-vel >= 90\`. A controlled 60-unit/s inward contact is a deterministic **candidate failing parity fixture**, provided the same collision preconditions are met; it has **not been executed**. The runtime significance should be validated in native physics rather than inferred from source alone.

**F02 survives W1 verification:** protected V148 plain Frostguard \`anchored=true\` without Earth stacks implies 0.30 force scale and 2.0× effective mass; R16 uses \`anchorStacks=3\`, giving 0.34 and 4.10×, plus extra damping while at stack 3. On a subsequent R16 launch, \`anchorStacks\` decreases to 2 even though \`frostguardAnchored\` is cleared, creating a further post-launch discrepancy.

Mitosis and Furnace are explicitly out of scope here and belong to separate A10-W2 semantic arbitration (Issue #106).

## 1. Frozen trace metadata contract for future fixture execution

Each **future** trace must record:
- exact R16 source package SHA, imported A70 source commit, test commit, V148 reference SHA and scene/build;
- fixture ID and variant, deterministic seed, side/owner, source and target IDs, turn/action serial, event order, colliders, exact initial position/velocity;
- \`stateBefore\` and \`stateAfter\` with full structure/ball fields, flags, HP/shield, anchor stacks, nextId and dead flags;
- contact's inward normal speed, physics step \`dt\`, separation/fresh-contact history and V148 cooldown clock;
- emitted events (STRUCTURE_HIT/BREAK/REPAIR; STOP/FROSTGUARD/LAUNCH/HIT) with order and source;
- source of each expected output (\`V148_RUNTIME\`, \`R16_CURRENT\`, \`DESIGN_INTENT_UNIMPLEMENTED\`), and full observed PASS/FAIL/ERROR raw logs;
- managed C# result **separate** from Unity native physics result and optional networking snapshot evidence.

Do not manufacture seed values as if run; seed must be fixed, documented and actually used in later harness.

## 2. F01 — constructions: **source truth vs declared two-hit intent**

### 2.1 Exact source anchors

**Protected V148** (\`Reference/V148_reference_original.html\`):
- lines **24843–24854**: \`createStructure\` and \`scaledStructureExtra\`;
- lines **24866–24880**: unused \`defaultHits\` map contains \`wallOrb:2\` / \`engineerWall:2\`, but effective initial \`hitsRemaining/maxHits = extra.hp ?? 5\`;
- lines **24915–24918**: \`engineerWall\` explicitly resets remaining/max to 5;
- lines **25033–25078**: Wallmaker passes \`hits:2\`, **not** \`hp:2\`;
- lines **25665–25677**: Barricade passes \`hits:2\`, **not** \`hp:2\`;
- lines **23087–23139**: Engineer passes \`hits:2\`, **not** \`hp:2\`;
- lines **25163–25214**: \`damageStructure\` decrements \`hitsRemaining\` by \`hitCount\` and destroys at 0;
- lines **25388–25397**, **25444–25472**: collision \`impact=-vn\`, hostile threshold **>32** and same collision key cooldown **>.28 s**, then one structure damage stage (hidden RAM double-damage disabled);
- lines **22775–22816**, **23681–23693**, **23154–23170**: repairability, RepairPulse repairs by up to two one-hit operations; Engineer repairs by one.

**R16** (\`CoreClash-V149-Unity\`):
- \`Assets/CoreClash/Core/ConstructionEffects.cs:32–55\`: Wallmaker \`TryCreateRow(...3, 5, .18f)\`;
- \`ConstructionEffects.cs:57–72\`: Barricade \`TryCreate(... radius, 5, .24f)\`;
- \`ConstructionEffects.cs:81–108\`: Engineer \`TryCreate(...14, 5, .08f)\`;
- \`ConstructionEffects.cs:73–80\`: RepairPulse repairs +2 and then shields if no damaged owned structure;
- \`Assets/CoreClash/Core/StructureSystem.cs:59–69\`: \`hp=maxHp=hp\` parameter;
- \`StructureSystem.cs:105–128\`: repair cap, damage and break at zero;
- \`Assets/CoreClash/Physics/BallPhysics.cs:60–85\`: fresh structure-contact tracking and \`-vel >= 90\` hostile hit threshold;
- \`Tests/ConstructionTests.cs:11–20, 36–43, 53–61, 76–85, 86–97\`: historical managed assertions currently expect 5 HP, RepairPulse 2→4→5, fresh contact episode gating and structural snapshot retention.

### 2.2 Deterministic logical hit-stage oracle — **both runtimes agree at initial 5 HP**

After a valid Wallmaker/Barricade/Engineer build (and assuming one damage stage per independently qualifying hostile impact):

| Qualified hit count | V148 runtime \`hitsRemaining\` | R16 \`hp\` | Live? |
|---:|---:|---:|---|
| 0 | 5 | 5 | yes |
| 1 | 4 | 4 | yes |
| 2 | 3 | 3 | **yes** |
| 3 | 2 | 2 | yes |
| 4 | 1 | 1 | yes |
| 5 | 0 | 0 | **no** |

The V148 *caller-configured* \`hits:2\` and unused \`defaultHits\` map are **DESIGN_INTENT_UNIMPLEMENTED**, not a valid \`V148_RUNTIME\` oracle. Their resolution needs HQ/A10 if someone wants a future behavioral change, not a stealth Unity fix.

### 2.3 F01 golden cases (test design, all NOT_RUN)

**F01-G00 — creation/control.** Setup: clear board, valid coordinates, active stock irrelevant once source exists; spawn owner 0 Wallmaker around (270,450), source angle \`-π/2\`, then invoke real STOP; separately Barricade STOP and Engineer own TURN. Validate structures are created by their real resolver, have distinct IDs, correct \`sourceId\`/owner/kind, are placed legally, initial 5/5 stages/HP; Wallmaker creates an atomic triple; Barricade makes at most four; Engineer obeys 8 own-wall cap. **V148 expected: 5 stages; R16 expected: 5 HP.** This is a *baseline parity control*, not a failing fixture.

**F01-G01 — isolated collision episode threshold (priority **P1, first actual failing fixture candidate**).** Create a live \`wallOrb\` (repeat on \`engineerWall\`), opposing \`normal\` ball, separated from all other colliders; position/velocity must produce a confirmed **fresh inward normal impact=60** at the structure boundary. On V148, after no hit during previous .28 s, \`impact>32\` produces \`5→4\` and one structural damage; on R16, \`fresh=true\` but \`-vel=60 <90\` gives \`5→5\` and no STRUCTURE_HIT. Record actual incoming velocity **at contact**, not launch power. Avoid incidental collisions or unmatched update order. Source-derived prediction; **native/cross-engine observations NOT_RUN**. This replaces W1's invalid “two-hit must break” candidate.

**F01-G02 — high-impact five-episode lifecycle.** Same structure, opposing ball, five **separate** hits each with measured pre-contact normal impact ≥120; V148 ensures >.28 seconds since last same-ball/structure key, R16 ensures a complete separation frame between contacts. Expected logical stages: 5→4→3→2→1→0; break on the fifth, not second. Retain immutable hit IDs/order and ensure no further live collision after break. Expected both runtimes at logical-stage level; run native contact integration to establish actual event delivery.

**F01-G03 — sustained overlap and debounce (negative control).** While collision remains one episode, repeatedly advance frames without rearming; do not infer five damages from five physics frames. R16 uses \`previousStructureContacts\`; V148 has key/time cooldown. Compare *observed* event counts and timing, not assumed equivalence between distinct debounce algorithms. Deliberately varying gap length can expose another source-level divergence.

**F01-G04 — friendly/weak/blocked controls.** Same owner cannot damage a structure; phase/invalid collision should not create hostile damage; low impact at or below 32 should not damage V148; below 90 should not damage R16. Empty/blocked placement must not spawn ghosts or consume IDs unexpectedly; Wallmaker's three-pillar placement is atomic. \`No damage\` is not equivalent to \`no contact feedback\`.

**F01-G05 — RepairPulse and Engineer, 5-stage actual runtime.** Set live allied structure at 2/5 (via documented controlled damage) near RepairPulse: one own TURN →4/5; next own TURN→5/5; only thereafter allow fallback ally shield. Ensure enemy-owned structure is not repaired. Engineer with damaged allied structure 3/5 repairs to 4/5 instead of spawning another wall. This is a **readiness dependency**, not a reason to force a two-stage scale.

**F01-G06 — rollback/network state negative control.** Capture host authoritative structure snapshot with 3/5, restore through supported admission path, ensure ID, sourceId, owner, kind, hp/maxHp and dead state survive. A new damage episode must decrement **once**, not double-count because of a client replay or repeated frame. Host ownership remains authoritative. R16's earlier snapshot managed test is *historical*; a W2 native/network retest was not run.

### 2.4 F01 false-pass traps

- **INVALID:** read \`hits:2\` or \`defaultHits.wallOrb=2\` and assert actual V148 structures die after two contacts; the constructor does not consume that field.
- **INVALID:** use \`StructureSystem.Damage(g,1,...)\` for the **threshold/cooldown** test. It bypasses \`BallPhysics.ResolveStructures\` and hides the 32-versus-90 divergence.
- **INVALID:** use game launch power as measured inward contact speed; measure or control the actual normal component immediately before collision.
- **INVALID:** treat repeated overlapping physics frames as fresh hit episodes in R16 or assume they obey V148's wall-clock cooldown.
- **INVALID:** infer exact trajectory parity from the 5/5 stage equality; separate geometry, restitution and collision order may differ.
- **INVALID:** promote RepairPulse just because basic managed \`Repair\` passes: real hit damage and host snapshot acceptance remain separate.

### 2.5 F01 disposition

**V148-runtime-versus-R16 initial durability mismatch:** **NOT CONFIRMED; W1 premise corrected**.  
**Collision hit-gate divergence:** **SOURCE-CONFIRMED** (V148 >32 / cooldown .28s versus R16 ≥90 / fresh episode), runtime acceptance impact **NOT TESTED**.  
**Owner-facing two-hit intent:** **OPEN DESIGN/BUG CLASSIFICATION FOR HQ/A10**.  
**Required first future fixture:** **F01-G01**, pre-fix, expected to fail on R16 *relative to actual V148* at controlled 60-unit/s contact.  
**Gameplay fix authorization:** NONE.

## 3. F02 — Frostguard actual parity defect

### 3.1 Exact source anchors

**Protected V148:**
- \`Reference/V148_reference_original.html:23619–23626\`: \`frostguardStop\` sets \`anchored=true\`, zero velocity, shield +10 capped 15, **does not modify** \`earthAnchorStacks\`.
- \`:25724–25734\`: \`earthForceScale\` returns **.30** for plain anchored with zero Earth stacks; \`earthMassMultiplier\` gives **2×**.
- \`:27371–27372\`: effective masses feed ball-ball collision.
- \`:27686–27694\`: anchored Frostguard counter-freezes enemies on allowed HIT, not a STOP-area aura.
- \`:22101–22114\`: preparing a non-Earth ball for replay sets \`anchored=false\`; preserves baseline zero Earth stacks.

**R16:**
- \`Assets/CoreClash/Core/ElementalEffects.cs:26–32\`: Frostguard STOP sets **\`anchorStacks=3\`** and \`frostguardAnchored=true\`, zero velocity, shield+10 to 15.
- \`Assets/CoreClash/Physics/CollisionResolver.cs:12–13\`: \`ForceScale=max(.34,1-0.22*stacks)\`, \`Mass=base*(stacks>=3?2:1)*(1+0.35*stacks)\`; only \`rooted\` special-cases force to zero.
- \`CollisionResolver.cs:21–25\`: \`Mass\` participates in actual collision separation/impulse and impact damage.
- \`Assets/CoreClash/Core/AbilityResolver.cs:51\`: \`Impulse\` directly multiplies power by \`ForceScale\`.
- \`Assets/CoreClash/Physics/BallPhysics.cs:23–24\`: stack≥3 adds **0.90 per 1/60s** extra velocity damping multiplier beyond normal drag.
- \`Assets/CoreClash/Core/GameSimulation.cs:52–59\`: successful launch sets \`anchorStacks=max(0,stacks-1)\` and \`frostguardAnchored=false\`; **leaves two residual stacks after a plain Frostguard STOP**.
- \`Tests/ElementalTests.cs:81–113\`: historical managed STOP/counter-freeze/copy/replay/snapshot evidence, but no complete parity check of collision mass/impulse, residual stacks or native physics.

### 3.2 Golden scalar oracle (derived from code, **not** measured Unity forces)

For an alive Frostguard initially not rooted, no Earth stacks, no shield, at rest:

| State / observable | V148 runtime | Current R16 |
|---|---:|---:|
| Immediately after STOP: defensive anchor flag | \`anchored=true\` | \`frostguardAnchored=true\` |
| Earth anchor stacks after STOP | **0** | **3** |
| Velocity after STOP | 0,0 | 0,0 |
| Shield after first STOP | 10 | 10 |
| Force scale | **0.30** | **0.34** |
| Effective mass / base mass | **2.00×** | **4.10×** |
| Additional anchor-stack damping | no 3-stack multiplier | **0.90 per 1/60s** multiplier |
| After successful launch: defensive flag | false | false |
| After successful launch: Earth stacks | **0** | **2** |
| After launch: force scale | **1.00** | **0.56** |
| After launch: effective mass/base mass | **1.00×** | **1.70×** |

These are **derived scalar invariants**, not an assertion that measured velocity/position outcomes differ by exactly these ratios. Collision geometry, time stepping, restitution and clamping must be held constant in the future physics fixture. If other Earth stacks/rooted status are present, use a separate fixture with an explicitly calculated reference, not this zero-stack oracle.

### 3.3 F02 golden cases (test design, all NOT_RUN)

**F02-G00 — minimal STOP state (priority **P0, first failing fixture**).** Fresh owner-0 Frostguard at (270,450), no Earth stacks, no rooted, no ongoing FIRE/ICE, shield0, velocity e.g. (80,-20) before STOP. Trigger the **real STOP** path once with recorded action ID. Expected V148: anchored true, \`earthAnchorStacks=0\`, velocity(0,0), shield10. Current R16: \`frostguardAnchored=true\`, **anchorStacks=3**, velocity(0,0), shield10. First failing assert is **stacks remain zero**, not just flag or shield. Do not call new C# mechanics until the pre-fix failure is preserved.

**F02-G01 — protected scalar-response oracle (P0).** Starting from G00, compare pure helper properties before a physics step: V148 \`earthForceScale=.30\`, \`earthMassMultiplier=2\`; R16 \`CollisionResolver.ForceScale=.34\`, \`Mass/baseMass=4.1\`. One controlled \`Impulse\` whose unclamped normalization produces power100 would produce computed pre-clamp delta power30 vs34; only the **helper-derived expectation** is specified here, not a measured velocity result. Separate managed helper tests from native step tests.

**F02-G02 — ball-ball mass/impulse controlled native case (P0).** Create equal base-mass opponent, no effects, fixed collision vector/normal, low enough speeds to avoid speed clipping or status damage. Assert the source-specific effective mass input (2× vs4.1×) and later actual restitution/impulse trace independently. Record before/after \`vx/vy/x/y\`, exact dt and frame. Do not compare raw world positions across different engines unless coordinates/steps are normalized.

**F02-G03 — post-impulse friction / damping (P1).** After STOP, apply a controlled sub-clamp kick and one physics step dt=1/60. Current R16 \`BallPhysics\` multiplies its normal friction factor by additional **.90** while stack=3; V148's plain-anchor path has no Earth stack-based extra .90. Assert the existence and application of the extra multiplier; calculate actual velocity only inside future harness from the real coefficients. Zero-velocity-only tests cannot detect this.

**F02-G04 — successful REPLAY/LAUNCH residual stacks (P0).** Set owner0 Frostguard inside own replay zone with valid turn, no bonus pending, no prior replay, and a valid \`Replay\` command. Expected V148 after \`prepareBallForAction\`: \`anchored=false\`, stacks0, force1.00, mass1.00×. Current R16 after \`TryCommand\`: \`frostguardAnchored=false\`, **stacks2**, force .56, mass1.70×. Assert both flag and stacks. Existing R16 tests only check the flag, causing false PASS on the residual physical effect.

**F02-G05 — shield cap / double STOP negative control.** One STOP: shield0→10; repeat eligible STOP:10→15; further STOP:15 stays15. Never grant extra shield from \`anchorStacks\`. Keep per-action event ordering, Echo eligibility and source ID. This verifies unchanged common behavior, not mass parity.

**F02-G06 — reactive counter-freeze and ally/TOUCH negatives.** STOP by itself does **not** create a freeze aura. Subsequent enemy qualifying **HIT** counter-freezes the attacker; enemy TOUCH below HIT threshold does not; allied HIT does not. Assert before/after ICE state and emitted event source; count exactly once per actual contact authorization. V148 checks \`anchored\`, R16 \`frostguardAnchored\`.

**F02-G07 — copy/reset and snapshot controls.** Identity-copy of Frostguard must not copy an active defensive anchor inappropriately. Serialize after STOP and after REPLAY separately; ensure \`anchorStacks\`, defensive flag, shield and state order round-trip through real supported host snapshot. Verify that a client cannot create/retain a phantom anchored status by submitting altered snapshot. This is a **future acceptance scenario**, not a claim that a network exploit currently exists.

**F02-G08 — preexisting Earth anchor / rooted negative controls.** Distinguish plain STOP from state that already carries Earth stacks or root: the G00/G01 exact numbers apply only with zero initial stacks and \`rooted=false\`. Test stack1 and stack2 input explicitly after HQ semantics ruling if simultaneous effects are reachable; do not indiscriminately zero legitimate Earth status for all other archetypes as a suggested repair.

### 3.4 F02 false-pass traps

- Testing only \`frostguardAnchored==true\`, \`shield==10\` or counter-ICE reproduces existing R16 tests and **misses** physics parity.
- Testing immediately after STOP with velocity0 and no external impulse cannot reveal mass/drag divergence.
- Clearing only \`frostguardAnchored\` on launch passes existing flag test but leaves two injected Earth stacks and changed physical response.
- Inferring a precise post-collision velocity ratio from mass 4.1 versus 2 without controlling all physics inputs is invalid.
- Calling C# \`CollisionResolver.Mass\` is a **managed helper/static acceptance**, not Unity native collision acceptance.
- Testing only an Earth archetype that legitimately accumulates stacks confounds the plain Frostguard baseline.
- Passing a snapshot JSON round trip does not establish host authority or physical-device networking.

### 3.5 F02 disposition

**Physics parity defect:** **SOURCE-CONFIRMED**.  
**First future pre-fix failing fixture:** **F02-G00** (injected stacks=3 instead of zero), then **F02-G01/G04**, with native collision/damping G02/G03.  
**Gameplay fix authorization:** NONE in W2.

## 4. Future **failing-fixture-first** execution and rollback plan

Recommended order once HQ authorizes the post-A70 coding wave:

1. Freeze exact A70 imported R16 source SHA, preserve the protected V148 reference SHA and source tree. Create one temporary test-only working branch/commit under the authorized future implementation task.
2. Add F02-G00, F02-G01 and F02-G04 **to managed C# tests without gameplay changes**. Run and archive the observed pre-fix **FAIL** including source commit, seed, assertion and trace. Do not label source-derived predictions as observed failures.
3. Add F01-G00 (must demonstrate 5 stages). **Do not** add an invalid V148-based two-hit fail. Add F01-G01 at the actual physics boundary. Observe whether current R16 fails against the **actual V148 >32** oracle; retain failing evidence if observed.
4. Add negative controls (friendly/blocked/overlap), RepairPulse and native-collision fixtures. Freeze harness geometry, velocities, dt and event/log schema.
5. HQ/A10 resolves whether to **preserve actual V148 5-hit runtime** or authorize a **new two-hit design change**. Absent permission, preserve V148's five-stage runtime. Do not conflate a future design change with parity restoration.
6. Only an explicitly authorized gameplay engineer implements narrow fixes. Each fix is reviewed with pre-fix red → post-fix green evidence, all historical R16 managed tests, native physics/player probes and serialization regressions. A50 does not edit production code in W2.
7. Roll back only the future **test or repair branch** if side effects occur, never modify the protected V148 original or overwrite R16 canonical ZIP. Preserve failing fixture, telemetry and rollback trace.
8. A60 independently verifies native and provenance results; HQ owns integration and any individual \`PARTIAL\`→\`UNITY_READY\` promotion. No automatic promotion on static/managed parity alone.

**Priority:** F02 STOP and post-launch persistent-stack physics **P0 acceptance**, then F01 contact threshold/cadence **P1 acceptance**; F01 two-hit intent needs a separate decision, not an automatic bug fix.

## 5. Executed evidence in **this W2 review** (no gameplay simulation)

A50 used a disposable, read-only extracted R16 source tree and original protected reference. The canonical ZIP and protected reference byte hashes were verified.

**Static source assertion script executed locally** against those exact files:
\`python3 /mnt/data/r17_w2_a50_oracle_static_check.py\`

Result:

\`\`\`text
19 / 19 static source assertions PASS
R16 ZIP SHA-256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4
Protected V148 SHA-256: bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e
SOURCE STATIC ONLY — no C# managed, Unity-native, gameplay simulation or device tests executed.
\`\`\`

Assertions covered V148 effective \`extra.hp\` five-hit constructor, ignored \`extra.hits\` value, all three callers, damage decrement, R16 five-hit constructor/damage, threshold and cooldown gates, V148 plain-anchor functions, R16 three-stack setup, force/mass formulas, extra drag, and replay residual-stack path.

The script is a **disposable review aid** outside repository ownership; it is **not** a committed runtime fixture and provides no Unity test result.

## 6. Acceptance truth table / exclusions

| Gate | R17-W2 evidence/status |
|---|---|
| Exact R16 ZIP hash | **SOURCE INTEGRITY PASS** |
| Exact V148 reference hash | **SOURCE INTEGRITY PASS** |
| W1 two-hit F01 claim | **CORRECTED**: not an actual V148 runtime invariant |
| V148 vs R16 initial construction HP | **SOURCE PARITY** at 5 |
| V148 vs R16 collision damage threshold/cadence | **SOURCE DIVERGENCE**; native impact NOT_RUN |
| F02 plain Frostguard stacks/mass/force | **SOURCE PARITY DEFECT** |
| F02 post-launch residual stacks | **SOURCE PARITY DEFECT** |
| F01 future native/collider fixtures | **TEST_DESIGNED, NOT_EXECUTED** |
| F02 future native/collider fixtures | **TEST_DESIGNED, NOT_EXECUTED** |
| \`UNITY_READY\` promotions | **0** |
| V148 gameplay/build/source modifications | **0** |
| Merge/deployment | **NONE** |

## 7. Five required statuses and HANDOFF → 00/HQ

**DESIGNED:** COMPLETE — two source-grounded golden-oracle families with explicit scenarios, expected traces, negative controls, false-pass traps, source anchors, priorities and test-first sequence.

**IMPLEMENTED:** Documentation/oracle only. **NO** production C#, Unity scene, \`.meta\` or gameplay changes. Future fixtures/fixes **NOT IMPLEMENTED**.

**TESTED:** **STATIC SCRIPT PASS 19/19**; exact R16/V148 SHA PASS. Managed C#/Unity physics/network/device acceptance **NOT RUN**. \`TEST_DESIGNED\` ≠ \`TEST_EXECUTED\`.

**INTEGRATED:** NO.

**RELEASED:** NO.

**Open questions/escalations:**
- **HQ/A10:** W1 F01 two-hit runtime claim contradicted by V148 constructor. Decide whether desired two-hit durability is a future change request; do **not** modify R16's matching initial HP from five to two under a parity pretext.
- **HQ/A60:** schedule actual F01 low-impact contact and F02 native-physics/red-fixture tests after source import.
- **A50 future acceptance:** do not sign off any of the affected \`PARTIAL\` abilities without real managed + native evidence; preserve existing W1 report as historical and record correction as this W2 addendum.
- Mitosis/Furnace are under **A10 W2 Issue #106**, not A50 W2 scope.

**HANDOFF TO:** 00/HQ; future implementation agent and A60 independent QA after HQ reconciliation.  
**FINAL STATUS:** **R17-W2 A50 ORACLE DESIGN COMPLETE — STATIC VERIFIED / RUNTIME NOT EXECUTED**.
