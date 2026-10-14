# WEB-005_A70_R13_HANDOFF

**Agent:** A70 — Match Lifecycle & Undo  
**Task:** WEB-005-T040-A70-R13  
**Wave:** R13.1 — 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE ONLY / QA-FIRST / NO SOURCE-CODE GO  
**Coordinator:** A00 WEB-005 Implementation Lead (not the global Queen)  
**Instruction source:** WEB-005_WAVE_R13_AGENT_PROMPTS.md, chore/web-005/t000-wave1-control  
**Release baseline:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**R13 doc branch:** docs/web-005/a70-r13-source-gate (branched from unchanged release)  
**Report and source contract:** docs/web-005/WEB-005_A70_R13_MP2B_SOURCE_GATE.md

## 1. Exact current PR state

| PR | SHA | State | Use |
|---|---|---|---|
| #39 MP1 Cancel/Restore | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT | independent candidate, not combined |
| #42 MP2A Global Undo LIFO | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT | independent candidate, not combined |
| #51 historical Undo fail-closed | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT / FROZEN | direct A70 R13 QA target |
| #41 Backup B1 | e847cb705296a48ab5c68ece96776cd0e0bbb417 | OPEN DRAFT | A90 source dependency |
| #48 Backup B3A | 2a8a4c72cb4a3a37402a346fd0acc83b03b39be3 | OPEN DRAFT | A90 source dependency |

**PR51 actual diff vs release:** 6 commits, 4 changed files: artifacts/api-server/src/routes/tournaments.ts (+93/-4), artifacts/api-server/test/revert-match.integration.test.ts (+126), docs/web-005/WEB-005_A70_R12_HANDOFF.md, docs/web-005/WEB-005_A70_R12_HIST_PAYLOAD_PATCH.md. No R13 code modifications and no PR51 branch writes.

## 2. R13 results and evidence

**SOURCE_CONFIRMED:** PR #51 has a safe parser guarding persisted historical action_log.undoPayload, rejecting invalid JSON/null/array/primitive/type/match identity via HTTP 409 UNDO_ACTION_CHANGED. It structurally checks the candidate before Undo and again after action-row lock, and checks tenant ownership of target matches before generic Undo writes. Existing legacy Undo/revert families remain present.

**Actual R13 source assertions:** 13/13 static predicates passed against exact PR51 source. Test source definitions verified 11 table-driven malformed cases + 6 individual cases = 17. Detailed mapping H01–H17, zero-write snapshot contract and positive checks are in the R13 MP2B_SOURCE_GATE document.

**ACTUAL APPLICATION TESTS/COMMANDS:** NOT_EXECUTED. No Node/pnpm typecheck, API HTTP, PostgreSQL16 or React test run performed by A70 in R13. Therefore no native command exit code, TAP count, or PG evidence is available. A simple connector-level static predicate result is NOT a native test PASS.

**CI/QA:** PR51 branch GitHub Actions yielded 0 runs in the R13 query, and no GitHub review was registered for PR51. This does not imply that A60 did not produce a report elsewhere. Independent SOURCE_ACCEPTED/RUNTIME_VERIFIED not established from verified evidence here.

## 3. A50/A60 handoff — strict pinned SHA

**Target:** PR51 @ 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a only. No PR39/42 implicit acceptance.

**A50 isolated PG16 safety preflight:** physical disposable test DB, explicit authorization, TEST_DATABASE_URL only for dedicated test target (DB name contains test, never prod/shared), TEST_DATABASE_SCHEMA=tm_test_t040_r13_hist, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA, Node22/pnpm10, locked dependencies and test runner NODE_TEST_CONTEXT. No credential disclosure. Only then:
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Capture exact full HEAD, both command exit codes, TAP pass/fail/skip, environment fingerprint excluding secrets and DB before/after state for each rejection. Invalid newest action must be 409 without undoing older entries, without altering matches/action_log/result_history/players/stages/game-picks or foreign tenant state. Verify legal status and completed-result Undo controls.

**A60:** independently review PR51 source/test-first and historical compatibility at exact SHA; classify findings and judge real A50 runtime evidence. A60 must not declare acceptance just because author wrote the 17 cases. Cross-check separate PR42 global LIFO on its own exact SHA and PR39 Cancel/Restore separately.

## 4. MP2B and Backup V3 policy gates

**SOURCE_CONFIRMED Direct Revert CAS gap:** public POST /matches/:id/revert currently forwards no request-level revision or completion action ID even though domain revertMatch optionally accepts expectedMatchRevision and expectedCompletionActionId. Host sends only ID; OpenAPI no body; generated React/Zod parity absent; generic action-log GET only last 50 entries.

**PROPOSED (NOT APPROVED):** two mandatory positive integer preconditions with malformed/missing 422 and stale/replayed 409 + zero-write. Prevent ABA and double submit. A00/HQ must approve exact external field name, Host old-tab cutover, authoritative activeCompletionActionId read source and client-generated parity rollout before authorizing code. Internal controlled-correction domain path must remain compatible.

**A90 ownership:** Backup V3 portable revisions, imported result_history provenance and B2 legacy compatibility are not action_log.undoPayload parsing. PR41/PR48 belong to A90; A70 performed read-only scoping only, made no changes to Backup V3, result_history or domain revert-match.ts. Do not silently add Backup B2 repairs into MP2B/PR51.

## 5. File conflicts / decision / STOP

**File overlaps:** PR39, PR42, PR51 (plus A100 PR44/PR46) alter artifacts/api-server/src/routes/tournaments.ts. PR42 and PR51 both modify artifacts/api-server/test/revert-match.integration.test.ts. Future integration owner must reconcile diffs with QA; no composite SHA in WEB-005 and no source rebase/cherry-pick by A70 R13.

**Policy owners:** A00/HQ must decide strict public revert CAS field name, coordinated old Host rollout, completion-action ID discovery, and later parser/legacy remediation if A60 identifies additional issues. A50/A60 supply source acceptance and actual isolated PG evidence before future GO.

**NEXT single small patch, CONDITIONAL:** after A00/HQ policy and independent QA, propose narrow Direct Revert HTTP body validation/forwarding test-first as new separately authorized code lane. No code GO in R13.

**GO completed:** PR51 QA handoff + MP2B SOURCE-ONLY contract + A90 boundary analysis + R13 report.

**STOP:** application source edits, new PR implementation, API semantics, SQL, merge/rebase/cherry-pick, paid manual CI, staging, production, Replit, SWARM-006 dispatch.

**Final disposition:** A70 R13 assigned SOURCE-ONLY outputs prepared; WEB-005 IN_PROGRESS; RELEASE NO-GO; A60 and PostgreSQL runtime pending.