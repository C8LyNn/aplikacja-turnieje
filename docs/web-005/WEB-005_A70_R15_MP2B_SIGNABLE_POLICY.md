# WEB-005 / A70 / R15 — T040 MP2B Direct Revert CAS — OWNER-SIGNABLE POLICY

**Document ID:** WEB-005-T040-MP2B-DECISION-R15  
**Agent:** A70 — Match Lifecycle & Undo  
**Task:** WEB-005-T040-A70-R15  
**Prepared:** 2026-10-14 Europe/Warsaw  
**Status:** DECISION REQUEST / POLICY_OPEN / **NOT SIGNED**  
**Policy owner:** Global HQ/owner, coordinated by WEB-005 A00 Implementation Lead  
**Authority:** SOURCE-ONLY — proposal, NOT implementation, API release, merge, A60 independent acceptance or SWARM-006 handoff  
**Instruction:** WEB-005_WAVE_R15_AGENT_PROMPTS.md R15.1, §§0–2 and AGENT A70  
**Release source baseline:** release/tournament-ops-20261013-01 @ **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**

## 1. Verified source evidence: problem and dependencies

| Package | Exact HEAD, separately verified at R15 | GitHub state | R15 status |
|---|---|---|---|
| P06, MP1 Cancel/Restore | PR #39: **16053ee132756ca05b6f2cd1f0cabae823905387** | OPEN DRAFT, not merged | PATCH_PROPOSED / PG16 not verified |
| P09, MP2A global latest Undo LIFO | PR #42: **1ae0ccb801f4177052bff1ec7041e55b8c992c8b** | OPEN DRAFT, not merged | PATCH_PROPOSED / PG16 not verified |
| P18, malformed historical Undo payload | PR #51: **2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a** | OPEN DRAFT, not merged | PATCH_PROPOSED / PG16 not verified |

