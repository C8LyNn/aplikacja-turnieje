# Tournament Backend — Undo Reliability (working pack)

**Status:** DRAFT — work in progress / NOT RELEASED  
**Repository:** `C8LyNn/aplikacja-turnieje`  
**Stacked branch:** `fix/tournament-undo-stale-state-guard-20261012`  
**Pull Request:** #27, based on `fix/tournament-match-cancellation-contract-20261010` (PR #7).  
**Pack numbering:** intentionally unassigned. Historical Pack 25 has not been verified, so this document does not claim to replace it.

## Purpose

Make tournament undo operations reject stale, corrupt or contradictory history **before** mutating match or participant state. Maintain existing organizer/support access controls, per-tournament locking and transactional rollback.

## Included changes

1. Cancellation and match-status undo compares expected status, result state, revision and note where applicable.
2. Best-of undo checks its expected BO, pending status, revision and current result state.
3. Featured match undo checks the current pointer, action type and previous match ownership.
4. Player-swap undo checks participants, scores, status, revision and recorded Deadlock hero/side selections; unknown legacy pick snapshots fail closed.
5. The latest eligible undo action is re-evaluated after the tournament lock is acquired.
6. Persisted undo JSON is parsed through a typed action-to-payload whitelist; invalid JSON, arrays, null and mismatched types result in a controlled conflict.
7. Match-bound undo actions must refer to the same match as their action log row.
8. Draft roster undo also rechecks operation order, validates player IDs and restores only editable, validated player fields.
9. A combined match status + BO PATCH is rejected, avoiding two independent undo actions for one match revision.
10. Historical entries without newer metadata are processed conservatively. Actions whose state cannot be validated are rejected rather than guessed.
11. New roster add/edit operations persist complete post-operation snapshots (`nextData`), and edits additionally persist full pre-operation snapshots (`prevData`). Undo compares the current player to the expected post-operation state under the tournament lock before any deletion or restoration.
12. Legacy roster add/edit actions without a verified `nextData` are **not automatically undoable**. This is intentionally stricter than prior behavior and requires an operator-mediated recovery route for older data.
13. The action-log `canUndo` affordance reports false for roster actions missing valid post-operation snapshots; it is not a guarantee that a valid-looking operation will succeed when the underlying DB state has changed.

## Verification coverage (code authored; tests not yet executed)

- `test/undo-payload.test.ts`: pure parser/action compatibility.
- `test/undo-history-safety.integration.test.ts`: corrupt JSON, cross-match payload, stale roster order, invalid player ID/status/note, invalid roster snapshot, correct restore, post-write roster drift, legacy roster history, action-log availability, and sequential undo of edit then registration.
- `test/match-revision.integration.test.ts`: cancellations, status ABA, best-of, featured/unfeatured, swap and Deadlock pick safety, legacy history and mixed PATCH rejection.

## Required QA (isolated environment only)

These commands require a checked-out copy of the branch and installed pnpm dependencies:

```bash
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/undo-payload.test.ts
```

For integration tests, configure a **disposable PostgreSQL database** containing `test` in the database name. The test harness drops and recreates its dedicated test schema and must NEVER point at production.

```bash
# Set TEST_DATABASE_URL and TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
# in the terminal/session for the dedicated TEST database.
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/undo-history-safety.integration.test.ts ./test/match-revision.integration.test.ts
pnpm test
pnpm build
```

Then inspect organizer Host flows: cancel, restore, undo-last, match start/postpone, BO changes, featured/unfeatured and Deadlock side swaps.

## Release boundary

**Do not merge or deploy this draft PR yet.** There have been no database migrations, production writes or frontend modifications in this working pack. No CI, PostgreSQL integration, typecheck or build success is claimed until real test output is available.

## Follow-up risks to review

- Legacy undo records can lack revisions, pick snapshots or roster `nextData`: conservative rejection is intentional but requires operator-facing guidance. **Older player registrations and edits without `nextData` will no longer be auto-reversible.** Before release, validate UX copy and a manual recovery procedure; do not bypass history verification.
- Race testing should independently verify per-tournament serialization of status, roster and result mutations.
- Verify OpenAPI documentation and clients' treatment of the HTTP 409 and 422 responses before promoting this bundle.
