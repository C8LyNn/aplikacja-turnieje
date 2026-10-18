# CC-001 / R17-W3 / A10 — Mitosis wall-first executable oracle

**Date:** 2026-10-18  
**Issue:** [#121](https://github.com/C8LyNn/aplikacja-turnieje/issues/121)  
**Role:** A10 — Lead Game Design  
**Branch:** `feat/cc001-r17-w3-a10-mitosis-oracle`  
**Frozen A70 import base:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**Branch-start SHA:** `e9e235a69a04eb57727defd308918321836d7f02` (W3 dispatch commit, parent is exact frozen A70 base)  
**Imported Unity source root:** `unity/cc001-r16/CoreClash-V149-Unity/`  
**R16 source archive SHA-256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**Protected V148 SHA-256:** `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`  

**Mode:** V148 behavior/source reconciliation and future test oracle ONLY. No modifications to game, V148, catalogs, networking, WebGL/website, R16 import or prior W1/W2 documents. This W3 report is a precise addendum to [W2 A10 Mitosis/Furnace arbitration](../../w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md), **not** a replacement for [W1 lifecycle/RETURN](../../R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md).

## 1. Decision summary: FIRST TOUCH is not “first eligible ball TOUCH”

**Observed in executable protected V148:** a new wall TOUCH increases `motionTouchCount` and passes the Mitosis first-TOUCH event gate, but **does not directly execute `splitMitosis`**. The subsequent *weak* ball–ball TOUCH fails the `PIERWSZY TOUCH` condition and does not split. A sufficiently strong later ball–ball impact can still split by **a separate kinetic damage interception**, despite the rejected TOUCH gate. This must be treated as two separate pathways.

| Case / classification | Source-proven + observed behavior | R17 parity ruling |
|---|---|---|
| First weak ball–ball contact, no earlier TOUCH | TOUCH first-touch gate passes; one successful split, 15/15 + 15/15, same owner. **EXECUTED**. | Positive native fixture; no minimum strong-HIT gate. |
| First strong ball–ball contact, no earlier TOUCH | Gate passes; split occurs; subsequent impact damage can reduce parent HP after the initial 15/15 split. **EXECUTED**. | Assert split event/child/ordering, **not** “15 final HP” after an entire strong collision. |
| Earlier wall TOUCH, then weak ball–ball | Wall consumes first-touch counter; later TOUCH fails `CONDITIONS`; **no split**. **EXECUTED**. | Required negative parity fixture. R16 unconditional pair-contact split should be investigated as a mismatch, not accepted as “equivalent”. |
| Earlier wall TOUCH, then strong ball–ball | Pair TOUCH fails `CONDITIONS`; later `damageBall(...,{kind:'impact'})` interception splits before HP damage and returns 0 for that Mitosis damage packet. **EXECUTED**. | Separate positive kinetic-path fixture; this is **not** splitting on the wall surface. |
| Friendly ball–ball | Same direct first-TOUCH split even when contacting ball shares owner. **EXECUTED**. | Preserve no enemy-only gate. |
| Failed generated spawn | No split flag or 15-HP rewrite if placement fails. **EXECUTED with synthetic spatial saturation**, not a legal-match whole-physics scenario. | Model negative/fault-injection fixture; later native legal-no-space fixture is still required. |

**Binding recommendation:** preserve the actual V148 dual-path distinction pending HQ authority. Do **not** implement “Mitosis always splits on first ball contact”, “Mitosis splits whenever any solid surface is touched”, or “only strong HIT splits”. Each would change at least one observed case. No owner approval exists for all-surface activation or for resetting first-touch semantics; any such change is an **EXPLICIT_CHANGE_REQUEST**.

## 2. Protected source anchor ledger

Source file (present byte-exact in A70 imported Git subtree): `unity/cc001-r16/Reference/V148_reference_original.html`. Line numbers are relative to that exact **34,825-line** HTML.

| Anchor | Executable relevance |
|---|---|
| **L8227–8235** | Legacy card text “pierwsze fizyczne uderzenie” and card nominal 30 HP: **SPEC_TRUE only**. |
| **L10703–10711** | Effective Mitosis primary trigger `TOUCH`; condition `PIERWSZY TOUCH`. |
| **L12159–12164** | Legacy `HIT` migration explicitly `UNRESOLVED/LEGACY_CONTACT_COMPAT`, runtime event `TOUCH`; do not infer a strong-hit-only rule. |
| **L12749–12752** | `evaluateCondition('PIERWSZY TOUCH')` tests `ctx.firstTouch`; it does **not** test first *ability-success* or first *ball-contact*. |
| **L12875–12915** | `dispatchTriggerEvent` evaluates the pipeline; failed conditions return null and log reason `CONDITIONS`. |
| **L12325–12342** | `v147ContactProcAllowed` requires actual passed TOUCH/HIT event for declared triggers; a contact log by itself is insufficient. |
| **L27115–27135** | Distinct per-ball/pair/surface contact episode keys; retention frames = source-configured policy. |
| **L27151–27169** | `v147DispatchSurfaceContact`: dispatches event with `firstTouch=(ball.motionTouchCount||0)===0`, then increments `motionTouchCount` for all fresh surface TOUCH episodes; no `splitMitosis` call here. |
| **L30066–30081** | Arena sides `left/right` classified `wall`, `top/bottom` as `base`, both call surface dispatcher; base HP contact handled separately. |
| **L27172–27228** | Real ball–ball `collide`: new contact episode; first-touch computed from **same counter** at L27196–27197, event gate, counter increment, `v147ContactProcAllowed`, and pair `splitMitosis` call only when allowed. |
| **L21818, L21839–21859** | `IMPACT_DAMAGE_KINDS` includes `impact`, `ram`, `ram-recoil`, `structureImpact`, `thornback`, `reflect`; unsplit Mitosis intercepts positive kinetic `damageBall`, calls `splitMitosis`, returns zero (even if spawn fails). |
| **L23254–23275** | `splitMitosis`: validation, `spawnGeneratedAt` first, return false on no child, only then parent+child split flags and 15/15 HP, inherit owner, success feedback. |
| **L23176–23199 / L22694–22721** | Safe placement search; fail means no child. |
| **L19714–19739, L19851–19861** | Spawn initializes counter/owner; nominal catalog 30 HP may become observed 35 HP after the Earth archetype spawn modifier (+5). Do **not** retune HP in A10. |
| **R16:** `Assets/CoreClash/Core/EvolutionEffects.cs` L51–88 | `EvolutionPairContact` currently splits on pair if unjammed; no first-TOUCH state check shown; subsequent generated child 15/15. This is source-based R16 risk, **not** an executed Unity finding. |
| **R16:** `Assets/CoreClash/Physics/CollisionResolver.cs` L15–25 | Native collision calls pair-contact path. Exact V148 first-touch/kinetic interception is not established by this alone. |

The wall surface *passing an event gate* is not a successful gameplay split. **Event accepted** ≠ **ability body executed** ≠ **child actually spawned**.

## 3. Genuine executed V148 probes — reproducibility and limitations

### 3.1 Environment and technique

Executed locally with `Python Playwright` + headless `/usr/bin/chromium`. Exact R16 archive read using Python `zipfile`; SHA-256 of archive and embedded `Reference/V148_reference_original.html` computed and matched the canonical values. The V148 source file was never edited. An **in-memory transient HTML string** exposed existing closure-local `spawn`, `collide`, `damageBall`, `v147DispatchSurfaceContact`, `state`, collision/pipeline logs and a physics frame setter just before the closing script IIFE. The original `requestAnimationFrame(loop)` kickoff was omitted from this transient instrumented page, so normal ongoing match motion and UI updates were **not** running. A temporary wrapper around `damageBall` recorded actual `opts.kind` and pre/post split state while forwarding to the original function.

Each case used a new Chromium page/JS environment, an empty initial `state.balls`, `state.phase='battle'`, `nextId=1`, `keywordPhysicsFrame=100`, no jam, no phase/spawn grace, source `spawn('player','mitosis',300,300,velocity,0)` and partner `spawn(owner,'normal',331,300,-velocity,0)`. Contact is created by the *real* `collide(a,b)` function at overlap of the two real spawned balls. Weak case velocity = 0, 0 (impact 0); strong case source +60 x, partner -60 x (relative closing speed **120**, native strong threshold **90**). For wall-first cases first call `v147DispatchSurfaceContact(a,'arena:left','wall',45,{...})`, representing one fresh weak wall event without running arena boundary resolution; this increments actual contact telemetry. Synthetic block cases inserted one extra very large collision-blocking ball (radius 10,000 at source position), creating an intentionally impossible placement state; **not evidence of a legal game board**.

The probe tests actual source JS functions with controlled inputs; it is **not** a recorded real-player game, full-frame physics continuation, Unity simulation or device/crossplay test. No test injected new gameplay logic or patched the original on-disk HTML. After execution source SHA-256 was checked again: **MATCH**.

### 3.2 Observed trace table

| ID | Setup | First-TOUCH event trace on Mitosis | Post-collision parent HP / split / generated child | Actual result |
|---|---|---|---|---|
| **D-WEAK-ENEMY** | First pair weak, enemy | pair **PASS** | 15 HP / true / one child player-owned at 15/15 | **EXECUTED PASS** |
| **D-STRONG-ENEMY** | First pair strong, enemy, impact 120 | pair **PASS** | **13 HP** / true / one child player-owned at 15/15; later `impact` packet -2 on parent | **EXECUTED PASS** |
| **D-WEAK-ALLY** | First pair weak, friendly | pair **PASS** | 15 HP / true / one child player-owned at 15/15 | **EXECUTED PASS** |
| **W-WEAK-ENEMY** | Wall TOUCH first, pair weak, enemy | wall **PASS**, pair **REJECT CONDITIONS** | **35 HP** / false / no child | **EXECUTED PASS** |
| **W-STRONG-ENEMY** | Wall TOUCH first, pair strong impact 120 | wall **PASS**, pair **REJECT CONDITIONS** | **15 HP** / true / one player child at 15/15; kinetic `impact` interception performs split and absorbs that hit | **EXECUTED PASS** |
| **W-WEAK-ALLY** | Wall TOUCH first, pair weak, friendly | wall **PASS**, pair **REJECT CONDITIONS** | 35 HP / false / no child | **EXECUTED PASS** |
| **D-WEAK-BLOCKED** | First pair weak, synthetic no-space blocker | pair **PASS** | 35 HP / false / no child; no exception | **EXECUTED PASS, synthetic spatial precondition only** |
| **W-WEAK-BLOCKED** | Wall TOUCH first, pair weak, synthetic blocker | wall **PASS**, pair **REJECT CONDITIONS** | 35 HP / false / no child; no exception | **EXECUTED PASS, synthetic spatial precondition only** |

Detailed kinetic instrumentation in strong cases:
- **D-STRONG-ENEMY:** first pair split, then `damageBall(source,2,{kind:'impact'})` moved parent from 15 to 13 HP. A second impact packet damaged partner from 30 to 28.
- **W-STRONG-ENEMY:** first pair TOUCH failed. Then `damageBall(source,2,{kind:'impact'})` observed source transition from 35 HP unsplit to **15 HP split**, with source damage handled by the Mitosis interception (zero original packet damage); partner took its separate impact packet.
- No browser script errors or exceptions in the eight cases. Each observed record was programmatically compared to a pinned expected outcome; **8/8 scenario assertions PASS** plus kinetic-kind and source-integrity assertions PASS.

**Important:** a final parent HP below 15 in a strong direct collision does not automatically mean the 15+15 split was incorrect; evaluate the event timeline, not just the last HP number.

### 3.3 Minimal reproducible probe pseudocode (memory-only instrumentation)

```text
read ZIP entry Reference/V148_reference_original.html byte-for-byte
assert sha256 == bbc48f84...4623e
in Chromium, replace ONLY in-memory HTML script tail:
  expose existing closure functions state,spawn,collide,damageBall,
    v147DispatchSurfaceContact,keywordPhysicsFrame and pipeline logs
  do not start requestAnimationFrame(loop)

for each fresh page:
  state.phase='battle'; state.balls=[]; state.nextId=1
  keywordPhysicsFrame=100
  a=spawn('player','mitosis',300,300, STRONG?60:0, 0)
  b=spawn(OWNER,'normal',331,300, STRONG?-60:0, 0)
  a.spawnGrace=b.spawnGrace=0; a.phaseTimer=b.phaseTimer=0
  if WALL_FIRST:
    v147DispatchSurfaceContact(a,'arena:left','wall',45,
      {preVx:-45,preVy:0,target:{id:'wall:left',kind:'wall',type:'wall',owner:null}})
  if SYNTHETIC_NO_SPACE:
    state.balls.push({id:999999,type:'normal',owner:'cpu',
      dead:false,isMirageGhost:false,x:300,y:300,r:10000,hp:20})
  collide(a,b)
  capture: motionTouchCount, motionHitCount, FIRST TOUCH gate trace,
    kinetic damage kind, split flag, parent HP, child count/owner/HP
assert 8 exact observed scenario outcomes
assert on-disk protected V148 SHA unchanged
```

This deliberately invokes the engine's actual contact dispatch and `collide` method but does **not** replay a physically simulated ball travelling to the wall. A later full-physics browser/Unity test must prove that the corresponding natural collision episode is reachable with standard motion and expected arena geometry.

## 4. Future A50/A40 controlled acceptance matrix (**DESIGNED, NOT_RUN IN UNITY**)

| Fixture | Deterministic setup / action | Expected V148 oracle | Priority |
|---|---|---|---|
| **A10-MW01** | Unjammed first weak 0-impact enemy pair, spawn legal | Pair TOUCH allowed; exactly 1 child; two 15/15 split balls with same owner | P0 |
| **A10-MW02** | Unjammed first strong enemy pair at impact 120 | Split once; no duplicate from TOUCH+HIT; test event before later `impact` damage | P0 |
| **A10-MW03** | Same first weak contact but allied partner | Identical split; no enemy-only filter; child owner from Mitosis | P0 |
| **A10-MW04** | Single fresh left-wall TOUCH (impact 45) followed by *weak* enemy pair on next episode | Wall count 1, pair count 2; pair firstTouch=false; no split; no child | **P0 – missing R16 parity path** |
| **A10-MW05** | Same wall-first sequence, then strong pair (impact 120) | Pair TOUCH fails `CONDITIONS`; later kinetic `impact` packet causes split and absorbs original impact damage | **P0 – second path** |
| **A10-MW06** | Single base surface TOUCH before weak pair | Equivalent first-touch counter consumption, but **actual natural base collision not executed in W3**; verify targetKind/ownership and base HP independently | P1 |
| **A10-MW07** | Weak pair attempted under legal map spatial saturation, generation impossible | No child, no split flag, no HP rewrite; synthetic blocked probe already passed, natural legal no-space still NOT_RUN | P1 |
| **A10-MW08** | Failed generated placement followed by release of space and another distinct weak pair episode | Determine whether global firstTouch gate remains spent; source implies no automatic retry. **NOT_RUN; do not assume automatic retry** | P1 |
| **A10-MW09** | Explicit positive kinetic `damageBall` kinds (`impact`, `ram`, `reflect`) with no previous split; negative non-kinetic kind | Kinetic intercept attempts one split; non-kinetic does not. Verify natural reachability of individual kinds separately | P1 |
| **A10-MW10** | Duplicate pair contact same physical episode / repeated frame, and a jammed Mitosis | Dedupe; no double birth. Jam and later unjam qualification require timeline traces | P1 |
| **A10-MW11** | Source and target roles swapped by velocities/IDs; friendly/enemy permutations | Mitosis can be SOURCE or TARGET if declared role permits; child always Mitosis owner's | P1 |
| **A10-MW12** | Positive split snapshot/replay/network round-trip | Stable parent/child identity, owner, 15/15 and split flag; no repeated generation on load | P2 |

A50 should write failing tests against the **imported R16** first, then compare the two paths (pair gated by global firstTouch; separate kinetic interception) before A40/HQ considers a gameplay fix. R16 `EvolutionPairContact` currently lacks protected V148's first-contact gating in its inspected source; however **no R17 native failing test** has been executed here. Network ownership/state tests remain with the proper other agent.

### Source/target/ownership boundaries

- Normal pair: source and contacted target are real living physical balls, not ghosts, banished or in spawn grace; owner equality **does not** prevent split; event role (SOURCE/TARGET) and effective spec still matter.
- Wall/base: surface target is an object with `targetKind='wall'|'base'`, not a ball; its successful TOUCH event **does not** call `splitMitosis` on the surface path. It can spend the first-touch gate.
- Kinetic `damageBall`: damage **recipient** Mitosis is the split subject; `opts.kind` must be in `IMPACT_DAMAGE_KINDS` and amount >0. This path does not pretend that the wall's `TOUCH` spawned a child.
- Spawned child inherits original owner's side through `spawnGeneratedAt(parent,...)`; generation is not a stock purchase. Parent and child receive `mitosisSplit=true`. Actual failure leaves original unsplit.
- The existence of a successful TOUCH event is neither sufficient to prove a successful child spawn nor evidence that the contact is the first eligible **ball** TOUCH.

## 5. Conflicts and authority boundary

**Confirmed V148 behavior conflict with oversimplified W2 reading:** “first eligible contact with a ball always splits” is too broad when a wall TOUCH happened first; actual global `motionTouchCount` gating prevents a later weak pair. W2 supplemental issue comment already called out this hazard; W3 has now reproduced it with real V148 JS execution. This report **narrows** the default oracle without editing the W2 decision.

**OPEN to owner/HQ:** whether a future intentional design change should reset/track “first *eligible ball* TOUCH”, extend activation to non-ball surfaces, or change cap-failed retry behavior. Each change would depart from an observed source/runtime path and requires an explicit separate authorized gameplay contract.

**No new W3 gameplay implementation is permitted to A10.** A40 lifecycle/RETURN W1 implementation stays on its separate HQ gate; Phoenix, Revenant, Soul Anchor, Dirge and Den Mother contracts are untouched. Furnace belongs to W2 copy/zone follow-up, not this W3 task.

## 6. Actual evidence / five status gates / HANDOFF

**Actual tests executed in this A10 W3 task:**
- Python SHA-256 check of exact R16 ZIP — **PASS**, canonical hash.
- SHA-256 check of V148 reference extracted from ZIP before and after Chromium probes — **PASS**, canonical hash.
- Chromium (Playwright Python) real V148 JavaScript controlled probes: **8/8 PASS** after fixed expected-outcome assertions; no browser script errors, with independent output traces for TOUCH `CONDITIONS` and `damageBall kind='impact'`.
- Read-only GitHub source and branch/base inspection; W3 branch parent verified as frozen A70 source-import commit.

**NOT RUN:** real full-frame original HTML match playback with natural wall trajectory; Unity editor/managed C# tests/build; simulated/physical mobile/tablet; live multiplayer, WAN, snapshot round trip; future A50/A40 fixtures A10-MW01 through A10-MW12. The eight JavaScript checks are **browser-source behavior probes**, not completed Unity acceptance.

**DESIGNED:** YES — decision-quality dual-path oracle and 12 future fixtures.  
**IMPLEMENTED:** NO — no gameplay code, documentation/report only.  
**TESTED:** YES FOR ISOLATED PROTECTED V148 JS PROBE (8/8); NO FOR R17 UNITY/NATIVE ACCEPTANCE.  
**INTEGRATED:** NO.  
**RELEASED:** NO.

**HANDOFF → 00/HQ, A50, A60, A40 (future):** adopt A10-MW04 and A10-MW05 as mandatory separate source-parity checks. Do not approve a generic “ball contact always splits” fix or reinterpret logged wall TOUCH as a spawned-child event. A50 must preserve observed wall-first weak failure and strong kinetic bypass in its failing-fixture-first follow-up; A60 independently certifies runtime after HQ-approved integration. No merge, force-push or public deployment was performed.
