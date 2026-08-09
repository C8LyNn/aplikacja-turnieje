# ADR: Configurable seeding and placement v2

## Status

Proposed in Patch 04. Patch 03 remains the pure domain implementation; this ADR describes persistence, API and organizer UI integration.

## Context

Tournament Engine v2 separates three decisions that were previously implicit:

1. **entry seeding** — how incoming participants receive stage seeds;
2. **placement** — where those seeds are placed in groups or a bracket;
3. **result reseeding** — how qualifiers receive seeds for the next stage.

The same random result must be reproducible, auditable and suitable for a later live wheel presentation. Animation is presentation only and must never be the source of truth.

## Decision

Each persisted stage stores:

- `entry_seeding_policy`: `preserve`, `registration_order`, `alphabetical`, `random` or `manual`;
- `seeding_policy`: format-specific placement (`standings_order`, `snake_groups`, `random_groups`, `standard_bracket`, `random_bracket`);
- `result_seeding_policy`: `standings_order`, `rank_bands` or `global_ranking`;
- optional deterministic `random_seed`;
- `random_reveal_order`: `instant` or `sequential`;
- optional immutable start-stage `seeding_audit` JSON snapshot.

The stage plan API exposes user-facing equivalents:

- `entrySeedingMethod`;
- `placementMethod`;
- `resultSeedingMethod`;
- `randomSeed`;
- `randomRevealOrder`.

Old plans and Backup V3 documents remain valid through defaults:

- entry: `preserve`;
- group placement: `snake`;
- bracket placement: `standard`;
- group result: `rank_bands`;
- reveal: `instant`.

## Runtime rules

At stage start the server, inside the existing transaction:

1. locks the stage, memberships and players;
2. validates the incoming membership/source chain;
3. computes one complete seed permutation with the Patch 03 engine;
4. persists stage participant seeds;
5. computes group/bracket placement;
6. generates matches;
7. stores the audit together with the active-stage transition.

A random policy is invalid without a non-empty key of at most 200 characters. The same key and participant input produce the same assignment. Random placement uses a deterministic derived stream `<key>:placement`; this prevents simultaneous random entry seeding and random placement from mathematically cancelling each other.

For group results:

- `rank_bands` keeps every group winner before every runner-up, etc.;
- `global_ranking` compares qualifiers across groups using per-match normalized results, then group rank and previous seed as deterministic tie-breakers.

## UI

Basic creation remains unchanged. Advanced options are hidden in a native expandable section. The organizer can select policies and see a deterministic preview before creating the tournament.

Sequential reveal only records the intended presentation order. The animated wheel, pause/resume and stream presentation are deferred.

## Compatibility and deployment

Migration `0004_configurable_seeding_v2.sql` is additive except for safely expanding the PostgreSQL placement enum. It updates existing stage rows to format-valid defaults. Guarded preflight/migration scripts require the `flexible_group_stages_v2` marker and write `configurable_seeding_v2` only after schema verification.

Backup V3 exports the new fields, while imports accept older V3 documents with the defaults above. Backup V2 conversion remains unchanged.

## Deferred

- full wheel animation and public draw screen;
- manual drag-and-drop placement slots;
- custom ordered tie-breaker builder;
- rank systems, pots and team-avoidance constraints;
- reseeding after every elimination round.
