# WEB-005 — A70 R14 — MP2B owner-policy decision + MP1/MP2A/history QA gate

**Task:** WEB-005-T040-A70-R14  
**Role:** A70 — Match Lifecycle & Undo; responsible for T040 source-only contract, not integration or QA self-certification.  
**Wave:** R14.1 / 2026-10-14 / Europe/Warsaw  
**Mode:** SOURCE-ONLY / NO CODE GO / QUALITY GATE.  
**Coordinator:** A00 WEB-005 Implementation Lead; final policy owner is owner/HQ.  
**Source:** WEB-005_WAVE_R14_AGENT_PROMPTS.md at chore/web-005/t000-wave1-control.  
**Pinned baseline:** release/tournament-ops-20261013-01 at 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.  
**Status:** PATCH_PROPOSED on three independent draft PRs, PG16 HTTP not runtime verified, strict Direct Revert public request policy OPEN, RELEASE_NO_GO, SWARM-006 HOLD.

## 1. Current GitHub state: exact independent candidates

| Packet | PR / exact HEAD | Base | State | Source files / collisions |
|---|---|---|---|---|
| P06 / MP1 Cancel+Restore | #39 / 16053ee132756ca05b6f2cd1f0cabae823905387 | 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 | OPEN DRAFT, 8 commits/8 files | routes/tournaments.ts, match-revision.integration.test.ts, OpenAPI and generated backend Zod/type files |
| P09 / MP2A global LIFO | #42 / 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | same | OPEN DRAFT, 3 commits/3 files | routes/tournaments.ts, revert-match.integration.test.ts, R9 report |
| P18 / history parser | #51 / 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | same | OPEN DRAFT, 6 commits/4 files | routes/tournaments.ts, revert-match.integration.test.ts, R12 report+handoff |

Other overlapping source PRs: #44 at 2f0187b7242681c394c09058b5ef647667206bd6 and #46 at 7f60849e389a7ed35fdd39dd5493c4c267d860 also change routes/tournaments.ts. No changes to release or main; no combined SHA. #39/#42/#51 source HEADs read and confirmed unmodified in R14. Direct Revert service file revert-match.ts not edited by A70 in this wave.

**GitHub CI evidence checked:**
- PR #39 exact HEAD has failed workflows; run 38573594642 job correction-qa failed at Pack 19 snapshot consistency tests. Subsequent PG application tests were not certified by this run. This is not direct evidence that MP1 failed.
- PR #42 branch Actions: zero runs found in R14 query.
- PR #51 branch Actions: zero runs found in R14 query.
- Formal GitHub review submissions for #39/#42/#51: zero in R14 query. This does not exclude independent written A60 QA outside GitHub.

**Secondary source nuance:** A10's R13 package manifest available in project Library cites an A60 R12 package matrix and records PR #51 at this exact HEAD as SOURCE_ACCEPTED_CONDITIONAL, with PG16/HTTP NOT_EXECUTED and package QA NOT_ACCEPTED. A70 did not directly inspect the referenced primary A60 matrix in GitHub; treat this as secondary-provenance conditional source status until A60 attaches the original signed exact-SHA receipt. Do not overwrite this with "no A60 review anywhere"; do not promote it to unconditional QA acceptance.

## 2. A50 isolated PostgreSQL16 / zero-write + rollback fixture for each exact HEAD

**Preflight MUST precede any command:** A50/owner authorizes a dedicated disposable PostgreSQL16 instance physically isolated from shared, staging and production resources, dedicated TEST_DATABASE_URL (database name contains test), TEST_DATABASE_SCHEMA matching tm_test_* and explicit consent for one test-schema reset via TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA. Verify the real host, database, schema, credentials role/privileges, no unsafe DATABASE_URL fallback, no user backups, Node22 and pinned pnpm10/lockfile. These instructions are NOT an instruction to run against a shared database. A70 did not execute any of them.

For each PR use a separate exact-SHA checkout / dedicated independent schema. Never test PR #39 and assume it covers PR #42/#51 or apply cherry-picks. After preflight, run:

