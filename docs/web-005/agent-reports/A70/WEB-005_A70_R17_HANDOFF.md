# WEB-005 — A70 R17 formal handoff to A00

**AGENT:** A70 — Match Lifecycle & Undo  
**TASK:** WEB-005-T040-A70-MP2A-ROSTER-R17 (R16 carryover, R17.1)  
**DATE:** 2026-10-14 Europe/Warsaw  
**MODE:** CONDITIONAL CODE GO, **original R16 exclusive files only**; final production code HOLD after file-scope preflight  
**STATUS:** **BLOCKED_WITH_EXACT_REASON / PATCH_REVISED_TESTS_ONLY / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO**  
**BASE:** release/tournament-ops-20261013-01 @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**PR:** [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) — existing `fix/web-005/t040-mp2a-global-undo-lifo-r9`, OPEN DRAFT, unmerged.  
**PR HEAD before R17:** `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`  
**PR HEAD after authorized test-only R17 changes:** `25b09f1a48a85ae882b817118f5d8c23bffbe383` (pin at time of report; check HEAD before A60 execution).  
**DETAILED RESULT:** [WEB-005_A70_R17_PR42_ROSTER_LIFO_RESULT.md](../../WEB-005_A70_R17_PR42_ROSTER_LIFO_RESULT.md)  
**R16 RECOVERY:** [WEB-005_A70_R16_RECOVERY_STATUS.md](./WEB-005_A70_R16_RECOVERY_STATUS.md) — `R16_ARTIFACTS_UNAVAILABLE`, not a fabricated patch.

## 1. R16 result recovery — first gate

Read central R16 original prompt and searched GitHub central A70 reports and relevant branches. At R17 start PR42 was identical to the R9/R15 candidate. No original A70 R16 patch SHA, report URL, or native execution receipt could be independently verified. Original R16 does NOT count as completed or failed; **R16_ARTIFACTS_UNAVAILABLE**. The separate recovery document publicly records this distinction.

## 2. R17 exact reviewed/changed code

Source path | Old and end-state
---|---
`artifacts/api-server/src/routes/tournaments.ts` | read and checked; final blob **a0473fed687932a26275f2bef14864d196ed3bb7**, identical to pre-R17 candidate
`artifacts/api-server/src/application/players/tournament-roster.ts` | read and checked; final blob **1a9184d92736b5c2bcca07bb0d3067a0f7b314ce**, identical to pre-R17 candidate
`artifacts/api-server/test/revert-match.integration.test.ts` | **modified**, final blob **3479ab5fe888416858346f82691d4c57f369df25**, +156 lines (four defined roster test cases)
`docs/web-005/WEB-005_A70_R17_PR42_ROSTER_LIFO_RESULT.md` | new documentation-only on central docs branch
`docs/web-005/agent-reports/A70/WEB-005_A70_R16_RECOVERY_STATUS.md` | honest R16 recovery publication
`docs/web-005/agent-reports/A70/WEB-005_A70_R17_HANDOFF.md` | this report

R17 transient exploratory service + route changes appeared in intermediate PR42 commits, **but both were completely reverted** on finding original R16 exclusive-files restriction. Compare old R9 PR42 HEAD to current R17 code HEAD verifies **one retained modified file: the authorized test file**. No app-service production change or LIFO fix is claimed.

## 3. Exact source defect and test-first definitions

A60 original R15 independent report marked P09/PR42 `SOURCE_BLOCKED_GLOBAL_UNDO_LIFO` at old HEAD. `POST /tournaments/:id/undo-last` pre-reads a roster action and routes `delete_player/restore_player` into `undoTournamentRosterAction`. Roster service starts its own DB transaction; after locking draft tournament and candidate action it omits globally latest Undo recheck. X can queue on tournament lock behind B, B inserts new undoable action Y, and X can improperly revert stale A after B commits. Generic Undo and `revert_match` on PR42 already have guarded same-tx LIFO; do not rewrite them.

