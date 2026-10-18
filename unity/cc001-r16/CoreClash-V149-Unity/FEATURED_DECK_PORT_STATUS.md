<!-- R16 CURRENT -->
# Aktualny stan: R16 / 18.10.2026

Źródła R15 zostały rzeczywiście sprawdzone i rozwinięte. 269 testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. StandaloneWindows64: Succeeded; WebGL: Succeeded; Android: Succeeded.

Czytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.

**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**
<!-- R16 END -->

# Featured class-demo decks — native status and presentation guide

The exact latest user selections are retained in `Assets/Resources/Data/featured-decks.json`. They mix archetypes freely, are additive **PROVISIONAL CLASS DEMO / FEATURED** presets, and are not balance-certified. No canonical deck or roster entry was removed. All nine identities in each deck were deployed in a complete native-simulation local smoke match. This verifies completion, not competitive strength or automatic combo execution.

Current R9 native evidence: `Evidence/unity-tests.json` (**180/180** checks), `Evidence/unity-featured-matches.json` (four complete matches, zero motion guards), `Tests/ShowcaseTests.cs` (11 controlled causal combo checks), `Evidence/ability-support.json` (effective statuses). Each of the 36 selected primary abilities also has an individual outcome smoke test in `AbilityTests.cs`, `RealityTests.cs` or `SpatialTests.cs`. R8 adds Pinballer/Slingshot/Ram and R9 Mine/Time Bomb/Bomb outside these unchanged presets; supported copying/repetition can use their handlers. R9 verifies repeated living Bomb DEATH payload through Agony, and Echo arming/detonation. Featured readiness remains 31 UNITY_READY / 5 PARTIAL. The same pure C# core is compiled into Unity players; these targeted tests are not manual GUI matches or hardware-device tests.

**UNITY_READY** describes the tested native primary handler, not complete source parity, every archetype passive or production readiness. **PARTIAL** is mandatory for five broad copying/repetition identities because they can reference the full roster, including data-only abilities. V148 source observations and source smoke matches are separately documented in `docs/SOURCE_FEATURED_REVIEW.md`; source quirks are not Unity requirements.

## 1. DEATH ENGINE

| Ball ID | Why selected / native demonstration | Status / main risk |
| --- | --- | --- |
| agony | Friendly contact repeats an allied DEATH effect without killing it; visible setup → repeated payoff | UNITY_READY; effect chains bounded at depth 8 |
| requiem | STOP repeats up to three nearby allied death effects | UNITY_READY; positioning and legal targets required |
| bonfire | Repeatable enemy damage/fire plus ally healing | UNITY_READY; ranges originate at Bonfire |
| wildfire | DEATH leaves a three-tick fire field; persistent board state | UNITY_READY; periodic, not an instant blast |
| soulburst | Missing HP changes the repeated death burst | UNITY_READY; undamaged setup is weaker |
| reclaimer | Trades HP once for an eligible ally revive | UNITY_READY; needs grave, HP and free space |
| gravehide | RETURN listener upgrades after three qualifying turns | UNITY_READY; once per global turn |
| packheart | RETURN listener shields each returned ally | UNITY_READY; per-target turn limit |
| cascade | Bounded successor lives with shared lineage | UNITY_READY; natural 25 → 10 → 5 chain; copied effects need space |

**PRIMARY COMBO:** Agony → allied Cascade's DEATH effect → living successor → RETURN → Packheart shield and Gravehide progress. The parent survives copied effects. Native combined test performs qualifying returns on three different turns and verifies ancestry/+10 maximum HP.

**SECONDARY COMBO:** Requiem STOP → Bonfire damage/fire/heal and Wildfire persistent field, with both original balls alive. Native combined test verifies enemy HP/fire and a live field.

**OPTIONAL EMERGENT INTERACTION:** Reclaimer revives an eligible fallen Bonfire at 15 HP → RETURN feeds both Packheart and Gravehide. Verified in the native combined test.

**SETUP BALLS:** Cascade, Packheart, Gravehide; Bonfire/Wildfire/Soulburst provide reusable payloads; a grave enables Reclaimer.

**PAYOFF BALLS:** Agony/Requiem trigger payloads; Packheart and Gravehide turn lifecycle events into lasting board value.

**KNOWN RUNTIME RISK:** Three returns in one turn are not three Gravehide stacks. Generated placement can fail on a crowded board; all generated chains are bounded. Consume is a separate removal event and does not trigger DEATH or RETURN.

**SIMPLE 3-TURN DEMO:** Begin with Packheart, Gravehide and Cascade staged on the board and Agony able to reach Cascade. (1) Make friendly Agony contact; show a shielded successor and first stack. (2) Re-contact the living parent on a later qualifying turn; show stack two. (3) Repeat on a third qualifying turn; show ancestry. This is a predeployed rehearsal, not four legal deployments from an empty board in three turns.

Native completion smoke: 50 turns / 51 actions, bases **11–8**, 50-turn HP tie-break, all nine selected identities deployed, zero motion guards.

