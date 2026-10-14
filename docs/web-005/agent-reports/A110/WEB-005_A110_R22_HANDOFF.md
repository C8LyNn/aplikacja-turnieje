# WEB-005 — A110 R22 FINAL HANDOFF TO LOCAL A00

**Agent/task:** A110 Basket Concurrency & Frontend State / `WEB-005-T055-T110-A110-R22`  
**Wave:** R22.1 · 2026-10-15 Europe/Warsaw  
**GO:** L3 TEST-FIRST API/PG16 acceptance contract only. **NO production endpoint/router/service, database schema/DDL, Backup V3 or frontend behavior GO.**  
**Exit:** `R22_L3_TEST_SOURCE_PUBLISHED / PR55_DRAFT / FAIL_FIRST_10_TESTS_AUTHORED / A60_EXACT_SHA_QA_PENDING / NATIVE_APP_PG16_NOT_EXECUTED / CAS_IMPLEMENTATION_NOT_STARTED / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Exact actual GitHub changes

**NEW independently scoped draft [PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55)** `[WEB-005][A110][R22][T055] Fail-first Basket CAS API/PG16 acceptance contract`.

- **Branch:** `WEB-005-T055-CAS-R22-TEST_CONTRACT`
- **HEAD:** `c3a4ea00ba933cbab36b3582859cb3eff20f0204`; **base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- **GitHub file and readback blob:** [`artifacts/api-server/test/stage-basket-cas.integration.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/WEB-005-T055-CAS-R22-TEST_CONTRACT/artifacts/api-server/test/stage-basket-cas.integration.test.ts), `f95f032f4146f33ccbba813a3d08b34dfb9bb929`.
- **Verified git compare:** `ahead_by=1`, **only one new test file** (316 added lines, 0 deleted), no modified existing app file, no DB or new migration, no code from PR39/42/44/46/51 and no composite.
- **Scope:** 10 **intentionally fail-first** tests CAS-01..10: strong coherent ETag GET/tenant identity; missing PUT If-Match 428/no write; malformed fail-closed; valid current token; stale 412 typed/no write; simultaneous V0 writers one 200/one 412; cross-tenant tag rejected; stage-version change; roster change; unauthorized organizer still denied.
- **Draft state:** new PR is **not merge-ready**. The production CAS doesn't exist. These tests are acceptance hypotheses **authored** (not measured RED or GREEN). A60 independent first-pass source/code/test acceptance on exact new SHA is **pending** and must not be replaced by author review.

**R22 docs publication** (control branch `chore/web-005/t000-wave1-control`):
1. [`WEB-005_A110_R22_T055_CAS_TEST_GATE.md`](./WEB-005_A110_R22_T055_CAS_TEST_GATE.md) — **verified Git blob `3a40d293b40a79d9c238eaac5ee98bcd15c7298c`**, creation commit `a28f9ad0257207a8b53c4e3437f5d1c5ecc5ff10`. Full test cases, exact command, database reset safety, A20/A90/DTO/L2 next slices.
2. `WEB-005_A110_R22_HANDOFF.md` (this report). Only docs files on control; app test-only branch separate. No unapproved source modification.

## 2. Verified owner approval and independent pre-R22 QA

