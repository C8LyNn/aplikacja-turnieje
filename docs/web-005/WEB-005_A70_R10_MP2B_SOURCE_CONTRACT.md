# WEB-005_A70_R10_MP2B_SOURCE_CONTRACT

**AGENT:** A70 — Match Lifecycle & Undo  
**TASK:** WEB-005-T040-A70-R7 / WAVE R10  
**MODE:** SOURCE-ONLY / NO CODE / MP2B DESIGN  
**DATE:** 2026-10-14 Europe/Warsaw  
**BASE:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**MP1:** PR #39 @ 16053ee132756ca05b6f2cd1f0cabae823905387 (OPEN DRAFT)  
**MP2A:** PR #42 @ 1ae0ccb801f4177052bff1ec7041e55b8c992c8b (OPEN DRAFT, FROZEN)  
**PR #7:** 4621fc1580c718b304b5526f74269d6bfe234c9f  
**PR #27:** 8e5a6e1fc613a0afacca22ac21bf86a38899e034; PR #27 base is exact PR #7 HEAD.  
**Evidence:** SOURCE_CONFIRMED for API gap, STATIC_INFERRED for consequences, POLICY_OPEN for legacy compatibility, NOT_EXECUTED for HTTP/PG16.  
**Authorization:** R10 grants no code writes to A70. This document is a proposal, not an MP2B implementation GO.

## 1. Actual current source contract

