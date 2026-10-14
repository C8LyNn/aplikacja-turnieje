# WEB-005 A100 / R12 — T080-S1B-P Password + Visibility Post-Lock Authorization

**TASK:** `WEB-005-T080-A100-S1B-P-R12`  
**AGENT:** A100 — Session Security & Private Access  
**WAVE:** R12, 2026-10-14 Europe/Warsaw  
**AUTHORITY:** [`WEB-005_WAVE_R12_AGENT_PROMPTS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R12_AGENT_PROMPTS.md), central blob SHA `7f39cc5c7a5e845a97e3952187c8128510e498bc`, §§0–2 and AGENT A100; code lane L2 only.  
**BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (independently rechecked).  
**BRANCH:** `fix/web-005/t080-s1b-password-visibility-r12`, directly from release.  
**PR:** [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49), **OPEN DRAFT / no merge**.  
**TEST-FIRST COMMIT:** `70e5c04e3ec49ce00246f2b95f6c0e0b3b89e08e`.  
**CODE PATCH COMMIT:** `ef78a70996f1723c02528fe585c1c2e9582a12f9` (report-only commits will advance PR HEAD).  
**EVIDENCE:** `SOURCE_CONFIRMED` missing under-lock auth at baseline; `PATCH_PROPOSED` code and test exist; `STATIC_INFERRED` race outcomes; `RUNTIME_VERIFIED=NO`; `NOT_EXECUTED` PG tests/typecheck; `A30/A50/A60=PENDING`; `RELEASE=NO_GO`.

## 1. Scope and source discovery

R9 S1 inventory `WEB-005_A100_R9_T080_S1_PATCH.md` (blob `c08fa6b8d01436547228f45a7c5dbb36a4c4e475`) identified `routes/auth.ts` organizer-owned password and visibility mutations with pre-lock authority but no post-lock revalidation. R12 re-read baseline `artifacts/api-server/src/routes/auth.ts` blob SHA `7c7799a096b8f8d20bf198a8e4ec72b68f0a7a9a` and `src/access-policy.ts` blob SHA `2efd5a51e365e9b3aed598eb3289178911f87af6`.

The four vulnerable, **confirmed source** routes (no other routes modified):

| Endpoint | Previously checked | R12 fix |
|---|---|---|
| `POST /tournaments/:id/auth/change-support-password` | `requireOrganizerAccess` before hashing, then locked support version read and update | Locked selection now includes `organizerPasswordHash`; revalidate original token before updating support hash/version |
| `POST /tournaments/:id/auth/change-viewer-password` | Same early gate; locked viewer version only | Locked organizer hash check before viewer hash/version update |
| `POST /tournaments/:id/auth/change-visibility` | Same early gate; locked viewer version only | Locked organizer hash check before visibility/hash/version mutation |
| `DELETE /tournaments/:id/auth/viewer-password` | Same early gate; locked visibility/viewer version check | Locked organizer hash check occurs before private-online 409 precondition or credential removal |

Source-confirmed pre-existing gap: the initial organizer token is validated outside `db.transaction`; a different transaction can rotate `organizerPasswordHash` before this request obtains tournament row lock. Without revalidating inside the lock, the stale request can persist a write based on no-longer-current authority. Physical exploitation remains `STATIC_INFERRED` until real PG16 test.

## 2. Patch design and exact changed files

**Source-only patch at `ef78a709...`:**
- `artifacts/api-server/src/routes/auth.ts` — add existing shared authorization error import, create **local standalone helper** `revalidateLockedOrganizer(req, tournamentId, organizerPasswordHash)`, and call it in the four locked transactions immediately after row-found check and before mutation. The helper checks the original `x-organizer-token` is a single string and calls **existing baseline** `verifyOrganizerToken` with the locked tournament credential hash. Failure throws the pre-existing `TournamentMutationAuthorizationError` which maps in `app.ts` to HTTP `403` and code `SUPPORT_SESSION_EXPIRED`; no new error schema.
- `artifacts/api-server/test/auth-organizer-revocation-r12.integration.test.ts` — first commit creates 17 parameterized physical PostgreSQL/HTTP test cases with deterministic `pg_stat_activity` lock barrier, protected data snapshot comparison and signed tokens. Tests are **authored, not run**.

**GitHub compare baseline→code**: only two paths; source diff `+35/-3` lines (1 helper + 4 authorization guards); new test `+273` lines. No modification to `routes/tournaments.ts` (A70 exclusivity), `access-policy.ts`, `auth.ts`, `routes/tournament-controlled-correction-revert.ts`, frontend, SQL/migrations, policy, release or main.

Existing organizer-role check, request shapes, `hashPassword` implementation, credential version increment, `visibility` semantics, `private_online` 409 guard, positive 200 response, audit after authorized commit, viewer/support session semantics, token wire format and TTL remain unchanged. Guard runs within the **existing** tournament lock and transaction, not in a nested transaction; no role escalation or raw credential logging.

**R12 explicit scope exclusions:** `set-organizer-password` bootstrap and legacy organizer upgrades, DELETE tournament PR46, bans/game-picks PR44, controlled correction intents, S2 private frontend cache, token hashing-at-rest/TTL/rotation model, and all other auth endpoints.

## 3. Deterministic test matrix (17 cases, none executed)

Four endpoint categories × four case types, plus one existing-invariant regression:

| ID | Test family | Count | Required expected result |
|---|---|---:|---|
| S1B-P-RACE | Pre-authenticated A blocks on row lock held by B; B changes organizer hash, commits; A resumes | 4 | 403 `SUPPORT_SESSION_EXPIRED`, no support/viewer password-version, visibility, session or auth audit changes; organizer hash only reflects B's committed rotation |
| S1B-P-CURRENT | Valid organizer token, unchanged current hash | 4 | 200; only corresponding authorized password/visibility mutation; expected version increments, audit record, session rows preserved |
| S1B-P-UNPRIV | Support, viewer and anonymous on each route (12 HTTP denials organized in 4 test cases) | 4 | 403 for every actor; all protected snapshots unchanged |
| S1B-P-PRE-REVOKED | Organizer token revoked before initial request (each route) | 4 | 403, no protected writes |
| S1B-P-VIEWER-409 | Viewer-password removal when already `private_online` | 1 | 409 `VIEWER_PASSWORD_REQUIRED`, no protected writes |

**Race ordering:** test B begins transaction, holds `SELECT tournaments FOR UPDATE`; HTTP A starts using the *then-valid* organizer token, waits at its own `SELECT ... FOR UPDATE`. The test must observe A as a real `pg_stat_activity` lock waiter (`wait_event_type = 'Lock'`, SQL text includes `tournaments`) before B updates the organizer hash and commits. If no waiter appears, fails with `R12_S1B_P_BARRIER_NOT_OBSERVED` instead of claiming a race PASS. After A resumes, snapshots compare digest-only credential proofs, password versions, visibility, session metadata (never sessionToken), and audit records. The authorized rotation by B is the only permitted difference on a rejected request.

**Test fixture:** dedicated synthetic tournament; synthetic signed organizer/viewer credentials and support row; `getSafeTestDatabaseConfig()` executes before destructive reset and enforces test-only database naming, schema `tm_test_*`, reset confirmation, Node test runner. No real user data or secrets used.

## 4. Safe test commands for A50; provenance

Execute only in the A50-approved **disposable and physically isolated PostgreSQL16** environment with Node22/pnpm10, a correct checkout pinned to the exact PR #49 code SHA, and a confirmed test-only `TEST_DATABASE_URL`. Do **not** run on production or shared DB; do not start paid CI runs without explicit authorization.

```bash
export TEST_DATABASE_URL='<A50_APPROVED_DISPOSABLE_PG16_TEST_DATABASE_URL>'
export TEST_DATABASE_SCHEMA='tm_test_t080_a100_r12'
export TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/auth-organizer-revocation-r12.integration.test.ts
pnpm --filter @workspace/api-server typecheck
```

Independent A50: record test command, actual exit code, counts, failed assertions, DB/schema isolation proof, version of Node/pnpm and exact HEAD; then run relevant existing password/session and visibility integration regressions in their own verified test schemas. A60 to validate that the race truly reached post-lock revalidation and verify 200/403/409 parity. A30 to inspect auth proof provenance, error code policy preservation, and credential/log hygiene.

| Check | Actual R12 A100 status |
|---|---|
| GitHub R12 central scope / release base and frozen PR44/46 | Verified source metadata |
| `routes/auth.ts` pre-lock/under-lock source inventory | Verified source code |
| Four locked guard calls, helper and no forbidden paths | Verified source diff, **not runtime PASS** |
| 17 real-app test definitions | Created and committed; **NOT_EXECUTED** |
| Targeted PostgreSQL16 integration tests | **NOT_EXECUTED** (A50 environment not available to this agent) |
| Native TypeScript typecheck/build | **NOT_EXECUTED** (no verified installed checkout or pnpm in this agent session) |
| Independent security A30 / acceptance A60 | **PENDING**; no self-certification |
| Manual GitHub paid CI, shared/production DB, Replit, release deployment | **NOT ATTEMPTED / STOP** |

**CI context:** R12 central source documents unrelated historical Pack19 test regex failure inherited on release-based draft PRs before #35 is composed. Do not classify that mismatch as a demonstrated failure or success of this R12 auth patch. Only A40/A50 own Pack19 evidence and A60 owns independent QA.

## 5. PR relationships, rollback, policy and handoff

- **Existing PR #44 / S1A:** `2f0187b7242681c394c09058b5ef647667206bd6` OPEN DRAFT, source helper for post-lock proof in *other* flows. This R12 patch deliberately uses already released `verifyOrganizerToken` and does **not** cherry-pick or copy the #44 source helper.
- **Existing PR #46 / S1B-D DELETE:** `7f60849e389a7ed35fdd39dd5493c4c4c267d860` OPEN DRAFT, no modifications from A100 R12. No shared route path collision with PR #46.
- **A70 R12 ownership:** `routes/tournaments.ts` is exclusive to A70; A100 did not modify it.
- **Rollback:** abandon/close this isolated draft branch before authorized integration; release remains at baseline. After eventual authorized integration, revert the narrow auth route commit through the coordinator-controlled process; no SQL rollback.
- **POLICY_OPEN:** expired organizer user-facing error code and message (reuse existing `SUPPORT_SESSION_EXPIRED` temporarily for wire stability), auth TTL, persisted support token digest, organizer password rotation rules. No unilateral decisions.
- **A00:** treat PR #49 as **conditional internal R12 patch**, not a completed release gate; A10 controls packet numbering. Do not send anything to SWARM-006.
- **A30:** security source review of #49; **A50:** PG16 run only after disposable-DB preflight; **A60:** independent source/runtime verdict anchored to exact SHA.
- **MERGE/CHERRY-PICK/INTEGRATION/REPLIT/DEPLOY/PRODUCTION/SWARM-006:** **NOT AUTHORIZED**.

**Verdict:** `PATCH_PROPOSED / SOURCE_REVIEWED_BY_AUTHOR / TESTS_NOT_EXECUTED / A30_A60_PENDING / RELEASE_NO_GO`.
