# ADR: Flexible Group Stages v2

## Status

Proposed for the `feat/tournament-engine-v2` branch. This change extends the existing Tournament Stages V1 runtime without replacing the Tournament Engine V2 foundation.

## Context

The original group-stage implementation accepted only two or four equal-sized groups and only one or two qualifiers from every group. It also assumed that a group stage always fed a single-elimination play-off using a fixed cross-group slot mapping.

Those restrictions prevent common plans such as:

- 17 participants split into groups of `5, 4, 4, 4`;
- 32 participants split into seven groups of `5, 5, 5, 5, 4, 4, 4`;
- all participants advancing, with the group stage used only to calculate new seeds;
- a group stage feeding another league or group-like stage rather than a play-off;
- more than four groups.

## Decision

### Balanced group allocation

For `N` participants and `G` groups:

- `1 <= G <= floor(N / 2)`;
- every group contains at least two participants;
- group sizes differ by at most one;
- larger groups are created first;
- group sizes are derived by the server and are not independent configuration.

Examples:

- `17 / 4 -> 5, 4, 4, 4`;
- `32 / 7 -> 5, 5, 5, 5, 4, 4, 4`;
- `40 / 6 -> 7, 7, 7, 7, 6, 6`;
- `32 / 16 -> 2` in every group;
- `32 / 17` is invalid.

Participants continue to be assigned by capacity-aware snake seeding. Group labels are generated as `A..Z, AA..AZ, ...`.

### Qualification

`qualifiersPerGroup` is a maximum applied to each real group size:

`qualifiers(group) = min(groupSize, qualifiersPerGroup)`.

The accepted range is from one through the largest derived group size. Therefore an uneven group stage can allow every participant to advance by selecting the largest group size. Smaller groups then also advance everyone.

A non-final group stage must still send at least two participants to the next stage because the current V1 stage-plan contract requires every stage to contain at least two participants.

### Rank-band reseeding

Qualified participants receive consecutive new seeds. Ordering is calculated in rank bands:

1. all first-place participants;
2. all second-place participants;
3. all third-place participants;
4. and so on.

Within one rank band, ties are resolved deterministically by:

1. match win rate;
2. game differential per match;
3. game wins per match;
4. previous stage seed;
5. group key;
6. player ID.

Rates are normalized because uneven groups can produce different numbers of matches.

When everyone advances, no participant is marked eliminated. The completed group stage acts only as a classification and reseeding stage.

### Next-stage placement

The next stage receives seeds `1..N` in the calculated order. A single-elimination stage uses the existing standard seeded-bracket placement, so the strongest seed is paired against the weakest seed and top seeds are separated across the bracket. Non-power-of-two participant counts are supported through BYEs.

The group stage may also feed a supported non-elimination stage. Qualification source remains `group_position` and the new seeds are preserved.

### Persistence and API

A new migration removes the old fixed group constraints and installs constraints based on balanced derived sizes. `group_key` is now a non-empty string rather than an `A-D` enum-like API type.

`participantsPerGroup` remains persisted for compatibility, but it is derived and must equal `ceil(participantCount / groupCount)`.

Backup V3 export/import and validation use the same balanced-group rules.

## Compatibility

- Existing single-stage tournaments are unchanged.
- Existing Swiss and Round Robin behavior remains unchanged. A later participant-flow amendment permits Single Elimination to be a non-terminal qualifying stage when its output is a complete round boundary.
- Existing stage-plan limits remain in place, including the maximum of three stages. Every linear transition must now reserve exactly the number of participants output by its source stage.
- The old `group-playoff` module is retained for compatibility/history but is no longer used to assign new seeds for newly completed flexible group stages.
- No automatic deployment or push is part of this patch.

## Validation requirements

Before acceptance, Codex must run:

- all unit tests;
- all integration tests against a temporary PostgreSQL instance;
- typecheck;
- build;
- `git diff --check`;
- production and development read-only migration preflights where the environment permits it.

The migration must be applied only after its guarded preflight reports `needed`, and a second preflight must report `applied`.
