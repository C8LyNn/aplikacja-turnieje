# WEB-005 / A100 / R10 — T080-S1A Session Revocation Under Lock

**TASK:** `WEB-005-T080-A100-S1A-R3`  
**AGENT:** A100 — Session Security & Private Access  
**WAVE:** R10, 2026-10-14 (Europe/Warsaw)  
**PR:** [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) — **OPEN DRAFT / DO NOT MERGE**  
**SOURCE BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**PATCH+TEST COMMIT (before report files):** `a40384f8be44c8f177ab59023e535c9fb5e11e90`  
**BRANCH:** `fix/web-005/t080-s1a-revocation-lock-r10`  
**MODE:** GO SOURCE-CODE ONLY, L1 A100 exclusive ownership of `routes/tournaments.ts` per central R10 §0–§2.  
**CURRENT STATUS:** `PATCH_PROPOSED / SOURCE_DIFFERENCE_CONFIRMED / RUNTIME_NOT_EXECUTED / INDEPENDENT_QA_PENDING / RELEASE_NO_GO`.

## Scope and actual changes

Source file inventory (base → patch, verified by GitHub compare):

1. `artifacts/api-server/src/auth.ts` — exports existing `organizerCredentialFingerprint` (same implementation, token serialization/signature unchanged).
2. `artifacts/api-server/src/access-policy.ts` — `getTournamentMutationActor` carries in-memory organizer authorization proof derived from the **already authenticated** pre-lock tournament snapshot; proof carries tournament id and credential version, **not raw token**. `revalidateTournamentMutationActor` requires the same id and version after tournament `FOR UPDATE` before mutation, throws existing `TournamentMutationAuthorizationError` on mismatch. Existing support-session row lock + password-version comparison preserved.
3. `artifacts/api-server/src/routes/tournaments.ts` — `PUT /players/:id/bans` and `PUT /matches/:id/game-picks/:gameNumber` use `withTournamentMutationLock`. Read target tenant before initial authorization only to locate access context, recheck actual player/match ownership under lock; game config / bans / stage key are read using the **same tx**; the upserts use `tx` rather than an unguarded `db.insert`. Existing ban-mode validations, 422/404/200 behavior, side mapping and response shapes preserved.
4. `artifacts/api-server/test/session-revocation-race.integration.test.ts` — 14 real-app/PostgreSQL integration test cases authored (8 revocation races including insert/overwrite; 4 active-credential writes; 2 viewer/anonymous denies). All `NOT_EXECUTED` pending A50 safe PostgreSQL16 gate.

**No changes:** JWT/token wire format, session TTL, support token persisted storage, organizer password rotation APIs, frontend private cache, `revert-match.ts`, PR42, SQL migrations, OpenAPI, shared integration branches, main/release, CI triggers.

## Revocation and isolation contract

Initial HTTP request A passes `requireTournamentWrite`. B has acquired `SELECT ... FROM tournaments ... FOR UPDATE` in a separate PostgreSQL transaction. A reaches `withTournamentMutationLock` and waits. B updates `organizer_password_hash` **or** `support_password_version` and commits. A acquires the locked tournament row and must fail with **HTTP 403** and `code: SUPPORT_SESSION_EXPIRED` **before the UPSERT**. Pre-existing bans or game picks must remain byte-for-byte equivalent at the domain data level.

**Lock order:** tournaments row → support_sessions row (support actor only) → player/match/config/ban rows. Race tests poll PostgreSQL `pg_stat_activity` for a genuine lock waiter; if the waiter cannot be observed, the test errors rather than marking a hypothetical race PASS.

**Important:** The generic error code remains `SUPPORT_SESSION_EXPIRED` even for organizer, for wire compatibility under R10. A distinct organizer-specific error message/code is not introduced by this patch. Source-level strict actor proof is applied to requests using `getTournamentMutationActor`; the legacy optional internal service actor contract is not silently redesigned in S1A.

## Test evidence: observed versus unexecuted

