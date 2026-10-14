# WEB-005 — A100 / R9 / T080-S1 — Session Revocation Under Lock

**Report ID:** `WEB-005_A100_R9_T080_S1_PATCH`  
**Task:** `WEB-005-T080-A100-S1-R2`  
**Agent:** A100 — Session Security & Private Access; **parent:** A00; **independent QA:** A60; **test infra:** A50; **security peer:** A30  
**Date:** 2026-10-14 (Europe/Warsaw)  
**Evidence classification:** `SOURCE_CONFIRMED` (gaps and existing guards), `STATIC_INFERRED` (exploit timelines), `NOT_EXECUTED` (tests), `BLOCKED` (shared-file ownership), `POLICY_OPEN` (non-S1 auth policy)  
**Decision:** `HOLD CODE — FILE OWNERSHIP NOT AGREED`; no implementation, source-code branch/commit, code PR, merge, DB operation or deployment. This report is published on a separate **documentation-only** branch; publication grants no source-code GO.

## 0. R9 instructions and version pin

- Authoritative R9.1: [`WEB-005_WAVE_R9_AGENT_PROMPTS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R9_AGENT_PROMPTS.md), §§0–2 and `AGENT A100`. Verified documentation branch HEAD `01bf9e8e73678cb762d2b4c7b29467eb674a9ad4`.
- Repository: `C8LyNn/aplikacja-turnieje` (private).
- **Baseline/release HEAD** `release/tournament-ops-20261013-01` = `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (verified from GitHub branch API).
- `main` HEAD = `c50cc48e6fa508592bda3f4838111e9cff5af80c` (not target).
- Security boundary PR #34 HEAD `fae2eea2f22df3f1b02ad035a7db00bc411ea73f`, OPEN DRAFT; PR #37 HEAD `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7`, OPEN DRAFT. Their changed file lists do not include `access-policy.ts` or `routes/tournaments.ts`; **no changes to those PRs**.
- Collision evidence: PR #39 (A70/T040 MP1) HEAD `16053ee132756ca05b6f2cd1f0cabae823905387`, OPEN DRAFT, already touches `artifacts/api-server/src/routes/tournaments.ts`. R9 explicitly reserves potential modifications to that same file for A70/MP2A (lane 2) and A100/S1 (lane 3), subject to prior A00/A70 scheduling agreement. No R9 MP2A branch/PR found in checked GitHub search, but absence of a visible branch is **not** approval to take ownership.
- Existing R1 reviewed: `WEB-005-T080-A100-R1.md` (T080-S1/S2 split, SEC-006/SEC-021/SEC-022) in the current conversation workspace. **S2 frontend cache is not in this R9 code lane.**

## 1. Ownership gate and exact stop reason

The minimum S1 change **requires** modifying `artifacts/api-server/src/routes/tournaments.ts` to fix the confirmed out-of-lock writes in `PUT /players/:id/bans` and `PUT /matches/:id/game-picks/:gameNumber` (and to assess other routes). A70 holds potential concurrent ownership of that file. The R9 A100 instruction states to obtain agreement with **both A00 and A70 before writing** and to `HOLD CODE` while that conflict is unsettled.

**Current fact:** no affirmative A00/A70 file-window agreement is available to this A100 thread. Thus source-code patch generation, test-file commits and draft PR are **not represented as completed**. Avoided even a speculative code-only commit to `access-policy.ts`, because it could create the appearance of a complete S1 fix while the known bypasses in `tournaments.ts` remain live.

**Required unblocking decision (specific):** A00 + A70 provide an exclusive time/branch window for A100 edits of `routes/tournaments.ts`, or nominate a split such that A70 finishes MP2A first, then A100 rebases from the same approved **source** baseline and modifies only S1 hunks. Do **not** merge MP2A to release as a shortcut. Also confirm any exception if `tournament-controlled-correction-revert.ts` is considered A70/MP2A ownership.

## 2. Minimal source inventory — write authorization

Evidence anchor: exact baseline `1fdc401...`, not current live application. Route line numbers refer to that commit.

| ID | Location / operation | Observed pre-auth and post-lock state | Classification | R9 disposition |
|---|---|---|---|---|
| R9-S1-01 | `artifacts/api-server/src/access-policy.ts:44–89`, `revalidateTournamentMutationActor` and `withTournamentMutationLock` | Tournament `FOR UPDATE`; support session `FOR UPDATE` and version comparison. **Organizer returns early without comparing credential version**. | `SOURCE_CONFIRMED` gap | Core fix needed, owned by A100 only after file gate. |
| R9-S1-02 | `access-policy.ts:131–177, 243–275` | Signed organizer token validated against pre-lock `organizerPasswordHash`; support session loaded using `sessionToken` and pre-lock version. | `SOURCE_CONFIRMED` check-before-lock | Keep initial guard; add organizer post-lock proof. |
| R9-S1-03 | `routes/tournaments.ts:3154–3202` `PUT /players/:id/bans` | `requireTournamentWrite` then game config read and `db.insert(...).onConflictDoUpdate` outside transaction/lock. | `SOURCE_CONFIRMED` missing guard; exploit `STATIC_INFERRED` | A100 S1 shared-file HOLD. |
| R9-S1-04 | `routes/tournaments.ts:3239–3355` `PUT /matches/:id/game-picks/:gameNumber` | `requireTournamentWrite` then game config/bans/side validation and direct UPSERT outside tournament lock. | `SOURCE_CONFIRMED` gap; exploit `STATIC_INFERRED` | A100 S1 shared-file HOLD. Move reads and write into one transaction if authorized. |
| R9-S1-05 | `routes/tournaments.ts:1364–1373` `DELETE /tournaments/:id` | `requireOrganizer` then immediate `db.delete` without locked auth revalidation. | `SOURCE_CONFIRMED` gap | Propose alongside shared-file window; higher destructive-operation priority; A00 confirm scope. |
| R9-S1-06 | `routes/auth.ts:155–213` `set-organizer-password` | Existing `FOR UPDATE` / single-set invariant, but initial organizer guard outside transaction. | `SOURCE_CONFIRMED` early guard; exploit-specific case inferred | Recheck original organizer authority against locked row before setting first hash, not after it changes. |
| R9-S1-07 | `routes/auth.ts:373–409`, `450–485`, `488–535`, `538–572` | Support/viewer password and visibility operations lock tournament but do **not** post-lock validate the previously authenticated organizer token. | `SOURCE_CONFIRMED` gap | A100 S1, no changes to credential-policy semantics. |
| R9-S1-08 | `routes/tournament-controlled-correction-revert.ts:33–121` POST correction intent | `requireOrganizer` before repeated reads and later direct insert approval/receipt; no tournament-lock recheck. | `SOURCE_CONFIRMED` gap; cross-workstream | HOLD coordination with A00/A70 (correction ownership), no unsolicited patch. |
| R9-S1-09 | `application/players/tournament-roster.ts:57–71` | `lockDraftTournament` obtains `FOR UPDATE` then calls revalidate helper before writes. | `SOURCE_CONFIRMED` existing pattern | No rewrite; organizer helper fix would cover it. |
| R9-S1-10 | `application/matches/complete-match.ts:194–204`, `revert-match.ts:210–221` | Tournament lock then shared revalidate; downstream separate logic. | `SOURCE_CONFIRMED` existing pattern | Regression only; revert-match.ts A70 exclusive. |
| R9-S1-11 | `application/stages/stage-lifecycle.ts:593–598,914–919`, `routes/tournaments.ts:1390–1450,1647–1660` | Lock + shared revalidation for reviewed stage and round/start paths. | `SOURCE_CONFIRMED` existing guard | Regression only, preserve lock order. |
| R9-S1-12 | `routes/tournaments.ts:1197–1305`, `2251–...`, `2482–...`, cancel/restore/swap/reorder | Calls `withTournamentMutationLock` on reviewed flows. | `SOURCE_CONFIRMED` existing helper use | Core organizer proof fix should apply; do not alter domain CAS/LIFO. |
| R9-S1-13 | Stage-baskets, Marvel group actions, correction execute-atomic, specialized operations | Delegate to services after pre-auth; no full call-graph attestation performed on every subflow. | `NOT_EXECUTED` exhaustive coverage | A30 independent authorization inventory; do not claim they are vulnerable absent service trace. |
| R9-S1-14 | `routes/tournament-se-correction-readiness.ts` and preview/preflight | Documented read-only transactions; `POST` alone does not mean mutation. | `SOURCE_CONFIRMED` read-only classification | Exclude from S1 write patch. |
| R9-S1-15 | `routes/core-clash-multiplayer.ts`, Steam catalog | Separate room state / T030 security, not T080 tournament revocation in this wave. | OUT OF SCOPE | No takeover of other agents' code. |

**Observation:** the generic authorization exception currently always uses code `SUPPORT_SESSION_EXPIRED`, even if organizer revalidation is added. Do not unilaterally change API error contract. Confirm with A00/A30 whether the new organizer denial can use the existing 403 code temporarily or needs a separate *approved* stable code (policy question).

## 3. Exact small patch design — not yet applied

### 3.1 Central proof (safe design, no raw token propagation)

Target: `auth.ts`, `access-policy.ts` (no owner conflict observed for these, but overall S1 code held pending shared-file gate).

1. Export an internal pure organizer credential-version derivation from existing HMAC fingerprint (using same `SESSION_SECRET`, tournamentId, and locked `organizerPasswordHash`); do **not** change token wire format, TTL, signing or password rotation.
2. At `getTournamentMutationActor(access)` create a **post-lock verifier proof** derived from the *pre-authenticated* tournament fingerprint if `access.actor.type === 'organizer'`. Do not put raw `X-Organizer-Token` into actor, event, log, query key or request error. Preserve support identity via `sessionId`.
3. At `revalidateTournamentMutationActor(tx, lockedTournament, actor)` fail-closed when actor missing; for organizer, compare the carried verified-version proof to a recomputation from `lockedTournament.organizerPasswordHash` and `lockedTournament.id`; mismatch => transaction throws `TournamentMutationAuthorizationError` before any protected mutation. Prefer constant-time comparison or a fixed-size cryptographic digest equality; no plaintext secrets. For support keep `supportSessionsTable FOR UPDATE` plus `passwordVersion` comparison under same `tournamentsTable FOR UPDATE` lock.
4. Audit all direct invocation call sites: changing optional-actor semantics from `if (!actor) return` to deny may impact tests/legacy internal call paths, so do not silently broaden semantics without `ripgrep`/typecheck. Pass actor explicitly from authorized routes to all S1 writes. Any *explicitly verified* internal service call without an HTTP actor needs a separate internal-authority contract; do not forge a role at the HTTP layer.
5. Keep lock order **tournament → support session → domain rows**, and ensure auth-changing routes also lock tournament before versions, to avoid lock inversion.

### 3.2 Shared route edits after A00/A70 ownership release

- `PUT /players/:id/bans`: prefetch `player.tournamentId` only to locate tenant; verify `requireTournamentWrite`; invoke `withTournamentMutationLock(tid, getTournamentMutationActor(access), async (tx)=>...)`. Revalidate target player ownership **inside** transaction, load relevant game config within same transaction, validate per-player ban limit, run `tx.insert...onConflictDoUpdate`; no stand-alone `db.insert` outside guard. Reject revoked actor with 403 and zero ban-row writes.
- `PUT /matches/:id/game-picks/:gameNumber`: prefetch `match.tournamentId` only; after locked proof, re-read match/players, config, bans, stage-key and derived hero restrictions via `tx` rather than `db`, and perform UPSERT using `tx`. Prevent both auth race and stale ban/game side validation. Keep validation 422 and hero banMode parity; ensure a domain state that cannot be authenticated/validated denies before write.
- `DELETE /tournaments/:id`: require organizer, then lock tournament and verify organizer proof before `tx.delete`. Confirm semantics of 404 for missing target vs general auth fail; do not move to destructive deletion before lock.
- `routes/auth.ts` organizer-owned mutations: capture pre-authenticated organizer proof, hash outside lock if expensive, `tx SELECT tournaments FOR UPDATE`, `revalidateTournamentMutationActor` before `tx.update`. For initial password bootstrap, validate **before** first hash write, then mint new token for the newly changed hash. Preserve already-set 409 behavior when actor remained otherwise authorized.
- `correction-intents`: candidate independently documented, but do not alter without A00/A70 assignment due overlap with T040.

**Minimal pseudocode for race semantics:**

```text
A receives request (valid organizer/support actor under old credential)
A performs initial auth check, but it is only advisory to enter queue
B obtains tournament FOR UPDATE and commits credential version/hash revocation
A obtains tournament FOR UPDATE, revalidates A's original proof against locked current state
if revoked: throw controlled 403; rollback transaction; no domain mutation or action-log commit
else: validate current tenant resources and domain constraints using same tx; commit domain mutation
```

**Linearization rule:** request already holding the lock and committed *before* revocation can legitimately succeed (operation A precedes B). A request whose recheck happens *after* revocation commits must not succeed, regardless of earlier HTTP pre-auth.

## 4. Test-first deterministic negative matrix — all `NOT_EXECUTED`

| ID | Interleaving / actor / target | Expected HTTP and DB result | Owner |
|---|---|---|---|
| S1-R9-PG01 | Valid support A passes pre-auth for bans; A blocked at tournament lock; B rotates support password then commits; resume A. | A `403` controlled, bans unchanged; no domain audit action committed. | A50/A60 |
| S1-R9-PG02 | Same with `game-picks/:gameNumber`. | A `403`; game picks unchanged, no side/ban drift. | A50/A60 |
| S1-R9-PG03 | Passwordless organizer token A passed pre-auth; B sets initial organizer password and commits before A lock. | A `403`, no mutation; **do not fabricate a nonexistent generic organizer rotation endpoint**. | A50/A60 |
| S1-R9-PG04 | Support session physically removed or version mismatched after pre-auth, before A lock. | `403`, no mutation; retain other current sessions per existing policy. | A50/A60 |
| S1-R9-PG05 | Organizer A tries `change-support-password`, `change-viewer-password`, visibility, viewer-password removal after its credential became obsolete via supported bootstrap scenario. | No change to credential hashes/versions/visibility; 403 for revoked A. | A50/A60 |
| S1-R9-PG06 | Organizer A tries tournament deletion queued behind its invalidation. | `403`; target and descendants present. | A50/A60 |
| S1-R9-PG07 | A obtains tournament lock and commits first; B's rotation waits and then commits. | Both allowed in A→B order, no deadlocks, resulting version revokes older token. | A50/A60 |
| S1-R9-PG08 | Valid current organizer/support performs bans, picks, roster, complete/revert, stage action. | Existing positive behavior remains; no regression in constraints/history. | A50/A60 |
| S1-R9-PG09 | Anonymous, viewer, wrong tournament token, expired-by-version support token attempt bans/picks. | 403 and zero domain writes; no cross-tenant leakage. | A50/A60 |
| S1-R9-PG10 | Bans changed concurrently while delayed game-picks validation holds lock. | Serialized state; banned selection rejected 422, no illegal pick. | A50/A60 |
| S1-R9-PG11 | Intentional 422 invalid input after valid locked auth; induced DB exception before commit. | Zero domain delta; no partial audit/event; deterministic rollback. | A50/A60 |
| S1-R9-PG12 | Organizer/support race across two tournaments. | Only intended tournament affected; tenant-bound `sessionId`, token proof and `match/player.tournamentId`. | A50/A60 |
| S1-R9-PG13 | Correction intent approval delayed past organizer revocation. | Expected 403/no approval row if separately authorized; currently source gap, OWNERSHIP HOLD. | A00/A70 + A50/A60 |
| S1-R9-UNIT14 | Pure `organizer credentialVersion` equality, missing actor, changed hash/ID, support version mismatch. | Deny without awaiting DB write; no credential material logged. | A100 (later) |

**Harness contract:** use existing [`test-database.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/test/test-database.ts) guard, explicit dedicated `TEST_DATABASE_URL`, schema `tm_test_*`, Node test context and PG16; data synthetic only. Prefer test-only Promise barriers at the **post-auth / pre-lock** seam, two dedicated connections and deterministic transaction order, not timing sleeps. No debug endpoint in deployed server. Assert full database snapshot/delta of target domain tables before/after and lock waits, including rollback on failures. `last_active_at` may be touched by current support pre-auth flow; if "zero writes" includes that auxiliary field, define a separate rule rather than incorrectly counting it as a domain-row mutation.

**Repro commands to hand off once source patch exists and isolated test DB is certified:**

```sh
# Execute only in the controlled repository checkout pinned to approved new S1 HEAD:
node --version
pnpm --version
git rev-parse HEAD
# Mandatory physical/database safety preflight by A50, with explicit isolated PG16.
# Then (after A100 adds an exact test file):
pnpm --filter @workspace/api-server test -- <specific-test-file>  # ADAPT to verified package scripts
```

The command above is a **planning placeholder**, not a verified executable package command: A50 must inspect `artifacts/api-server/package.json` before publishing exact invocation. **No Node, pnpm, PG16, Supertest, browser or application tests were run in this A100 turn.** No `PASS`, no exit code is asserted.

## 5. Security invariants and policy boundaries

- **Fail closed under lock:** original actor proof bound to tenant; no cross-role fallback, no retroactive substitution of a fresh organizer token into an old request.
- **No irreversible work before proof:** password hashing may occur before lock (no persistent write), but row inserts/updates/audit within scope occur only after locked auth; transaction rollback on any thrown denial.
- **No secrets in logs, errors or test fixtures:** generated synthetic tokens only; no production database inspection.
- **Keep support `passwordVersion` + `support_sessions FOR UPDATE` semantics:** no new TTL, token-digest migration, password rotation model, server-side logout API, role hierarchy, or generic auth architecture.
- **Retain public GET and viewer access semantics:** S1 is a write guard; do not implement S2 frontend cache, which remains `SEC-022 = UX-030` separate task.
- **`POLICY_OPEN`:** SEC-002 token TTL, SEC-007 digest-at-rest for support session token, SEC-008 organizer rotation, generic organizer-vs-support denial code. Explicit owner decision required.
- **No cross-agent changes:** PR34/37 are A30 scope; MP2A Undo is A70; Backup V3 is A90; A60 evaluates independently; A50 runs test infra; A10 maintains internal package registry. SWARM-006 not activated.

## 6. Deliverables, status, next action

**ACTUAL CHANGES:** `NO CHANGES` to repository application code, routes, tests, PRs or product configuration. This standalone report is published **only** as a documentation file on an isolated docs branch; no S1 code branch exists.  
**READ:** R9 control prompt, R1, release `auth.ts`, `access-policy.ts`, `routes/auth.ts`, `routes/tournaments.ts`, roster/complete/revert/stage services, relevant correction routes, test-database contract, PR #34/#37/#39 metadata and changed-file lists.  
**TEST EVIDENCE:** static code reading via connected GitHub on pinned SHA; executable testing `NOT_EXECUTED`, no exit code, no PG16 assurance.  
**FINDING DISPOSITION:** `SOURCE_CONFIRMED` gaps SEC-006/021; runtime exploit not reproduced; approved S1 code change not applied; S2 and SEC-002/007/008 explicitly `POLICY_OPEN`/deferred.  
**BASE / HEAD / PR:** Base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; patch HEAD `NONE`; PR `NONE` — OWNERSHIP HOLD.  
**DEPENDENCIES:** A00/A70 exclusive ownership of `routes/tournaments.ts`; A30 source security review; A50 isolated PG16 tests; A60 independent exact-SHA review.  
**GO:** read-only analysis, test contracts, handoff documentation and its isolated docs-only commit. **STOP:** source-code commits, patch PR, shared-file edits, merge, deployment, production/SQL actions until explicit shared-file gate resolution.  
**NEXT ACTION:** A00 and A70 decide a non-overlapping editing window/sequence for `routes/tournaments.ts`; after approval A100 may create an isolated release-based S1 branch and implement only the scoped patch with deterministic tests.

**Signature:** `WEB-005-T080-A100-S1-R2 / R9 — SOURCE_REVIEWED — HOLD_CODE_FILE_OWNERSHIP — NOT_EXECUTED — RELEASE_NO_GO`.