**SOURCE_CONFIRMED MP2B gap:** On the pinned release source, public \`POST /matches/:id/revert\` validates path id and write role then calls \`revertMatch({matchId, expectedTournamentId, actor})\`; it does **not** parse body or pass request-level \`expectedMatchRevision\` / \`expectedCompletionActionId\`. The domain use case in \`artifacts/api-server/src/application/matches/revert-match.ts\` already supports optional fields with transactional comparisons; internal controlled correction also uses \`expectedStageVersionVector\` and correction operation receipts. \`lib/api-spec/openapi.yaml\` declares NO requestBody at \`/matches/{id}/revert\`; generated \`lib/api-client-react/src/generated/api.ts\` has \`revertMatch(id, options?)\` with NO typed data; \`artifacts/tournament-manager/src/pages/tournament-host.tsx\` sends \`revertMatch.mutate({id:matchId})\`. A public strict CAS server-only patch is NOT deployable without a synchronized client/read-contract solution.

**Completion action discovery:** existing \`GET /tournaments/:id/action-log\` orders by created_at and applies \`.limit(50)\`. A valid match completion may be older than these 50 entries. Do not require Host to guess completion action by match revision or scan only that window. A privileged match read model or a dedicated bounded authorized endpoint must return the current active completion action id and matching match revision.

**Distinct risk lanes:** MP1 is Cancel/Restore status/revision; MP2A checks global latest action under tournament lock; PR51 safely parses persisted \`action_log.undo_payload\`. Neither MP2A nor PR51 implements strict public Direct Revert request CAS. Do not reuse PR27 (stacked on PR7) wholesale.

## 2. TWO ALTERNATIVES — sign EXACTLY ONE; NO VARIANT SELECTED BY A70

### OPTION A — STRICT PUBLIC DUAL CAS, coordinated cutover (recommended for complete invariant)

- \`POST /matches/{id}/revert\` requires **both** \`expectedMatchRevision\` and \`expectedCompletionActionId\` as positive, safe JSON integers on **every** new public request.
- Host reads a version-linked active completion id from the authorized read model at confirmation time and submits an immutable confirmation snapshot. OpenAPI → Zod/generated types → React generated client → Host implementation are released in a coordinated, explicitly planned cutover alongside the strict server.
- Old Host/browser tabs posting only \`{id}\` (no body) receive controlled validation failure, not silent no-CAS revert; UX must communicate refresh/upgrade. No indefinite fallback.
- Internal T050 controlled-correction service behavior remains compatible; mandatory preconditions apply at the PUBLIC HTTP boundary only.
- **GO prerequisite:** agreed rollout guarantees client availability or owner accepts explicit user-facing old-tab refresh behavior; independent QA must cover both.

### OPTION B — EXPLICIT TIME-BOXED LEGACY HOST TRANSITION, ending in strict CAS

- The **new** API/Host path uses exactly the same mandatory dual CAS as Option A. Legacy no-body behavior may exist temporarily **only behind a separately defined explicit API version, allowlist or release feature gate**, not by an invisible optional field on the same unversioned new route.
- Required transition record: \`legacy_surface\`, \`eligible_actor_scope\`, \`start_date\`, \`hard_stop_date\`, rollback condition, observability (counts of remaining legacy requests), and an owner-named sunset executor. No unconditional unrestricted legacy bypass.
- Owner documents the security/stale-reversal residual risk while old access is enabled, compensating server-side authorization and operator warning, and A60 acceptance of that bounded exception. All legacy requests remain guarded by existing domain role, state and qualification rules; do NOT pretend they have CAS.
- After signed sunset, **all** public requests must meet Option A dual-precondition contract. No auto-renewal, no permanent dual semantics.
- **GO prerequisite:** explicit owner-approved duration and removal task/owner, tests for legacy-only endpoint/gate and observable removal.

### Decision to sign

- [ ] **OPTION A — STRICT**: no legacy bypass; coordinated API/Host cutover and refresh old tabs.
- [ ] **OPTION B — TIME-BOXED TRANSITION**: explicit legacy surface, end date and owner, eventual strict enforcement.
- [ ] **DEFER** both until missing contract information/QA is supplied; KEEP CODE STOP.

**Default until signature: DEFER / POLICY_OPEN / NO MP2B CODE GO.**

## 3. Shared contract under either approved A or B

| Contract dimension | PROPOSED exact behavior | Owner signoff item |
|---|---|---|
| Public body | \`{"expectedMatchRevision":7,"expectedCompletionActionId":1234}\` | Choose \`expectedMatchRevision\` or \`expectedRevision\` as ONE external name; no hidden alias |
| Values | Two required positive **safe integers**, type number, no coercion; reject missing/0/negative/decimal/string/unsafe | Confirm required strict validation |
| Missing/malformed/invalid JSON shape | HTTP **422** with stable \`INVALID_REVERT_PRECONDITION\`; zero writes | Owner must confirm malformed RAW JSON handler error mapping 422 vs existing framework 400 |
| Stale match revision | HTTP **409 CONCURRENT_MODIFICATION**, zero writes | Confirm priority if both revision+action token stale |
| Stale/wrong completion id | HTTP **409 UNDO_ACTION_CHANGED**, zero writes | Reject replay, ABA and duplicate completion action |
| Valid current pair | HTTP 200, exactly one completion reversal and once-only action log; preserve immutable result_history | Preserve result/history semantics and sporting guards |
| Concurrent identical POST | One success at most, later request 409, no second correction | No automatic client retry |
| Authorization | Existing anonymous/viewer/organizer/support restrictions preserved; cross-tournament match ID denied | Decide whether read model reveals active ID to organizers/support only and spectator behavior |
| Completion ID read | Authenticated scoped \`activeCompletionActionId\` coupled with current match \`revision\` on match-detail/read model or dedicated scoped endpoint; works when completion is older than 50 log rows | Owner chooses API surface and exact read authorization |
| Host UX | Capture immutable pair on opening confirm; 409 -> invalidate/refetch, show stale message, require **new operator confirmation**, never resubmit new tokens automatically | Approve old-tab and cross-device UX |
| Internal correction | Do not break domain \`revertMatch\` calls using stage version vectors and correction receipts | Independent T050/A80 regression |

**Important security interpretation:** returning an action identifier may reveal internal history metadata. A00/A30/A60 must review authorization for the newly exposed field. Do not place raw \`undoPayload\` or private correction details in the Host read response. An id+revision read is an optimistic hint, never a substitute for locked POST validation.

## 4. Owner signature form / machine-verifiable decision record

Fill each field and commit the signed decision under \`DECISIONS.md\` (by authorized A00/HQ only), referencing this document; do NOT treat the checked list here as authorization.

| Field | Owner entry / unresolved |
|---|---|
| Decision ID | \`WEB-005-T040-MP2B-DECISION-R15\` |
| Signed option | **[OPTION_A / OPTION_B / DEFER — TO FILL]** |
| Canonical wire name | **[expectedMatchRevision / expectedRevision — TO FILL]** |
| Invalid JSON code | **[422 INVALID_REVERT_PRECONDITION / scoped 400 decision — TO FILL]** |
| Stale precedence | **[CONCURRENT_MODIFICATION before UNDO_ACTION_CHANGED / otherwise — TO FILL]** |
| Active completion ID read API | **[endpoint/read-model field + roles + revision linkage — TO FILL]** |
| Host cutover strategy | **[deployment order, old tabs behavior — TO FILL]** |
| If Option B: legacy gate | **[surface / allowlist / start / hard stop / owner / telemetry — REQUIRED]** |
| Approving owner/HQ | **[name or signed authority, date/time, decision version — TO FILL]** |
| A00 task+file reservation | **[authorization identifier, branch baseline SHA, exclusive files/hunks — FUTURE]** |
| QA prerequisite waiver? | **[NONE unless explicitly recorded with scope and risk — TO FILL]** |

NO A70 self-signoff. Policy can be approved independently of code, but **code GO is a distinct later A00 authorization** on exact SHA and exclusive file scope.

## 5. Pinned independent QA runbook — A50/A60, not executed by A70

**Physical PG16 preflight first:** owner-authorized disposable PostgreSQL16 with test-only \`TEST_DATABASE_URL\` (DB name includes \`test\`, no prod/shared credentials); \`TEST_DATABASE_SCHEMA\` matches \`^tm_test_[a-z0-9_]+$\`; \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\` scoped only to the test schema; confirm NODE_TEST_CONTEXT via Node runner; Node22/pnpm10 and lockfile in an actual exact-SHA checkout. No production/shared data or destructive scripts. Run each PR separately; never compose patch branches here.

\`\`\`sh
# PR #39 checkout at 16053ee132756ca05b6f2cd1f0cabae823905387
# TEST_DATABASE_URL = verified isolated PG16 dedicated TEST db, configured privately
export TEST_DATABASE_SCHEMA=tm_test_t040_r15_mp1
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

# PR #42 checkout at 1ae0ccb801f4177052bff1ec7041e55b8c992c8b
export TEST_DATABASE_SCHEMA=tm_test_t040_r15_mp2a
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts

# PR #51 checkout at 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a
export TEST_DATABASE_SCHEMA=tm_test_t040_r15_hist
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
\`\`\`

Each checkout's tests need a **separate fresh, explicitly authorized isolated fixture/reset**. An environment variable alone is not proof of isolation. Capture full HEAD, test schema & host fingerprint without secrets, commands, exit codes, TAP pass/fail/skip, PostgreSQL actual version, expected/actual HTTP and before/after SQL snapshots. No 200/409/422 can be certified without actual HTTP/app runtime.

### Required existing regressions, test-first acceptance

| Lane | Negative | Positive | No-write invariant |
|---|---|---|---|
| #39 MP1 | Generic PATCH cannot bypass Cancel/Restore, 422; stale expectedRevision/ABA 409; duplicate request | Normal authorized Cancel/Restore with current revision | Rejected action adds zero match, history, log, stage, participant, correction changes |
| #42 MP2A | X queued on tournament row behind B, Y writes newer action and commits; X gets 409 UNDO_ACTION_CHANGED for **revert_match AND restore_status** | Normal newest Undo 200 once | Compare post-Y DB snapshot: X did not write or undo Y; no older action secretly consumed |
| #51 history | 11 malformed payload shapes + 4 tenant/no-skip cases -> 409 UNDO_ACTION_CHANGED | Valid legacy status Undo 200; valid completion Undo 200 with result_history retained | Exact DB snapshots for tournament, matches, action_log, history, stages, players, game picks; both tournaments in cross-tenant cases |

**Existing test definition evidence:** #39 \`match-revision.integration.test.ts\`; #42 \`revert-match.integration.test.ts\` contains \`pg_blocking_pids\` lock barrier with two queued-X cases; #51 \`revert-match.integration.test.ts\` includes 11 table-driven + 6 individual cases. Definitions do NOT indicate execution.

**Runtime receipts now:** #39 exact-HEAD GitHub Actions run \`38573594642\` FAILED at upstream **Pack19 snapshot consistency tests**, not a feature-specific PG verdict. #42 and #51 have no found HEAD workflow runs. GitHub PR review lists for all three are empty. R14 A10 manifest (secondary) reported A60 \`SOURCE_ACCEPTED_CONDITIONAL\` for #51 based on an R12 source matrix, but original primary signoff/URL was not verified by A70; conditional ≠ \`RUNTIME_VERIFIED\`.

**A60 direct QA needed:** attach signed exact-SHA SOURCE_ACCEPTED/FAIL, structural and concurrency checks, no-write snapshots; do not infer pass from author's static checks or one branch's tests. A50 supplies actual PG16 proof with exit/TAP. If no safe DB, \`BLOCKED\`, explicitly no synthetic pass.

## 6. Conflict ownership / future MINIMAL code lane request (NOT GO)

**Existing shared file collision:** \`artifacts/api-server/src/routes/tournaments.ts\` is changed independently by PR #39/#42/#44/#46/#51, and \`artifacts/api-server/test/revert-match.integration.test.ts\` by #42/#51. These PRs remain frozen. Do not merge, rebase, cherry-pick, create WEB-005 composite branch or modify existing PR heads.

**Smallest future, gated source code lane:** after owner signs one option, A00 assigns ONE exclusive backend owner for (a) a focused negative-test suite for \`POST /matches/:id/revert\`, (b) public body validation / forwarding existing domain fields and selected stable error codes, and (c) a narrowly authorized active-completion-ID read model if separately allowed by owner. It must use an A00-pinned integration-aware base and explicitly reserved \`routes/tournaments.ts\` hunks so T080 security patch authors do not concurrently touch them. Keep \`revert-match.ts\` T050/A80 implementation intact unless separately proven defective. Independently sequence MP3 OpenAPI/Zod/React/Host tests and compatibility cutover; do not silently change the current API wire before that policy is signed.

**Prerequisite order:**
1. One owner/HQ policy signature (option, field names, error precedence, read authorization, compatibility sunset).
2. A50 safe PG16 exact-SHA receipts or an explicit A00/HQ documented risk disposition; A60 primary exact-SHA source verdict and independent runtime review for PR #39/#42/#51.
3. A00 exclusive ownership window covering the conflicting route/test and generated API/Host files, identifying the exact approved source base.
4. Separate explicit new code authorization; THEN implement future test-first narrow lane. R15 is **NO CODE GO**.
5. SWARM-006 later integrates only after whole WEB-005 backlog formal closeout and separate owner/HQ permission.

## 7. T040 vs Backup V3 B2 / migration ownership

- **A70/T040:** \`action_log.undo_payload\` parser, tournament Undo global LIFO, public Direct Revert CAS interface. Stored history is not automatically repaired or skipped.
- **A80/T050:** domain \`revert-match.ts\` evaluates live \`result_history\` invariants, correction stage vector, qualification and sporting state.
- **A90/T060 B2:** Backup V3 portable match revision serialization, \`result_history\` backup match/stage provenance, legacy snapshot shape, import validation/repair policy. No transfer of this scope to the Undo JSON parser; no fabricated/relinked historical result record.
- **A20/T020/T021:** migrations and actual PG16 ledger/preflight. A70 does not approve DDL or infer deployed migration state from repository source.

**Risk requiring future cross-owner QA:** legacy \`action_log\` records without nextStatus/nextRevision/nextPicks, plus mismatched result history after an import, must never trigger arbitrary fallback to older Undo or cross-tournament write. Invalid history is a controlled rejection with explicit future remediation policy; portable Backup B2 validation is independent.

## 8. Final disposition

- R15 A70 changed application files: **NONE**.
- Report/policy documentation only; frozen PR39/#42/#51 untouched.
- PR39/42/51: **PATCH_PROPOSED**, not proven full runtime.
- Owner option: **UNSIGNED / POLICY_OPEN**. No policy chosen by A70.
- Actual Node/pnpm/HTTP/PG16 tests by A70: **NOT_EXECUTED**; no exit/TAP/safe DB fixture.
- Formal A60 independent acceptance on exact heads: **NOT_VERIFIED_BY_A70**. Secondary conditional #51 source report does not imply full package signoff.
- No merge / migration / paid CI / staging / Replit / production / SWARM-006.
- **NEXT FOR A00:** circulate the binary owner decision and collect its signed record; obtain A50 exact-SHA PG16 receipts and A60 signed matrix; reserve a future unconflicted file window if both policy and QA gates clear.