| PR / exact HEAD | Isolated schema | Command (after typecheck) | Acceptance target |
|---|---|---|---|
| #39 / 16053ee132756ca05b6f2cd1f0cabae823905387 | tm_test_t040_r14_mp1 | pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts | stale revision/ABA 409; PATCH cancel/restore bypass 422; duplicate cancel/restore only one legal commit; invalid input and post-409 zero-write; ordinary valid Cancel/Restore |
| #42 / 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | tm_test_t040_r14_mp2a | pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts | deterministic queued-X/newer-Y global LIFO for revert_match and restore_status: stale X 409 UNDO_ACTION_CHANGED, no X writes, committed Y preserved; legal newest Undo 200 once |
| #51 / 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | tm_test_t040_r14_hist | pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts | 17 authored cases H01-H17; malformed persisted JSON/action/matchId 409 with no writes; malformed latest must NOT undo older valid; legal historical status and result Undo still work |

For EACH checkout, run before the targeted suite: pnpm --filter @workspace/api-server typecheck.
Collect command line, exact HEAD SHA, runner versions, dependency lockfile identity, exit code, TAP totals (pass/fail/skip), database/schema fingerprint without secrets, reset consent and independent before/after snapshots. No real executed commands, exit codes or runtime counts were provided to A70 in this R14 run.

### Precise reproducible fixtures and rollback/no-write control

**Fixture MP1:** create disposable tournament with organizer and support sessions plus two matches in known statuses and revisions. Store S0 snapshots. X reads revision r; Y changes status/revision, X attempts Cancel/Restore with r. Expect 409 and SQL state equal to post-Y, not pre-Y. Repeat ABA (two changes restore an outwardly identical status but revision increased). For generic PATCH sending status cancelled or transitioning away from cancelled, expect 422, no changes. Preserve legal expected current revision success once; duplicate concurrent requests commit only once. Note: PR39 currently accepts OPTIONAL expectedRevision on dedicated Cancel/Restore for legacy clients; the stricter client requirement remains a separate owner decision, not a test assumption that it is mandatory today.

**Fixture MP2A:** B begins a transaction holding the target tournament row lock; X begins POST undo-last after reading candidate action A and queues behind B; verify X is actually waiting via PostgreSQL pg_blocking_pids barrier (not mere timer). B updates another match and inserts newer undoable action Y under same tournament, then COMMITs; X resumes and MUST return 409 UNDO_ACTION_CHANGED. Compare all post-Y rows against state after X: no X-originated writes, exactly one newer committed Y, both original and newer actions stay not-undone. Repeat with A as match completion undo (revert_match) and A as generic restore_status. A correctly latest action must still Undo once. If B aborts, explicitly ROLLBACK its fixture transaction; never run production cleanup.

**Fixture #51:** insert a corrupt action_log.undo_payload into dedicated test fixture after one older valid action; capture S0 (including both actions). Invalid latest must 409 and leave BOTH action records, result_history and match state untouched. Table-driven H01–H11: truncated JSON, null, array, primitive, empty object, unknown type, action/type mismatch, absent/string matchId, malformed prevStatus, unknown actionType. H12: invalid newer above older valid, no fallback. H13–H15: foreign match, action-to-payload mismatch, foreign featured match: capture both tournament snapshots, no foreign match_game_picks write. H16/H17: valid status and completed-result Undo, history retained. No direct user data; synthetic only.

**Snapshot minimum:** tournaments, matches (status/revision, participants, score, winner, note), action_log (all IDs, payload, is_undone), result_history, players, tournament_stages, stage_participants, match_game_picks, downstream match slots, correction receipts where populated. State after any HTTP 4xx must equal the committed valid baseline (after any Y), and no new action receipt may be inserted by rejected X. Positive controls must show exact intended one-way state change. On test failure, A50's disposable harness may reset ONLY its explicitly approved isolated tm_test_* schema; do not use schema reset as proof of request-level rollback.

**Evidence gate:** If no approved isolated DB or dependencies are available, mark BLOCKED/NOT_EXECUTED, do not fabricate test results. This report supplies commands and expected behavior, not a run.

## 3. A60 independent QA, defects and interoperability

