# ADR: Universal seeding and placement engine V2

## Status

Proposed by Patch 03. This patch introduces the reusable domain engine and replaces duplicated standard bracket/group logic. It deliberately does not add new database columns or organizer-facing controls yet.

## Context

The existing runtime mixed three different responsibilities:

1. calculating a participant's seed;
2. placing a seed in a group or bracket;
3. generating matches from that placement.

Group-stage reseeding was hardcoded inside `group-stage.ts`, while single-elimination bracket positions were independently implemented in both the stage lifecycle and the legacy route. That made later additions such as alphabetical seeding, public random draws, manual order, random group placement and round reseeding risky and inconsistent.

## Decision

Introduce two pure domain modules.

### `seeding.ts`

The module converts participant data into a contiguous seed order. Supported policies:

- registration order;
- alphabetical order;
- preserved previous seed;
- manual seed permutation;
- deterministic random seed assignment;
- ordered criteria;
- rank bands with independent criteria inside each band.

Random assignment requires a non-empty persisted random seed. It returns an audit record with both the final seed order and sequential draw records. The `participant_order` reveal mode directly supports the planned wheel animation: participant 1 draws one remaining seed, then participant 2, and so on.

The random generator is deterministic and portable, but intentionally not cryptographic. Fairness comes from publishing and storing the random seed and resulting audit, not from treating the generator as a security primitive.

### `stage-placement.ts`

The module decides where already seeded participants appear. Supported pure operations:

- canonical standard seeded bracket;
- arbitrary participant counts with BYE slots;
- deterministic random bracket placement;
- strongest-versus-weakest reseeding for a future dynamic-round runtime;
- balanced snake group placement;
- deterministic random group placement.

Seed assignment and placement remain separate. Random placement does not rewrite the participant's original seed.

## Runtime integration in Patch 03

- flexible group-stage snake assignment now uses the shared placement engine;
- group qualifiers now use the shared rank-band seeding engine;
- stage-aware single-elimination generation uses the shared canonical bracket engine;
- legacy single-elimination generation uses the same canonical bracket engine;
- duplicate local bracket-position algorithms are removed.

The live behavior remains the current default:

- group input placement: snake;
- group output seed assignment: rank bands by group place;
- single elimination: fixed standard seeded bracket;
- top seed receives the best available BYE position.

## Explicitly deferred

Patch 03 does not yet persist or expose organizer-selectable policy choices. A later patch may add:

- database/API fields for selected input seeding and placement policies;
- alphabetical, random and manual selection in the UI;
- stored random-draw audit and wheel presentation;
- random group/bracket placement controls;
- dynamic reseeding after every elimination round;
- rank-system and bucket criteria.

The domain engine is designed so those additions do not require rewriting the placement mathematics again.

## Invariants

- participant keys are unique;
- assigned seeds are unique and contiguous from 1 to N;
- manual and preserved seed policies reject incomplete permutations;
- standard bracket size is the next power of two;
- standard bracket protects top seeds from meeting earlier than intended;
- BYEs go to the highest available seeds;
- balanced groups differ in size by at most one;
- random operations are reproducible from the same random seed;
- lower rank bands cannot overtake higher rank bands unless a future policy explicitly chooses global classification.

## Compatibility

No database migration, OpenAPI change, Backup change or UI change is included. Existing persisted tournaments keep their current behavior. The change is an internal refactor plus new domain capabilities and tests.
