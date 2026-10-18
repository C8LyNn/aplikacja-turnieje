# WEB-005_A100_R10_HANDOFF

- **AGENT / TASK / WAVE:** A100 / `WEB-005-T080-A100-S1A-R3` / R10
- **BASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **PATCH + TEST SOURCE COMMIT:** `a40384f8be44c8f177ab59023e535c9fb5e11e90`.
- **PR:** [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) OPEN DRAFT, head branch `fix/web-005/t080-s1a-revocation-lock-r10` (live HEAD must be rechecked after reporting commits).
- **REPORT:** [WEB-005_A100_R10_T080_S1A_PATCH.md](./WEB-005_A100_R10_T080_S1A_PATCH.md). Full evidence, contracts and runnable A50 commands there.
- **ACTUAL CHANGES:** `artifacts/api-server/src/auth.ts`, `src/access-policy.ts`, `src/routes/tournaments.ts` (api-server path), `artifacts/api-server/test/session-revocation-race.integration.test.ts`; two R10 documents. No SQL migrations/frontend.
- **FIXED IN SOURCE / PATCH_PROPOSED:** Organizer revocation proof must match credential hash under tournament lock and match tenant id. Support revalidation retained. Bans and match picks write only after post-lock verification, with same-transaction validation and upsert.
- **TEST EVIDENCE:** 14 PostgreSQL/Express deterministic scenarios **AUTHORED, NOT_EXECUTED**. No approved isolated PG16, no pnpm installed in A100 environment; targeted suite, Deadlock regression, TypeScript typecheck **NOT_EXECUTED**, no exit codes invented.
- **INDEPENDENT QA:** A30 security review PENDING; A50 isolated runtime PENDING; A60 independent exact-HEAD review PENDING.
- **CONFLICT / DEPENDENCIES:** A100 exclusive `routes/tournaments.ts` in R10; A70 PR #42 changes the same file in separate draft and is review-only. No cherry-pick/merge; A00 coordinates later.
- **POLICY OPEN / REMAINING:** TTL, support token storage digest, organizer rotation, reuse of historical `SUPPORT_SESSION_EXPIRED` 403 code; S1B+ unauthorized write families, S2 React Query privacy cache remain separate tasks.
- **GO/STOP:** GO source-only draft patch completed. **STOP** runtime production/shared DB, manual paid CI, frontend S2, other S1B+, release/merge/deploy/Replit, SWARM-006 dispatch.
- **NEXT ACTION:** A50 isolated PostgreSQL16 preflight and test run against current PR #44 HEAD; A60 independent acceptance, A30 review; A00 logs as internal conditional package only.

`STATUS=PATCH_PROPOSED | TESTS=NOT_EXECUTED | QA=PENDING | RELEASE=NO_GO`
