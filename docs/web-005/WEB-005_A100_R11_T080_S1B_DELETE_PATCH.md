# WEB-005 — A100 / R11 / T080-S1B-D — Protected Tournament Delete

**TASK ID:** `WEB-005-T080-A100-S1B-D-R4`  
**AGENT:** A100 — Session Security & Private Access  
**WAVE:** R11, 2026-10-14 Europe/Warsaw  
**AUTHORITY:** `docs/web-005/WEB-005_WAVE_R11_AGENT_PROMPTS.md` §0–§2, AGENT A100 (`3e3b2ea04b6c7ce47986bff89c835a767e710cd4` blob).  
**GO MODE:** SOURCE-CODE ONLY / TEST-FIRST / Draft PR; exclusive ownership of the **DELETE route only**.  
**SOURCE BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**CODE+TEST PATCH SHA:** `55776965d6ca52cf74fc600bbddc2048ea27e977` (the code changes below).  
**BRANCH:** `fix/web-005/t080-s1b-delete-post-lock-r11`.  
**PR:** [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) — OPEN DRAFT / not merged.  
**STATE:** `PATCH_PROPOSED`, `SOURCE_CONFIRMED` diff, `NOT_EXECUTED` real tests, `SOURCE_ACCEPTED_PENDING`, `RUNTIME_VERIFIED_PENDING`, `RELEASE_NO_GO`.

## 1. R11 source discovery and dependency pin

- PR44/S1A HEAD `2f0187b7242681c394c09058b5ef647667206bd6` verified GitHub `OPEN DRAFT`, untouched. R10 A100 handoff `docs/web-005/WEB-005_A100_R10_HANDOFF.md` read. Existing source-side shared credential proof approach reviewed.
- PR42/MP2A HEAD `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`, OPEN DRAFT, untouched. Both #42/#44 modify `routes/tournaments.ts`, but are frozen by R11 ownership. No cherry-pick, merge, rebase or composite integration.
- Release branch HEAD rechecked: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, unchanged at patch creation. No dependency on unmerged helper is introduced.
- Prior R9 inventory identified `router.delete("/tournaments/:id")` with `requireOrganizer()` followed directly by `db.delete(tournamentsTable)` outside a tournament transaction. This is an objective source gap. Exact HTTP exploit and cascade risk are hypotheses until physically executed.
- Existing `verifyOrganizerToken(token, tournamentId, organizerPasswordHash)` is **already available in baseline `src/auth.ts`** and verifies signed token identity and current password-version fingerprint. No copy of PR44-only `organizerCredentialFingerprint` helper, no new auth architecture.

## 2. Minimal patch: source-confirmed change

| File | Change |
|---|---|
| `artifacts/api-server/src/routes/tournaments.ts` | Import existing `verifyOrganizerToken` and update only the DELETE handler. First `requireOrganizer` preserves role gate; then a single `db.transaction` locks `tournaments.id` with `FOR UPDATE`, verifies the original signed organizer token **against the locked row**, then `tx.delete(tournamentsTable)` in that transaction. Revalidation error aborts the transaction before any delete; lock-missing row gives 404, approved deletion gives pre-existing 204. |
| `artifacts/api-server/test/tournament-delete-revocation.integration.test.ts` | Add 5 actual-HTTP/PG16 tests as contracts, test-first commit `48cfea0df0ddf42ca05271403f3cb969dd586bcd`. No test execution claim. |

**Diff at source patch SHA:** only two files: DELETE-route import + 35-line guarded section (36 additions, 1 deletion), 209 lines new integration test. GitHub compare at base→patch: ahead 2, behind 0. No changes to `access-policy.ts`, `auth.ts`, any other auth endpoints, frontend, OpenAPI or SQL.

### Locking and revocation linearization

1. HTTP DELETE enters with a signed organizer token; `requireOrganizer` runs the existing *pre-lock* role check (unchanged).
2. The database transaction obtains `SELECT id, organizer_password_hash FROM tournaments WHERE id=:id FOR UPDATE`.
3. On the locked row, `verifyOrganizerToken(originalToken, id, currentHash)` must be true. Failure throws existing `TournamentMutationAuthorizationError` and app middleware returns **403** (wire code `SUPPORT_SESSION_EXPIRED`).
4. Only a token valid *at the lock linearization point* reaches `tx.delete(tournamentsTable)`. Database cascading FK deletes happen within the same transaction.
5. If B rotated the organizer credential and committed before A obtained the lock, A is denied with **0 deleted domain rows**. If A acquired the lock/deleted first, it was authorized at that point; a later B cannot retroactively invalidate an already committed deletion.
6. A row already absent after the preliminary check results in **404**. No disclosure of token or hash is introduced to logs/audits.

**No policy change:** Signed token wire format, JWT TTL (no new TTL), password routes, support session storage, organizer privilege rules, API status 403/204/404, all unchanged. Existing generic `SUPPORT_SESSION_EXPIRED` name/message also applies to organizer post-lock rejection; product-facing copy and potentially finer error codes remain owner/HQ policy follow-up, not this patch.

## 3. Test-first negative and positive contracts — not executed