Four **new test definitions** on PR42:
- `delete_player` stale X queued using `pg_blocking_pids`; Y newer commit; expect 409 `UNDO_ACTION_CHANGED`, exact post-Y zero-write SQL snapshot and legitimate latest Y Undo.
- `restore_player` same deterministic queued-X/newer-Y race and zero-write oracle.
- Latest legal `delete_player` Undo 200 exactly once, deleting expected player.
- Latest legal `restore_player` Undo 200 exactly once, restoring prior player name.

**No real HTTP/PG16 execution**: only source inspection and static criteria checked. Test definitions do not imply PASS or observed FAIL; with current unpatched roster service the negative tests are expected to fail when executed in a physically isolated test environment.

## 4. Why implementation stopped — exact GO/STOP boundary

The original R16 A70 prompt explicitly authorizes modifications to `routes/tournaments.ts` and `test/revert-match.integration.test.ts` **only**. R17 orders finishing precisely that same R16 scope without enlargement. Correct synchronization must happen **inside `artifacts/api-server/src/application/players/tournament-roster.ts`'s existing transaction**, under the same tournament row lock, before it writes players or the action log. This is outside the authorized code path. A route-only lock-and-release introduces TOCTOU; retaining a route transaction while roster service creates a second own transaction risks self-blocking/deadlock; duplicating roster service code in the route breaks separation of concerns and authorization guards.

**ACTION REQUIRED FROM A00/HQ:** explicit file-ownership extension / code GO that includes `tournament-roster.ts`, the small error-to-HTTP409 mapper in `routes/tournaments.ts` and existing test file, all on PR42 only. A00 must avoid cross-PR overlap with #39/#44/#46/#51. Until then P09 remains source-blocked and no further code edits are authorized.

## 5. Test evidence and owner runbook

**Test command executed by A70:** **NONE** (no pnpm workspace/physical disposable PostgreSQL16); exit code/TAP/HTTP response DB state: **NOT_EXECUTED**.

**Candidate independent test after safe explicit PG16 authorization** (requires actual checkout exact current PR42 HEAD, Node22/pnpm10, dedicated nonshared database name containing `test`, TEST_DATABASE_URL with no production fallback, `TEST_DATABASE_SCHEMA=tm_test_t040_r17_roster`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` authorized):
```sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
```
A50 must preserve exact SHA, real run/exit/TAP, DB fingerprint without secrets, committed-Y vs rejected-X snapshots; A60 must independently review the **new test-only HEAD** and the eventual authorized production patch. An A60 old-HEAD source verdict cannot certify current or future HEAD.

**Independent A60 latest verified:** original R15 report P09 `SOURCE_BLOCKED_GLOBAL_UNDO_LIFO`; an independent re-review of current R17 SHA **NOT_VERIFIED**. A50 original R15 receipt reports environment blocked and zero app runtime tests. No A70 self-review or invented acceptance.

## 6. Cross-scope and release protections

`routes/tournaments.ts` overlaps #39 (Cancel/Restore), #42 (MP2A), #44/#46 (auth), #51 (historical Undo); `revert-match.integration.test.ts` overlaps #51. No cherry-pick, rebase or merge of any. MP2B direct Revert CAS public API + Host decision remains POLICY_OPEN and untouched; no Undo malformed-history parser grafting from PR51, SQL migration, stage/Backup B2 policy, paid CI, production, staging, Replit or SWARM-006.

**FINAL NEXT STEP TO 00:** decide whether to authorize an explicit expanded `tournament-roster.ts` ownership window for PR42. If YES, A70 would need a NEW precise code GO (none is implied by this handoff), followed by A50 isolated PG16 and A60 signed exact-SHA review. If NO, record P09 as BLOCKED with an owner-approved disposition before whole-backlog closeout. **RELEASE NO-GO; SWARM-006 HOLD.**
