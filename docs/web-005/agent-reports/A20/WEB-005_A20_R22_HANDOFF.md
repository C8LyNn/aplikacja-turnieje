# WEB-005 — A20 R22 Final Handoff

**Task:** `WEB-005-T021-A20-R22` · **Agent:** A20 PostgreSQL Migration Reconciliation · **Mode:** DB SAFETY READ / SOURCE-ONLY · **For:** A00, A110, A90, A60 · **Date:** 2026-10-15.

**FINAL:** `SCHEMA_CONTRACT_PUBLISHED / T055_OWNER_POLICY_SELECTED / B3_OWNER_DELEGATED / MIGRATION_ID_UNASSIGNED / SQL_NOT_EXECUTED / PG16_NOT_EXECUTED / PR38_REVIEW_ONLY / NO_CODE_GO / RELEASE_NO_GO / SWARM006_HOLD`.

## Exact deliverable / changed paths

**[WEB-005_A20_R22_T055_B3_DB_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ec67447b272e679a29002e4980898bd1debf86d/docs/web-005/agent-reports/A20/WEB-005_A20_R22_T055_B3_DB_GATE.md)**, commit `3ec67447b272e679a29002e4980898bd1debf86d`. Proposed future additive `tournaments.basket_config_revision bigint NOT NULL DEFAULT 1 CHECK >0`; full DDL/trigger/privilege/writer-lock/rollback contract, explicit no-ABA fail-closed ETag/If-Match and 412/428 behavior; distinction of existing `0028_match_revision.sql` match state revision, result history revision and new basket revision; safe Backup B1–B6 strict/legacy clone-local revision. **This is documentation, not a SQL migration or source implementation**.

R22 changed only:
- `docs/web-005/agent-reports/A20/WEB-005_A20_R22_T055_B3_DB_GATE.md`;
- `docs/web-005/agent-reports/A20/WEB-005_A20_R22_HANDOFF.md` (this file).
No app source code, tests or `lib/db/migrations` path changed by A20; no PR was opened because A20 has no R22 source-code GO. **SQL_NOT_EXECUTED**.

## Owner authority / independent QA

- [Central R22 scope](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md), blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`: only A80 L1 and A90 L2 have limited source-code GO; A110 L3 tests/contract only. A20 READ ONLY design, NO new migration.
- [Owner T055 approval](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), blob `36a14ef3be7852c202cc003264bf17e67da2f022`: **D1=B persistent monotonic revision, D2=B ETag/If-Match, D3=B 412, D4=A 428, D5=B stage/roster under lock, D6=B preserve local draft/manual reconcile**. These decisions are SELECTED, not open for another product vote.
- [Owner Backup B1=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md) and [A00 owner-delegated B2=B, B3=A, B4=A, B5=A, B6=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md), blobs `a0579990ace09d85eea62cfcab33b8ad54ea6fdc` and `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a`. Selected policy is not a runtime import test or SQL GO.
- [A60 R21 independent](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`: `HANDOFF_NOT_READY`; P05 `SOURCE_ACCEPTED_OFFLINE_ONLY`, no PG16. R21 review predated later owner product approvals; it is NOT independent acceptance of this new R22 design or implementation.

## Actual source checks / runtime statement

At verified release HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`:
- `lib/db/src/schema/tournaments.ts` blob `0fb1a93e2ea99a5944e71ea1e7bc54d4097f60a8`, no `basket_config_revision`; dependent tables include stages/roster/baskets/routes/assignments.
- `lib/db/migrations/0028_match_revision.sql` blob `45eb2ea26e8bbeb290be4e8ded21b544440ce7ec`, match revision `integer default 1` with BEFORE UPDATE trigger, not `result_history.revision` or T055 counter.
- `artifacts/api-server/src/application/stages/stage-basket-configuration.ts` blob `7814928721fb3b3af11ef6960c4944ef96c2d128`: PUT currently parent/stage/player `FOR UPDATE`, graph DELETE/INSERT and stage-version updates, but **no persisted parent basket CAS**; GET not evidenced as one repeatable-read snapshot.
- `artifacts/api-server/src/routes/tournaments.ts` blob `6767e7ac6c4d43cf39faa8a61534bdb92b898e14`: GET no ETag and PUT no If-Match currently.
- P05 [PR38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38): **OPEN DRAFT, unchanged HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`**, release base as above; historical original `0030/0031` collisions and proposed 0032–0040 mean next migration identifier **cannot be guessed**. P05 `REVIEW_ONLY / ready_for_sql:false`.
- [PR41 Backup B1](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) HEAD `f03cf3d09988a04ba9c2856e205d21f994ff67f1`; [PR48 B3A MVCC](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) HEAD `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3`, all OPEN DRAFT and unmerged; do not assume new B3 portable strict profile is implemented.
- R22 checks actually executed: **GitHub read-only source fetches/PR/ref checks and publication/readback**. Runtime `psql`, PG16 DDL, isolation preflight, API/React tests, Node suite: **NOT_EXECUTED** in this wave; command/exit/TAP `NULL`. R20's P05 37/37 + author 22/22 offline are *historical receipts only*, not R22 test passes. No trusted authorized PG16/reset scope was provided; owner selected conditional **EXEC-B**, not a PG16 authorization.

## Engineering risk / exact next unblockers

1. **A00 → future schema GO:** allocate unique migration ID *after* historical P05 source/ledger reconciliation; review proposed BIGINT/check/monotonic guards and all relevant writer DML paths/lock order with A20, A110, A90, A60. No short-lived vector/digest fallback: violates D1 ABA resilience. The reviewed trigger design must invalidate for meaningful stage/roster changes; full PUT's multiple trigger bumps are okay when ETags opaque but numeric +1 is not guaranteed without further design. Lock parent `tournaments FOR UPDATE` first in every writer; review compat trigger and deadlock/order before DB implementation.
2. **A110 L3 acceptance:** test missing If-Match 428, stale 412/zero writes, concurrent A/B, stage/roster invalidation, A→B→A ABA, same snapshot GET ETag, organizer authorization, legacy client cutover and draft retention. No R22 PUT writer code.
3. **A90 L2 pure strict backup:** portable **match-state** revision distinct from `resultHistory.revision`; clone-local T055 basket token; strict new capability/legacy-safe compatibility; no import/export/source PR41/48 edit without new GO.
4. **A50/A60 future runtime:** only owner-certified disposable PG16, explicit test-only `TEST_DATABASE_URL`, `tm_test_*`, separate written reset scope, exact SHA, full checkout, actual exit/TAP, future migration+backup rollback tests. NO physical SQL was run this wave.
5. **SWARM-006:** holds eventual integration/conflict/deployment and controlled migration, only on separately signed one-time final handoff; cannot infer authorization from EXEC-B preference. Release NO-GO until real tests.

**No-go:** new production/shared DB migration, unapproved SQL/DDL, schema reset, app source changes in A20, merge/rebase/cherry-pick, live/staging, paid CI or SWARM-006 start.

**Final:** `WEB-005-T021-A20-R22 — DB_DESIGN_DELIVERED / NO_CODE / SQL_NOT_EXECUTED / PHYSICAL_PG16_NOT_EXECUTED / QA_PENDING_FUTURE_MIGRATION / SWARM006_HOLD`.