| Test ID | Scenario | Expected |
|---|---|---|
| R11-A100-D01 | A organizer passes initial authorization; B holds tournament row lock; A queues; B changes organizer hash inside transaction and commits; A resumes | **403**, stable code, tournament + players + stages + matches + result_history + action_log + support session + auth audit all retained; only B's organizer hash change allowed |
| R11-A100-D02 | Current organizer, valid token | **204**, corresponding tournament and dependent snapshots all empty afterward (authorized cascade) |
| R11-A100-D03 | Support / viewer / anonymous DELETE | **403**, no domain record changes |
| R11-A100-D04 | Organizer token from tournament Y used on tournament X | **403**, no record changes in X |
| R11-A100-D05 | Organizer token invalidated before HTTP DELETE begins | **403**, no record changes |

**Fixture:** synthetic 2-player tournament created through isolated PostgreSQL16, real HTTP start and match completion generate persisted stage, match, result history and action log. A supporter session is synthetic and tournament scoped. Test D01 acquires `FOR UPDATE` in one pool client, issues HTTP DELETE, waits until `pg_stat_activity` reports a real `wait_event_type='Lock'` query on the tournament table, then updates the credential hash through the lock-owning client and commits. If the lock-waiter cannot be observed, the test throws `DELETE_RACE_NOT_EXERCISED` and cannot be counted PASS. Snapshot compares domain tables plus synthetic support-session timestamps and auth audit, omitting sessionToken from assertions; exempting **only the B-authored credential rotation**. No arbitrary sleep alone determines race order.

### A50 approved isolated test run recipe

Use an independently verified checkout at the **exact PR46 source HEAD** and approved disposable PostgreSQL16, Node22 and pnpm10 with locked dependencies. The existing `test-database.ts` preflight checks test-only DB name and `tm_test_*` schema and explicitly requires the reset confirmation. Do **not** run with production/shared `DATABASE_URL`.

```bash
export TEST_DATABASE_URL='<APPROVED_ISOLATED_POSTGRESQL16_TEST_DB_URL>'
export TEST_DATABASE_SCHEMA='tm_test_t080_a100_r11'
export TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/tournament-delete-revocation.integration.test.ts
pnpm --filter @workspace/api-server typecheck
```

Expected test runner: all 5 tests PASS, exit=0, 0 skipped/TODO. After targeted suite, run the relevant authorization/deletion regression on the same approved isolated test DB (separate disposable schema per suite) and record per-command exit code and SHA. **Do not launch paid GitHub CI without explicit consent.**

### Actual execution evidence

| Check | Actual outcome | Classification |
|---|---|---|
| GitHub base branch, PR44, PR42 | SHA and OPEN DRAFT state verified via connected GitHub | `SOURCE_CONFIRMED` |
| PR46 `base...head` diff | Two changed files only; no helper copying, no migration/frontend; code protected by lock | `SOURCE_CONFIRMED` |
| New test source | 5 test definitions, real barrier and snapshot assertions present | `SOURCE_CONFIRMED` **test existence, NOT test result** |
| Local container Node | `node --version` returned `v22.16.0`, exit 0 | `RUNTIME_VERIFIED` **tool availability only** |
| Local checkout / package manager | No working checkout, `pnpm` absent | `BLOCKED` real compile |
| Test database | `TEST_DATABASE_URL` absent; no preflight or PostgreSQL client checked | `BLOCKED` real integration |
| Targeted PostgreSQL suite | **NOT_EXECUTED** (no command exit code) | `NOT_EXECUTED` |
| TS typecheck / build / full regression | **NOT_EXECUTED** (no command exit code) | `NOT_EXECUTED` |
| Independent QA A60 / security A30 | Awaiting exact-HEAD external acceptance | `PENDING`, not self-approved |

## 4. Remaining risks / reviewer requirements

- **A30 security review:** confirm direct use of baseline `verifyOrganizerToken` inside transaction is acceptable as a temporary isolated fix, that no raw token is logged, and that `SUPPORT_SESSION_EXPIRED` on organizer denial preserves pre-existing wire behavior without a policy decision. Confirm array-valued header fails closed.
- **A60 independent QA:** verify D01–D05 against actual PostgreSQL16 and supervised A50 environment, inspect row-lock linearization, rollback and cascades; check 403 vs 404 vs 204 behavior and positive role parity; pin verdict to exact code SHA.
- **A50 runtime:** preflight isolated PostgreSQL16/Node22/pnpm10 and run tests. Do not infer PASS from authored tests.
- **A00 conflict ownership:** PR46 and frozen PR44/PR42 touch same route file. Keep independent; A00/SWARM-006 eventual authorized integration must reconcile, but **no integration this wave**.
- **POLICY OPEN:** better organizer error code/message; TTL, support token digest/storage, organizer password-rotation policy, other S1B+ routes and S2 cache. No changes.
- **Scope exclusions:** `routes/auth.ts`, correction intent, `DELETE` other resources, frontend, `access-policy.ts`, common signer, global authorization infrastructure, staging/live, production DB.

## 5. Formal GO/STOP and handoff

**GO:** test-first source patch and isolated Draft PR created, provenance documented.  
**STOP:** no QA acceptance, no actual PostgreSQL test PASS, no merge/cherry-pick, no staged or live rollout, no paid CI, no migration, no SWARM-006 dispatch.

**NEXT ACTION:** A50 provides isolated PostgreSQL16 approval and runs PR46-targeted tests; A30 and A60 independently review exact PR HEAD. A00 registers PR46 as **P13+ conditional internal package**, pending source/QA/runtime, not accepted for deployment.