## 2. STATUS REACTOR

| Ball ID | Why selected / native demonstration | Status / main risk |
| --- | --- | --- |
| blightpool | STOP creates periodic toxin setup | UNITY_READY; infection occurs at turn end |
| plagueleech | First enemy contact binds/infects; own-turn drain bypasses shield | UNITY_READY; link needs a living infected enemy |
| vector | Actual infected enemy death spreads toxin to a clean neighbor | UNITY_READY; once per turn, eligible neighbor required |
| septiccore | Two qualified infected-target HITs create a Virulence burst | UNITY_READY; per-target turn gating |
| consecrator | Persistent zone removes one status family from a selected ally | UNITY_READY; three periodic ticks |
| absolver | Genuine CLEANSE event becomes a shield payoff | UNITY_READY; transfer itself is not cleanse |
| penitent | Moves oldest active eligible ally debuff onto itself | UNITY_READY; already-held families are skipped |
| ward | Native full modeled-debuff cleanse and baseline shield | UNITY_READY; not lasting immunity |
| halo | Blocks the first kinetic damage instance | UNITY_READY; other damage is not blocked |

**PRIMARY COMBO:** Blightpool → toxin → Septic Core qualified HITs on separate turns → Virulence burst; if the infected target actually dies, Vector spreads toxin. Native causal test stages a wounded target for the lethal second burst and verifies spread. Two same-turn contacts do not bypass the limit.

**SECONDARY COMBO:** Penitent takes an ally's fire → Consecrator clears it at a periodic tick → CLEANSE → Absolver shields Penitent. Native combined test verifies transfer alone gives no shield, then cleanse gives five.

**OPTIONAL EMERGENT INTERACTION:** Ward removes modeled fire/toxin together; Absolver's single genuine cleanse payoff combines with Ward's own shield. Native combined test verifies both statuses gone and ten shield. Unlike HTML, native Ward intentionally clears toxin too.

**SETUP BALLS:** Blightpool supplies toxin; Consecrator/Absolver establish a defensive listener chain; Penitent needs an incoming opponent debuff.

**PAYOFF BALLS:** Septic Core, Vector, Plagueleech and Absolver; Halo buys a separate kinetic protection window.

**KNOWN RUNTIME RISK:** Burst damage alone need not kill; Vector requires actual death and an eligible neighbor. Status timing matters. Source Plagueleech's extra first-contact prerequisite, Ward's toxin omission and Penitent's immediate ally reinfection are deliberately not reproduced. Natural thaw now removes ICE bookkeeping so it cannot steal Penitent's next transfer.

**SIMPLE 3-TURN DEMO:** Stage Vector, an enemy inside Blightpool range, and a clean enemy neighbor outside the pool. (1) STOP Blightpool and show turn-end toxin. (2) HIT the infected target with Septic Core; show one Virulence. (3) On a later qualifying turn HIT again; show burst. If combined damage kills, point out Vector spread; otherwise show remaining HP honestly. An opponent's turn/status tick may itself cause the infected death.

Native completion smoke: 43 turns / 44 actions, bases **13–0**, all nine selected identities deployed, zero motion guards.

## 3. GRAVITY TRAP

| Ball ID | Why selected / native demonstration | Status / main risk |
| --- | --- | --- |
| web | Four placed single-use ROOTED nodes | UNITY_READY; crowded/illegal placements may reduce count |
| briarheart | HIT pays off against rooted enemies | UNITY_READY; weak TOUCH is insufficient |
| vinehook | Nearest eligible enemy pull prepares trap entry | UNITY_READY; one effect per turn, root blocks forces |
| gravitymine | STOP arms a field; enemy entry triggers explosion | UNITY_READY; detonation stays at visible armed field after displacement |
| singularity | DEATH creates growing, bounded consume field | UNITY_READY; consumes both teams; ten-consume lifecycle |
| horizonrelay | Three qualifying enemy non-token consumes damage base | UNITY_READY; ally/token consumes do not charge |
| gatekeeper | Replaceable paired portals with cooldown and momentum transfer | UNITY_READY; placement can fail; both teams can use |
| harpoon | Farthest-enemy long pull contrasts Vinehook | UNITY_READY; range and target ordering matter |
| vortexmedic | Pull setup doubles as low-HP ally healing | UNITY_READY; a rooted enemy resists pull but counts for healing |

**PRIMARY COMBO:** Pull an unrooted enemy toward Web → node entry supplies ROOTED → Briarheart qualified HIT gains damage. Native combined test verifies Web's actual node root feeds Briarheart's payoff. Pull selection is separately tested for both nearest and farthest selectors.

**SECONDARY COMBO:** Singularity actually dies → black hole consumes three enemy non-token balls → Horizon Relay damages opposing base. Native combined test uses real hole entry/consume, verifies one base damage, and confirms consumed Cascade makes no grave or RETURN successor.

**OPTIONAL EMERGENT INTERACTION:** Vortex Medic counts a nearby rooted enemy for healing while root blocks its physical pull. Verified by a dedicated native outcome test. Portals offer a separate positioning layer.

