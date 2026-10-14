# WEB-005 — A70 R11: MP2B Direct Revert CAS and historical Undo gate

**Agent:** A70 — Match Lifecycle & Undo  
**Task / wave:** WEB-005-T040-A70-R8 / R11  
**Date:** 2026-10-14, Europe/Warsaw  
**Authorization:** SOURCE-ONLY; no source-code edits  
**Coordinator:** WEB-005 A00  
**Central task:** WEB-005_WAVE_R11_AGENT_PROMPTS.md version R11.1  
**Baseline:** release/tournament-ops-20261013-01 at 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**Previous source design:** WEB-005_A70_R10_MP2B_SOURCE_CONTRACT.md, commit f92f9b1daaabcbc899ec3819ca36c34677aee734

## 1. Exact source evidence and unchanged PRs

| Item | Verified SHA | State |
|---|---|---|
| PR39 / MP1 | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT, unmerged |
| PR42 / MP2A | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT, unmerged, FROZEN |
| PR27 / stale Undo source | 8e5a6e1fc613a0afacca22ac21bf86a38899e034 | OPEN DRAFT, PR7-dependent |
| PR44 / A100 route overlap | 2f0187b7242681c394c09058b5ef647667206bd6 | OPEN DRAFT |
| PR45 / A80 RR state | a7a87bc019731191dbfa44bee6939e3fa25e27f4 | OPEN DRAFT |

PR42 files: artifacts/api-server/src/routes/tournaments.ts; artifacts/api-server/test/revert-match.integration.test.ts; docs/web-005/WEB-005_A70_R9_MP2A_PATCH.md. Its revert-match.ts blob equals baseline blob 0cb16ad0d82da754bac0553a946a3513db70e1ee. PR39 changed 8 files including the same tournament route and API/Zod generated types, but not React generated client. No cherry-pick or merge.

## 2. PR42 / MP2A: focused A50+A60 QA handoff

**SOURCE_CONFIRMED:** shared lockLatestUndoableAction runs after withTournamentMutationLock, locks candidate row, verifies candidate action metadata and stored raw payload, then reselects globally latest undoable action ordered by createdAt DESC, id DESC. Both standard Undo and revert_match call the helper; revert_match passes the SAME transaction into revertMatch(input,{},tx). Mismatch raises UNDO_ACTION_CHANGED mapped to HTTP 409.

**R11 STATIC SOURCE CHECK ACTUALLY RUN:** 10/10 predicates passed at PR42 exact SHA, covering both branches, single transaction, action identity, global latest recheck, HTTP error mapping, PostgreSQL queue barrier and source zero-write assertions. Earlier author's R9 9/9 also were static, not app tests.

**RUNTIME:** no A70 execution of typecheck, HTTP tests, or PostgreSQL16. PR42 Actions queried and returned zero runs; formal GitHub Reviews returned zero reviews. Absence of a review in GitHub does not disprove an independent report elsewhere. RUNTIME_VERIFIED is not established.

**A50 execution only after physically isolated authorized PG16 preflight:** genuine Node22/pnpm10 checkout of PR42 exact SHA, dedicated test database and tm_test_ schema, explicit DROP_TM_TEST_SCHEMA reset confirmation. Run:
~~~bash
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
The existing suite tests two deterministic queued-X/newer-Y cases with pg_blocking_pids barrier, for revert_match and restore_status. Expected X HTTP 409 UNDO_ACTION_CHANGED, zero X-originated writes, Y preserved. Independently confirm normal latest Undo still works, no double-undo, and authorization. Record git HEAD, exact command, exit code, TAP pass/fail/skip, database/schema fingerprint (not secrets), full before/after data snapshots. NOT_EXECUTED until evidence exists.

**A60:** independently inspect correct placement of global latest check and shared transaction, review snapshots of matches/revision/result_history/action_log/players/stages/tournaments/downstream and correction receipts. Review against PR42 exact HEAD; a static 10/10 does not satisfy PG16 acceptance.

## 3. MP2B strict public Direct Revert request CAS (SOURCE-ONLY)

**Current source gap OPS-02:** public POST /matches/:id/revert parses only path id, performs authorization, then calls revertMatch without a client revision or completionActionId. The domain use case already accepts optional expectedMatchRevision and expectedCompletionActionId and validates them after locked match/completion action queries. Do NOT rewrite the T050 domain, stage vector, receipt or downstream guards. OpenAPI has no revert requestBody; backend Zod has no RevertMatchBody; generated React revertMatch(id,options?) and Host revertMatch.mutate({id}) cannot pass preconditions. Action log read is limited to the newest 50 entries, so not a guaranteed completion-id discovery API.

