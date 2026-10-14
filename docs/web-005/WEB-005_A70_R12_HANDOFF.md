# WEB-005_A70_R12_HANDOFF

AGENT: A70 — Match Lifecycle & Undo
TASK: WEB-005-T040-A70-HIST-PARSE-R12
WAVE: R12.1 / 2026-10-14 (Europe/Warsaw)
GO: NARROW SOURCE-CODE ONLY / TEST-FIRST, L1
BASE: release/tournament-ops-20261013-01 / 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7
BRANCH: fix/web-005/t040-hist-parse-r12
PR: #51 — https://github.com/C8LyNn/aplikacja-turnieje/pull/51
HEAD: resolve latest PR #51 head.sha; initially 70127252ae6156d9698eeab25416d317de723e19 before this handoff commit
TARGET SOURCE: frozen independent PR #39 / 16053ee132756ca05b6f2cd1f0cabae823905387; PR #42 / 1ae0ccb801f4177052bff1ec7041e55b8c992c8b (NOT incorporated)
HISTORIC REFERENCE: PR #27 / 8e5a6e1fc613a0afacca22ac21bf86a38899e034 (not cherry-picked)

## Exact source edits

- artifacts/api-server/src/routes/tournaments.ts: typed historical Undo parser and valid actionType→payload.type mapping; malformed persisted JSON, null, array, primitive, wrong action type and invalid shape fail closed using existing structured 409 UNDO_ACTION_CHANGED. Post-lock reparse and identity comparison; tenant ownership guard for generic Undo match targets and featured previous match. No auto-skip of newest action or history repair.
- artifacts/api-server/test/revert-match.integration.test.ts: 17 test-first cases (11 table-driven malformed and six focused, including foreign match IDs, valid status and result Undo); negative assertions snapshot tournaments/matches/action_log/result_history/players/stages/game-picks, also foreign tournament.
- docs/web-005/WEB-005_A70_R12_HIST_PAYLOAD_PATCH.md: implementation and QA/rollback detail.
- This handoff document only.

All code edits are limited to A70 Undo hunks and its tests. No migrations, Replit, frontend/API client, public Direct Revert MP2B, global LIFO refactoring, or revert-match.ts change.

## Evidence / tests

SOURCE_CONFIRMED: baseline unhandled JSON.parse at two Undo call sites; source parser patch now safely catches malformed JSON before and after lock; type guard and tenant prewrite guard. Specific static assertions on patch verified: no raw JSON.parse inside Undo route, both safe parser calls, allowlist, typed 409, target-tenant guard, current switch structure and test definitions. An initial naive grep against any 'continue' was inapplicable: the only continue in Undo is for a null optional featured-target ID, not a skip of a malformed history row. The malformed parsed-candidate branch explicitly returns HTTP 409 and does not iterate to older history. This is STATIC SOURCE evidence, not runtime proof.

TEST-FIRST order: test commit 7e30a80dfda1b2695c2f0d0136319857e8f10e59 before implementation 3695f76b8612129b3433abadd483ecd857dac784; later test addition 911b7ab7dd9177bbf24cb344d7822061c5f54d77; numeric TypeScript narrowing f560b1330b496c709783f7dae75416e4cc3adca2.

ACTUAL TYPECHECK: NOT_EXECUTED; no process exit code.
ACTUAL HTTP/PG16 TEST: NOT_EXECUTED; no TAP or database report.
A60 INDEPENDENT QA: PENDING; no source or runtime certification.
CI: NO paid manual rerun launched by A70. Do not infer success from PR existence.

A50 authorized independent commands (ONLY on approved isolated PG16 database and checkout of final PR51 SHA, test-only TEST_DATABASE_URL, TEST_DATABASE_SCHEMA=tm_test_t040_r12_hist, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA):
1. pnpm --filter @workspace/api-server typecheck
2. pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
Need exact CLI exit code + TAP pass/fail/skip, Node22/pnpm10, physical DB fingerprint excluding secrets, full SQL no-write snapshots.

A60 independent scope: examine malformed latest action cannot result in 500 or older undo; zero writes across all relevant tables, cross-tournament match/picks isolation, valid historical status/completion/roster parity, exact-HEAD source owner restrictions, race and PR42 future integration conflict.

## Open risks and ownership

Structural parsing does not implement stale-but-well-formed CAS, MP2A global LIFO or strict public Direct Revert CAS (POLICY OPEN). mapActionLog.canUndo still uses nonempty payload as affordance; it is not a structural certificate. Previous historical data not migrated; bad row remediation needs separate A00 decision.

Competing unmerged PR #39, #42, #44, #46 edit the shared routes/tournaments.ts in separate source branches. A70 cannot reconcile/merge them. A100 owns auth files in R12; A80 revert-match.ts was not edited.

ROLLBACK: close PR51 and discard isolated branch; release, production, schema and data unchanged. Future authorized integration can revert scoped commit through reviewed Git only. No SQL rollback required.

A00 NEXT: route this PR51 exact final HEAD to A50 and independent A60, record file conflict, await actual PG16 evidence. Do not dispatch SWARM-006 until full WEB-005 backlog formally closed.

GO/STOP: PATCH_PROPOSED and docs ready; RUNTIME_VERIFIED=NOT_EXECUTED; SOURCE_ACCEPTED pending; MERGE/DEPLOY=HARD STOP.