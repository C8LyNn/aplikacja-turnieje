# Post-V148 archive: bounded presentation review

Source: `CC001_POST_V148_KOMPLET_PACZEK.zip`, research documents under
`CC001_POST_V148_VISUAL_RESEARCH/DOKUMENTY_BADAWCZE`. The archive is research
material. Its internal roles, gates and proposed mechanic mappings do not
override the current native runtime or authorize a release.

## Concrete gaps addressed

- The previous two-letter name prefixes produced 59 repeated mark groups;
  188 of 224 specials shared their displayed mark with another special.
  `BallIdentity` now assigns a mnemonic ASCII stem and, where needed, a base-36
  disambiguator, ordered by canonical ID with ordinal comparison. All 227
  catalog entries, including Standard and the two generated types, participate
  in the same mapping. Marks are unique, two to four characters long and stable
  under catalog reordering and culture changes. Board, launcher, tray and detail
  previews use that one mapping. Adding or renaming roster entries can change
  a collision group's labels; these labels are presentation, not saved IDs.
- Board ownership previously depended on a colored rim. It now also has a static
  `P1`/`P2` label. Independent state tokens preserve simultaneous ancestral,
  rooted, frozen, shield, divine-shield and armed states, plus active elemental
  and other runtime statuses. `abilityUsed` is not interpreted as a generic
  charge/spent state. Identity and health remain inside the circular body.
- Board details previously opened by type and showed catalog health, losing
  the selected instance. Runtime inspection now binds the instance ID and reads
  its current type, owner, health, shield and statuses on every render. It follows
  replacement network snapshots and distinguishes a ball that has left the board.
  The player sees the canonical name; raw IDs remain developer information.
  Detail text and scroll extent are measured at the available width so the
  added state information and long rule descriptions remain reachable.

## Inspection controls and authority

Right-click a board ball on desktop, or choose **INSPECT BOARD** and tap/click
either player's ball. The button also provides access to replay-eligible home
balls without starting their replay gesture. Cancel the mode with its button or
Escape. Ordinary launcher and replay drags retain their existing action route.
Inspection reads current state without submitting commands, and remains available
to a network client while the other player owns the turn or while a shot resolves.
It does not expand launch permissions, change clocks or pause authoritative play.

## Research basis

- `CC-001_T017_A82_MULTICHANNEL_SYSTEM_RECOMMENDATION_001.md`, section 2,
  lines 61–75: distinguish ownership, exact identity, current state and event
  feedback; keep the circular physics boundary truthful. Sections 3.1–3.4,
  lines 79–105, and section 4, lines 118–125: persistent non-hue ownership,
  static actionable state, and precise inspect-level confirmation.
- `CC-001_T017_A83_MULTICHANNEL_UX_RECOMMENDATION_001.md`, section 8,
  lines 152–170: non-hue alternatives and inspection without hover. Section 9,
  lines 180–187: small-size loss needs accessible exact information. Section 10,
  lines 192–205: canonical identity, current statuses and truthful rule details.
- `CC-001_T019_A83_INSTANCE_DIFFERENTIATION_001.md`, section 4,
  lines 67–95: engineering uniqueness, visible uniqueness and learned recognition
  are separate claims; comparisons must use actual neighboring identities.

## Verification and limits

`IdentityPresentationTests` covers all 227 marks, order/culture stability,
ASCII fallback, instance binding across state replacements, independent
simultaneous states and read-only hit testing without active-owner restrictions.
An isolated scratch driver demonstrated the missing behavior first and then
passed all six tests without writing `Evidence` artifacts. The main test runner
includes these tests; the root task owns the final suite/build and runtime QA.

This is no claim of human recognition efficacy, WCAG certification or 16-pixel
legibility. Dense overlaps can still obscure board labels; the explicit inspector
provides full confirmation. The proposed family-frame language, 224-icon artwork,
source/target graphics, A/B/C experiments and reduced-motion controls remain
separate work. No abilities, physics, numerical rules, roster, deck data or network
message format are changed by these presentation improvements.