**SETUP BALLS:** Web, Vinehook, Harpoon, Gatekeeper; Singularity needs real combat/opponent damage or a staged death.

**PAYOFF BALLS:** Briarheart, Gravity Mine, Horizon Relay and Vortex Medic.

**KNOWN RUNTIME RISK:** Root first → pull later does not work. Root expiry and action order determine the attack window. Holes threaten allies as well as enemies. Portal recast keeps one pair; source death removes it. Consuming a source cleans its traps/portals. Gravity Mine's repaired blast origin is its armed field, not a displaced caster position.

**SIMPLE 3-TURN DEMO:** Start with Web/Briarheart positioned for a controlled encounter. (1) Pull an unrooted enemy toward a node. (2) On the enemy action let it enter the node and show ROOTED. (3) HIT with Briarheart before expiry. A free-play opponent can avoid entry. Demonstrate the separate Horizon engine with staged Singularity death and three enemy non-token consumes; this is not a guaranteed three-shot empty-board combo.

Native completion smoke: 31 turns / 32 actions, bases **1–0**, all nine selected identities deployed, zero motion guards.

## 4. REALITY HACKERS

| Ball ID | Why selected / native demonstration | Status / main risk |
| --- | --- | --- |
| mimic | Steals enemy identity, leaving enemy Standard, owners retained | PARTIAL; copied data-only primary remains unavailable |
| doppelganger | Copies enemy identity without stripping it | PARTIAL; copied scope depends on implementation |
| wildcard | Random visible nonunique identity; ratio-preserving HP | PARTIAL; can select data-only ability; never promise a chosen result |
| collector | Death observer captures current type signatures | PARTIAL; unsupported signatures emit an explicit unavailable event |
| echo | STOP repeats nearby non-Echo STOP handlers on either team | PARTIAL; unimplemented targets cannot gain a handler |
| timeshift | Short-range nearest-enemy position swap | UNITY_READY; positioning does not imply damage |
| chronomancer | Alternating saved-state restore; save is consumed | UNITY_READY; placement may seek nearby free space |
| paradox | Own-turn saved-state restore; retained save | UNITY_READY; snapshots include modeled statuses, not identity/death undo |
| traitor | Ownership exchange; self becomes opposing Standard | UNITY_READY; opponent-dependent, not an instant score gain |

**PRIMARY COMBO:** Chronomancer stores a STOP snapshot and Paradox an own-turn snapshot → opponent changes HP/position → Echo repeats both nearby STOP handlers → both restore using their different save lifecycles. Native combined test verifies HP/positions, consumed Chronomancer save and retained Paradox save.

**SECONDARY COMBO:** Traitor captures an enemy with an implemented STOP effect → Echo repeats that now-friendly effect. Native combined test uses a captured Chronomancer.

**OPTIONAL EMERGENT INTERACTION:** Mimic steals enemy Ice → later dies with its current Ice identity → Collector records Ice and uses a freeze signature. Native combined test verifies transformed identity, death collection and the resulting ice stack.

**SETUP BALLS:** Chronomancer, Paradox and Collector; opponent identities supply useful copying/capture opportunities. Timeshift supplies repositioning.

**PAYOFF BALLS:** Echo, Mimic, Doppelganger, Traitor and Collector; Wildcard demonstrates controlled uncertainty.

**KNOWN RUNTIME RISK:** This is the most visibly PARTIAL deck. Echo also helps enemy STOP balls and skips archetype STOP hooks. Wildcard draws from the full unchanged roster, not a secretly restricted supported pool. Collector has an implemented signature subset. Copying an unimplemented ability does not make it ready. Temporal saves do not resurrect dead balls or restore old identities.

**SIMPLE 3-TURN DEMO:** Stage Chronomancer/Paradox near Echo and record Paradox's own-turn start. (1) STOP Chronomancer to save. (2) Use a controlled opponent action to damage/displace both. (3) STOP Echo nearby; show both rewinds and explain save consumption. Keep enemy STOP balls out of range for a clear rehearsal, then include one to show the risk. No fixed result is promised for Wildcard/Collector randomness.

Native completion smoke: 33 turns / 34 actions, bases **0–20**, all nine selected identities deployed, zero motion guards. The loss is retained as completion evidence, not used to rebalance or replace the showcase.

## Curation decision

Keep all four exact user decks. Their primary/secondary interactions are runtime-backed, and clean native intent resolves the source-only Plagueleech issue, so no forced replacement is needed. The older Worldshaper→Reflector and Sentry→Interdictor fallbacks do not apply to this latest selection. Full roster migration, competitive balance certification, physical mobile testing and exhaustive copied ability combinations remain outside this showcase claim.

Delivery classification: DONE — four replaceable presets, 36 targeted primary outcomes and four complete native-simulation matches; PARTIAL — five broad copy/echo/signature identities; NOT TESTED — physical Android runtime (toolchain and APK exist); NOT STARTED — exhaustive nonfeatured ability and competitive balance certification.