- \`artifacts/api-server/src/routes/tournaments.ts\`: \`POST /matches/:id/revert\` checks route id and write authorization, then calls \`revertMatch({ matchId, expectedTournamentId, actor })\`. It neither parses request body nor forwards revision or completion action ID.
- \`artifacts/api-server/src/application/matches/revert-match.ts\`: the existing domain \`RevertMatchInput\` already permits **optional** \`expectedMatchRevision\` and \`expectedCompletionActionId\`; inside the transaction after \`FOR UPDATE\` the match revision is compared and the unique live \`match_result_submitted\` log action is checked. Mismatch uses \`CONCURRENT_MODIFICATION\` or \`UNDO_ACTION_CHANGED\` (mapped by route to 409). Preserve these guards and controlled-correction integration, including \`expectedStageVersionVector\` and \`correctionOperationId\`.
- \`lib/api-spec/openapi.yaml\`: \`/matches/{id}/revert\` defines **no requestBody**.
- \`lib/api-zod/src/generated/api.ts\`: \`RevertMatchParams\` and response only, no \`RevertMatchBody\`.
- \`lib/api-client-react/src/generated/api.ts\`: \`revertMatch(id, options?)\` has no typed data argument.
- \`artifacts/tournament-manager/src/pages/tournament-host.tsx\`: \`revertMatch.mutate({ id: matchId })\` omits preconditions. \`Match\` includes \`revision\`, but the immutable active completion action must be identified. Action log includes \`id\`, \`actionType\`, \`matchId\`, \`isUndone\`, yet \`GET /tournaments/:id/action-log\` limits to 50 records; there is no guaranteed current-match completion-id discovery channel after older history exceeds 50.
- \`lib/db/migrations/0028_match_revision.sql\`: server-owned match revision incremented on relevant state mutations. Deployed schema/ledger verification remains T020/T021/A50 responsibility.

## 2. Proposed MP2B public request contract (not approved)

Proposed *future* JSON request body:
\`\`\`json
{"expectedMatchRevision": 7, "expectedCompletionActionId": 1234}
\`\`\`
- Both fields: **required when activating strict MP2B**, positive **safe integers**. Alternative external name \`expectedRevision\` requires A00 naming decision; never accept two names silently or implement conflicting semantics. For internal use case keep \`expectedMatchRevision\`. Do not rely on a client-supplied tournament ID; resolve match->tournament and recheck ownership under lock.
- If body is missing, nonobject, wrong type, noninteger, <=0, NaN, unsafe integer, array, or has contradictory aliases: **422** with stable code \`INVALID_REVERT_PRECONDITION\`, zero writes. Optional unknown-key rejection subject to API contract review; known-only strict schema recommended.
- Compare both preconditions **inside the same transaction after tournament/stage/match locks** and before any reset/result-history/action-log/stage changes. Existing use case has the comparison logic; HTTP route must pass validated fields.
- Correct current completion ID + revision -> existing authorized reversible result behavior, with one action marked undone and one revert log in same transaction.
- Stale revision, stale completion ID, ABA / double submit, completed→reverted→completed again -> **409** \`CONCURRENT_MODIFICATION\` (revision) or \`UNDO_ACTION_CHANGED\` (completion ID), **zero writes**. A repeated HTTP request must never revert a *different* completion.
- Auth failures continue to be denied. Nonexistent match 404; downstream/approved-qualification/route guards remain active; terminal Swiss and RR policy not altered here.
- Existing controlled-correction flows and direct domain invocations without request-level CAS must not be accidentally broken. Strict **public** revert route requirements do not silently redefine controlled-correction \`revertMatch\` API.
- **Critical policy/rollout decision for A00:** old Host clients currently post \`{}\`. Strict body-on means they receive 422 until MP3 Host and generated React code deploy together. Select a coordinated release/rollout mechanism (e.g. explicit version gate); a long-term permissive fallback would defeat request-level CAS. No default policy decided by A70.
- **Completion ID discovery decision for A00:** either expose \`activeCompletionActionId\` on an authorized match detail/read model, or add a bounded dedicated endpoint; relying solely on the last-50 tournament action log is not robust. A60 verifies no disclosure of private history to unprivileged viewers.
- No new migration is proposed for MP2B if existing DB schema is sufficient; real PG16 ledger prerequisites remain unverified.

## 3. Suggested isolated implementation order **after separate A00 GO**

**IB-0 Tests first:** add regression to \`artifacts/api-server/test/revert-match.integration.test.ts\` with public body semantics, stale/ABA/double-submit, zero-write snapshots and legal controls. Preserve existing fixture behavior by explicitly updating legacy POST {} tests only as part of an approved, coordinated client-contract change.

**IB-1 OpenAPI & generated contract:** add \`RevertMatchInput\`/body in \`lib/api-spec/openapi.yaml\`, deterministically regenerate \`lib/api-zod/src/generated/api.ts\` and type exports, and \`lib/api-client-react/src/generated/api.ts\` + \`api.schemas.ts\`. Confirm generated file parity, no manual type drift.

**IB-2 Backend route:** in \`artifacts/api-server/src/routes/tournaments.ts\` add strict body parse and forward validated \`expectedMatchRevision\`, \`expectedCompletionActionId\` to existing \`revertMatch\`. Do not reimplement transactional domain logic; don't weaken T050 guards. Keep machine-readable 409/422.

**IB-3 Client Host:** in \`artifacts/tournament-manager/src/pages/tournament-host.tsx\`, hold immutable match revision + completion identity snapshot at confirmation-open, reject stale data locally, pass both preconditions; on 409 refetch and retain explicit operator intent (no automatic resend of a new completion). Reconcile old-tabs and client/API release order.

**IB-4 Regression and independent QA:** isolate PG16, test on same composite SHA after A100/A80 shared-file integration. No merge/deploy until A60 signs exact SHA and A00 resolves policy.

### File ownership R10: no edits now

- \`routes/tournaments.ts\`: **A100 exclusive R10**. A70 cannot edit.
- \`revert-match.ts\`: **A80 exclusive R10**. A70 cannot edit.
- \`lib/api-spec/openapi.yaml\`, generated Zod/React, Host: MP3 future gate, not A70 source patch now.
- PR #39/#42: **FROZEN**. Do not cherry-pick PR #7/#27, do not append commits to these branches.
- A00 must serialize future MP2B against A100 and A80; begin from newly approved integration base, not force-rebase either author's patch.

## 4. MP2B negative HTTP / PG16 matrix (planned only)

| ID | Scenario | Expected | DB assertion |
|---|---|---|---|
| B01 | Valid active completion, matching revision/id | 200 | exactly one result reset, one completion undone, one revert event |
| B02 | Missing JSON body | 422 INVALID_REVERT_PRECONDITION | zero-write |
| B03 | Missing expectedMatchRevision | 422 | zero-write |
| B04 | Missing expectedCompletionActionId | 422 | zero-write |
| B05 | Revision 0, -1, decimal, string, unsafe number | 422 | zero-write |
| B06 | Action ID 0, -1, decimal, string, unsafe number | 422 | zero-write |
| B07 | Malformed JSON/array/null body | 422 (controlled error, no 500) | zero-write |
| B08 | Current match modified since form opened | 409 CONCURRENT_MODIFICATION | zero-write |
| B09 | ABA: completed A→reverted→completed B, old A request | 409 | B unchanged |
| B10 | Correct revision but prior completion action ID | 409 UNDO_ACTION_CHANGED | zero-write |
| B11 | Two concurrent identical revert POSTs | one 200, one 409 | exactly one revert log |
| B12 | Two competing results on same match | stale revert 409 | newest result preserved |
| B13 | Disconnected/completed downstream | existing 409 | zero-write |
| B14 | Approved qualification / materialized route | existing 409 | zero-write |
| B15 | Viewer, anonymous, revoked support | 403/recognized auth code | zero-write |
| B16 | Cross-tournament match id/actor | 403/404 | zero-write |
| B17 | Malformed result_history/completion action | existing 409/422; never 500 | zero-write |
| B18 | Legitimate played/walkover/no_contest reverts | 200 | standings/history parity |
| B19 | Correction operation with stage vector and receipt | unchanged legal behavior | receipt atomically consistent |
| B20 | Old Host POST {} after strict API upgrade | 422 until coordinated MP3 | zero-write; release rollout POLICY_OPEN |
| B21 | Completion log older than 50 action entries | precondition id discoverable by chosen read API | no gap in authorized read model |
| B22 | Terminal Swiss / RR after A80 patch | regression only; no policy selection | unchanged approved lifecycle semantics |

**Snapshot grain:** \`matches\` (status, revision, scores, winner, participants), \`action_log\` (id, is_undone, payload, created_at), \`result_history\`, \`tournament_stages\` (status/version), \`tournaments\` (status/winner/current_round), \`stage_participants\`, downstream match slots and correction receipts. Query snapshots before/after each 4xx and assert strict equality or allowed no-op metadata only.

**Deterministic race:** X captures \`expectedMatchRevision=r\` and completionId A, X queues behind an authorized mutation, Y changes or re-finalizes, X resumes under lock, gets 409 and writes zero. Use a PG barrier/hook that proves queuing rather than relying on sleep timing.

## 5. A50/A60 repeatable test / gates

At PR #42 exact \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` (MP2A), A50 should run existing R9 source tests **only on approved disposable PG16**:
\`\`\`bash
export TEST_DATABASE_URL='postgresql://<isolated-user>:<password>@<isolated-pg16>/<dedicated-test-db>'
export TEST_DATABASE_SCHEMA=tm_test_t040_mp2a
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
\`\`\`
Safe preflight: \`NODE_TEST_CONTEXT\` provided by the Node test runner; DB name contains \`test\`; schema matches \`tm_test_*\`; verify physical DB isolation, access authorization, no prod/shared \`DATABASE_URL\`; explicit RESET confirmation. Capture environment/version (without secrets), exact SHA, command, exit code, TAP case counts, before/after DB snapshots.

**MP2A acceptance:** both existing R9 race cases X queued → Y newer commit → X HTTP 409 \`UNDO_ACTION_CHANGED\` without X writes; Y preserved; legal latest Undo still 200; history unchanged on conflicts. Author's static 9/9 contract is **not PG/runtime PASS**. No GitHub workflow runs were present for PR #42 branch when checked in R10.

**A60:** strict independent source review and runtime recheck, exact HEAD; separate SOURCE_ACCEPTED from RUNTIME_VERIFIED. No A60 review was found on PR #42 GitHub itself at R10 check; off-GitHub review is not disproven.

### MP2A remaining caveat outside MP2B

Release/PR #42 parses some historical \`undoPayload\` via \`JSON.parse\` without typed validation outside/inside lock. Malformed payload fail-closed handling from PR #27 is a separate, explicitly gated task; it must not be silently bundled into MP2B. Evaluate result \`500\` risk as source gap; no runtime reproduction claimed.

## 6. Decisions to A00 / GO-STOP

1. Decide mandatory public revert precondition field name (\`expectedMatchRevision\` vs \`expectedRevision\`), reject ambiguous aliases.
2. Decide strict cutover for legacy Host requests and old browser tabs; require MP3 parity before strict enforcement.
3. Decide authorized \`activeCompletionActionId\` discovery API when completion history exceeds last 50 entries.
4. Acknowledge R10 ownership: \`routes/tournaments.ts\` → A100; \`revert-match.ts\` → A80. A70 **HOLD CODE**. Should A60 discover a critical PR #42 defect, A00 must freeze conflicting authors before authorizing a fix.
5. Ensure PR39 + PR42 + A100 + A80 composited source is independently tested later on exact candidate SHA; separate draft PRs are not a release.

**GO:** source design / QA handoff prepared.  
**STOP:** MP2B code, MP3, merge, deploy, migration, paid CI, shared DB, SWARM-006.  
**NEXT:** A50 executes PR42 MP2A in approved PG16; A60 issues independent verdict; A00 then evaluates MP2B separate GO after code-file ownership clears.