A60 must separately review all three pinned HEADs, not their author's self-report, and issue exact-SHA verdict for source and runtime:
- #39 MP1: PATCH cancellation bypass, CAS/ABA, optional expectedRevision legacy behavior, note/revision consistency, Zod/OpenAPI+generated React parity gap; valid restore/cancel and no-write negative cases.
- #42 MP2A: global latest eligible Undo recheck after tournament row lock, both generic and revert_match under the SAME transaction, deterministic barrier, no stale A revert, valid newest Undo; compare lock order to #51 parser.
- #51 history parser: corrupted persisted data yields structured 409, zero-write, no skip of malformed top action; tenanted IDs and cross-tournament match_game_picks; valid legacy Undo and roster/result history parity. STRUCTURAL validation is not full state CAS of well-formed old actions.
- Cross-PR conflicts: all three edit routes/tournaments.ts, #42/#51 also edit revert-match.integration.test.ts; #44/#46 route overlap; potential MP1 generated OpenAPI/Zod vs React/Host parity. Later future integration owner resolves, never A70 during R14.
- Result_history and action_log migration risk: verify legacy entries without nextRevision/nextStatus/nextPicks cannot override newer state; no auto-skip/reassignment, ambiguous data fail-closed and operator remediation separately approved. Domain result_history match/stage lineage is T050/A80 and portable Backup V3 B2/A90 responsibility, not something the Undo parser should fabricate. PG16 ledger validation and migration deployment are A20/owner scope.

**A60 deliverable:** direct signed source report with exact SHA(s), checks performed, severity-coded evidence, and actual A50 raw command/exit/TAP/DB snapshot receipt references. The secondary A10 manifest citation of A60_R12_SOURCE_ACCEPTED_CONDITIONAL for #51 must be verified against that primary report before final promotion. SOURCE_ACCEPTED does not imply RUNTIME_VERIFIED, mergeability, or deployment GO.

## 4. OWNER/HQ decision packet — T040-MP2B-DECISION-R14, one signature

**Current source gap SOURCE_CONFIRMED:** Public POST /matches/:id/revert route accepts only path id and calls revertMatch without request preconditions; domain revertMatch supports optional expectedMatchRevision and expectedCompletionActionId, compares both under transaction/match/completion locks, and emits 409-coded domain errors. OpenAPI has no Direct Revert requestBody; generated Zod has no RevertMatchBody; generated React revertMatch(id,options?) and Host revertMatch.mutate({id}) cannot send CAS. Public tournament action-log endpoint returns at most 50 actions and cannot ensure authorized current completion action ID discovery after more history entries.

**Proposed external request (NOT APPROVED, NOT CODED):**
~~~json
{"expectedMatchRevision":7,"expectedCompletionActionId":1234}
~~~

**Recommended substantive direction for owner signature:** STRICT DUAL CAS for public Direct Revert once end-to-end Host/API/client parity and immutable action-ID discovery are released together. Do not accept a long-term optional public token fallback. Scope mandatory validation to PUBLIC HTTP handler only; do not silently break internal T050 controlled correction use-case with expectedStageVersionVector/correction receipts.

| Decision field | Proposed default | Explicit owner alternative / unresolved question |
|---|---|---|
| Required tokens | both expectedMatchRevision and expectedCompletionActionId are mandatory positive safe integers | Owner may select external expectedRevision instead of expectedMatchRevision; choose ONE canonical wire name, no ambiguous aliases |
| Invalid or missing client JSON | HTTP 422, stable INVALID_REVERT_PRECONDITION, zero writes | Owner must confirm 422 vs 400 for malformed JSON parser errors, stable machine error name |
| Stale revision | HTTP 409 CONCURRENT_MODIFICATION, zero writes | Owner signs error priority if both tokens stale |
| Stale/unknown completion ID, ABA/double submit | HTTP 409 UNDO_ACTION_CHANGED, zero writes | No automatic retry against newly fetched tokens |
| Old Host/browser tabs | Strict coordinated rollout after generated client and Host update (recommended) | Temporary **explicitly versioned and time-boxed** legacy endpoint/feature gate with finite sunset; permanent silent optional bypass is discouraged |
| Current active completion ID read | authorized match detail or narrow authorized endpoint with activeCompletionActionId bound to the read match revision | Owner chooses endpoint/access policy; generic latest-50 action-log insufficient |
| Internal revert-match use case | preserve controlled-correction stage-vector/receipt pathway | Owner documents any separate requirements, no hidden interface breaking |

**Owner/HQ required sign-off:**
- Decision ID: T040-MP2B-DECISION-R14
- Signed policy variant: STRICT / EXPLICIT_VERSIONED_TRANSITION / DEFERRED
- Canonical wire key: expectedMatchRevision or expectedRevision
- Result of 422 vs malformed raw JSON mapping and stale precedence
- Auth scope and response shape of activeCompletionActionId read model
- Old Host release order / compatibility expiry
- Author, timestamp, version and explicit approval for next separate code lane
Until ALL materially relevant cells are signed, MP2B remains POLICY_OPEN / CODE STOP.

