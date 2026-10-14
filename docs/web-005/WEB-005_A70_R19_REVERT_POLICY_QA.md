# WEB-005 — A70 R19 / frozen PR42 PG16 QA + owner-signable Direct Revert CAS policy

**Task:** WEB-005-T040-A70-R19 | **Role:** A70 — Match Lifecycle & Undo
**Wave:** R19.1, 2026-10-14 Europe/Warsaw | **Mode:** SOURCE ONLY / NO CODE GO
**Authority:** WEB-005_WAVE_R19_AGENT_PROMPTS.md §§0–2, AGENT A70; local coordinator A00, global HQ/Queen elsewhere.
**Release base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
**Verdict:** `PR42 SOURCE_ACCEPTED_CONDITIONAL` (independent A60 R18); `RUNTIME_NOT_EXECUTED`; `MP2B_POLICY_OPEN`; `WEB005_HANDOFF_NOT_READY`; `SWARM006_HOLD`.

## 1. R19 verified source evidence / exact candidate SHAs

| Packet | Exact SHA observed at R19 intake | GitHub / QA |
|---|---|---|
| [P09 / PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) — global Undo LIFO | **021bed269f9ea8ac8ce53caeea44263c098aa2dd** | OPEN DRAFT, independent A60 R18 SOURCE_ACCEPTED_CONDITIONAL, PG16 pending |
| [P06 / PR39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) — Cancel/Restore | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT, separate conditional candidate |
| [P18 / PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) — malformed historical Undo | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT, separate conditional candidate |

Other agents' R19 code lanes at initial read: PR53 `8710f7fe5946d7f62e366303a97722d4201fc96b` and PR54 `9866e5d2e73c99e01c2934a38ca1c62455efd2ed`. These can change during R19. Do not use these snapshots to override their current heads, reviews, or ownership.

**Primary signed QA:** [A60 R18 independent report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), Git blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`. A60 inspected PR42 exact roster blob and controlled 409 mapping, marking P09 SOURCE_ACCEPTED_CONDITIONAL rather than full runtime QA. [A60 R18 formal handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) = `NOT_READY`, Git blob `e838d37d15a30beb83dd65ec5189b10df89827b0`.

**A50 R18 [actual receipt](./agent-reports/A50/WEB-005_A50_R18_RECEIPT.md)**: 0 native application tests. Complete trusted checkout, pinned pnpm dependencies and physical test PG16 were unavailable. Node/Git version preflight is NOT a test of the application. At R19 read, PR42 exact-HEAD Actions had 0 matching runs and formal PR42 GitHub reviews 0; A60 review exists as the separately published QA document, not an inline GitHub PR review. No A70 runtime test is claimed.

**PR42 R18 source frozen at R19**: before `25b09f1a48a85ae882b817118f5d8c23bffbe383`, after/current `021bed269f9ea8ac8ce53caeea44263c098aa2dd`. Changed only:
- `artifacts/api-server/src/application/players/tournament-roster.ts` +21/-1, blob `b47bc6e1452173fbc65b236909efe01aebf76116`.
- `artifacts/api-server/src/routes/tournaments.ts` +1/-1, blob `6d9608104700bd0619754e362bc30d5af053bd0b`.
- Existing four R17 test definitions retained in `artifacts/api-server/test/revert-match.integration.test.ts`, blob `3479ab5fe888416858346f82691d4c57f369df25` (unchanged R18/R19).
No new source commit or PR by A70 in R19.

## 2. A50 PostgreSQL16 actual execution contract — PR42 exact SHA

**Source invariant:** In existing roster-service `db.transaction`, `lockDraftTournament` locks the tournament and checks actor/draft status. The candidate action is locked FOR UPDATE. In the SAME transaction, immediately before roster/action_log mutation, service reselects tournament-wide latest eligible action by `isUndone=false` and `undoPayload IS NOT NULL` ordered `createdAt DESC, id DESC`. Stale action IDs throw `TournamentRosterError("UNDO_ACTION_CHANGED")` and HTTP 409. This is source inspected / conditionally accepted; runtime must independently verify actual lock behavior and zero writes.

**Safety preflight, absolute prerequisite (A20/A50/owner):** owner-approved physically isolated disposable PostgreSQL16 DB, test-only `TEST_DATABASE_URL` with DB name containing "test", NO fallback to shared/prod `DATABASE_URL`, verified database and schema identity, restricted test credentials, `TEST_DATABASE_SCHEMA=tm_test_t040_r19_roster` and **explicit** reset permission `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` limited to that schema. Clean complete per-SHA checkout at `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, Node22 + pinned pnpm10 + frozen lockfile dependencies; Node test runner `NODE_TEST_CONTEXT`. Never log secrets or clear shared/prod data. None of these preflights/runtime commands was executed by A70.

Commands for A50 AFTER approved physical preflight (**NOT_EXECUTED by A70**):

