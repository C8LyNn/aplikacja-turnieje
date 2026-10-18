# Featured deck source interaction review

Review date: 2026-10-15. Selection: the latest four user-selected **PROVISIONAL CLASS DEMO** decks in `Assets/Resources/Data/featured-decks.json` (36 distinct IDs). The certified V148 HTML is a design reference and mechanic catalog. These observations do **not** require Unity to reproduce legacy bugs, numerical tuning, timing, physics, or event-order quirks.

## Evidence and scope

- Runner: `Tools/source-featured-smoke.cjs`.
- Evidence: `Evidence/source-featured-smoke.json`.
- Original: `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`.
- Original SHA256: `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`; verified before and after; original unchanged.
- Featured selection SHA256 at run: `b0931b8d0129a21c7c5b705c3e6da94164b99e652aac3eebb0f68d8b8650b634`.
- **36/36 selected-ball runtime scenarios, 13/13 interaction/replacement scenarios, 198/198 assertions passed.** Two passing scenarios deliberately confirm source limitations (Plagueleech's extra prerequisite and Penitent toxin re-infection); passing does not imply these intended behaviors work cleanly.
- **4/4 complete local source-runtime matches** reached base destruction using original standard rules, source action selection, stock, physics update and resolution. No mass safety-cap endings, no forced mass settles, no page errors. The source's built-in motion guard activated once per match; this is disclosed rather than described as a guard-free physics result.
- All tests use isolated headless Edge. Hook insertion occurs only in the intercepted browser response, never in the source file. `requestAnimationFrame` is disabled for this page so only explicit original-source physics steps advance the simulation. Targeted scenarios use original spawn/contact/STOP/turn/death helpers, with controlled positions and preconditions.
- These tests validate original-source mechanics and causal interactions. They do not validate Unity implementation, UI usability, balance, or exact player aim trajectories. Earlier 92 built-in tests are separate evidence and are not counted here.

Reproduce from the project directory: `node Tools/source-featured-smoke.cjs`. The machine must permit isolated headless Edge. `--targeted-only` runs the 49 targeted scenarios but deliberately cannot yield a complete overall report without the four matches.

| Featured deck vs Standard-only source opponent | Turns / actions | Featured copies deployed | Source result | Forced settles / safety cap |
| --- | ---: | ---: | --- | --- |
| DEATH ENGINE | 36 / 37 | 18, all 9 selected types | Featured win, bases 14–0 | 0 / false |
| STATUS REACTOR | 32 / 33 | 16, all 9 selected types | Featured win, bases 20–0 | 0 / false |
| GRAVITY TRAP | 28 / 29 | 14, all 9 selected types | Standard win, bases 0–2 | 0 / false |
| REALITY HACKERS | 19 / 20 | 9, 8 selected types | Standard win, bases 0–19 | 0 / false |

The Reality match did not deploy Wildcard before ending; its transformation is covered by the dedicated runtime test. Four fixed-seed matches against one baseline are completion smoke checks, not comparative strength evidence.

## DEATH ENGINE

Roster: `agony`, `requiem`, `bonfire`, `wildfire`, `soulburst`, `reclaimer`, `gravehide`, `packheart`, `cascade`.

**PRIMARY COMBO:** Agony touches an allied Cascade → Cascade's repeatable DEATH effect creates a living successor without killing the parent → canonical RETURN gives the successor Packheart shield and advances Gravehide. Repeat qualifying returns on three different turns for ancestral Gravehide. Verified by `combo:death-primary`; all three successors received five shield and Gravehide gained ten maximum HP at the third stack.

**SECONDARY COMBO:** Requiem stops near Bonfire and Wildfire → repeats their DEATH effects while both remain alive → Bonfire damages/burns nearby enemies and heals nearby allies, while Wildfire creates a persistent fire zone. Verified by `combo:death-secondary`; the damage/heal ranges are measured from Bonfire, not from Requiem.

**OPTIONAL EMERGENT INTERACTION:** Reclaimer revives an eligible fallen Bonfire → the REVIVE also triggers Packheart and Gravehide. Verified by `combo:death-emergent` (15 HP returned Bonfire, five shield, one Gravehide stack).

**SETUP BALLS:** Cascade and the two RETURN observers; Bonfire/Wildfire provide reusable DEATH effects. Reclaimer needs an eligible graveyard entry.

**PAYOFF BALLS:** Agony/Requiem trigger the engine; Packheart protects returned units; Gravehide upgrades. Soulburst provides a stronger burst when missing HP.

**KNOWN RUNTIME RISK:** Gravehide is once per turn, so three returns in one turn do not produce ancestry. Cascade's natural death sequence is 25 → 10 → 5 HP and stops; copied DEATH on a still-living parent can create additional successors, so token/lineage limits merit a deliberate clean Unity design. RETURN excludes tokens. Wildfire actually creates a periodic fire zone, despite old descriptive text suggesting an immediate blast. Soulburst uses missing HP; using Agony on an undamaged Soulburst gives a weak payoff. Space can prevent successor/revive placement.

**SIMPLE 3-TURN DEMO SEQUENCE:** Use a staged board with Packheart, Gravehide and Cascade alive, and Agony available for controlled re-contact. (1) Touch Cascade with Agony: point out a shielded successor and stack 1. (2) Re-contact the still-living parent on a later player turn: show stack 2. (3) Re-contact on a third qualifying turn: show ancestry. This is a mechanic rehearsal with predeployed setup, not a promise that four setup pieces can be deployed from an empty board in three turns. Source test positions are controlled; normal play still requires legal access/replay and open placement.

## STATUS REACTOR

Roster: `blightpool`, `plagueleech`, `vector`, `septiccore`, `consecrator`, `absolver`, `penitent`, `ward`, `halo`.

**PRIMARY COMBO:** Blightpool's turn-end zone supplies toxin → Septic Core's qualifying HIT builds Virulence on the infected enemy → a second qualifying turn reaches the burst threshold → if that infected enemy dies, Vector infects a nearby clean enemy. Verified by `combo:status-primary`. The Vector payoff requires actual DEATH; the burst alone need not be lethal.

**SECONDARY COMBO:** Penitent touches an ally carrying fire and takes that debuff → a Consecrator zone removes it from Penitent at turn end → the resulting genuine CLEANSE lets Absolver shield Penitent. Verified by `combo:status-secondary`. Transfer itself is not CLEANSE and does not trigger Absolver.

**OPTIONAL EMERGENT INTERACTION:** Ward removes fire from an ally that also has toxin → Absolver adds its CLEANSE shield while toxin remains. Verified by `combo:status-emergent`: Ward five shield plus Absolver five, with toxin still active. This demonstrates the distinction between partial cleanse and full immunity.

**SETUP BALLS:** Blightpool and Vector establish toxin propagation. Consecrator and Absolver establish the defensive listener chain. Penitent's demonstration needs an incoming transferable debuff from the opponent.

**PAYOFF BALLS:** Septic Core, Vector, Absolver; Halo independently blocks the first kinetic damage. Plagueleech's intended ongoing drain is useful after binding, subject to the source prerequisite below.

**KNOWN RUNTIME RISK:** The source applies Plagueleech's “bound and poisoned” condition to its initial TOUCH: a clean target is not infected or bound. It only binds a target already infected and carrying `webbed`/`sticky`. This roster has no reliable internal supplier for that extra restraint, making Plagueleech the weakest standalone source-demo slot. Penitent successfully transfers toxin, but the same collision's generic allied contagion immediately re-infects the relieved ally; use fire for the clean transfer demonstration. Ward clears fire/ice/webbed/sticky/jam, but does not clear toxin or ROOTED; Consecrator can clear those. Septic Core is once per target per turn, so two hits in one turn are not two Virulence increments. Periodic zones resolve at turn end.

**VERIFIED REPLACEMENT OPTION:** If the class demo must run against the HTML source without correcting its Plagueleech prerequisite, replace `plagueleech` with existing ID **`venom`**. `combo:replacement-venom` verifies that a slow TOUCH infects a clean enemy; another TOUCH on that infected enemy deals five damage and heals Venom by five. This gives an immediate, self-contained toxin payoff. No featured JSON was changed by this review. A clean intended Unity Plagueleech can instead infect/bind on first enemy contact; preserving this source bug is unnecessary.

**SIMPLE 3-TURN DEMO SEQUENCE:** With a staged enemy in zone range and Vector already alive: (1) stop Blightpool near the enemy; show toxin at turn end; (2) hit that enemy with Septic Core and show one Virulence; (3) hit it on a later qualifying player turn and show the threshold burst. If the target dies, show Vector's spread to a clean neighbor; otherwise identify the remaining HP needed, without claiming a guaranteed death. This sequence does not need Plagueleech.

## GRAVITY TRAP

Roster: `web`, `briarheart`, `vinehook`, `gravitymine`, `singularity`, `horizonrelay`, `gatekeeper`, `harpoon`, `vortexmedic`.

**PRIMARY COMBO:** Place Web nodes → arrange enemy entry while ROOTED will remain active for the attack window → Briarheart HIT gains its rooted-target bonus. Vinehook/Harpoon can position an unrooted enemy toward the trap before it triggers. The runtime verifies Web supplies ROOTED and Briarheart's HIT gains damage (`combo:gravity-primary`); a slow TOUCH does not gain the HIT bonus.

**SECONDARY COMBO:** A dead Singularity creates a black hole → consumed enemy non-token balls charge Horizon Relay → every third qualifying consume damages the opposing base. Verified by `combo:gravity-secondary` and `horizonrelay`. Ally consumes and token consumes do not charge Horizon. Consumption removes the ball without DEATH, graveyard entry or Cascade RETURN.

**OPTIONAL EMERGENT INTERACTION:** Vortex Medic counts a nearby rooted enemy for healing although ROOTED prevents that enemy's physical pull displacement. Verified by `combo:gravity-emergent`: the rooted enemy stays still and the injured ally heals five. Treat this as an observed HTML interaction, not an instruction to preserve accidental Unity bookkeeping.

**SETUP BALLS:** Web, Vinehook, Harpoon, Gatekeeper; Singularity must actually die before its hole exists. Gravity Mine arms at STOP and triggers when an enemy enters its range.

**PAYOFF BALLS:** Briarheart, Horizon Relay, Gravity Mine and Vortex Medic's healing. Gatekeeper's paired portals support positioning; they are replaced on recast and removed on source death.

**KNOWN RUNTIME RISK:** ROOTED blocks pull forces, so “pull an already rooted enemy into the black hole” is not a working source combo. Pull first, root afterward, or use a separate unrooted target. ROOTED expires at the end of the target owner's next owner turn; careless turn ordering loses Briarheart's window. The hole consumes both teams and expires after ten total consumes. Portal placement can fail and portals work on both teams. Singularity has no automatic self-sacrifice tool in this deck; the secondary combo needs combat/opponent damage or a staged death. A whole-match completion does not prove the AI arranged this combo.

**SIMPLE 3-TURN DEMO SEQUENCE:** Begin with Web nodes and Briarheart already positioned for a controlled encounter. (1) Pull an unrooted enemy toward the trap with Vinehook or Harpoon. (2) During the enemy's action, let it enter a node: show ROOTED. (3) On the next player action, HIT it with Briarheart before root expires. This sequence counts alternating side turns and assumes the enemy's trap entry; an opponent may avoid it. The separate Horizon demonstration is a staged Singularity death followed by three enemy non-token consumes, not a guaranteed three-shot empty-board setup.

## REALITY HACKERS

Roster: `mimic`, `doppelganger`, `wildcard`, `collector`, `echo`, `timeshift`, `chronomancer`, `paradox`, `traitor`.

**PRIMARY COMBO:** Chronomancer records a STOP snapshot; Paradox records its own-turn snapshot → after position/HP changes, Echo STOP repeats their nearby STOP handlers → Chronomancer consumes its save and restores itself, while Paradox rewinds to its retained snapshot. Verified by `combo:reality-primary`.

**SECONDARY COMBO:** Traitor touches an enemy with a useful STOP effect → the enemy becomes allied while Traitor becomes an enemy Standard → nearby Echo repeats the captured ball's STOP ability. Verified using a captured Chronomancer in `combo:reality-secondary`. This is opponent-dependent; Traitor cannot conjure an enemy STOP ability.

**OPTIONAL EMERGENT INTERACTION:** Mimic copies an enemy Ice and reduces the target to Standard → the transformed Mimic later dies as Ice → Collector records the current Ice type, then uses the freeze signature at STOP. Verified by `combo:reality-emergent`. Collector copies a broad trait signature, not the original exact ability handler.

**SETUP BALLS:** Chronomancer, Paradox, Collector; useful opponent types provide copy/capture opportunities. Timeshift swaps with a nearby enemy for positioning. Wildcard produces a random visible nonunique special while keeping its rounded HP ratio.

**PAYOFF BALLS:** Echo, Mimic, Doppelganger and Traitor; Collector gains signature variety from deaths. Doppelganger copies the enemy type without stripping the enemy; Mimic strips it.

**KNOWN RUNTIME RISK:** Echo repeats enemy STOP abilities too and can benefit the opponent. It directly repeats handlers without target motion STOP events or archetype STOP hooks. Random Wildcard outcomes and Collector's randomly chosen signature cannot be promised in a fixed three-turn script. Type/owner changes are meaningful state changes, not automatic score gains. Paradox's legacy status snapshot and Chronomancer's snapshot omit some newer status bookkeeping; use position/HP for a clear demonstration. No source-tested combo guarantees a strong win rate; the one baseline match ended in a loss.

**SIMPLE 3-TURN DEMO SEQUENCE:** With Chronomancer and Paradox staged nearby and Paradox's own-turn snapshot recorded: (1) stop Chronomancer to store a position/HP snapshot; (2) use an opponent action to displace/damage the staged temporal balls; (3) stop nearby Echo to show both rewinds. Keep enemy STOP balls outside Echo range if a clear one-sided teaching example is wanted. This is a controlled scenario, not a guarantee that a free-play opponent chooses the required displacement.

## Review decision

The primary and secondary interactions above are backed by source runtime assertions. Keep all four selections provisional. The clearest optional roster adjustment is `plagueleech` → `venom` for a standalone original-HTML demonstration; intended clean Unity behavior can keep Plagueleech after fixing its first-contact prerequisites. No fallback is required merely to preserve a source bug. Source audit owns no Unity readiness status and makes no claim that these 36 abilities are implemented in Unity.