**Central R22 prompt** [R22.1](../../WEB-005_WAVE_R22_AGENT_PROMPTS.md), Git blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`: expressly grants L3 test-first; prohibits production PUT changes and any DDL before A20 design and further file-specific GO.

**Signed owner T055 policy** [R21 approval](../../WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), Git blob `36a14ef3be7852c202cc003264bf17e67da2f022`:
- D1=B persisted monotonically increasing `basketConfigRevision`;
- D2=B GET ETag / PUT mandatory If-Match;
- D3=B stale **412 + `STAGE_BASKET_CONFIGURATION_STALE`**, zero changes;
- D4=A missing **428** (malformed fail-closed);
- D5=B basket token plus atomic stage/roster drift verification under lock;
- D6=B preserve draft, require manual reconcile and opt-in retry.
**This is product approval, NOT code/migration/release/QA approval.**

**A60 R21** [independent source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), Git blob `47dc44f980734ce68dd63769ba3f25ad60dc899f` = `HANDOFF_NOT_READY` for **older** P01–P21 (not PR55). No new A60 PR55 review verified at this handoff. Owner policy was recorded after original R21 QA and must not be confused with runtime acceptance.

**Existing unchanged OPEN DRAFT PR source collisions/risks at R22 readback:**
- [P10 #43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`, A60 conditional source;
- [P17 #50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`, A60 conditional source;
- [P19 #52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) HEAD `cce73ec47445102b216b3f8eceb4ec9de67eb1a7`, A60 conditional source;
- [P20 #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, A60 source scoped, raw legacy cache policy open;
- [P21 #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`, A60 conditional source, PR47 DE child integration debt.
PR43/50/54 overlap `tournament-detail.tsx` and PR47/54 `stage-progress-view.tsx`; PR55 touches **neither**. All 21 old PRs are independent and unmerged.

## 3. Honest execution receipt, not simulated QA

**A110 R22 actual application/test commands and exits:** `NOT_EXECUTED / NULL`. GitHub branch/file creation and source readback are the only source operations; **no complete connected pinned repo checkout / Node22+pnpm10 frozen dependencies / physically owner-approved isolated PG16** was available for real application execution. No TAP/pass/fail/skip produced. **10 authored tests = 0 actual test outcomes**.

**A50 prior R21** [receipt](../A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`: native app runs 0 and physical PG16 block. A50 may independently report later work, but nothing is inferred here.

**Future A50 exact commands** only after A20+owner test-only host/schema/reset approval:
```bash
git rev-parse HEAD  # expected c3a4ea00ba933cbab36b3582859cb3eff20f0204
pnpm --filter @workspace/api-server run typecheck
# TEST_DATABASE_URL points ONLY to physically isolated disposable PG16;
# owner-approved precise test reset, no fallback to production/shared.
export TEST_DATABASE_SCHEMA=tm_test_t055_r22
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
(cd artifacts/api-server && node --import tsx --test --test-concurrency=1 ./test/stage-basket-cas.integration.test.ts)
```
Require synthetic data, actual CLI exit/TAP/log; full typed API and React hooks after later authorized implementation. No paid CI manually rerun.

**Important existing test conflict:** baseline `stage-baskets.integration.test.ts` and `basket-participant-flow.integration.test.ts` use unconditional PUT; **will require coordinated future fixture updates** after D4=A mandatory If-Match cutover. PR55 does not silently rewrite pre-existing tests or let legacy writes through.

## 4. Dependencies / future scoped implementation — no present code permission

**A20 schema/migration review gate:** release `lib/db/src/schema/tournaments.ts` currently contains `basketFlowAuthorityVersion` mode, **not** persisted basketConfigRevision. A20 must sign exact chosen revision identity, migration ledger and rollback with existing SQL conflicts, in-lock stage/roster writer proof + ABA and additional direct persisted-column assertions before implementation. No DB DDL/revision schema change by A110.

**A90 Backup V3:** future CAS persisted revision must be portable or intentionally regenerated on Backup V2/V3 legal restore under approved B2–B6, with strict modern/valid legacy compatibility and no replay token. No Backup source changes by A110.

**Future separate L1 production/backend GO:** A00/HQ must explicitly grant new exact-file exclusive ownership to add GET coherent ETag and PUT If-Match comparison within same transaction/lock before ANY graph writes, 412/428 fail-closed, atomic revision increment, stage/roster coherence; actual PG16 tests. Existing routes overlapping multiple PR branches need integration ownership decision. **NO GO L1 in R22.**

**Future separate L2 frontend/DTO GO:** OpenAPI/Zod generated types + `StageBasketsPanel` D6=B draft retention/reload/reconcile/explicit retry and no cross-tournament leakage, while separately enforcing Host UX044 navigation policy. Frontend static hook tests and mounted A→B/412 HTTP regression not authored in PR55; documented in [test gate](./WEB-005_A110_R22_T055_CAS_TEST_GATE.md). Existing PR53 private cache downgrade must be respected.

**Outstanding overall:** original 38 WEB004 R2 cases = 29 secondary IDs, 9 missing originals and no signed per-case disposition, MP2B/Steam/session/cache residual owner choices pending, no independent full app QA, no approved single final handoff GO.

## 5. Direct final links / owner next action

**New exact-head standalone draft source-test PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/55

**Test gate docs:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A110/WEB-005_A110_R22_T055_CAS_TEST_GATE.md

**Formal A110 R22 handoff:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A110/WEB-005_A110_R22_HANDOFF.md

**Immediate A00/A10:** register PR55 as **NEW** R22 test source candidate (not one of 21 historical), request independent A60 R22 review **on `c3a4ea00ba933cbab36b3582859cb3eff20f0204`**. A20 to decide schema revision and physical isolated PG16 safety; A90 to review Backup V3; A50 to execute only with written physical go and complete clean checkout; A00 to issue separately owned future CAS L1/L2 implementation GO. **Until then: source CAS not fixed, PR55 draft RED-design, QA pending.**

**A110 author signoff (not independent QA):** `A110_R22_L3_TEST_SOURCE_DELIVERED / PR55_DRAFT_NEW / EXACT_HEAD_PINNED / TEST_RUNTIME_NOT_EXECUTED / SCHEMA_BACKUP_GATE_OPEN / NO_MERGE / RELEASE_NO_GO / SWARM006_HOLD`.

## 6. R22 automatic CI outcome on PR55 — upstream gate, NOT CAS test execution

A new **automatic** GitHub Actions workflow [run 38646040840](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646040840) triggered for **PR55 exact HEAD `c3a4ea00ba933cbab36b3582859cb3eff20f0204`**. Run `completed / failure`; [job 116133014455](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646040840/job/116133014455) `correction-qa`.

Actual job steps: checkout/pnpm/Node/locked install/SE safety unit **success**; **Pack 19 snapshot consistency tests failed** on the known **old regex requiring `isolationLevel:"repeatable read",readOnly:true`** while release code uses **`accessMode:"read only"`**. Pack20–26 and static/database release gates were **skipped**. Workflow did **NOT** execute `stage-basket-cas.integration.test.ts`, so neither RED runtime result nor GREEN/PASS is evidenced for CAS. Existing separate **PR35** owns the Pack19 source matcher correction; do not duplicate it in PR55.

**Actions taken:** inspected workflow jobs and actual failing job log only; **no manual rerun**, no CI bypass, no merge. Classification `CI_UPSTREAM_PACK19_FAILURE / CAS_TEST_NOT_EXECUTED / RUNTIME_UNVERIFIED`. A60 R22 should review source/test code independently on PR55 exact HEAD and distinguish this automatic upstream failure from the fail-first contract itself.