~~~sh
# Check git rev-parse HEAD equals 021bed269f9ea8ac8ce53caeea44263c098aa2dd
# Configure owner-verified isolated TEST_DATABASE_URL privately; do not print it
export TEST_DATABASE_SCHEMA=tm_test_t040_r19_roster
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~

**Actual runtime receipt must capture:** checked-out full HEAD SHA, Node/pnpm/PG version and sanitized host/schema fingerprint, command lines and real exit codes, TAP total/pass/fail/skip, observed HTTP status/code and before/after SQL snapshots. A test definition, authored expected status or source static check is NOT a runtime PASS. Timeout/unsafe DB => `BLOCKED` or `FAIL` with details, not invented green.

### Deterministic X/Y test and rollback oracle

| ID | Test case | Required result |
|---|---|---|
| P09-R1 | `delete_player` stale X preselects A; B holds tournament FOR UPDATE; `pg_blocking_pids` confirms queued X; B writes newer Undo Y and commits; X resumes | **409 UNDO_ACTION_CHANGED**, zero X writes; both A and Y remain is_undone=false |
| P09-R2 | Identical stale-X/newer-Y barrier for `restore_player` | **409 UNDO_ACTION_CHANGED**, roster state unchanged after Y; no action skipped |
| P09-R3 | Latest legal `delete_player` Undo with no newer action | **200**, exactly one deletion and one marked-undone action |
| P09-R4 | Latest legal `restore_player` Undo | **200**, old player values restored once |
| P09-R5 | After stale X rejection, a NEW request targets genuinely latest Y | **200** if lawful; Y only, and previous X remains available |
| P09-R6 | B rolls back instead of committing Y | **200** if X remains latest; extra recommended fixture NOT yet authored in PR42 |

PR42 test source already defines R1–R4 and the positive Y control inside R1/R2. R6 is **recommended to A50/A60**, not represented as an existing test or executed PASS. The deterministic barrier must show X actually queued (no reliance on timer). Take oracle snapshot inside B's transaction after committed-intended Y is written but before COMMIT; after COMMIT/X rejection compare fresh DB state against Y snapshot. Capture tournaments, players, action_log, matches including status/revision/score, result_history, tournament_stages, stage_participants, match_game_picks, downstream match slots and correction receipts if populated. No change attributable to X. Disposable fixture cleanup is not proof of request-level transaction rollback.

**Same-suite cross-regression:** Keep prior global LIFO queued X / newer Y tests for `revert_match` (completion) AND `restore_status` (generic) with stale 409 zero-write and valid latest 200. Check authorization/tenant/draft boundaries; newly committed Y must supersede older action regardless of action kind where lifecycle permits. Do NOT treat isolated PR42 tests as certification of independently unmerged PR39 Cancel/Restore or PR51 historical malformed Undo. No cherry-pick/test composite here. A60 re-evaluates real A50 receipt on **this exact SHA**.

**One concrete environmental unblocker:** A00/HQ connects an approved trusted PC/VM executor to A50 with full clean repository checkout, Node22/pnpm10/frozen deps, test authority. A20/owner separately approves physically isolated dedicated PG16 identity and test-schema reset. Without this, status remains `ENV_BLOCKED / NOT_EXECUTED` and a separate signed runtime-debt transfer is possible ONLY after other final source/policy/backlog gates close.

## 3. Public Direct Revert CAS / Host — OWNER-SIGNABLE MP2B decision

**SOURCE_CONFIRMED gap, NOT current API behavior:** Release `POST /matches/:id/revert` validates id/access but calls `revertMatch({matchId,expectedTournamentId,actor})` without parsing/passing public expected match revision or expected completion action ID. Domain use case already has **optional** `expectedMatchRevision` and `expectedCompletionActionId` checks under its own transaction plus internal `expectedStageVersionVector` / correction receipts. OpenAPI has no revert requestBody; backend generated schema lacks required body; generated React `revertMatch(id, options?)`, Host `revertMatch.mutate({id:matchId})` cannot send token pair. Tournament action-log GET returns latest **50** actions, not an authoritative way to discover older still-active completion action id. PR39/42/51 do NOT close this public API/Host gap.

**Future candidate JSON shape (NOT LIVE):**

~~~json
{"expectedMatchRevision":7,"expectedCompletionActionId":1234}
~~~

**OPTION A — STRICT SYNCHRONIZED CUTOVER:** Both fields mandatory as safe integers for each public Direct Revert. First provide authorized read model bound to revision, OpenAPI/Zod/generated React/Host parity; coordinate server enforcement and old-browser-tab refresh. Old no-body requests get controlled validation failure. No unversioned no-CAS fallback. Internal T050 correction use case remains compatible.

**OPTION B — EXPLICIT TIME-LIMITED LEGACY HOST TRANSITION:** New API path strictly requires both fields. Only an explicitly versioned/feature-gated restricted legacy surface can temporarily accept old Host no-body requests with a signed expiry date, accountable owner, eligible actor scope, telemetry, rollback and written residual-risk acceptance. Do not silently make new endpoint CAS optional forever. End state strict as A.

