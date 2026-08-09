# ADR: Seeding Ceremony V2

## Status

Proposed in Patch 05. The implementation is additive and does not require a database migration.

## Context

Patch 04 made random entry seeding and random stage placement deterministic and persisted the random key, but a stage still applied the result only when it started. Organizers could not reveal assignments one by one, resume a public draw after a refresh, or prove that the animation had not changed the result.

The product requires a ceremony in which, for example, 24 participants receive unique random seeds one after another while the audience sees the resulting group or bracket slot immediately.

## Decision

### Server is the source of truth

A ceremony is prepared atomically before the stage starts. The server calculates every draw and every destination in advance and stores the complete result in `tournament_stages.seeding_audit` as `seeding_ceremony_v1`.

The wheel animation never chooses a value. It reveals the next already persisted draw.

### No new table or migration

`seeding_audit` was introduced as nullable JSONB in Patch 04 and is already included in Backup V3. Patch 05 stores ceremony state in that field. Existing non-ceremony audit objects remain valid and are ignored by the strict ceremony parser.

### Ceremony lifecycle

- `prepared`: result saved, no sequential draws revealed;
- `in_progress`: at least one, but not all draws revealed;
- `completed`: all draws revealed and the stage may start;
- `applied`: stage started with the persisted result.

For `randomRevealOrder=instant`, preparation immediately produces `completed` state. For `sequential`, `StartStage` refuses to run until the ceremony is complete.

### Persistence and resumption

Every reveal updates `revealedCount` in the same stage row. Refreshing the page reads the persisted count and resumes from the next draw. Auto-play and animation timing are local presentation preferences; stopping them does not alter server state.

### Stale result protection

The ceremony stores two SHA-256 fingerprints:

- participant signature: memberships, player identities, names, manual seeds and previous stage seeds;
- configuration signature: format, participant count, group count, seeding policies, random key and reveal mode.

Prepare is idempotent while both signatures match. Reveal and stage start reject stale state. If participants or settings changed, the organizer prepares a new ceremony.

### Placement preview

Each draw contains a seed and a public destination:

- group and position for group stages;
- first-round match, side and BYE information for elimination brackets;
- ordered position for formats without a separate placement layout.

The normal UI renders only the first `revealedCount` rows. The persisted audit and deterministic random key remain readable through the existing tournament data model for reproducibility, so this feature provides an event-style reveal rather than cryptographic secrecy. Public commitments and hidden future draws are deferred.

### Authorization

- reading ceremony state uses normal tournament read access;
- prepare, reveal and reset require organizer access;
- mutations are accepted only while the stage is planned and has no generated matches or groups.

### Audit

Action log entries are created when a ceremony is prepared, completed or reset. The complete draw history remains stored in the stage audit and becomes immutable after stage start.

## API

- `GET /tournaments/{id}/stages/{stageId}/seeding-ceremony`
- `POST /tournaments/{id}/stages/{stageId}/seeding-ceremony/prepare`
- `POST /tournaments/{id}/stages/{stageId}/seeding-ceremony/reveal-next`
- `POST /tournaments/{id}/stages/{stageId}/seeding-ceremony/reveal-all`
- `DELETE /tournaments/{id}/stages/{stageId}/seeding-ceremony`

## UI

A planned random stage displays a ceremony card with:

- animated wheel;
- manual next draw;
- local auto-play with pause;
- reveal-all without animation;
- reset before stage start;
- persisted history;
- live group or bracket placement preview;
- presentation dialog and read-only audience mode.

## Compatibility

- existing instant random stages still start without manually opening the ceremony; the lifecycle creates and applies a deterministic completed audit;
- existing non-random stages keep the previous audit shape and behavior;
- active or completed legacy random stages without `seeding_ceremony_v1` do not display an empty ceremony panel;
- Backup V3 already transports `seedingAudit`; imported stale planned ceremonies cannot be revealed or applied until prepared again.

## Deferred

- koszyki and ranking presets;
- team and rematch placement constraints;
- manual post-draw edits and their audit workflow;
- broadcast overlays outside the application;
- cryptographic public commitments. The current RNG is reproducible and auditable, not intended as a cryptographic lottery.
