# CC-001 — VISUAL RECOVERY SPEC / A20 UX AUDIT ANNEX

**W20 · 2026-11-03 · A20 UX/UI & Game Feel · SPEC ONLY, NO GAME CODE**
**Master:** [VISUAL RECOVERY SPEC / A00 Draft PR #314](https://github.com/C8LyNn/aplikacja-turnieje/pull/314) and [master issue #313](https://github.com/C8LyNn/aplikacja-turnieje/issues/313). This annex supports the ONE canonical A00 spec; it does not replace it.
**Unity source:** [#309](https://github.com/C8LyNn/aplikacja-turnieje/pull/309) @ 7473ceb249086e35942999c093f2c42a91afd415, game-code build parent fb5eb505d861a4f8f44a34321020ad71a0ba1710. **W11 QA freeze unchanged:** 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3.
**Catalog source:** Assets/Resources/Data/catalog.json, Git blob 65874e0078949a21219af056b5e26d296ba65d76. [Full 227-name/mark inventory](CATALOG_227_NAME_MARK_AUDIT.csv).

## 1. Evidence contract

- **SOURCE_CONFIRMED:** authenticated GitHub exact C# and JSON readback. This proves source behavior/risks, NOT that a human saw it in the current Player.
- **HISTORY_SOURCE:** bounded direct reading of historic V122-named HTML drawBall. Its filename/version provenance is unresolved until [A11 #315](https://github.com/C8LyNn/aplikacja-turnieje/issues/315); do not rank entire HTML versions from one snippet.
- **SCREENSHOT_REPORT:** independently described earlier #308 screenshot overlaps and Claude-reported #309 repairs; screenshot review is NOT independently executed Player QA. Prior forwarded PNG 05–07 copies had altered dimensions and unmatched original hashes.
- **INDEPENDENT_NATIVE:** A20 did not run Unity, .NET9 managed C#, Windows Player or physical PC1–PC2 flipped LAN. A60 is the runtime owner; status NATIVE_HOLD.
- **OWNER LOCK:** numeric current HP always outside a live ball; no default per-orb P1/P2 text; colors still denote owner; STOP ON/OFF must be available for every implemented mode, estimator not removed; V148 Mitosis, Furnace FIRE-only periodic DoT, HP R16, Protocol149, frozen SHA and RC1 untouched.

## 2. Current Unity: defect / redundancy / interference matrix

| Priority | Actual file and code condition | UX effect | Evidence | Recovery requirement |
| --- | --- | --- | --- | --- |
| P0 | **BallView.cs** approx L45–52 puts type mark and current numeric HP as two lines INSIDE orb | Crowds centre, undermines recognizability, makes both text sizes small | SOURCE_CONFIRMED | Move exact current HP outside, leave only one mechanical type icon centrally |
| P0 | **BallView.cs** approx L54–58 paints separate P1/P2 chip while colored team rim already exists | Duplicate ownership, consumes upper-right external HP lane | SOURCE_CONFIRMED | Remove default P1/P2 chip; use team color and at most one optional non-hue geometric cue |
| P0 | **BallIdentity.cs** reduces names to first two ASCII chars + base36 suffixes | Unique mark is not semantically meaningful; 191/227 entries belong to repeated stem groups | SOURCE_CONFIRMED + full catalog census | Replace with semantic icons keyed by canonical ball ID, no gameplay ID rename |
| P0 | **BallView.cs** displays unlimited status rows below, R chip top-left and gold Replay halo | Multiple independent labels compete with balls, STOP, damage banner, launcher | SOURCE_CONFIRMED | One priority budget, status overflow via Inspect; HP and input target never sacrificed |
| P0 | **BoardView.cs** RenderStopEstimate draws path/ring/crosshair/EST. STOP and qualifier | Rich coaching may reduce independent aiming; affects agency and cognitive load | SOURCE_CONFIRMED; skill effect HYPOTHESIS | Preserve estimator, mode-wide ON/OFF, A10 owns defaults and fairness |
| P0 | Pre-#309 screenshot showed BASE DAMAGE over R/ball and Replay count over launcher; #309 introduces collision-aware planning | Information decorations may block game pieces and drag affordance | PREVIOUS SCREENSHOT + #309 SOURCE | Treat #309 as baseline and re-audit keep-outs AFTER HP moves; do not duplicate its BoardView implementation |
| P1 | **BoardView.cs** RenderMarginNotes returns when frame band is below 8px | If all in-field slots full on a narrow board, last-resort banner/counter disappears | SOURCE_CONFIRMED CONDITIONAL | Provide explicit alternative HUD slot/zoom/scroll instead of silent elision; no new patch before A70 gate |
| P1 | **MatchView.cs** uses raw English catalog names with descriptions largely Polish; variable-size cards | Uneven information hierarchy and localization, long names distract from actions | SOURCE_CONFIRMED | Separate stable ID, localized displayName, mechanic role, icon and full description |
| P1 | Team rim, catalog type tint, gold Replay, statuses, wake trails and zone glow stack together | Color and animation carry too many meanings simultaneously | SOURCE_CONFIRMED | Define independent role for each channel, reduced-motion and non-color owner cue |
| P1 | **BallInspection.Statuses** creates labels; **BallView.Render** computes states and **BoardOverlayPlanner.KeepOuts** recomputes them per draw | Extra string/collection work on high-density boards | SOURCE_CONFIRMED call pattern, performance NOT_MEASURED | Measure GC Alloc, P95 frame time and IMGUI passes for 22+ balls before optimization |
| P2 | **SetupView.cs** has four featured cards, nine-orb previews, builder readiness filters and local start | Historic HTML may have clearer mode discovery, but not every old mode exists in Unity | SOURCE_CONFIRMED, HTML comparative PENDING_A11 | Consider progressive disclosure only after side-by-side proof |

**Exact source anchors:** [BallView](https://github.com/C8LyNn/aplikacja-turnieje/blob/7473ceb249086e35942999c093f2c42a91afd415/unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BallView.cs) blob 94151cc19e4432c6cad88aa5bbf199b2fc4791b8; [BallIdentity](https://github.com/C8LyNn/aplikacja-turnieje/blob/7473ceb249086e35942999c093f2c42a91afd415/unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BallIdentity.cs) blob 7d7e97696f871cee379f29901487ec9ee76e37f6; [BoardView](https://github.com/C8LyNn/aplikacja-turnieje/blob/7473ceb249086e35942999c093f2c42a91afd415/unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/BoardView.cs) blob 6d92ed05c68b2ebdb26aa4e5acd3acc21b0de921; [MatchView](https://github.com/C8LyNn/aplikacja-turnieje/blob/7473ceb249086e35942999c093f2c42a91afd415/unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/MatchView.cs) blob 5b82ac3561cc4388b7db86ea17df9d119e0a601c.

### 2.1 Narrow-board source condition: reproducible arithmetic, NOT Player FAIL

- World-space arena top field margin = 16 units, transformed to 16×boardWidth/540 pixels.
- When width is 248px, the frame band is approximately **7.35px**. BoardView.RenderMarginNotes returns if band is below 8px.
- Consequently, any banner/Replay counter unable to fit on field and relegated to this frame **cannot render at that width**. The upstream placement failure is *conditional* and not observed on a live Player here.
- Current W19HudCollisionTests includes a 248px board in its planner matrix and a 640px packed-board no-slot case, but does not exercise end-to-end visibility of the 248px fallback. Add a specific native test after A70 assigns implementation owner.

## 3. BALL_VISUAL_CONTRACT v0.1 — A20 PROPOSAL

**Semantic source:** actual ball circle centre/radius/owner and BallRuntime.hp are authoritative. Presentation-only changes must never alter physics, command paths, Replay eligibility, shield or base HP.

| Channel | Default gameplay target | Inspect/accessibility | Constraint |
| --- | --- | --- | --- |
| Ball type | One large, meaningful single-color icon centred in the sphere, with catalog-tint body behind it | Full localized name, role, trigger, exact rule | Art chosen by immutable ball.id; ASCII mark only explicit missing-art fallback |
| Current HP | **One exact integer badge outside the perimeter**, preferably upper-right, high-contrast capsule | Current/max/shield as distinct values | Always actual BallRuntime.hp, never maxHP, percentage or shield+HP |
| Owner | Existing cyan/rose ring; at most one *non-text* geometry cue after testing (e.g. one vs two ticks under sphere) | Explicit P1/P2 in HUD and Inspect; optional debug/accessibility | Owner is intrinsic owner ID, not upper/lower screen position in flipped P2 |
| Replay | Gold static ring and R upper-left only when canonical CanReplay is true | Explanation of legal/illegal Replay | Must preserve pointer hit area and not overlap HP or launcher |
| Status | One current actionable state or compact overflow indicator by priority | Full independent state list in Inspect | Do not merge unrelated effects into a false single state |
| Motion | Subtle trail and state FX; no decorative overlay on hit targets | Reduced-motion variant preserves static state signals | Must not fake movement or teleport |
| STOP | Existing estimate only when A10-approved preference is ON | Off suppresses prediction display without changing command or physics | No gameplay/Protocol changes |

### 3.1 Geometry: one external HP lane, one Replay lane, no owner chip

- **Primary HP anchor:** upper-right outside r plus scaled gap (roughly 1–2 o'clock). Exact visual font/spacing chosen by testing, suggested readable >=11 logical pixels and 4.5:1 text contrast. Don't treat either as a measured current PASS.
- **Nonoverlap:** reserve true HP bounding box FIRST in BoardOverlayPlanner keep-outs, R chip remains upper-left, owner geometry could occupy bottom, status below only when space exists; remove prior P1/P2 chip keep-out rather than leaving unused space.
- **Wall fallback:** fixed deterministic candidate order upper-right → right → upper-left → lower-right; avoid oscillating anchor every rendered frame by hysteresis. Use a leader line if label must be separated from circle.
- **Crowded scene:** 22–40 balls at a 248px board may make simultaneous non-overlap of every exact HP value *mathematically impossible*. Do not silently replace numbers with percentages or hide them. Design zoom/pan or keyed external HP rail with connection lines, keeping exact numeric information recoverable. OWNER DECISION REQUIRED whether strict all-at-once visibility outranks a minimum view scale.
- **Network:** remote smoothing may interpolate the render position but the HP number comes from latest accepted authoritative snapshot. One label per live id; no stale badge after death/banish/removal.
- **Priority:** interactive silhouette > current HP > type icon > legal Replay > urgent status > STOP estimate if enabled > recent damage banner > decorative FX. Preserve exact cause of base damage or display honest ambiguous cause; never infer details not carried by source data.

### 3.2 Accessibility and visual meaning

Keep three independent semantic channels: owner = rim + optionally geometric code; ball type = centre silhouette/tint; actionable Replay = gold R; HP = neutral integer. Preserve owner in Inspect and HUD. Test grayscale and color-vision simulations on both physical perspectives, low visual scale, reduced motion and 44-logical-pixel touch targets. One designed geometric code is preferable to a stack of P1/P2, arrows and competing colors. The gold Replay pulse must have a static non-motion state.

## 4. Complete catalogue audit: naming vs iconography are separate P0 defects

Actual catalog census: **227 ball IDs, 227 distinct names, 12 archetypes; 64 multiword names; 12 names longer than 12 chars; 1 name with non-ASCII character**. Current BallIdentity maps them to **95 two-character stems**; **59 repeated-stem groups cover 191 balls (84.1%)**, with base36 suffixes that avoid code collisions but are not semantic drawings. See full [227-row CSV inventory](CATALOG_227_NAME_MARK_AUDIT.csv). Every row holds ID, name, archetype, derived mark, stem group size, name length/word count, review flags and a brief catalog-description excerpt. Heuristic flags mean REVIEW, not that every flagged name is bad.

**Concrete confusion sets:**
- Stem **RE** = 11: Reflector, Regenerator, Replicator, Relay, Requiem, Revenant, Repair Pulse, Recycler, Resurrector, Reclaimer, Relentless.
- Stem **CO** = 8: Colossus, Conductor, Collector, Commander, Conscriptor, Contagion, Control Beacon, Consecrator.
- Stem **FR** = 6: Frost, Frostgrave, Frost Bomb, Frostguard, Frost Path, Frost Trap.
- Stem **MI** = 6: Mine, Mimic, Mitosis, Mirage, Miasma, Mirecloak.
- Similar first letters are **not** shared mechanics. One fire icon cannot represent Fire, Furnace, Firebrand and different fire trails without modifier language.

**New four-layer naming and icon scheme, not yet approved:**
1. **Canonical ID:** untouched for saved decks, data, network and reference semantics.
2. **Localized displayName:** 1–2 words when possible, mechanical distinction before poetic embellishment; decide product locale (catalog mixes English names and Polish descriptions). Do not quietly rename canonical keys.
3. **Role/trigger:** one validated semantic role among STRIKE, CONTROL, PROTECT, RESTORE, CREATE, MOVE; independent timing chip ON HIT, ON STOP, EACH TURN, ON DEATH, PASSIVE. These tags require A10 runtime validation, not just legacy text (some data rows are DATA_ONLY).
4. **Icon:** ball.id → approved monochrome visual asset; one main silhouette plus at most one role modifier, readable at 24, 32, 48px. Missing artwork uses an honest placeholder + readable name, not a misleading icon. Preserve text-based alternative for accessibility.

### 4.1 Pilot icon taxonomy (24 examples, proposals only)

| Canonical ID / current name | Mechanic cue to validate against implementation | Pilot silhouette |
| --- | --- | --- |
| normal / Standard | neutral core | single central orb |
| bounce / Bouncer | bounces | angled reflection |
| fire / Fire | burning contact | flame + contact notch |
| ice / Frost | freezing touch | ice crystal + contact notch |
| furnace / Furnace | limited FIRE zone and periodic damage | kiln + bounded fire rim |
| mitosis / Mitosis | first contact splitting | Y branching into two orbs |
| mine / Mine | armed STOP trap | circular mine + triangle trigger |
| medic / Medic | radius healing | plus + radial line |
| shield / Shield | ally shield | kite shield + outward wave |
| phoenix / Phoenix | death/return hand loop | broken feather + return arrow |
| gatekeeper / Gatekeeper | paired portals | two linked circles |
| warp / Warp | opposite wall transport | paired edge portals |
| relay / Relay | linked boost | three connected nodes |
| horizonrelay / Horizon Relay | singularity consume and base impact, needs A10 validation | staged relay to base |
| quartermaster / Quartermaster | repeated Standard token | crate issuing a small orb |
| replicator / Replicator | clone at current HP | matching twin circles |
| brood / Brood Core | HP cost for small offspring | parent/small orb |
| hatchery / Hatchery | periodic Broodling | shell + emerging orb |
| timebomb / Time Bomb | delayed fuse | clock ring + fuse |
| staticfield / Static Field | area disruption | interrupted radio waves |
| blightpool / Blightpool | toxin zone on STOP/TURN, needs A10 validation | puddle + toxin dot |
| rimeburst / Rimeburst | frozen interaction, needs A10 validation | shattered snow crystal |
| mirage / Mirage | illusion/copy positions | solid orb + two ghost outlines |
| singularitycore / Singularity Core | persistent pull | inward three-point spiral |

**Names and icons acceptance:** test 24-icon pilot before the other 203. For each: source ID, localized name, verified ability, role, trigger, silhouette/alt text, visually close neighbours, small-size + grayscale recognizability. Proposed experimental goals only: >=80% role/family top-1 identification from icon alone after short exposure and >=90% icon+name match from eight choices; record false-positive confusion, not only percent. Do not ship mass-generated 227 icons or rewrite catalog names without human recognition data. Selected candidate renames are **pending**, not asserted facts of gameplay.

## 5. Selective HTML recovery input to A11, not a duplicate historical verdict

Direct original [V122-named HTML archive](https://github.com/C8LyNn/aplikacja-turnieje/blob/7473ceb249086e35942999c093f2c42a91afd415/artifacts/tournament-manager/public/portfolio/docs/evidence/core-clash-v122-archive.html) contains in its drawBall block: segmented HP ring at **1 segment / 5 Max HP**, exact current integer **above the orb in detail==2**, cheap arc-only proportional view at detail==0, and a small triangle under orb for owner without P1/P2 text.

| Historical detail | A20 verdict | Caveat |
| --- | --- | --- |
| External numeric current HP | **PORT concept** — now owner-locked | Always numeric, not conditional on display quality |
| Nontext triangular owner marker | **PORT principle** — evaluate one/two ticks | Need actual P1/P2 and grayscale readability |
| HP segments per 5 max HP | **OPTIONAL secondary decoration** | Must not obscure exact current HP or imply rule change |
| Lower-detail effect path | **PORT adaptation to crowding** | No wholesale copying of legacy animations |
| HTML mode cards | **RESEARCH then selectively port layout cues** | Old HTML mode existence ≠ current Unity capability |
| Old mechanics, source network, save restore | **DO NOT PORT** | Protected V148/Protocol149 and known archived regressions |

A11 alone owns the final best/worst version ranking with matching screenshots, exact version SHA and do-not-port list. This A20 annex only captures one verified historical pattern.

## 6. STOP preview UX contract (A10 decision pending)

Do NOT remove STOP. Preserve available per-mode ON/OFF in every **implemented** Unity mode; A10 sets default per mode, whether choice is local/session-shared, competitive information fairness and change timing. HQ v0.1 defaults are **provisional**.

- **ON:** EST. STOP label, projected ring/curve, truthful IF PATH CLEAR qualifier when obstructed; never guarantee future ability/contact result; keep independent aim/readiness cues and Replay legal-state controls.
- **OFF:** no projected end marker/ring/path/caption and no hidden expensive prediction; same pointer command, canonical physics, random seed, turn, HP and network output as ON for identical input.
- In LAN PvP, no hidden advantage on the client; expose session policy to both players. Avoid Protocol149 changes without owner authorization.
- A/B measurements: first-shot delay, targeting time, bounce prediction accuracy, agency confidence, opt-out, win variance by novice/expert; both OFF and ON tested per mode. This is a hypothesis study, not verified balance.

## 7. Visual acceptance matrix (DESIGNED, TESTS NOT RUN)

| Test ID | Required evidence / falsifiable success | Scene | Owner |
| --- | --- | --- | --- |
| UX-HP-01 | Exact BallRuntime.hp outside physics circle for every live ball; distinct from max HP and Shield | 1/8/22/40 balls, damaged/shielded, dying, return and remote snapshot | A20/A60 |
| UX-HP-02 | Number never silently disappears; wall/crowded fallback preserves exact source binding and no click interception | desktop 1280×900, 1920×1080, 1366×768, 1024×768; portrait 768×1024 and 390×844; short 568×270 | A20/A60 |
| UX-OWN-01 | Default per-orb P1/P2 text OFF, owner still recognizable in grayscale + P2 flipped LAN, no hue-only dependence when accessible mode ON | P1, P2, 24px preview and physical LAN client | A20/A60 |
| UX-ICON-01 | Icon distinct among RE/CO/FR/MI confusion sets; meaning correct against real effect; name and icon agree | 24-icon pilot, then 227 | A20/A10 |
| UX-REPLAY-01 | Gold R only for true CanReplay; legal drag works; turn/stock correct; counter/banner never obscure launcher/ball | both owners, 22+ balls, compact, portrait, LAN | A60 |
| UX-STOP-01 | Same canonical outcomes for same actions ON vs OFF; mode matrix and no false precision | empty/blocked path, wall, replay, every implemented mode | A10/A60 |
| UX-READ-01 | No overlap of mandatory HP, type, Replay, STOP, status and BASE DAMAGE; all status details still reachable | 1/8/22/40 balls, moving, pause/reconnect, reduced-motion | A20/A60 |
| UX-PERF-01 | GC Alloc/frame and P95 frame time measured before/after, no unexplained increase | 22+ moving balls and active drag, desktop/portrait | A60/A50 |
| UX-PROTECT-01 | Source diff preserves V148, Protocol149, Mitosis V148, Furnace FIRE-only DoT, HP R16, QA freeze, RC1/main | exact object compare + original native Player provenance | A71/A70 |

Use original unmodified screenshots, source SHA, full Player path/size/SHA inventory, P1/P2 state and physical device IDs. **No independent screenshot or Player PASS is asserted by A20.**

## 8. Handoff / spec gates

P0: approve exact HP external badge and impossible-density fallback; approve owner non-text encoding; test 24 named/icon pilot; wait for A11 HTML provenance and A10 STOP per-mode defaults; reconcile into **one** canonical HQ PR #314. P1 after owner/A70 dispatch: single-owner coordinated BallView and keep-out update and native A60 regression, no duplicate Claude BoardView rewrite. P2: optional 5-HP ring, adaptive effects, historic mode cards after comparative evidence.

**AGENT=A20 | SOURCE_SHA=7473ceb249086e35942999c093f2c42a91afd415 | EXECUTED=GitHub BallView/BallIdentity/BallInspection/BoardView/MatchView/SetupView + full catalog census, bounded historic HTML review | STATUS=SOURCE_AUDIT_COMPLETE / VISUAL_CONTRACT_PROPOSED / A11+A10_PENDING / PLAYER_NATIVE_HOLD | EVIDENCE=this annex + 227-row CSV | BLOCKERS=owner sign-off, A11 history, A10 mode policy, A60 real images/PC1–PC2 | NEXT=A00 integrate approved A20 material into canonical #314, A70 keep implementation HOLD / RELEASE STOP.**

## 9. W20 A20 verification addendum — clipping, smoothed poses, HTML HP exception (2026-11-03)

**This addendum is source-verified UX contract refinement on the existing A20 Draft PR.** It does not change any C# source. It integrates distinct implementation/evidence risks identified after A20 v0.1 in [A33 review](https://github.com/C8LyNn/aplikacja-turnieje/issues/313#issuecomment-6615872630), [A44 evidence protocol](https://github.com/C8LyNn/aplikacja-turnieje/issues/313#issuecomment-6615876713), and A20 direct GitHub reads at immutable SHA 7473ceb249086e35942999c093f2c42a91afd415.

### P0-01 — external HP must remain visible at the clipped field border

**Source fact:** BoardView.Render computes visible field as Box(board,Left,Top,Right-Left,Bottom-Top), enters GUI.BeginGroup(field), then invokes BallView.Render **inside that clipping group**. Merely translating the existing current-HP label outside the orb may clip it at the top/right/left/bottom boundary. The current code is not a new exterior-HP Player; this is a PRE-IMPLEMENTATION RISK, not a reproduced failure.

**Contract:** one coherent presentation geometry plan takes (ball ID, rendered centre, physics radius, field rect, viewport scale, view owner, eligible Replay, visible state tokens) and returns body bounds, visible external HP box, Replay box, prioritized status boxes, all keep-outs and any leader-line endpoint. The same rectangles must drive drawing and banner/counter collision avoidance; no duplicate independent magic constants in BallView and BoardOverlayPlanner. Prefer to keep the HP label inside the visible field but **outside the sphere**. If impossible at the boundary, propose a visually connected rail/outer pass with explicit field/group-coordinate conversion and zero hit-test interception; A20/A10/owner must choose. Never silently clip/omit exact current HP.

**Source-target checks:** exact ball at each of the four walls and corners, 1/8/22/40 balls, P1 & flipped P2, 390x844/568x270 plus desktop. A rendered HP capsule must not overlap owner, gold R, launcher, STOP, base-damage banner, ball tap area, nor disappear behind the field clipping group. Compare actually rendered bounds, not only pre-layout geometry.

### P0-02 — do not confuse canonical HP state with the visual pose

**Source fact:** BoardView.Render uses remoteVisual.TryGetPosition to interpolate renderX/renderY during Moving and sends them into BallView.Render, whereas BoardOverlayPlanner.KeepOuts currently derives rectangles from canonical b.x/b.y; they may differ on remote clients. MatchPerspective.ViewY returns 900-simulationY for local P2, without changing canonical ball.owner.

**Contract:** current integer HP comes from latest accepted authoritative BallRuntime.hp; its POSITION and reserved overlay rectangle track the **same actual rendered ball pose** as the orb. Use the one projection and render pose across type icon, HP, status, Replay, collision avoidance and eventual leader line. Never animate current HP to mean a value that has not been received. Keep Replay legality tied to authoritative state and displayed P2 ownership tied to real ball.owner, not top/bottom orientation. This is an architectural spec, **not** authorization to change networking or smoothing.

### P0-03 — historical Mirage Ghost is an actual unresolved semantic exception

**Direct original-source evidence:** historical file path contains v122, but its HTML title is **Core Clash — V121 Keyword Semantics**; do not label it an independently verified V122 runtime without A11 provenance confirmation. In its drawBall, a historical ghost with isMirageGhost can copy its parent displayHp/displayMaxHp. The external integer HP label appears only at detail===2; at detail===0 only the cheap ring appears. Therefore historical *placement* is useful, but historical *conditional visibility* violates the owner's new always-numeric HP rule, and a raw-instance HP value might be a **mechanically significant deception reveal** if V148 intentionally hides ghost identity.

**Owner/A10 arbitration needed before a final unqualified HP contract:** confirm exact protected V148 Mirage Ghost state and whether deception requires displaying copied parent HP. If yes, define an explicit approved *displayed HP* projection for ghosts that retains outside numeric visibility without revealing hidden identity; actual HP still remains authoritative in simulation and debug Inspect according to permissions. If not, use BallRuntime.hp. **DO NOT choose by assumption and do not change V148 rules.** A11 owns historical title/version provenance.

### P1-04 — separate HP meaning in match, builder and returned-hand entry

**Source/use distinction (A32's data contract):** live board HP is BallRuntime.hp; a catalog/deck card's BallDefinition.hp describes initial/spawn HP, while a returned Phoenix Hand can carry a separate current hand HP. Card copy should distinguish START HP, RETURN HP and CURRENT HP, all with correct sources; never use one generic HP label with an unrelated authoritative value. A hand-ready indicator must remain readable during the opponent turn without making the card actionable. A20 owns visual grammar; A32/A10 verify semantics and authorizes no change to catalog, hand stock or nine-card constraint.

### P1-05 — avoid contradictory action hint after simplifying Replay

**Source fact from MatchView:** the main status prompt can correctly say opponent's turn/disconnected, while a secondary sentence on desktop says a glowing home ball can Replay before spawning without the same current seat/eligibility guard. Compact/phone display short cues instead and may not teach where to start Replay drag. A21 already documented this discrepancy in [#313](https://github.com/C8LyNn/aplikacja-turnieje/issues/313#issuecomment-6615863058), and its old PR stack is NOT integrated into #309.

**UX contract:** context-aware copy states the **current valid action and its origin**. Display a Replay instruction only for eligible canonical CanReplay and local actionable phase, not when disconnected, opponent turn, Moving, Over or Inspect. On phone/compact, explicitly teach dragging the gold-marked home ball while not hiding basic launcher instructions. Preserve existing input authorization, no text-only attempt to expand privileges. Source risk, no live human comprehension PASS.

### Gate consequences / do-not-implement

These are **ACCEPTANCE REQUIREMENTS, not approved patches**. Before one-owner BallView/BoardLabelLayout/BoardView implementation: A20+A10/owner approve clipping/rail strategy and Mirage disclosure; A11 identifies actual historical source version and matched-original screenshots; A70 preserves single-file ownership. After implementation: A60 original-window screenshots, true replay drag, two physical LAN seats, and P2 swapped view; human comprehension/STOP study separate. Native Player remains NOT_RUN by A20, release STOP. A00 owns canonical PR #314 and may selectively fold these clauses; no competing master document.