**Proposed HTTP request after a separate A00 GO:**
~~~json
{"expectedMatchRevision":7,"expectedCompletionActionId":1234}
~~~
Both required positive safe integers; missing/malformed/array/invalid number => 422 INVALID_REVERT_PRECONDITION with zero-write; stale match revision => 409 CONCURRENT_MODIFICATION; stale/wrong completion action => 409 UNDO_ACTION_CHANGED; ABA complete A → revert A → complete B, replay A => 409 leaving B intact. Valid current pair preserves 200 and exact one completion-undo plus one revert audit record. Authentication, stage finalization, downstream and correction receipts retain their existing protections.

Do not silently accept BOTH expectedMatchRevision and expectedRevision aliases. A00 must choose external field name. The strict public route must NOT silently require these fields on internal controlled-correction revertMatch invocations.

**Old Host risk / POLICY_OPEN:** deployed clients currently POST empty body; strict CAS will yield 422 for old tabs unless MP3 generated React, Zod, OpenAPI and Host are coordinated. Indefinite permissive fallback defeats strict public CAS. A00/HQ chooses phased rollout vs strict cutover. Completion action id must be supplied via authorized match read model or scoped API, not by guessing or by relying on the latest-50 generic action log. Private history disclosure and user role must be checked by A60.

**Narrow future file plan, separate GO ONLY:** tests first in focused revert integration suite; lib/api-spec/openapi.yaml; deterministic regeneration of lib/api-zod/src/generated/api.ts and React api.ts/api.schemas.ts; strict POST handler in artifacts/api-server/src/routes/tournaments.ts; Host confirmation snapshot; end-to-end QA. No SQL schema changes proposed. A100 owns tournament route in R11, so A70 cannot edit it now.

### MP2B negative test-first contract

| ID | Scenario | Expected |
|---|---|---|
| B01 | valid revision+completion ID, played/walkover/no_contest | 200; once-only history and audit |
| B02 | absent/null/array/malformed body | 422; zero-write |
| B03 | missing either field | 422; zero-write |
| B04 | field 0/-1/decimal/string/unsafe integer | 422; zero-write |
| B05 | intervening match revision | 409; zero-write |
| B06 | matching revision, wrong completion action | 409; zero-write |
| B07 | completed A→reverted→completed B, stale A retry | 409; B unchanged |
| B08 | concurrent identical POST | one 200, one 409; one audit event |
| B09 | downstream/qualification/routing committed | existing 409; zero-write |
| B10 | different tenant/viewer/revoked support | controlled 403/404; zero-write |
| B11 | controlled correction operation and receipt | baseline behavior unchanged |
| B12 | completion log older than 50 generic actions | authorized exact completion ID discoverable |

## 4. MP2C separate future source gate: malformed historical Undo payload

**SOURCE_CONFIRMED risk:** PR42 retains bare JSON.parse on lastAction.undoPayload BEFORE its try/transaction, and JSON.parse on lockedAction.undoPayload inside the transaction. A malformed persisted string may yield an uncontrolled exception; HTTP 500 is STATIC_INFERRED, not runtime reproduced. Its mapActionLog.canUndo currently tests nonempty payload, which can advertise an invalid payload as actionable.

PR27 provides a reference parser (domain/tournament/undo-payload.ts) with allowlist actionType→payload.type, parse try/catch, object/null/array rejection and stronger runtime state checks. It is older and stacked on PR7, not on release correction schemas; DO NOT cherry-pick the PR. Source parser type check alone is insufficient to validate match IDs, old snapshots, current state or tenant.