### Why a naive one-file change is insufficient

Existing Host sends only match ID. Enforcing a required body immediately would reject old Host operations with 422. The current generated React mutation signature lacks request data; OpenAPI/Zod contract is missing. Guessing completion ID from the last 50 action records fails for older results; guessing it from match revision is invalid. An apparently successful one-file Direct Revert patch without the client/read-model rollout would produce a user-visible regression. No policy is chosen by this A70 document.

### Future test-first acceptance matrix AFTER a separately issued GO

C01 valid played, walkover and no_contest current pair -> 200, one Undo and one log;
C02 body missing, null, array, wrong types, negative/zero/decimal/string/unsafe integers -> 422, zero-write;
C03 stale match revision -> 409 CONCURRENT_MODIFICATION, zero-write;
C04 correct revision but stale completion ID -> 409 UNDO_ACTION_CHANGED, zero-write;
C05 ABA complete A -> revert A -> complete B -> old request must NOT revert B;
C06 two simultaneous identical POST -> one success max, loser 409;
C07 current completion beyond 50 action log entries -> authorized read still exposes correct actionId;
C08 anonymous/viewer/revoked support/other tournament -> existing 401/403/404, zero-write;
C09 protected downstream/approved qualification/committed stage -> current domain guards remain active;
C10 internal controlled-correction receipt/stage vector -> unchanged behavior, no divergence;
C11 old Host tab -> explicit chosen legacy handling, no silent downgrade;
C12 stale UI confirmation after another operator's change -> clear 409, refetch, require new operator confirmation, never auto-resubmit.

## 5. Future narrowly scoped code lane REQUEST ONLY, not GO

Prerequisites, in order:
1. A00/HQ signs the entire T040-MP2B-DECISION-R14 record including strict/transition, external name, read model and release order.
2. A50 supplies executable independent exact-SHA receipts for #39/#42/#51 or A00 formally documents a block, its reason and accepted compensating risk; A60 issues independent exact-SHA source verdicts with defects dispositioned.
3. A00 reserves exclusive ownership for routes/tournaments.ts (conflicts #39/#42/#44/#46/#51), and for Host/OpenAPI/Zod/React generated client. T050/A80 retains revert-match.ts corrections.
4. A00 issues a separate explicit narrow test-first code GO on a pinned approved base for public POST body parsing/validation/forwarding plus the authorized completion-ID read contract, with MP3 Host/generated client parity sequenced. Do not automatically create a branch/PR from this proposal.
5. A50/A60 complete native isolated PG16+frontend verification of that separate candidate; later composite integration belongs ONLY to SWARM-006 after formal WEB-005 final closeout.

**Proposed next single small patch:** only the public Direct Revert boundary (request precondition validation and forwarding) plus its focused negative HTTP tests **after** policy and read-model/client rollout sequencing are resolved; do not alter domain correction semantics or historical parser as part of that patch. If no safe rollout exists, NO PATCH / POLICY_OPEN is the correct outcome.

## 6. R14 GO/STOP disposition

- SOURCE_CONFIRMED: PR39/42/51 exist at pinned SHA with scoped source fixes, #51 malformed Undo parser, #42 global LIFO, #39 Cancel/Restore.
- PATCH_PROPOSED: three independent open drafts, no combined build.
- SOURCE_ACCEPTED: a secondary A10 R13 manifest references conditional A60 source acceptance of #51; original primary signed review not verified by A70; no unconditional author-claimed acceptance.
- RUNTIME_VERIFIED: NOT_ESTABLISHED for exact independent PG16 HTTP tests; PR39 CI fails before target gate, PR42/51 have no recorded branch Actions.
- POLICY_OPEN: public Direct Revert strict CAS/client rollout/read model, historical legacy remediation, any separate stage/backup history changes.
- R14 A70 actual code/test execution: NO APPLICATION SOURCE EDITS, NO SQL, NO NATIVE TEST EXECUTION, NO CI RETRY.
- Merge/rebase/cherry-pick, production/staging, real backups, SWARM-006: HARD STOP / RELEASE_NO_GO.
- Exact next action: A00 appoints A50 isolated PG executor and obtains A60 primary exact-SHA verdict for PR39/#42/#51, then signs or explicitly defers T040-MP2B-DECISION-R14 before any future code GO.