| Evidence / command | Environment and result | Classification |
|---|---|---|
| GitHub branch/base compare at source+test commit | 4 files (auth / access policy / tournaments route / one test); changes limited to S1A | SOURCE_CONFIRMED |
| Static source assertions | organizer proof id + version checks present; support lock retained; bans/picks use lock; no frontend or migration changes | SOURCE_CONFIRMED, **not runtime** |
| `pnpm --filter @workspace/api-server typecheck` | **NOT_EXECUTED** — deps and pnpm CLI unavailable in A100 container | NOT_EXECUTED |
| Targeted PostgreSQL integration test below | **NOT_EXECUTED** — no A50-attested isolated PostgreSQL16 URL/schema | BLOCKED / NOT_EXECUTED |
| Existing `deadlock-ban-pool.integration.test.ts` regression | **NOT_EXECUTED** | NOT_EXECUTED |
| Independent A30 / A60 review | **NOT_EXECUTED**; handoff requested by report | PENDING |
| Production / staging / Replit | **NEVER ATTEMPTED** | STOP |

### A50 executable command contract — do not run without approved disposable PG16

From repository root, with locked dependencies installed by A50 and an explicitly approved, dedicated PostgreSQL16 **test-only** database (not shared/production):

```bash
export TEST_DATABASE_URL='<A50_APPROVED_TEST_ONLY_POSTGRESQL16_URL>'
export TEST_DATABASE_SCHEMA='tm_test_t080_a100_r10'
export TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/session-revocation-race.integration.test.ts
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/deadlock-ban-pool.integration.test.ts
pnpm --filter @workspace/api-server typecheck
```

The existing `test-database.ts` requires `NODE_TEST_CONTEXT`, a database name containing `test` but not `prod`, `TEST_DATABASE_SCHEMA` matching `tm_test_*`, and the explicit reset confirmation. **Never run with just `DATABASE_URL`.** Record command, environment class, exit code, failed assertions and tested SHA.

### Independent QA acceptance gate (A60)

- Validate both organizer and support revocation: after B commits, A returns 403, **no insert, no overwrite**, and transaction rollback/no partial mutation.
- Validate valid organizer and support succeed with 200, viewer/anonymous fail with 403; tenant isolation and no support-session deadlock.
- Confirm Deadlock `shared_pool` and `opponent_only` ban rules, ban count, side guard, pre-existing test suite, response parity.
- Confirm S1A remains independent from PR #42's MP2A code; any later integration conflict must be handled by A00 authorized process, not A100 cherry-pick.
- Keep `SOURCE_ACCEPTED` (if reviewed) separate from `RUNTIME_VERIFIED` (only after actual PostgreSQL16 runtime).

## S1B+ / S2 / policy backlog explicitly excluded

- **S1B+**: `DELETE /tournaments/:id`; `auth/change-support-password`, `auth/change-viewer-password`, `auth/change-visibility`, `auth/viewer-password`, `auth/set-organizer-password`; controlled correction intent issuance; review all other raw write endpoints. These remain separate authorization tasks, not fixed by this PR.
- **S2**: frontend React Query private cache invalidation, logout, context switch and stale response suppression remain separate; no frontend code touched.
- **POLICY_OPEN**: TTL, support token digest/storage, organizer rotation and expired organizer error nomenclature. No default decisions adopted.

## Handoff and GO / STOP

- **A30**: review threat model, identity proof linkage and rollback/role boundary.
- **A50**: check preflight and run targeted PG16 and Deadlock regression with exact PR HEAD.
- **A60**: independent review and explicit SOURCE_ACCEPTED / RUNTIME_VERIFIED / FAIL verdict anchored to SHA.
- **A00**: register PR #44 as **P10+ CONDITIONAL**, coordinate with PR #42 ownership/integration later, track S1B+ and S2 as open.
- **A10**: add PR #44 to internal-only package registry after A00's confirmation; **do not dispatch SWARM-006**.
- **NEXT ACTION**: A50 performs isolated PostgreSQL16 preflight and executes targeted suite; A60 reviews exact HEAD, reports fixes if needed.
- **MERGE / CHERRY-PICK / DEPLOY / REPLIT / PROD / CI BILLING**: **NOT AUTHORIZED**.

**Verdict:** S1A narrow code and tests authored, PR DRAFT. **No QA PASS / release certification** until verified.
