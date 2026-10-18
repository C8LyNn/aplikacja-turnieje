# WEB-005 — A70 / DEVELOPMENT FIRST / WAVE 2 — preflight and handoff

**Task:** T040-A70-WAVE2-ROSTER-UNDO-PAYLOAD-SAFETY  
**Agent:** A70 — Match Lifecycle & Undo  
**Mode:** scoped test-first functional hardening; PG16/DB execution prohibited without separate safety approval.  
**Branch:** `fix/web-005/t040-wave2-roster-undo-payload-safety`  
**Exact base:** PR #42 `021bed269f9ea8ac8ce53caeea44263c098aa2dd` (OPEN DRAFT, NOT MERGED); distinct from PR #104 `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f`.

## Exclusive edit allowlist, published before source change

1. **NEW** `artifacts/api-server/src/application/players/roster-undo-payload.ts`: pure parser for `player_added/delete_player`, `player_edited/restore_player`, strictly scoped player IDs and previous fields.
2. **NEW** `artifacts/api-server/test/roster-undo-payload.test.ts`: unit tests first; legitimate old and new snapshots, malformed/double/stale/version-shaped payloads, clone-foreign IDs, type mismatch and no input mutation.
3. **EXISTING A70-owned PR42 path** `artifacts/api-server/src/application/players/tournament-roster.ts`: replace unsafe JSON cast + arbitrary `prevData` propagation in `undoTournamentRosterAction` ONLY, preserving same transaction lock/LIFO/auth; translate parse errors to `ROSTER_UNDO_UNAVAILABLE`.
4. This file `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE2_HANDOFF.md`: source/candidate QA and exact SHA handoff.

**No other file changes permitted.** In particular do NOT edit `routes/tournaments.ts`, existing `revert-match.integration.test.ts`, PR #42, PR #51, PR #56/#58/#64/#104, game files, imported DB schema, migration files, importer or Replit live.

## Confirmed source issue before code

The existing PR42 roster service parses persisted action_log JSON with `JSON.parse(...) as Record<string,unknown>`; `delete_player` uses `Number(payload.playerId)`, and `restore_player` accepts any object as `prevData`, casts it to TypeScript `PlayerUpdate` and passes all its keys to `tx.update(playersTable).set(changes)`. TypeScript's cast does not remove `id`, `tournamentId`, `status`, etc. The service also selects its branch from payload.type without verifying actionType is the corresponding roster provenance.

A malformed or imported legacy action could therefore cause a mutation outside the documented historical player snapshot, even after correct tournament/global LIFO locks. This is **source-reproduced a path to unsafe writes**, **NOT** a claim that hostile import has already executed at runtime or that PG16 was tested.

## Baseline scenarios reviewed

- **Multiple calls:** existing `test/revert-match.integration.test.ts` asserts valid first Undo (200) and second does not repeat the same action; **authored, runtime not rechecked**.
- **Stale X/newer Y:** PR42 includes deterministic `pg_blocking_pids` barrier and source 409 `UNDO_ACTION_CHANGED`; **test exists, NOT_EXECUTED** in Wave 2.
- **Version conflict:** internal match Revert guards `expectedMatchRevision`/`expectedCompletionActionId`, but public Direct Revert required CAS remains separate owner MP2B policy. Do NOT change that policy/route in this PR.
- **Interrupted operation:** existing match Revert uses `afterMatchReset` fault hook and full transactional rollback test. Roster source uses single DB transaction; DB rollback not runtime-verified. Pure tests can verify rejected payload causes no input mutation, not promise SQL rollback.

## Next

Publish test-first new parser tests, a small pure parser module, wire parser ONLY into PR42 roster service in a NEW dependent Draft PR; run safe locally executable tests if possible; independent A60 per-exact-SHA QA mandatory. A10/A40 must not automatically include stacked PR42 in composite without overlap and live drift checks.

**STOP:** no destructive PG16/SQL, migrations, live publish, game changes, merge, cherry-pick, SWARM-006.
