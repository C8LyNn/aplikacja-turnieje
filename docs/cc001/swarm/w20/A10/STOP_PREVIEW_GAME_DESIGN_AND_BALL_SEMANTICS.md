# CC-001 / W20 / A10 — STOP Preview & Visual Game-Design Contract

**Status:** SPEC_PROPOSAL / OWNER_REVIEW_REQUIRED / NO IMPLEMENTATION.
**Owner:** A10 Lead Game Design.
**Canonical master:** [A00 VISUAL RECOVERY SPEC #314](https://github.com/C8LyNn/aplikacja-turnieje/pull/314) / [master #313](https://github.com/C8LyNn/aplikacja-turnieje/issues/313). This annex is a role-specific input to that ONE master, not a competing design system.
**Unity code reference:** `7473ceb249086e35942999c093f2c42a91afd415` (Claude #309 final test HEAD; actual author-reported Player built from `fb5eb505d861a4f8f44a34321020ad71a0ba1710`).
**Protected W11 SHA:** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` (unchanged).
**Dependencies:** [A20 #316 source audit and 227-name catalog](https://github.com/C8LyNn/aplikacja-turnieje/pull/316), [A11 #315 HTML source chronology](https://github.com/C8LyNn/aplikacja-turnieje/issues/315), [A10 historical STOP #286](https://github.com/C8LyNn/aplikacja-turnieje/issues/286).
**Evidence class:** current C#/JSON source and approved design requirements, not live Player, human UX or independent P2 LAN evidence.

## 1. Design decision: STOP preview stays, but cannot define shooting skill

**DECISION PROPOSED A10-W20-STOP-01:** Retain the W18 STOP estimator and make its *presentation* ON/OFF selectable in every actually available gameplay mode. Do not remove physics, direct aim vector, charge/force indication, canonical Replay eligibility or collision feedback. A user may play a complete match with either policy, subject to transparent shared PvP rules.

### 1.1 Current source boundary: what STOP actually computes

- `Assets/CoreClash/Presentation/StopPrediction.cs` (Git blob `39f2b42578c376e39465d227f4cdab86a3ab2db2`) estimates *free roll in an empty arena*, including friction/wall bounces/launcher protection. `Obstacles` observes live balls, structures and zones, and `Label` appends `IF PATH CLEAR` when a collision may invalidate the landing estimate. It does NOT predict arbitrary effects, multi-body collisions or ability chains.
- `Assets/CoreClash/Presentation/BoardView.cs` (Git blob `6d92ed05c68b2ebdb26aa4e5acd3acc21b0de921`) computes cached `StopPredictor.Predict` and draws a ring, projected trail and `EST. STOP` label during valid aim. Source reviewed at `7473ceb` has no mode-level persistent ON/OFF player setting.
- Existing `GameSimulation.TryCommand`, `BallPhysics.Step`, turn and Replay are the *authoritative* behavior. The preview is not allowed to alter any command, state, RNG, network snapshot, event order or HP.

### 1.2 Advantages, risks and falsifiable hypotheses

| Decision axis | ON: intended benefit | ON: plausible risk | OFF: intended benefit | What to measure |
| --- | --- | --- | --- | --- |
| Onboarding | Teaches launch power, falloff and wall bounce quicker | Player may copy marker without internalizing physics | Promotes discovery through feedback | Time to first valid shot; power/landing estimation error after overlay removed |
| Skill floor/ceiling | Lowers entry cost; supports deliberate shot planning | May compress precision-based mastery if free-roll estimates are too exact | Higher reward for internalized angle/power knowledge | Novice/expert change in hit rate; learning retention with delayed OFF test |
| Turn pacing | May reduce repeated uncertain drags | Inspecting/re-aiming against marker may add time | Faster intuitive play for some experts | Median/P95 drag time and total turn duration |
| Replay/complex shots | Clarifies trajectories from a non-launcher origin | Player might incorrectly expect multi-ball prediction | More room for tactical risk | Replay engagement; false-confidence reports after obstruction |
| Visual noise/performance | Conveys useful reach/STOP if truthful | More overlays on crowded field; predictive path computation | Cleaner playing field; lower UI/prediction cost | Occupied screen %, label collision count, per-frame allocations, P95 frame time |
| Competition | Shared ON can lower expertise advantage | Hidden individual ON is an unfair asymmetry | Shared OFF favors learned manual precision | Win/loss by matched skill and policy; perceived fairness |

**All effect directions are hypotheses, not observed Player results.** No change to game balance or matchmaking is approved from these assumptions alone.

## 2. Availability-aware defaults — proposal to owner

**SOURCE_CONFIRMED_UI:** `Presentation/SetupView.cs` (Git blob `2e0b8904ede5a52a399360f74013925b41154157`) exposes `START LOCAL MATCH`. `Networking/NgoLanLobby.cs` (Git blob `368919345847cd23e8f5dfb54a20ef1da2d33816`) exposes one two-player multiplayer lobby with LAN/Internet transport choices. `CoreClashApp.cs` (Git blob `4de913c511962f425a5ab65422de6134425ad5f5`) has local authoritative simulation or network authority. LAN and Internet are transports, **not independent gameplay rule modes**. Featured decks, viewport sizes and P1/P2 camera orientation are also not distinct modes.

| Mode or context | Unity evidence | Proposed initial STOP | ON/OFF contract | Persistence/policy |
| --- | --- | --- | --- | --- |
| **LOCAL 2P HOT-SEAT** | **CURRENT UI VERIFIED BY SOURCE** | **OFF** | Both available before match; one shared match setting visible to each seat | Save mode preference locally; match fixes one value for both players |
| **NETWORK 2P casual** (LAN or Internet) | **CURRENT UI VERIFIED BY SOURCE**; transport varies | **OFF** | Both ON and OFF must be *session-wide* and disclosed before acceptance of match | Host proposes, second player sees/acknowledges, authority fixes policy; reconnect reuses accepted policy. **NETWORK_CONFIG_HOLD** until a compatible non-Protocol149 public lobby negotiation mechanism is confirmed |
| **Tutorial / new-player solo** | HISTORY/FUTURE; not established in current reviewed Unity menu | **ON** | Each user ON/OFF | Personal per-mode preference; teaching explains assistance |
| **Solo / AI casual** | HISTORY/FUTURE; not established | **ON** | Individual ON/OFF | No fairness synchronization required |
| **Standard-only / deliberate skill challenge** | HISTORY/FUTURE; not established | **OFF** | Individual ON/OFF | Clearly label any score/achievement variant if policy affects comparison |
| **Sandbox / Creative / training** | HISTORY/FUTURE; not established | **ON** | Individual ON/OFF | Local-only overlay preference; no physics effect |
| **AI vs AI / Simulation Lab** | HISTORY/FUTURE; not established | **OFF** | Spectator overlay ON/OFF, even without human pointer aim | Preview is only relevant for an observable valid hypothetical aim; never promise a visible marker with no aim |
| **Ranked / tournament** | FUTURE ONLY | **OFF** | Both configurations must exist as explicit separate **ruleset/queue variant**, if/when introduced; do not silently mix ratings | Pre-queue policy fixed and public; owner approves any ON-ranked variant |

**Interpretation of “every mode”:** do not invent empty buttons for modes not implemented. Every **actual and future mode** must have an explicit ON and OFF experience when that mode is implemented, or must be marked `NOT_IMPLEMENTED` / `CONFIG_HOLD` until the contract can be honored. Default OFF for current PvP is a design recommendation, not a statement that the current Player already supports toggling.

### 2.1 Exact toggle timing and session fairness

- **Local 2P:** preset chosen in local setup before `START LOCAL MATCH`; both players use same policy. Never quietly toggle just because local seat/turn changes. During match, toggling is allowed **only** via a deliberate paused settings flow with both players' consent, at a *between-turn* safe point; if this confirmation UI is not designed, midmatch toggle remains disabled. The setting is not a strategic per-turn ability.
- **Network 2P:** before connecting/starting, host advertises the match STOP policy and guest accepts it explicitly; UI continuously offers read-only policy visibility. Client may not secretly override. Match policy does not change during network match; any proposed change requires an explicit unanimous pre-rematch process. Reconnect and new snapshot must not change policy without acknowledgement.
- **Transport/protocol:** `Protocol149` is protected. Never pretend the existing snapshot or `GameState` serializes a new STOP field. Determine with A41/A70 whether *already supported public lobby metadata* can agree this local presentation-only policy. If not, **NETWORK_CONFIG_HOLD** and owner approval for the smallest compatible path. Do not create a stealth client-only override or speculative wire field.
- **No unilateral customization in PvP:** per-player *accessibility* settings (contrast, larger text, reduced motion) remain independent, but access to predictive landing coordinates is a **match-wide game rule**. Any local global preference is merely the *next-match request*, overridden by agreed match policy.

### 2.2 ON/OFF data and rendering contract

- `STOP_ON`: draw *estimated* destination ring/path/caption and reach label; when obstacles intersect the path, show truthful `IF PATH CLEAR`. Never portray the output as guaranteed final collision/ability resolution. STOP must not occlude required HP, R, launcher or active drag.
- `STOP_OFF`: **do not call `StopPredictor.Predict` or rebuild its path/cache** and do not draw its endpoint/crosshair/ring, estimated trajectory/path, `EST. STOP` text or reach labels; retain base aim arrow, power/charge cue, legal Replay input, and any independently specified minimal direct direction indicator. A state change from ON to OFF invalidates cached STOP geometry; switching back recomputes from the next legal aim.
- Input must remain `LaunchGesture` → authoritative command unchanged; no additional shot validation, friction change, HP adjustment, RNG usage, network traffic or turn timing changes because of STOP.
- A slider/toggle belongs to the **mode's actual setup/lobby** and an accessible **read-only in-match status**. Provide textual ON/OFF labels, not an unlabeled icon. Keep `IF PATH CLEAR` semantic disclaimer and screen-reader text when ON.
- Prefer a stable setting key `stopPreviewPolicy.<actualModeId>`; transport choice alone must not create contradictory “LAN” and “Internet” gameplay defaults when they are the same network mode. Configuration not keyed by player seat or deck.

## 3. Controlled study: lower skill floor without flattening skill ceiling

Two independent gates:
1. **Determinism/safety (machine):** same game seed, exact committed decks/actions/turns and source SHA; compare ON/OFF authoritative states after each step (ball IDs, positions, velocities, HP/shield, owner, actionSerial, turn number, event list, victory). Test P1/P2 spawn, diagonal, wall bounce, obstruction, Replay, high density and reconnect. Expected game-state and network-snapshot difference **zero**. Verify predictor call count **zero** under OFF; UI draw and allocation traces allowed to differ. This is not proof of human usability.
2. **Skill/perception (people):** initial *pilot* 12 novices + 12 experienced players, within-person balanced ON→OFF vs OFF→ON order, identical practice time, comparable mapped shots and decks, minimum 10 shots in each condition per person; matched difficulties for empty, wall-bounce, one obstructed path and Replay. Record skill cohort and first-use experience; repeated subjects require counterbalanced carryover. Expand sample or pre-register confidence intervals before any ranked balancing claim.

**Metrics:** seconds from gesture start to accepted shot (median/P95), whole-turn duration, precise stopping error on empty path, success at reaching own/opponent zone, first-shot legal-input rate, unproductive retries and Replay usage, reported false certainty under obstruction, retention accuracy after ON players switch OFF, P95 frame time/GC allocation and player-reported agency/fairness. Run P1/P2 local and independent real P2 LAN for input/visibility, not merely C# screenshot fixtures.

**Decision gate:** maintain default OFF in current PvP until evidence favors another public session ruleset; if ON benefits onboarding and decreases physical aiming skill differentiation, keep ON as optional casual/training assistance rather than silently standardizing competitive outcomes. No inferential skill-ceiling claim from isolated screenshots or one 497/502-test managed run. Report effect estimates and confidence intervals, not a made-up PASS threshold.

## 4. A10 signoff on Ball HP / owner / semantics (coordinate with A20)

**Owner constraints are locked:** current numeric HP outside every live sphere; no literal P1/P2 on every ball by default; owner color must remain meaningful; UI names and icons need semantic audit. These are independent of STOP ON/OFF.

### 4.1 What is the external number?

| Context | Design truth and label | Data source / restriction |
| --- | --- | --- |
| Normal live ball | **CURRENT HP = integer** outside real collision circle, every normal display density | Accepted authoritative `BallRuntime.hp` (not maxHp, shield or catalog hp) |
| Catalog/build card | **START HP** | `BallDefinition.hp` (data, not current in-match HP) |
| Returned Phoenix hand | **RETURN HP** | `PhoenixHandEntry.hp` (hand state), not a live orb |
| Live shield | Shield is an independent property/status | Never add it to the CURRENT HP number |
| Dead/banished unit | No live-ball HP label | Preserve authoritative lifecycle and inspector history |
| **Mirage Ghost / intentionally disguised live entity** | **DESIGN EXCEPTION / OWNER REVIEW REQUIRED** | Historic protected V148 HTML publicly projects parent HP for a ghost in some states; do **not** inadvertently expose hidden identity through raw per-instance HP |

**A10-W20-MIRAGE-01 recommendation:** prioritize the unchanged **V148 deception rule** over a naive client read of raw ghost HP. Keep a *numeric external label for every live entity*, but when V148 requires concealment its public number should be the **canonical V148-displayed (projected) HP**, not secretly different underlying HP. Other live entities show true current HP. No `?`, unlabeled percentage or removal of digits. An authenticated debug/inspector may reveal actual HP only if that information is allowed in that context. If an illusion terminates, next authoritative state displays real current HP immediately. A public ghost must not receive a special "fake HP" icon that gives away its identity.

**IMPORTANT CONFLICT TO OWNER:** “exact current HP for every ball” and “preserve V148 ghost's deliberate wrong-public-HP illusion” cannot always both hold literally. This is **not silently approved** by A10; the recommendation is **V148 preservation + always numeric exterior**, pending explicit owner ruling on **public deception versus actual numeric HP**. Do not change simulation or network wire to make the decision. A20/A71 reported historical V148/V149 external HP and parent projection, whereas source reviewed Unity `BallView.cs` currently draws raw `ball.hp`; the presence of the corresponding active illusion in selected #309 is **NOT VERIFIED HERE**. A70 must keep this case OPEN until actual gameplay support and implementation path are verified.

### 4.2 Visual information order — binding semantic proposal

1. Physical orb/silhouette and **semantic type icon** centered; no two-letter+base36 machine code as the primary player identifier.
2. **Exterior integer HP**, anchored beside the ball's *rendered* position (including accepted P2 smoothing) and connected to exact ball ID; reserve the same actual label rectangle for planner keep-outs. Do not let field clipping hide it.
3. **Owner via team rim color + ONE tested non-hue cue** (geometry or rim rhythm), not permanent `P1/P2` chips. Keep literal owner text in HUD, Inspect and accessibility/debug mode. P2 camera flip may never reverse actual ownership.
4. **Replay action** (gold R+ring only if canonical `GameSimulation.CanReplay` allows; show the true locally actionable turn) and urgent statuses. Do not let HP label replace the actual Replay click target.
5. Optional/cosmetic statuses and detailed text in inspect/accessible panel, without suppressing factual important states. Do not invent summaries that discard independent mechanics.

**Dense-board limitation:** if 22–40 live orbs make individual external HP badges impossible to separate, provide a deterministic **spatially linked exterior rail/list/zoom** that still renders the numeric HP for all live IDs. This is an A20/owner layout design choice, not authority to hide any numbers. Dynamic rendered-pose/field clip/margin fallback must use one shared rectangle planner; overlays should never intercept pointer down/drag on a ball/launcher.

### 4.3 Naming/icon semantics — A10 acceptance rules

- **Never rename immutable mechanic IDs** in `catalog.json`, save, deck stock, protocol, telemetry or Replay commands. New player-facing `displayName`, semantic role tag, accessible description and icon key must be stable mappings keyed by canonical ID and versioned separately.
- One language per locale (no PL+EN hybrid in the same card), one syntax by role: short **noun/name** for ball type, **verb + actual condition** for ability, and **state + cause + timing** for action or debuff. Lore name may supplement a role label but may not imply mechanics that the implemented `AbilitySupport` reports unavailable.
- Icons encode *functional identity*, not initial two ASCII characters. Distinct silhouettes at 24px; consistent stroke/contrast, readable without animation and color; badges of ongoing FIRE/ICE/SHIELD etc. are **state overlays**, not replacements for type identity.
- Start from **24 representative confusing IDs across RE/CO/FR/MI families**, cross-checked against A20's complete 227-row inventory, real catalog descriptions and actually implemented ability contracts. Test icon alone, then icon+name, then mechanic description, 5-second recognition and confusion matrix; include grayscale, 390px, 24px and P2 inverted view. Only then roll out over all **227 currently cataloged** ball IDs. The older “224 special icons” is a different possible count and must not override total 227 without an explicit scope declaration.
- **Preferred primary icon order:** mechanic affordance/physical behavior > stable recognizable shape > role/group > lore decoration. No claim that generic fantasy glyphs or historic two-letter marks are sufficient. Do not bulk-generate 227 finished assets before a pilot and owner review.

## 5. Acceptance matrix / stop-gates (not yet executed)

| ID | Acceptance oracle | Owner/evidence | Gate |
| --- | --- | --- | --- |
| STOP-01 | Local 2P starts and completes with ON and OFF; one shared value across seat turnover | A10 design / A60 native | NOT_RUN |
| STOP-02 | Network 2P LAN and Internet both expose clearly acknowledged shared ON and OFF policy without Protocol149 mutations; rejection/unsupported channel fails closed | A41/A70 source + A60 two-PC | NETWORK_CONFIG_HOLD |
| STOP-03 | OFF makes 0 calls to destination predictor and shows no reach/STOP path, but ordinary aim arrow, power and Replay interaction remain | A20/A10 code gate, A60 Player | NOT_RUN |
| STOP-04 | 100 deterministic spawn scenarios + 20 Replay cases have identical authoritative per-step state/event outputs ON vs OFF; no extra network state | A30/A60 managed + LAN | NOT_RUN |
| STOP-05 | Pre-match policy is visible; unauthorized mid-drag, mid-turn, reconnect, guest override cannot change shared PvP setting | A41/A20 + A60 | NOT_RUN |
| STOP-06 | When obstructed, ON describes free-roll estimate `IF PATH CLEAR`; no false guaranteed ability outcome | A10/A20 visual + A60 | NOT_RUN |
| STOP-07 | Balanced player study measures time, precision, retention, skill-cohort differences and perceived agency; report effect uncertainty | A11/A13 UX human QA | NOT_RUN |
| BALL-HP-01 | Every live normal orb exposes its real integer HP **outside** sphere in four corners, 1/8/22/40 balls, P1/P2 smooth poses; zero overlap with interactive targets | A20/A60 native | NOT_RUN |
| BALL-HP-02 | Mirage public HP does not break protected V148 deception; choice signed by owner; hidden implementation state not leaked | A10/owner decision + A71 V148 evidence | OWNER_HOLD |
| BALL-OWN-01 | No default P1/P2 per-orb text; owner recognized by tested color+geometry in grayscale and real P2 LAN view | A20/A60 | NOT_RUN |
| BALL-NAME-01 | 24 pilot icons/names map to mechanically valid implemented effects; no unexplained confusion in selected collision groups; catalog IDs unchanged | A10/A20 test | NOT_RUN |
| PROTECT-01 | No diff to V148, GameSimulation/BallPhysics, Protocol149, Furnace FIRE+DoT, Mitosis V148 or R16 HP/catalog under doc-only package | A71/A70 SHA/source | SOURCE_SCOPE_ONLY |

**Viewport acceptance:** 1280×900, 1920×1080, 1366×768, 1024×768, 768×1024, 390×844, plus narrow 568×270 where supported. Test physical mouse/touch Replay, local P2 and *separately* physically independent inverted P2 LAN. Screenshot recognition cannot certify click-hit testing. Native/participant gates are HOLD until actual operator results.

## 6. Dependencies and integration contract

- **A00:** selectively amend the existing canonical [VISUAL RECOVERY SPEC #314](https://github.com/C8LyNn/aplikacja-turnieje/pull/314) with the A10 decisions; don't merge a parallel "master" document. Resolve the 227 vs 224 scope and A71's SHA typo review in canonical source.
- **A20:** own physical HP rectangle, P2 rendered-pose geometry, no P1/P2 chips, semantic visual/icon pilot and density policy. This annex only defines *what players must learn*, not pixel coordinates or new BoardView code.
- **A11:** independent HTML version-by-version best/worst and source provenance. No blanket port of V121/V122, V148 or legacy effects; separate game-mechanic fidelity from presentation history.
- **A41/A70:** design the **network fair session policy** with no hidden client STOP advantage. Until existing transport/lobby capability is proven, **do not implement network ON toggling or serialize new Protocol149 fields**.
- **Owner:** approve default OFF for local/network PvP, consent/locking policy, future-mode defaults and **Mirage public HP deception exception**. Unapproved cases remain decision HOLD, not implied requirements.
- **A60:** execute actual same-source Windows Player and real PC1–PC2 LAN; A71 hashes originals; both distinct from native .NET managed QA and author claims.
- **A70:** no Unity implementation wave before A00 receives A20 audit, A11 history best-of, this A10 STOP/semantic annex and owner's signoff. No merge into main/RC1/W11 QA freeze/release.

**Handoff:** `AGENT=A10 | UNITY_SOURCE_SHA=7473ceb249086e35942999c093f2c42a91afd415 | EXECUTED=authenticated Unity/code/spec reads + policy decisions authored | SOURCE=PASS_SCOPED | STOP=DESIGNED_PENDING_OWNER | MIRAGE=V148_PRESERVATION_RECOMMENDED_OWNER_HOLD | MANAGED_QA=NOT_RUN | UNITY_PLAYER=NOT_RUN | LAN_P2=HOLD | IMPLEMENTED=DOCS_ONLY | INTEGRATED=NO | RELEASE=STOP`.
