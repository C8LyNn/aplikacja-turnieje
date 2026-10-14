# WEB-005_A100_R12_HANDOFF

**AGENT:** A100 — Session Security & Private Access  
**WAVE / TASK:** R12 / `WEB-005-T080-A100-S1B-P-R12`  
**DATE:** 2026-10-14, Europe/Warsaw  
**MODE:** GO CODE-ONLY L2 / test-first / isolated draft PR; STOP integration.

| Record | Exact value |
|---|---|
| Release baseline | `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| Branch | `fix/web-005/t080-s1b-password-visibility-r12` (created from exact release commit) |
| PR | [#49 OPEN DRAFT](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) |
| Test-first commit | `70e5c04e3ec49ce00246f2b95f6c0e0b3b89e08e` |
| Source patch commit | `ef78a70996f1723c02528fe585c1c2e9582a12f9` |
| Current PR HEAD | Re-read GitHub after report commits; PR #49 is the live reference |
| Detailed report | [`WEB-005_A100_R12_S1B_PASSWORD_VISIBILITY_PATCH.md`](./WEB-005_A100_R12_S1B_PASSWORD_VISIBILITY_PATCH.md) |

## Exact changed files

- `artifacts/api-server/src/routes/auth.ts` — source-confirmed `requireOrganizerAccess` before locked password/visibility updates lacked post-lock credential check. Added one local guarded verifier based on baseline `verifyOrganizerToken`, called in **four** organizer-only mutation transactions: `change-support-password`, `change-viewer-password`, `change-visibility`, `DELETE viewer-password`. Keeps same row lock and update in one transaction; mismatched old organizer credential throws existing `TournamentMutationAuthorizationError` → HTTP 403 `SUPPORT_SESSION_EXPIRED`.
- `artifacts/api-server/test/auth-organizer-revocation-r12.integration.test.ts` — test-first physical PG16 + HTTP matrix of **17 declared test cases** (4 lock races; 4 legal current-token positives; 4 composite unprivileged cases covering support/viewer/anonymous; 4 pre-revoked denies; 1 protected `private_online` 409 regression).
- `docs/web-005/WEB-005_A100_R12_S1B_PASSWORD_VISIBILITY_PATCH.md` — full evidence, test methodology, policy/rollback.
- `docs/web-005/WEB-005_A100_R12_HANDOFF.md` — this formal report.

**Source diff:** code-only checkpoint `+35/-3` in `routes/auth.ts` and `+273` lines in one test file. No `routes/tournaments.ts`, SQL/migration, `access-policy.ts`, `auth.ts` or frontend. All prior PR #44 and #46 remain separate frozen drafts.

## Test/evidence separation

**Verified with live GitHub:** R12 authority, base/release SHA, PR #44 head `2f0187b7242681c394c09058b5ef647667206bd6` and PR #46 head `7f60849e389a7ed35fdd39dd5493c4c4c267d860`, route source gap, exact two-file code diff, presence and content of negative test contract. Evidence class `SOURCE_CONFIRMED` and `PATCH_PROPOSED`.

**NOT_EXECUTED:** A100 did not run PostgreSQL16/API integration, TypeScript compiler or full regression. No approved disposable isolated PG16 `TEST_DATABASE_URL`, explicit reset/schema attestation or checkout/pnpm install for A100; no command exit codes and no `RUNTIME_VERIFIED` claim. A50 may execute in safe preflight environment only.

Run (A50 only after approval; from verified repo checkout root, with explicit test-only env):
```bash
export TEST_DATABASE_URL='<A50_APPROVED_DISPOSABLE_TEST_PG16_DATABASE_URL>'
export TEST_DATABASE_SCHEMA='tm_test_t080_a100_r12'
export TEST_DATABASE_RESET='DROP_TM_TEST_SCHEMA'
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/auth-organizer-revocation-r12.integration.test.ts
pnpm --filter @workspace/api-server typecheck
```

**QA status:** A30 security peer **PENDING**; A50 PG16 runner **PENDING**; A60 independent exact-SHA source/runtime **PENDING**. 17 authored test cases != 17 passed. No manual paid CI rerun.

## Role/authorization/rollback gate

A100 owns only `routes/auth.ts` protected password and visibility routes for R12. `set-organizer-password` bootstrap, legacy upgrades, direct DELETE tournament PR46, Deadlock bans/picks PR44, correction intent, S2 React private cache and token TTL/hash/rotation semantics **OUT OF SCOPE**. R12 A70 owns `routes/tournaments.ts` Undo; no change there. Revoke stale organizer under tournament lock; keep 403 stable error code, 200 successful mutations, and existing viewer-password removal 409 guard. If rollback necessary, close isolated PR and abandon branch; release remains untouched.

**POLICY_OPEN:** historical expired-support error naming on organizer stale token; TTL, token digest-at-rest, organizer-rotation business policy; no new owner decisions taken.

**DEPENDENCIES / NEXT:** A50 independently verifies disposable PostgreSQL16 preflight and runs targeted source SHA; A30 reviews threat model/credential handling; A60 independent acceptance; A00 tracks conditional package and conflicts; A10 assigns canonical packet ID, no assumption. No cross-PR integration and **SWARM-006 NOT STARTED**.

`STATUS=PATCH_PROPOSED | TESTS=NOT_EXECUTED | QA=PENDING | MERGE=NOT_AUTHORIZED | DEPLOY=NOT_AUTHORIZED | RELEASE=NO_GO`
