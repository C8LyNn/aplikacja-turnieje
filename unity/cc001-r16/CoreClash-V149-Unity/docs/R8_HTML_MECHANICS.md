# R8 — native mechanics closer to V148 HTML

Continues the explicitly approved migration and the user's request to develop the game toward its HTML reference. This is a bounded extension of existing STOP/contact/structure handlers, not a new architecture or an exact-physics port. No further migration-planning approval checkpoint is required by the approved amendment in PROPOSED_DESIGN.md. No website files, Replit synchronization or deployment are authorized in this pass.

Reference remains the certified V148 final_candidate_r2 HTML in Downloads. Its content and the catalog/decks remain unchanged.

## Source-backed scope

- Pinballer STOP: an effective runtime radius-20 bumper near the closest arena edge, five enemy impact charges, restitution 1.42; source global structure limit 14. The actual V148 probe overrides the misleading raw `hits:3` / large-ball radius assumptions. Use bounded edge placement and a safe nearby fallback. Respect native free-placement/launcher rules and never overlap other balls/geometry. Friendly balls bounce without damaging their own structures. Bumpers persist after source death, matching the reference.
- Slingshot STOP: gather eligible allies within MEDIUM (165) and launch them together at 330 along its last movement direction with the source's slight fan. Native placement stays collision-safe. ROOTED/frozen allies are not displaced; this implements their intended immobilization rather than reproducing source forced-position quirks. No stock/player action is spent on these physical launches. Copy/repeat handlers reuse the same native STOP implementation.
- Ram HIT: first strong enemy ball contact per action adds min(7,2.5+impact*.010) impact damage, one-quarter recoil, and 118 outward impulse, respecting native force resistance/speed caps. SELF_ANY does not require Ram to be the initiating source. Keep per-action history on the authoritative ball and reset it on type transformation. The source's advertised structure bonus is disabled (`ramBreak=false`, line 25455); do not invent it. Mark Ram PARTIAL and explain the absent bonus in player copy.
- Technical timing: new late Slingshot motion renews an eight-second settling window, with a maximum of 28 seconds per action. Ordinary launches retain 14 seconds. This fixes an observed premature safety settle without removing STOP/repeat interactions or changing ball statistics. The authoritative host owns the deadline and includes it in snapshots.

## Implementation/verification

1. Observe focused outcome tests red before implementing: placement, cap/occupancy, three enemy vs friendly hits, Slingshot selection/immobilization/direction/blocked placements, Ram damage/recoil/action gating, Echo/Mimic and serialized snapshots.
2. Implement one pure mechanics partial using existing hooks, add truthful presentation copy/readiness and visible event feedback. Do not change numeric catalog records, canonical or featured decks, core turn/base/launch rules, or networking architecture.
3. Run the complete C# suite, legal local matches containing the new balls, native rendering, browser touch checks, three builds and real host/client state tests. Keep R7 evidence historical and record new evidence separately.
4. Independent review, fix material findings, document remaining limits and package a new local R8 delivery. Do not publish.