**Minimal future MP2C implementation, distinct from MP2B:**
1. Test-first parser over persisted text: return typed union or controlled invalid result; never throw JSON SyntaxError to HTTP. Reject nonstring/empty/truncated JSON, primitive, array, null, unexpected actionType or mismatched payload.type. No coercion.
2. Under tournament mutation lock re-read same candidate, recheck MP2A global LIFO and raw-payload identity, parse again. Validate positive safe integer matchId against action_log.matchId and tournament membership, before writes.
3. Invalid latest Undo => **409 UNDO_ACTION_CHANGED**, zero-write, preserve older history. Never skip malformed newest action, mark it undone, mutate older valid action or overwrite history.
4. Validate documented action families: result submitted/revert_match (completion action ID); started/postponed/restored/restore_status (allow only provable legacy nextStatus); BO odd positive and exact legacy canonical description suffix; featured previous/current ID tenant; cancellation previous status/note/current cancelled/result absent; players swapped snapshot and Deadlock game picks; roster through existing roster use case.
5. Legacy Missing nextRevision/nextStatus/nextPicks is not automatic approval: if target cannot be reconstructed and checked against locked state, 409 fail-closed. For old swaps missing nextPicks, any existing picks => 409, no swap.
6. No silent data migration/deletion, no global Undo rewrite, no user input semantic changes. Stored-history invalidity 409, whereas invalid NEW Direct Revert client body 422. Parser must not alter history. UI canUndo availability may use conservative parse but must not guarantee undo will execute; separate UI approval if needed.

**Policy gate:** A00 approves stable code 409 for malformed persisted Undo, conservative legacy fallback, and a manual remediation path for bad history. This is a distinct MP2C patch/code-lane after MP2B decision; do not combine.

### MP2C historical negative test-first contract

| ID | Payload/action fixture | Expected |
|---|---|---|
| H01 | invalid/truncated JSON latest | 409, no 500, zero-write |
| H02 | JSON null/array/primitive/empty string | 409, zero-write |
| H03 | incorrect type for declared actionType | 409, zero-write |
| H04 | non-integer or cross-tournament matchId, action.matchId mismatch | 409, zero-write |
| H05 | malformed newest action followed by older valid action | 409, do not undo older |
| H06 | queued X with malformed candidate and concurrently inserted newer Y | 409, Y preserved |
| H07 | documented legacy status, locked expected current state | valid once-only undo |
| H08 | legacy status mismatch/completed current | 409, zero-write |
| H09 | legacy BO canonical description and current BO parity | valid once-only undo |
| H10 | malformed/ambiguous legacy BO description | 409, zero-write |
| H11 | featured ID missing/other tenant/current featured changed | 409, zero-write |
| H12 | cancelled note/status mismatch or stale revision | 409, zero-write |
| H13 | old player swap missing nextPicks with Deadlock picks rows | 409, zero-write |
| H14 | valid swap with exact new snapshots and picks | exact restoration once |
| H15 | completion Undo with action.matchId mismatch | 409, zero-write |
| H16 | valid completion Undo but globally newer undoable action | 409, zero-write |

**Full no-write snapshots:** match status/revision/participants/score/winner; action_log IDs/isUndone/payload; result_history; stage/tournament version/status; players, stage_participants; match_game_picks; downstream slots; controlled correction receipts. Assert strict before/after identity after every rejected path, not just HTTP status.

## 5. Ownership / decisions / GO-STOP

**R11 DO NOT EDIT:** A100 owns artifacts/api-server/src/routes/tournaments.ts (DELETE route); A80 reviews artifacts/api-server/src/application/matches/revert-match.ts, PR45 frozen; A70 holds both. No OpenAPI/React/Zod/Host writes, no PR39 or PR42 changes. Any critical PR42 defect => alert A00, HOLD conflicting A100 edit before future patch authorization.

**Decisions requested from 00/HQ:**
1. External wire field expectedMatchRevision vs expectedRevision.
2. Strict Host cutover vs versioned compatibility; old tabs when POST {} now fails.
3. Authorized completionActionId read channel beyond newest 50 action-log entries, privacy.
4. Stable 409 for malformed stored Undo and legacy ambiguities; explicit operator repair policy instead of auto-skip.
5. Separate future GO for MP2B and MP2C only after a code lane and file ownership clear.
6. T020/T021 physical database ledger approval and A50/A60 exact-SHA isolated PG16 runtime evidence; no migrations in this work.

**Actual A70 R11 changes:** documentation/fixture only. No code modifications, no test DB, no manual CI, no merge/cherry-pick/deploy, no SWARM-006.

**NEXT:** A50 safely execute PR42 pinned PG suite, A60 independently review; A00 decide MP2B and MP2C policy/rollout/ownership and authorize one narrow future code lane if appropriate.

**STATUS:** MP1 & MP2A PATCH_PROPOSED / runtime not established; MP2B SOURCE_CONFIRMED gap + DESIGN READY (POLICY_OPEN); MP2C SOURCE_CONFIRMED parser gap + TEST-FIRST PLAN (POLICY_OPEN); release NO-GO.