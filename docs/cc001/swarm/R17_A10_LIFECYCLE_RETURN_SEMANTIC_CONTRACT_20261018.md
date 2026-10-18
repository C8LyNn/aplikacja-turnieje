# CC-001 — R17 / A10 — Lifecycle + RETURN semantic contract

**PROJECT:** CC-001  
**ROUND:** R17  
**ISSUE:** #91  
**AGENT:** A10 — Lead Game Design  
**MODE:** DESIGN CONTRACT ONLY  
**DATE:** 2026-10-18  
**BASE INPUT:** Core Clash V149 Unity R16  
**R16 SOURCE SHA-256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`

## 1. Scope and authority

This contract continues the existing A10 Core Clash design-semantic work. It does not restart the project and does not supersede earlier V148/V149 decisions except where this R17 document narrows the implementation contract for the selected lifecycle/RETURN batch.

Selected batch:

- Phoenix
- Revenant
- Soul Anchor
- Dirge
- Den Mother

No sixth ability is added.

This task authorizes **design semantics and acceptance-test requirements only**.

It does **not** authorize:
- code implementation;
- balance tuning;
- deck/catalog stat changes;
- V148 modification;
- public deployment;
- promotion to UNITY_READY without acceptance evidence.

## 2. Evidence basis

Reviewed before freezing this contract:

- R17 master dispatch;
- GitHub Issue #91;
- R16 `HANDOFF_R16_README.md`;
- R16 `R16_REPORT_PL.md`;
- R16 `R16_QA_PL.md`;
- R16 `ability-support.json`;
- `R16_AUDIT_20261018.md`;
- exact R16 source archive;
- protected `Reference/V148_reference_original.html`;
- current R16 lifecycle/state infrastructure.

The exact R16 source archive independently hashes to:

`b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`

and contains 639 ZIP entries.

All five selected abilities are currently **DATA_ONLY** in the R16 support registry. Generic lifecycle infrastructure already exists, but that is not equivalent to these five abilities being implemented or tested.

## 3. Global lifecycle contract

### 3.1 Event identity

Canonical lifecycle events remain distinct:

- **DEATH** — an actual terminal death event for a ball.
- **RETURN** — a successful restoration/return outcome after the relevant lifecycle action.
- **SPAWN** — creation/entry event for a new board instance.

`RETURN != SPAWN`.

When an actual death produces a later return:

`DEATH -> ... -> RETURN`

One successful return produces exactly one canonical RETURN event.

### 3.2 RETURN subtypes used by this batch

- **REVIVE**
  - Revenant returned form;
  - Soul Anchor graveyard revival.
- **REPLAY_RETURN**
  - Phoenix returns to the owner's hand.

A Phoenix later played from hand performs a normal board SPAWN; that later SPAWN is not a second RETURN.

Den Mother Broodling generation is SPAWN/generation, not RETURN.

### 3.3 Dirge repeated-DEATH distinction

Dirge repeats an eligible ally's **DEATH effect body** without killing that ally.

Therefore the repeated target:

- stays alive;
- does not emit a new DEATH event merely because its DEATH effect was repeated;
- does not create a graveyard record from that repetition;
- does not invoke generic death observers/rewards/cleanup from that repetition.

The copied effect may itself produce other legitimate events, including RETURN.

### 3.4 Ownership

Successful lifecycle products preserve the semantically appropriate owner:

- Phoenix hand entry and later replay remain with Phoenix's owner;
- Revenant returned form uses Revenant's owner;
- Soul Anchor revival uses the grave record / Soul Anchor owner;
- Den Mother Broodling uses Den Mother's allied owner.

Ownership changes are not introduced by this batch.

### 3.5 Stock

- Graveyard revival does not consume stock.
- Revenant returned form does not consume stock.
- Den Mother Broodling does not consume stock.
- Phoenix returns to a special hand state; this is not a new stock grant. Replaying the ready Phoenix consumes that hand opportunity rather than manufacturing normal stock.

No new stock rules are authorized.

### 3.6 Replay interaction

A returned/generated board object created by a lifecycle effect must not become an immediate free same-turn Replay target merely because it entered the board.

The implementation must preserve the existing V148/R16 replay-exclusion semantics for newly returned/generated objects.

Phoenix's later hand replay is a normal deliberate spawn/play action, not a free Replay action.

### 3.7 Graveyard

Canonical V148 graveyard behavior for this contract:

- per-owner bounded history;
- current V148 cap: 18 records;
- records preserve enough identity/state to restore the same eligible lineage;
- successful graveyard revival removes the consumed record only after a valid placement/creation succeeds;
- generated tokens/hidden token types do not become normal non-token graveyard candidates;
- a graveyard-revived unit does not recursively create another ordinary graveyard-revival generation under the current `reviveGeneration` rule.

Phoenix and Revenant themselves use their own lifecycle paths rather than the ordinary graveyard path.

### 3.8 Generated-unit safety

R16 already uses a global living-ball safety cap of 256 and safe-placement logic for generated units.

A40 may reuse those engineering safety mechanisms.

They are not balance tuning and must not be exposed as a new player-facing rule.

A failed safe placement/cap check must not create overlapping or partial phantom units.

### 3.9 Serialization / authority

The host-authoritative snapshot must preserve all state required for deterministic continuation of this batch, including canonical equivalents of:

- graveyard records;
- owner/type/ball identity;
- lineage identity;
- life;
- revive generation;
- generated/token state;
- replay-exclusion state;
- host RNG state used for Revenant outcome;
- Phoenix per-owner hand state and pending hand payload;
- Den Mother per-instance turn-limit state where required;
- any active lifecycle counters needed to prevent duplicate event resolution.

This contract defines semantics, not required field names.

### 3.10 Event ordering target

The externally observable V148 semantic ordering for this batch is:

1. legitimate DEATH event begins;
2. dying object becomes dead for subsequent lifecycle eligibility;
3. death observers such as Den Mother resolve in deterministic observer order;
4. ordinary death-side hooks/cleanup proceed;
5. eligible graveyard record is established where applicable;
6. the dead ball's own DEATH effect resolves;
7. any successful restoration/hand return emits RETURN.

A40 may adapt the current R16 hook structure to preserve this behavior without globally redesigning the engine.

A repeated DEATH effect from Dirge does not enter this full actual-death pipeline.

---

# 4. Phoenix

## Trigger / source / target

**Triggers:** SPAWN and actual DEATH.  
**Source:** Phoenix.  
**Targets:** SPAWN aura affects nearby valid balls; DEATH explosion affects nearby valid balls; RETURN-to-hand targets Phoenix's lifecycle identity/hand state.

## SPAWN behavior

On SPAWN Phoenix temporarily carries a large fire aura.

The aura:
- applies its current V148 fire payload to nearby valid balls;
- can affect both allegiances;
- must not repeatedly apply to the same target within the same entry-aura episode.

Exact numeric aura duration/range/damage remain V148 data and are not retuned by R17.

## DEATH behavior

Actual Phoenix death:

1. emits/participates in the normal Phoenix DEATH event;
2. produces the current short fire explosion and FIRE application;
3. does not enter the ordinary graveyard path;
4. creates Phoenix hand state at **5 HP**;
5. emits exactly one RETURN subtype **REPLAY_RETURN** to hand.

RETURN observers may react to the valid REPLAY_RETURN according to their own contracts.

## Hand timing / persistence

The hand item:
- is unavailable until one own turn has advanced;
- regenerates **+5 HP per own turn**, capped at Phoenix max HP;
- on the first qualifying own turn becomes replayable and has regenerated from 5 to 10 HP;
- persists as owner-specific hand state until replayed or match state ends.

Pending return-related Shield payload, if legitimately granted by an observer, must stay attached to the hand payload and apply on replay.

Ordinary board statuses do not persist merely because Phoenix returned to hand unless an existing explicit contract says otherwise.

## Hand replay

When ready Phoenix is played again:

- it creates a new normal Phoenix board instance;
- normal SPAWN semantics occur, including Phoenix entry aura;
- it uses the hand HP payload;
- pending hand Shield, if any, transfers to the new board instance;
- the hand opportunity is consumed;
- no extra normal stock is manufactured;
- a new runtime board identity/lineage is acceptable and matches current V148 hand-replay behavior.

## Dirge compatibility

Phoenix is **not** an eligible Dirge repeated-DEATH target in current V148.

No R17 change is authorized.

---

# 5. Revenant

## Trigger / source / target

**Trigger:** actual DEATH.  
**Source:** Revenant.  
**Target/outcome:** one randomly selected eligible non-unique visible ball type becomes the returned form.

## Eligible form pool

The current executable pool excludes at least:

- Revenant itself;
- Mirage;
- UNIQUE-tier types;
- hidden types.

R17 does not narrow this pool further by taste, archetype or deck identity.

Any pool adjustment would be a separate design change.

## Return creation

On successful resolution:

- owner is preserved;
- returned form begins at **10 HP**;
- type max HP remains the selected type's normal max;
- lineage is inherited from Revenant;
- life increments by one;
- the creation suppresses ordinary SPAWN-event semantics;
- exactly one RETURN subtype **REVIVE** is emitted;
- no stock is consumed;
- immediate same-turn Replay is blocked.

The returned form is not automatically a token merely because it was generated by Revenant.

If its selected type is otherwise graveyard-eligible, its later actual death may enter the ordinary graveyard system under current generation rules.

## RNG

Type selection must use the host-authoritative serialized game RNG.

Same legal pre-state + same serialized RNG state must produce the same Revenant form.

Client-local randomness is forbidden.

## Failure

If there is no legal form or no legal safe placement/capacity:

- no returned form is created;
- no RETURN event is emitted;
- no overlapping fallback ball is created;
- Revenant remains dead;
- no automatic retry is introduced.

## Dirge compatibility

Dirge may repeat Revenant's repeatable DEATH effect on a living Revenant.

In that case:
- the original Revenant stays alive;
- no DEATH event is emitted for it;
- one valid returned-form outcome may be created;
- successful creation emits RETURN once.

---

# 6. Soul Anchor

## Trigger / source / target

**Trigger:** actual DEATH, or a legal Dirge repeated-DEATH-effect invocation.  
**Source:** Soul Anchor.  
**Target:** most recent eligible allied graveyard record other than Soul Anchor's own current death record.

## Actual-death timing

On original actual death Soul Anchor is an ordinary eligible graveyard type under current V148 rules.

Its own new grave record may therefore exist before its own DEATH effect selects a target.

The selection must explicitly ignore the current Soul Anchor's own record.

## Selection

Choose the newest other eligible record belonging to the same owner.

Do not choose:
- enemy grave records;
- Soul Anchor's own current record;
- nonexistent/consumed records.

## Revival

On success:

- restore the recorded type;
- owner is preserved;
- place near the recorded **death position**, not near Soul Anchor's death position;
- current HP = **10**;
- recorded max HP is restored as max HP;
- lineage is preserved;
- life increments;
- mark the returned object as the first graveyard-revival generation under current semantics;
- suppress normal SPAWN event;
- remove the grave record only after successful creation;
- emit exactly one RETURN subtype **REVIVE**;
- block immediate same-turn Replay;
- consume no stock.

## Later death of returned unit

A unit revived through this ordinary graveyard path must not re-enter the same ordinary revive loop indefinitely.

Current V148 `reviveGeneration` semantics remain authoritative.

Its own legitimate DEATH ability may still resolve on later actual death.

## Failure

If safe placement/capacity prevents revival:

- target grave record remains;
- no RETURN event is emitted;
- the failed actual Soul Anchor DEATH does not gain a hidden automatic retry.

A later independent legal repeat effect may attempt the current graveyard state again.

## Dirge compatibility

A living Soul Anchor selected by Dirge:
- remains alive;
- does not create its own grave record;
- may revive the newest eligible allied grave record;
- successful revival emits RETURN once.

---

# 7. Dirge

## Trigger / source / target

**Trigger:** Dirge actual DEATH.  
**Source:** Dirge.  
**Target:** nearest eligible living allied ball with a repeatable DEATH effect.

## Eligible target

Target must be:

- alive;
- allied;
- not Dirge itself;
- not a Mirage ghost/equivalent non-real target;
- not type Dirge;
- explicitly DEATH-triggered;
- present in the approved repeatable-DEATH-effect set.

Current V148 behavior does **not** apply the old metadata `SHORT` range gate to the executable target search.

For R17, runtime truth is authoritative:

**nearest eligible ally globally**, not nearest eligible ally within SHORT.

This discrepancy must be recorded; A40 must not silently add a SHORT gate.

## Deterministic nearest selection

Primary ordering: Euclidean distance.

For exact ties in Unity, use a stable deterministic tie-break consistent with canonical entity ordering, preferably lowest stable entity ID.

## Resolution

Dirge calls the target's repeatable DEATH effect body.

The target:
- stays alive;
- receives no new DEATH event solely due to repetition;
- creates no graveyard record solely due to repetition;
- triggers no normal death observer/kill reward/cleanup solely due to repetition.

Effects produced by that effect body still occur normally.

Examples in this batch:
- Soul Anchor repeated effect can produce graveyard REVIVE/RETURN.
- Revenant repeated effect can produce its returned random form/RETURN.

## Ineligible examples

Under current V148 batch semantics:
- Dirge cannot target Dirge;
- Phoenix is not in the repeatable set;
- Den Mother is an observer mechanic and is not a repeated-DEATH-effect target.

## No target

If no eligible living allied target exists, Dirge's repeat effect does nothing.

No substitute target or retry is invented.

---

# 8. Den Mother

## Trigger / role / target

**Observed event:** allied actual DEATH.  
**Role:** living Den Mother observer.  
**Target qualification:** same-owner BEASTS ball, NON-TOKEN.  
**Limit:** **1/TURN per Den Mother instance**.  
**Effect:** spawn one Broodling at/near the qualifying death location.

## Observer ordering

Den Mother resolves as a death observer after the actual DEATH has begun and the target is dead, but before the dead ball's own DEATH body/graveyard-dependent downstream sequence where current V148 ordering requires it.

Observers resolve deterministically.

## Broodling semantics

Successful Den Mother effect creates:

- one Broodling;
- same allied owner;
- **5 HP**;
- token/generated identity;
- current Broodling score weight behavior;
- normal SPAWN semantics for the Broodling;
- no stock consumption;
- immediate same-turn Replay blocked.

Broodling generation is **not RETURN**.

A Broodling:
- is a token;
- does not enter the ordinary non-token graveyard path;
- does not satisfy NON-TOKEN RETURN/death-observer relationships.

## Limit behavior

Each Den Mother instance tracks its own 1/TURN use.

Consequences:
- two qualifying allied Beast deaths in one turn: one Den Mother may trigger only on the first event that passes its gate;
- two different Den Mothers may each legally react to the same qualifying death if each has an unused limit;
- the dead Den Mother cannot observe its own death because it is no longer a living observer;
- another living allied Den Mother may observe a Den Mother death because Den Mother is a non-token Beast.

The current event pipeline commits the limit before the generation effect.

Therefore if the event legitimately passes but generation later fails due to placement/capacity, that Den Mother's 1/TURN use remains spent.

R17 does not change this pipeline rule.

---

# 9. Cross-mechanic edge cases

## 9.1 Token lineage

RETURN does not automatically apply to generic tokens.

A token only participates in a return flow when an explicit same-token lineage contract says so.

None of the selected five introduces a new generic token-return rule.

## 9.2 RETURN observers

A successful RETURN is observable exactly once by valid RETURN listeners.

Examples:
- Phoenix REPLAY_RETURN may be observed by compatible RETURN listeners;
- Revenant/Soul Anchor REVIVE may be observed by compatible RETURN listeners.

No RETURN event is emitted on failed placement/no legal result.

## 9.3 Chains

Lifecycle chains may legally create nested effects, but they must remain bounded by the existing deterministic effect-chain safety.

R17 does not authorize an infinite DEATH/RETURN loop.

Dirge's no-Dirge targeting rule and current engine chain-depth protection remain part of the safety boundary.

## 9.4 Snapshot/reconnect

A snapshot taken after any committed lifecycle transition must restore one unambiguous state.

Examples:
- Phoenix already in hand must not repeat its DEATH/RETURN;
- consumed grave record must not reappear;
- a Revenant random form must not reroll on reconnect;
- Den Mother used limit must not reset merely because a snapshot is applied.

---

# 10. Acceptance-test matrix

These are required tests for A40/A60. They are **specified**, not executed by A10.

## Global lifecycle

| ID | Fixture | Required result |
|---|---|---|
| LR-001 | Actual death followed by successful revival | DEATH precedes RETURN; exactly one of each applicable semantic event |
| LR-002 | Revenant/Soul Anchor returned board object | RETURN occurs without a normal SPAWN event |
| LR-003 | Den Mother Broodling creation | SPAWN/generation occurs; no RETURN |
| LR-004 | Successful return | Owner is preserved |
| LR-005 | Returned/generated child same turn | No immediate free Replay |
| LR-006 | No legal safe placement / living cap reached | No overlap/phantom child; no false RETURN |
| LR-007 | Snapshot round-trip after lifecycle transition | Grave/lineage/life/revive/replay state remains identical |
| LR-008 | Revenant pre-state + same RNG snapshot | Returned type is deterministic |
| LR-009 | Nested repeat/RETURN chain | Finite deterministic resolution; no duplicate lifecycle event |
| LR-010 | Host/client snapshot of lifecycle result | Client receives host result; client does not locally reroll/re-resolve |

## Phoenix

| ID | Fixture | Required result |
|---|---|---|
| PHX-01 | Normal Phoenix spawn | Entry fire aura starts once |
| PHX-02 | Multiple valid nearby balls during one entry aura | Each target affected at most once for that aura; allegiance does not incorrectly filter valid V148 targets |
| PHX-03 | Actual Phoenix death | Death fire payload resolves; no ordinary grave record; hand created at 5 HP; DEATH before one REPLAY_RETURN |
| PHX-04 | First subsequent own turn | Hand HP becomes 10 and replay becomes available |
| PHX-05 | Additional own turns while held | +5 HP/own turn capped at max HP |
| PHX-06 | Replay ready Phoenix from hand | Hand opportunity consumed; new board Phoenix SPAWNs with stored HP/pending Shield; no extra stock manufactured |
| PHX-07 | Compatible RETURN observers present | One REPLAY_RETURN is observed once; pending hand payoff persists correctly |
| PHX-08 | Dirge searches repeatable ally | Phoenix is not selected |

## Revenant

| ID | Fixture | Required result |
|---|---|---|
| REV-01 | Actual Revenant death with legal pool/space | Revenant does not enter ordinary graveyard; one eligible non-unique visible form selected |
| REV-02 | Successful form | 10 HP, same owner, inherited lineage, life+1, no SPAWN event, one RETURN REVIVE |
| REV-03 | Same turn after form creation | Returned form cannot gain immediate free Replay |
| REV-04 | Later death of an otherwise graveyard-eligible returned type | Ordinary graveyard eligibility follows current generation rules rather than token classification |
| REV-05 | Save RNG state, resolve, restore same pre-state/RNG, resolve | Same form selected |
| REV-06 | No legal placement/capacity | No child and no RETURN |
| REV-07 | Dirge repeats living Revenant DEATH effect | Original Revenant stays alive; returned form may be created; no synthetic DEATH for original |

## Soul Anchor

| ID | Fixture | Required result |
|---|---|---|
| SA-01 | Soul Anchor actual death with other ally grave records | Own current record is ignored as target |
| SA-02 | Several eligible allied records | Newest other eligible record selected |
| SA-03 | Successful revive | Appears near recorded death position at 10 HP; recorded max HP; owner/lineage preserved; life+1; reviveGeneration advanced |
| SA-04 | Successful revive | Grave record removed only after success; no SPAWN; one RETURN REVIVE |
| SA-05 | Placement/cap failure | Grave record remains; no RETURN |
| SA-06 | Revived unit later dies | It does not recurse into another ordinary graveyard revival generation |
| SA-07 | Dirge repeats living Soul Anchor effect | Soul Anchor remains alive and creates no own grave record; valid ally may be revived |

## Dirge

| ID | Fixture | Required result |
|---|---|---|
| DIR-01 | Actual Dirge death with eligible allies | Nearest eligible living allied repeatable DEATH effect selected |
| DIR-02 | Repeated target effect | Target remains alive; no DEATH event, grave record, generic death observers or kill cleanup for target |
| DIR-03 | Equal-distance eligible targets | Stable deterministic entity-ID tie-break |
| DIR-04 | No eligible target | No effect; no substitute |
| DIR-05 | Candidate set includes Dirge, Phoenix, Den Mother, Soul Anchor, Revenant | Excludes first three; Soul Anchor/Revenant eligible when other gates pass |
| DIR-06 | Repeat Soul Anchor/Revenant | Their successful RETURN may occur once without synthetic target DEATH |
| DIR-07 | Eligible ally farther than legacy SHORT metadata | Current V148 executable behavior may still select it; no unauthorized SHORT gate |

## Den Mother

| ID | Fixture | Required result |
|---|---|---|
| DEN-01 | Allied non-token Beast actual death | One Broodling generated if Den Mother limit/space allow |
| DEN-02 | Allied non-Beast actual death | No trigger |
| DEN-03 | Allied Beast token/Broodling death | No trigger |
| DEN-04 | Enemy Beast death | No trigger |
| DEN-05 | Two qualifying deaths in one turn / one Den Mother | Only first accepted event uses the 1/TURN opportunity |
| DEN-06 | Two living Den Mothers / one qualifying death | Each independently unused Den Mother may trigger once |
| DEN-07 | Successful child | Broodling 5 HP, allied owner, token/generated, normal SPAWN, no stock, no immediate Replay |
| DEN-08 | Broodling later dies | No normal graveyard entry and no non-token RETURN qualification |
| DEN-09 | Qualifying ally with own DEATH effect | Den Mother observer resolves in the frozen lifecycle order before downstream own-DEATH body effects |
| DEN-10 | Limit passes but safe generation fails | No overlapping child; that Den Mother's 1/TURN use remains spent |
| DEN-11 | One Den Mother dies while another allied Den Mother lives | Dead instance cannot self-observe; other living instance may observe if its limit is free |

---

# 11. Implementation handoff constraints

A40 is the implementation owner, not A10.

A40 is blocked until:
1. A70 establishes the exact R16 Git source-import baseline;
2. HQ accepts this semantic contract;
3. the implementation branch is based/rebased on the A70 source baseline.

Implementation must be test-first against the acceptance matrix above.

A40 must not:
- broaden the batch;
- change numeric balance;
- rewrite decks/catalog stats;
- modify protected V148 reference;
- silently resolve the Dirge SHORT-metadata conflict by changing gameplay.

A60 independently verifies any implementation and must distinguish designed, implemented and tested states.

---

# 12. Evidence / validation performed by A10

Performed in this task:

- fetched and read R17 dispatch;
- fetched Issue #91;
- read R16 handoff/report/QA and R16 support registry;
- read independent R16 intake audit;
- downloaded exact R16 source archive;
- verified archive SHA-256 matches the dispatch/audit;
- verified archive contains 639 entries;
- inspected the protected V148 reference semantics for the selected five abilities;
- inspected existing R16 lifecycle/state infrastructure;
- checked the assigned Git branch exists and its pre-task head.

Not performed:

- no Unity import;
- no Unity compilation;
- no C# execution;
- no gameplay implementation;
- no acceptance-test execution;
- no physical-device test;
- no merge/integration;
- no release/public deploy.

Therefore acceptance tests in §10 remain **DESIGNED, NOT EXECUTED**.

---

# 13. Status vocabulary

**DESIGNED:** YES — this contract closes A10's R17 semantic scope.  
**IMPLEMENTED:** NO — A10 made no gameplay code changes.  
**TESTED:** NO — acceptance cases are specified but not executed.  
**INTEGRATED:** NO — HQ/A70/A40/A60 chain remains.  
**RELEASED:** NO — no public deployment authorized or performed.

---

# HANDOFF TO HQ

**PROJECT:** CC-001  
**ROUND:** R17  
**ISSUE:** #91  
**AGENT:** A10 — Lead Game Design

**SELECTED BATCH:** Phoenix / Revenant / Soul Anchor / Dirge / Den Mother

**SEMANTIC CONTRACT:** COMPLETE

**KEY BOUNDARIES:**
- RETURN != SPAWN;
- DEATH precedes RETURN on actual death-return chains;
- Dirge repeats DEATH effect, not DEATH event;
- Phoenix = REPLAY_RETURN to hand, then later normal SPAWN;
- Revenant/Soul Anchor successful restorations = RETURN:REVIVE with suppressed SPAWN;
- Den Mother Broodling = generated SPAWN, never RETURN;
- no stock creation from lifecycle effects;
- lifecycle RNG/state must be host-authoritative and snapshot-safe.

**KNOWN SOURCE CONFLICT:** Dirge metadata says SHORT, but current executable V148 target search has no range gate. R17 freezes executable behavior; no SHORT gate may be added without separate design authorization.

**A40 READY TO IMPLEMENT:** CONDITIONAL — only after A70 source-import baseline + HQ acceptance.

**A10 IMPLEMENTATION CLAIM:** NONE

**A10 TEST CLAIM:** NONE beyond source/provenance/static semantic verification described in §12.

**FINAL A10 STATUS:** DESIGNED / NOT IMPLEMENTED / NOT TESTED / NOT INTEGRATED / NOT RELEASED
