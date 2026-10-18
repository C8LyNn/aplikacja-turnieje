# CC-001 — R17-W2 / A10 — Mitosis & Furnace Semantic Decisions

**PROJECT:** CC-001 — Core Clash Unity  
**WAVE:** R17-W2 — parallel pre-import  
**AGENT:** A10 — Lead Game Design  
**ISSUE:** [#106](https://github.com/C8LyNn/aplikacja-turnieje/issues/106)  
**MODE:** SOURCE-TRUTH SEMANTIC ARBITRATION; **NO GAMEPLAY IMPLEMENTATION**  
**CANONICAL R16 ARCHIVE SHA-256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**PROTECTED V148 SHA-256:** `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e`  
**R16 REGISTRY:** 42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY / 0 NOT_PORTED — **UNCHANGED**  
**RELATION TO R17-W1:** independent addendum; **does not supersede/reopen** [A10 lifecycle + RETURN contract](../R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md).

## 1. Evidence rules and labels

This is a **static source review**, not a new Unity/runtime certification.

- **SPEC_TRUE** = a *written* contract/metadatum explicitly supports a claim. A legacy descriptive claim is not by itself an approved change to executable gameplay.
- **RUNTIME_TRUE** = the protected V148 executable path makes the outcome possible under documented conditions (or, when expressly labelled R16, a current Unity source path does). Static source truth is not proof that a native test ran.
- **UNKNOWN** = missing causal evidence or unresolved design-authority distinction; must not be filled in by inference.
- **EXPLICIT_CHANGE_REQUEST** = behavior not established by protected executable V148; requires separate owner/HQ decision, not a silent R17 patch.
- **TEST_DESIGNED** is not **TEST_EXECUTED**. Existing R16 managed QA remains historical R16 evidence.

Source paths below are **inside the exact R16 ZIP**. V148 anchors refer to line numbers in the ZIP's `Reference/V148_reference_original.html` (34,825 lines), never to a mutable website build.

## 2. Two-item binding decision table

| Item | Written / card claim | Protected V148 executable truth | Current R16 truth | A10 R17-W2 ruling | Owner approval / OPEN |
|---|---|---|---|---|---|
| **Mitosis** | Legacy card: `HIT · PIERWSZY`, “pierwsze fizyczne uderzenie rozdziela ją…”; ability spec/migration marks `TOUCH`, `UNRESOLVED / LEGACY_CONTACT_COMPAT`. Broad “physical impact” prose can suggest surfaces other than a ball. | First valid **ball–ball contact episode** can split on **weak TOUCH or strong HIT**, independent of whether the other ball is allied or enemy; 15 HP + 15 HP; no repeat. A **separate** `damageBall` kinetic-kind interception can also split on configured `IMPACT_DAMAGE_KINDS` even without the normal pair-contact split path. Generic wall/base/structure/trap/geometry **TOUCH/HIT dispatch is not itself a Mitosis split handler**. | R16 `EvolutionPairContact` splits on qualified ball–ball contact (weak works). `EvolutionContact` supports direct ball-ability contact calls; ordinary `OnWall` does not split. No verified native matrix for non-ball physical surfaces or independent V148 kinetic-kind interception. | **KEEP PRESENT-TENSE EXECUTABLE SCOPE.** Treat physical ball–ball contact as the required normal split trigger; do not turn every surface TOUCH into Mitosis. Preserve/verify the separate V148 kinetic-damage interception as an explicit parity question, not a new surface rule. No rebalance. | **OPEN S01:** any extension to wall/base/structure/trap collision split is an **EXPLICIT_CHANGE_REQUEST**. **OPEN P01:** A50/A31 must trace kinetic-kind interception parity and validate native negative/positive cases before promotion. |
| **Furnace** | Card says TURN aura does **“5 ogniste dmg wrogom i podpala ich.”** That can read as an immediate independent `-5 HP` **plus** FIRE. | Owner-turn `TURN` creates/refreshes one owner/source-bound `elementZone:fire`, radius 104, with 3 TURN-END evaluations. Each eligible enemy receives canonical `applyFireStatus` at TURN END. The field itself **does not call a separate immediate damage operation**. FIRE may deal damage later through ordinary burning or at its normal stack payoff. ICE/FIRE cancellation applies. | One `furnaceFire` zone per source+owner, radius 104 / 3 ticks; R16 `PeriodicZones` applies FIRE only at TURN END; existing managed source tests cover refresh, application, ICE cancel and snapshot, but not full native acceptance. | **MECHANICS UNCHANGED.** Classify “+5 direct damage plus burn” reading as inaccurate **copy debt**, not justification for new direct damage. Proposed wording below must distinguish FIRE application from later FIRE-derived damage. | **OPEN C01:** Owner/HQ approval for card/tooltip wording correction and UI placement. An additional immediate 5-damage callback would be an **EXPLICIT_CHANGE_REQUEST** requiring new gameplay approval, not a text fix. |

### Important numerical provenance distinction

Protected V148 Mitosis card/type shows **30 HP**, while current R16 imported catalog uses **35 HP** and its existing R12 test expects 35 HP before a failed split. Both describe a successful split as **15 + 15 HP**. Furnace similarly has historical V148 30 HP vs imported R16 35 HP.

These are source-era data differences; **A10 does not judge them a new R17 defect or authorize changing them**. The request forbids balance edits. If HQ needs catalog provenance reconciliation, issue it separately rather than coupling it to S01/C01.

## 3. Mitosis — surface-by-surface arbitration

**Source anchors**: V148 lines **8227–8235** (card), **10703** (TOUCH), **12159–12164** (unresolved compatibility), **21818, 21839–21859** (kinetic-type damage interception), **23254–23274** (split), **27151–27168** (surface dispatcher), **27202–27227** (pair contact), **25384–25392** (structure contact), **29712–29720** (physical trap contact), **30068–30080** (arena/base contact). R16: `Assets/CoreClash/Core/EvolutionEffects.cs:51–88`; `Assets/CoreClash/Core/AbilityResolver.cs:21–27`; `Assets/CoreClash/Physics/CollisionResolver.cs:15–25`; `Tests/EvolutionTests.cs:65–94`.

| Collider / cause | What is source-supported? | Source classification | R17 SHOULD split on this? | Restriction |
|---|---|---|---|---|
| **Ball↔ball weak first TOUCH**, friend or enemy | Pair episode sends TOUCH. V148 calls `splitMitosis` on eligible side, without owner filter; R16 weak-contact managed fixture exists. | **SPEC_TRUE + RUNTIME_TRUE** | **YES**, preserve and test in native physics | One valid first contact; respect Jam/event gate, living cap, safe spawn. |
| **Ball↔ball strong HIT** | A strong first contact also has TOUCH; normal split does **not require** passing the HIT threshold. | **RUNTIME_TRUE** | **YES**, but do not make strength a new condition | No second split from the subsequent HIT of the same episode. |
| **Arena side wall / rounded corner** | V148 emits surface TOUCH/HIT, **not** a surface-specific Mitosis split effect. No direct V148 split call is present in the wall branch; R16 `OnWall` handles Warp only. | Surface event **RUNTIME_TRUE**; split on that event **NOT ESTABLISHED / negative source path** | **NO by default** | Extending Mitosis to wall hits = **EXPLICIT_CHANGE_REQUEST**. Do not confuse contact telemetry with ability effect. |
| **Top/bottom base edge** | V148 emits `targetKind:base` TOUCH/HIT and separately applies base-edge pressure; no direct Mitosis split in the base branch. | Surface event **RUNTIME_TRUE**; base-contact split **NOT ESTABLISHED** | **NO by default** | Base HP pressure remains independent; extension requires approval. |
| **Constructed wall / turret / bumper / other structure** | V148 emits structure-contact episodes. The generic structure branch damages structures/rebounds; no corresponding direct Mitosis split invocation. | Surface event **RUNTIME_TRUE**; structure-contact split **NOT ESTABLISHED** | **NO by default** | A **separate** kinetic-kind damage callback, where legitimately produced, must be distinguished from merely touching structure. |
| **Map obstacle / physical geometry** | Geometry collision dispatch exists; no generic Mitosis action is attached to the geometry event. | Event **RUNTIME_TRUE**; split **NOT ESTABLISHED** | **NO by default** | No silent “all physical objects” feature. |
| **Physical trap overlap** | V148 trap contact dispatch exists (including synthetic contact logging test). It is not a split handler. Trap effects and direct kinetic-damage routes must be checked separately. | Event **RUNTIME_TRUE**; automatic split **NOT ESTABLISHED** | **NO by default** | Whether a specific trap creates a qualifying kinetic-damage packet is **UNKNOWN** until traced. |
| **Non-collider status zone / aura** | Periodic zone membership/effects are not collision episodes. | Generic “physical hit” claim **NOT APPLICABLE** | **NO** | Status application ≠ TOUCH of a solid object; no split from mere ZONE enter/tick. |
| **`damageBall` with configured kinetic-like `opts.kind`** | V148 `IMPACT_DAMAGE_KINDS` includes `impact`, `ram`, `ram-recoil`, `structureImpact`, `thornback`, `reflect`; `damageBall` attempts `splitMitosis` before HP damage and returns zero. | **RUNTIME_TRUE** for handler; natural availability of each cause **UNKNOWN until traced** | **PRESERVE AS PARITY CANDIDATE**, not surface expansion | A50 must distinguish source-kind/effect packet from collider TOUCH; R16 `GameSimulation.Damage` does not expose an equivalent generic Mitosis interception in the inspected source. |

**A10 binding choice for R17:** do not add wall/base/structure/geometry/trap-surface activation. This is the smallest present-tense V148-faithful rule and allows A50 to define stable positive and negative oracles. The broader card phrase remains a **legacy communication ambiguity**, not an implicit permission to redesign the trigger system.

**OPEN S01 (owner):** If desired design intent is truly “split on first physical collision with *any* solid object,” approve a separately scoped change request specifying exact collision classes, self/friendly boundaries, minimum contact, anti-spam and ordering. This document does **not** grant it.

**OPEN P01 (A50/A31):** The V148 `damageBall` interception is a genuine second path; trace whether concrete `reflect`/`thornback`/other kinds are reachable for Mitosis, then decide parity fixture coverage. Do not relabel this as “wall-touch split.”

### Mitosis outcome, ordering, ownership, state

- **SOURCE** = live non-ghost Mitosis identity; **TARGET** = contacting physical ball on normal path. Owner of the child remains the original source owner's side.
- **EVENT** = first qualifying canonical TOUCH episode for ball–ball path; strong HIT may accompany but must not be counted as an additional split.
- **SUCCESS** = safe generated child; parent and child become `mitosisSplit=true`, both current/max HP **15**, child generated, inherits owner, no stock is consumed.
- **ONE-TIME** = both divided instances cannot divide again merely because they touch again. Transform/copy state behavior is delegated to existing identity-reset contracts; no new inheritance rule.
- **ORDER** = applicable R16 `EvolutionPairContact` precedes identity theft/transform; Mine lethality can precede split per `EvolutionEffects.cs:51–53`. Don't reorder merely for test convenience.
- **JAM** = blocks applicable contact activation and is handled by the existing effect-gate semantics.
- **FAILED CAP/PLACEMENT** = no child, original remains intact with pre-split HP/state, eligible subsequent contact may retry. This is a failed outcome, not a successful spent split.
- **STATUS / PHASE / BANISH / DEAD** = honor current collision admission; a geometrical overlap without a legal contact episode is not activation.
- **REPLAY / STOCK** = no bonus Replay or consumed stock just from generating child; no claim of free hand return or RETURN event.
- **NETWORK / SAVE** = `mitosisSplit`, parent and child identities, ownership, generated bit, HP, state snapshot and event sequence must round-trip without additional split or duplicate birth.
- **FEEDBACK** = after successful split only: **“MITOSIS 15 + 15”**; on ordinary wall/base/structure TOUCH show no MITOSIS activation. Failed split must not show success. Jam may use established Jam feedback, not a false split cue.

## 4. Furnace — binding design semantics and proposed copy

**Source anchors**: V148 **8877–8884** (legacy card); **21205, 21220–21229** (zone radius / one per source / three tick state); **28034–28044, 28099–28101** (owner TURN); **19618–19642** (TURN-END zones, enemy filter/dedup, status application, tick decrement); **26699–26717** (normal FIRE application and ICE cancellation); **28048–28053** (FIRE damage on target's owner-turn). R16 `Assets/CoreClash/Core/ElementalEffects.cs:57–90`, `Assets/CoreClash/Core/StatusEffects.cs:91–105`, `Tests/ElementalTests.cs:62–80,106–115`.

### Executable sequence

1. **TRIGGER**: Furnace's own `TURN` (owner-turn condition) activates through normal ability gating (JAM/event eligibility still applies).
2. **SOURCE/OWNERSHIP**: one live Furnace source; zone is keyed by **source instance + owner + fire element**, not a universal map aura shared across unrelated sources.
3. **CREATE/REFRESH**: create or reposition/refresh an existing source zone instead of stacking duplicate zones; center tracks Furnace position at activation/refresh.
4. **DURATION**: current V148 zone payload has three periodic TURN-END evaluations; no consumption of duration in physics frames. R16's current zone has `turns=3`.
5. **TARGET**: living non-ghost **enemy** balls inside radius with the engine's collision-radius contribution; allies are excluded from status application.
6. **EFFECT**: one canonical FIRE application attempt per eligible source/target/turn-end. If ICE is present, first FIRE application **clears ICE** without automatically adding FIRE. Existing FIRE stacks may eventually trigger ordinary FIRE-stack burst; later burning damage follows the separate owner-turn status system.
7. **NO INDEPENDENT DIRECT DAMAGE**: TURN-END zone processor does **not** call `damageBall(...5...)` or `sim.Damage(...5...)` merely because the target is inside the Furnace field.
8. **PERSISTENCE / SNAPSHOT**: zone sourceId, owner, center, turns, createdTurn and dedup/turn lifecycle are authoritative state. R16 has a managed snapshot fixture, not native cross-device acceptance proof.
9. **DEATH / JAM**: no new behavior invented. Existing zone lifecycle after source death must follow the zone's current tick/cleanup implementation, not a new “cancel all fields on death” rule. Jam cannot be treated as damage immunity.

### Copy correction — **PROPOSAL, NOT APPLIED**

**Current potentially misleading text:**
> TURN: SHORT aura pieca zadaje 5 ogniste dmg wrogom i podpala ich

**Proposed player-facing description (Polish):**
> **TURN (własna tura):** Tworzy lub odnawia strefę ognia. Na końcu tury strefa nakłada **FIRE** na wrogie kulki w zasięgu. Ogień zadaje obrażenia zgodnie z normalnymi zasadami statusu FIRE.

**Compact tooltip:**
> **Strefa ognia:** wrogowie otrzymują FIRE na końcu tury (bez osobnych natychmiastowych obrażeń od strefy).

**Feedback vocabulary**
- activation: `STREFA OGNIA` / zone created or refreshed;
- valid status application: `FIRE +1` or canonical stack feedback;
- ICE-first case: `ICE USUNIĘTY` / elemental cancellation, **not** `-5 HP`;
- future owner-turn burn damage: ordinary `BURN -[actual damage]` damage feedback sourced to FIRE, **not** “Furnace direct hit.”

Any exact value displayed must be derived from actual resolved gameplay result, not hardcoded “5 direct damage.”

**A10 verdict:** copy/tooltip debt only; **no new damage**. Owner/HQ approval is required before changing catalog descriptions or presentation assets. The numeric `5` cannot be silently reinterpreted as immediate direct damage. A future gameplay change to add independent damage requires a new explicitly authorized gameplay contract and fairness review.

## 5. Acceptance conditions — **12 specified fixtures / 0 executed**

| ID | Setup / event | Required expectation | Evidence class |
|---|---|---|---|
| **W2-A10-M01** | First weak legal ball–ball TOUCH (test both friendly and enemy), Mitosis unjammed, capacity available | One child generated; parent+child 15/15, both split; same owner; exactly one MITOSIS success cue; no second activation from same episode. | **TEST_DESIGNED**; supported by V148 pair path and R16 R12 source fixture |
| **W2-A10-M02** | First strong ball–ball HIT, then sustained overlap/second distinct contact | First episode splits once; HIT is not a second activation; neither split unit divides again. | **TEST_DESIGNED** |
| **W2-A10-M03** | Jammed Mitosis first contact, then next legal unjammed contact | Jam blocks first split; later legal contact splits if still intact. | **TEST_DESIGNED** |
| **W2-A10-M04** | 256-live-ball cap or blocked safe placement, first legal pair touch, then release capacity and new legal touch | Failed generation does not set `mitosisSplit`, change parent HP or show “15+15”; subsequent legal contact can succeed. | **TEST_DESIGNED** |
| **W2-A10-M05** | Weak and strong contacts with ordinary arena side wall, rounded corner, then owner/enemy base edge, no pair contact | Surface TOUCH/HIT may be recorded; **no MITOSIS split from surface contact**. Base-edge HP rule remains independent. | **TEST_DESIGNED** / negative |
| **W2-A10-M06** | Contact generated wall/turret/bumper then static map geometry, no pair contact or qualifying kinetic-kind damage injection | Structure/geometry contact does **not** directly activate split. Test event vs ability-effect distinction. | **TEST_DESIGNED** / negative |
| **W2-A10-M07** | Touch/overlap physical trap and separately enter non-solid element/status zone, no pair contact/qualifying kinetic kind | Trap surface event alone and zone membership alone **do not** split; trap/status effects resolve normally. | **TEST_DESIGNED** / negative |
| **W2-A10-M08** | Inject a legal V148 kinetic-kind `damageBall` event (e.g. `impact` or a traced `reflect` cause), compare R16 source path; also cross-check pair ordering with Mimic | V148 interception can split before HP damage; no synthetic surface-trigger claim. Record R16 mismatch or non-reachability separately. In pair test split precedes identity theft when gates allow. | **TEST_DESIGNED** / parity investigation **OPEN P01** |
| **W2-A10-F01** | Furnace owner-turn callback; same source repeated in same owner turn; subsequent own turn from a different position | Exactly one source/owner zone; radius 104; three-turn-end tick budget refreshes and zone center updates; no duplicates. | **TEST_DESIGNED**; R16 managed fixture exists |
| **W2-A10-F02** | One enemy, one ally and one out-of-range enemy at field turn end | Only in-range valid enemy receives FIRE; ally/outside untouched; status effect occurs at TURN END, not creation or physics frame. | **TEST_DESIGNED** |
| **W2-A10-F03** | In-range enemy initially has ICE; separately a clean target; check HP before tick, after tick and on subsequent burn owner turn | FIRE application **clears ICE first**; a clean target gains FIRE but not independent immediate `-5` by zone. Later ordinary FIRE damage/burst may occur through canonical status machinery. | **TEST_DESIGNED** / presentation parity |
| **W2-A10-F04** | Zone expires through three TURN-END ticks; refresh; snapshot/restore partway; add two distinct Furnace sources | Expiry counts TURN-END, not frames; dedup prevents duplicate same-source target application in one turn-end; state/owner/source identity survives snapshot; distinct sources remain independently keyed. | **TEST_DESIGNED** / serialization |

All 12 are **NOT_RUN in this W2 pass**. R16 historical tests do not equal execution of these exact fixtures. No R17 UNITY_READY promotions.

### Later implementation / QA responsibility

- **A50**: incorporate M01–M08 / F01–F04 into the existing 19-PARTIAL acceptance matrix without changing counts or silently treating specs as PASS.
- **A31 / A40 (after HQ W3)**: preserve the existing real event boundaries; any detected parity repair requires failing fixture first and explicit scope authorization.
- **A60**: independently confirm actual native collision and TURN-END outcomes, snapshot and negative-control evidence.
- **A20 / catalog owner (after HQ decision)**: resolve proposed Furnace copy/tooltip independently from gameplay changes.

## 6. Backward compatibility / release boundaries

- **No protocol 149 change** required by this semantic ruling. `mitosisSplit` and Furnace zones already exist in R16 state; any future field addition must pass its own serialization/compatibility review.
- **No V148 modification**, no HTML modification, no Unity source or `.meta` modification, no deck/catalog-stat changes, no rebalancing.
- **No merge, no public deployment**, no source-import interference.
- Existing W1 **Phoenix / Revenant / Soul Anchor / Dirge / Den Mother** contract remains frozen and untouched.
- Mitosis and Furnace each remain **PARTIAL**. A10's decision does not certify full native collider/field coverage.

## 7. Direct evidence actually checked

R16 ZIP locally rehashed with SHA-256, and the embedded protected V148 rehashed with SHA-256 — both **MATCH**.

A read-only Python `zipfile/hashlib/json` **static source verifier** executed **17 / 17 PASS**, inspecting:
- both exact archives/hashes;
- V148 migration metadata, pair handler, surface dispatcher, kinetic interception and safe split order;
- V148 Furnace field creation and TURN-END FIRE dispatch;
- R16 pair handler, OnWall non-Mitosis path, Mitosis/Furnace catalog metadata;
- R16 Furnace field and normal status application;
- R16 existing weak-contact managed test and absence of a separate Furnace zone damage call.

This is a **STATIC SOURCE CHECK**, not a .NET test run. No Unity/editor, C#, native collision, physical device, or network test executed in W2.

W1 A50 report reviewed at:
`docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md` (Issue #93).

No R17-W1 files were edited.

## 8. OPEN questions / owner-vs-execution classification

| ID | Decision needed | Who may decide | Current safe treatment |
|---|---|---|---|
| **S01** | Should “first physical impact” expand Mitosis from ball contact and V148 kinetic interception to wall/base/structure/trap/geometry TOUCH? Which trigger strength/collision classes? | **Owner + HQ/A10 gameplay change authorization** | **NO EXPANSION**; preserve executable scope. |
| **P01** | Which `IMPACT_DAMAGE_KINDS` paths reach Mitosis naturally and which are missing from R16 Unity? | **A50 source fixture + A31/A40 after source gate** | Track as **parity investigation**, no automatic code change. |
| **C01** | Approve Furnace text/tooltip to remove an unsupported independent “5 immediate damage” promise. | **Owner/HQ + UI/catalog owner** | **Proposed copy only**, existing data unchanged. |
| **C02** | Is any explicit independent instant +5 FIRE damage desired in future? | **Owner gameplay change** | **NO** in R17-W2; would be new damage/balance behavior. |
| **D01** | How to reconcile historical V148 30 HP vs V149 R16 imported 35 HP and other catalog changes? | **HQ/source provenance & separate game-data authority** | **OUT OF SCOPE**, no tuning. |

## 9. Required status and handoff

**DESIGNED:** YES — semantic arbitration + 12 acceptance cases authored.  
**IMPLEMENTED:** NO — documentation only.  
**TESTED:** STATIC SOURCE CHECK ONLY (17/17 PASS); **GAMEPLAY TESTED: NO**.  
**INTEGRATED:** NO.  
**RELEASED:** NO.

**HANDOFF TO 00/HQ:** accept the Mitosis non-surface default and Furnace no-direct-damage ruling, decide S01/C01 only as explicit owner choices, route M/F tests to A50 after source-import wave. Preserve W1 and maintain A40 HOLD until source gate and HQ authorization.