**OPTION C — DEFER:** Leave current public behavior unchanged, keep `POLICY_OPEN / CODE STOP`, ask A00/HQ for missing wire/read/rollout decisions before any further implementation. **This is the default administrative status, not an owner-approved policy choice.**

### Shared proposed 422/409, data and UX contract — requires owner signature

| Dimension | Proposed invariant / explicit unresolved choice |
|---|---|
| Required body | Exact two typed numeric **positive safe integers**; proposed names `expectedMatchRevision` and `expectedCompletionActionId`. Owner may instead select `expectedRevision` as external first field; choose ONE name, no ambiguous aliases. |
| Missing/malformed values | **422 INVALID_REVERT_PRECONDITION**, zero writes; raw invalid JSON parser 400 vs 422 must be explicitly chosen. Reject null, arrays, string-coercion, zero/negative/decimal/unsafe integers. |
| Stale revision | **409 CONCURRENT_MODIFICATION**, zero writes; defeat ABA. |
| Wrong/stale completion ID | **409 UNDO_ACTION_CHANGED**, zero writes; no replay or double-reverse. |
| Both tokens stale | Owner signs error precedence; domain currently checks revision earlier than completion action. |
| Current token pair | HTTP 200, one valid reversal, preserving immutable result_history and existing qualification/downstream rules. |
| Concurrent identical calls | At most one success; loser 409, no second write. |
| Completion ID read model | Authenticated organizer/current support with appropriate access revalidation; output `activeCompletionActionId` bound to current match `revision`, not raw undoPayload/private history. Works when completion action older than last 50 log entries. Owner approves exact endpoint/roles. |
| Host UX | Snapshot immutable pair when confirming, stale 409 => refetch + NEW operator confirmation; never silently auto-retry with refreshed tokens. Owner signs old Host cutover and any finite legacy exception. |
| Internal T050 path | Preserve stage-vector/receipt-based controlled correction, no public-body requirement injected into domain internal callers. |

### Signature block — do NOT assume approval

- Decision ID: `WEB-005-T040-MP2B-DECISION-R19`.
- Select exactly one: [ ] A STRICT; [ ] B TIME-BOXED LEGACY; [ ] C DEFER.
- Canonical external field name: [ ] expectedMatchRevision; [ ] expectedRevision.
- Missing/invalid value & invalid raw JSON mapping / stable error code: __________.
- Both-token conflict precedence: __________.
- Active completion ID endpoint/read model, roles and match-revision binding: __________.
- API+OpenAPI+Zod+React+Host rollout order and old tabs: __________.
- If B: explicitly versioned/gated legacy surface, scoped actors, start / HARD end, monitoring, removal executor and residual risk signoff: __________.
- Named HQ/owner signature / timestamp / decision version: __________.
- **Separate** subsequent A00 code-GO ID + exclusive files/pinned SHA, if approved: __________.
- Standalone runtime-debt handoff waiver: NOT GRANTED by this packet; requires separate owner action.

At R19 read, central `docs/web-005/DECISIONS.md` records MP2B as POLICY_OPEN, not a signed option. This document does **not** select one, authorize code, or waive QA.

### Small future implementation request — NOT AUTHORIZED R19

After owner decision AND A00 exclusive overlapping-source ownership, a separate test-first backend public handler can validate and forward current pair to the existing domain guards; authorized completion-id read model and matching OpenAPI → Zod → React → Host contract must be coordinated, including old-client handling. Route `artifacts/api-server/src/routes/tournaments.ts` collides across PR39/42/44/46/51 and must not be modified speculatively. A80 retains T050 controlled correction authority. Future negative HTTP/PG16+React acceptance includes 422 bad/missing body, 409 stale revision/action/ABA, concurrent duplicate, multi-tenant denied and completion action beyond 50, positive played/walkover/no_contest, old-tab UX. No patch written or other PRs touched by A70 in R19.

## 4. Final project handoff gate (out of A70 authority)

Independent A60 R18 verdict `HANDOFF_NOT_READY` remains binding until superseded by A60 new evidence. P21 PR54 source blocker, P20 PR53 untagged cache risk (other agents' R19 assignments), 0 native tests, unsigned original WEB-004 **38-case** per-finding disposition, unsigned sports/Basket/Backup B2/MP2B/Steam/session choices and no runtime-debt signature remain outside A70's limited source-only lane.

A00 must reconcile 21 independent PR manifest, current SHA, conflicts, signed exceptions and owner decisions before requesting separate HQ `FINAL_HANDOFF_GO`. If runtime debt expressly approved after all other gates, SWARM-006 still must perform full composite PG16/API/frontend/CI testing before any staging/live; such waiver is neither automatic nor release GO.

**R19 A70 GO complete:** read-only GitHub inspection and two documentation outputs; **0 app code commits, 0 native executed tests, 0 merges/deploys, SWARM-006 HOLD**.
