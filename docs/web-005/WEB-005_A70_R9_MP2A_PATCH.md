# WEB-005_A70_R9_MP2A_PATCH

**AGENT / TASK / WAVE:** A70 — Match Lifecycle & Undo / `WEB-005-T040-A70-MP2A-R6` / R9
**Mode:** GO SOURCE-CODE ONLY; narrow scope MP2A.
**Evidence date:** 2026-10-14 Europe/Warsaw.
**Base:** `release/tournament-ops-20261013-01` at `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
**Patch commit:** `20da2027a5d0c362f26cbb65ac073ff6c8f6668b`.
**Branch:** `fix/web-005/t040-mp2a-global-undo-lifo-r9`.
**Draft PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/42
**Final HEAD:** use PR #42 current `head.sha` — documentation commits may advance this pointer after the patch commit.
**Merge / deploy:** NOT AUTHORIZED.

## Actual changes

1. `artifacts/api-server/src/routes/tournaments.ts` — common `lockLatestUndoableAction(tx, tournamentId, candidate)`; row-locks selected action; validates its immutable identity against the preliminary read; reselects most recent globally undoable action ordered by `createdAt DESC, id DESC` after acquiring tournament mutation lock. Both generic Undo and `revert_match` use the helper.
2. `revert_match` Undo — calls `revertMatch(input, {}, tx)` inside the same tournament-locked database transaction, so the LIFO check and result/history rollback cannot be separated by another correctly serialized mutation.
3. `artifacts/api-server/test/revert-match.integration.test.ts` — two new deterministic PostgreSQL races: `revert_match` and `restore_status`. B holds tournament row lock; X queues; B commits newer Y; X must reject 409 / `UNDO_ACTION_CHANGED`, preserve X match/result_history/actions, and retain Y. Uses `pg_blocking_pids`, not arbitrary sleep timing.
4. This report (`docs/web-005/WEB-005_A70_R9_MP2A_PATCH.md`), documentation only.

**Not changed:** `revert-match.ts` source, MP1 PR #39, client OpenAPI/Zod/React, migration SQL, stage policy, direct Revert endpoint.

## Provenance / disposition

| Finding | Result | Evidence level |
|---|---|---|
| OPS-01 / A50-F008 / A52-F010 — stale global Undo LIFO for `revert_match` | Source patch created in PR #42; generic and result Undo share post-lock recheck | PATCH_PROPOSED, SOURCE_CONFIRMED |
| Queued X vs later committed Y | Two deterministic test definitions authored; no PG runtime executed | NOT_EXECUTED |
| Zero-write-on-reject | Exception is raised before edits in same tx; transaction rollback and database snapshot assertions specified | STATIC_INFERRED; PG RUNTIME NOT VERIFIED |
| PR #27 historical Undo payload safety / malformed JSON | Not adopted; separate MP2B/next task | BLOCKED / OUT_OF_SCOPE |
| Direct `POST /matches/:id/revert` CAS | Not implemented (explicit R9 restriction) | MP2B SOURCE-ONLY |
| Terminal Swiss / RR / SE | Not touched; belongs to A80/T050/T051 | OUT_OF_SCOPE |
| Cancel `expectedRevision` optional in MP1 | Remains unchanged | POLICY_OPEN / MP3 |

## Test evidence

**Static source-contract check RUN:** 9/9 boolean assertions passed against patch commit `20da2027a5d0c362f26cbb65ac073ff6c8f6668b`, verifying helper, two call-sites, same `tx`, createdAt+id ordering, mapped 409, deterministic tests, PG lock barrier, zero-write assertions. This is **not** an application test or a typecheck.

**Node / API typecheck / unit / PostgreSQL integration:** NOT_EXECUTED. GitHub repository unavailable through local network; no checked-out dependencies and no authorized isolated PostgreSQL16 connection. `[skip ci]` marks commit messages to avoid invoking potentially billed Actions; no manual CI rerun.

### A50 execution contract

Only after safety preflight on disposable PostgreSQL16, with `NODE_TEST_CONTEXT` set by Node test runner, dedicated URL whose database name contains `test`, schema matching `tm_test_*` and explicit reset consent:

```bash
export TEST_DATABASE_URL='postgresql://<isolated-test-user>:<password>@<isolated-pg16-host>/<dedicated-test-db>'
export TEST_DATABASE_SCHEMA=tm_test_t040_mp2a
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
```

**Expected:** both `MP2A global LIFO` races return 409 with `code=UNDO_ACTION_CHANGED`, no Undo write after stale X, Y preserved, existing legal Undo/Revert regressions PASS. Record exact HEAD, command, DB/schema fingerprint, exit code and TAP counts. Never point tests at shared or production DB.

### A60 independent QA contract

Independently verify test-first ordering and run on the PR's exact final HEAD. Inspect before/after DB snapshots of `matches`, `action_log`, `result_history`, `tournaments`, `players` and downstream slot. Confirm:
- X captured older action A before tournament lock; Y committed a newer undoable action while X waited.
- Both `revert_match` and generic `restore_status` reject X via HTTP 409 and `UNDO_ACTION_CHANGED`; no records from X.
- Valid latest Undo continues to work (result/history exactly one reversible action).
- Authorization organizer/support, viewer/anonymous negatives unchanged.
- Compare route diff to base; `revert-match.ts` blob unchanged, MP1 not modified.
- `canUndo` UI contract, Direct Revert and malformed historic payload handling are **not** certified by MP2A.

## File ownership / dependencies

`routes/tournaments.ts` is shared with A100/T080-S1. At R9 writing time there was no `t080` branch in GitHub branch search. **A00 must serialize future A100 edits against this PR**; no second author should modify the same source concurrently. `revert-match.ts` is A70-owned for R9, untouched here; A80 SOURCE-ONLY. A10 register conditional **P08+** with actual PR #42 SHA and no SWARM-006 dispatch.

DB dependencies: existing `0028_match_revision.sql`, existing `action_log`, tournament row-lock path. No new migration or change to T020/T021.

## MP2B follow-up — SOURCE-ONLY

Separate later GO required: Direct `POST /matches/:id/revert` should accept mandatory `expectedMatchRevision`/public `expectedRevision` and `expectedCompletionActionId`; compare under `revertMatch` lock (existing domain inputs support both); stale ABA/double submit -> 409 zero-write; invalid body -> 422. Require API/OpenAPI/Zod and Host/generated React parity in separate MP3 approval. Do **not** couple MP2B to MP2A.

## GO / STOP to A00

**GO achieved:** isolated source patch and DRAFT PR #42 created.
**STOP release:** PostgreSQL runtime not executed, independent A60 verdict outstanding, shared-file sequencing for A100 outstanding, no overall WEB-005 closeout.
**Next concrete action:** A50 execute pinned PR #42 on an approved isolated PG16; A60 independently validate its exact SHA and send verdict to A00.
**SWARM-006:** NOT STARTED / NOT AUTHORIZED.
