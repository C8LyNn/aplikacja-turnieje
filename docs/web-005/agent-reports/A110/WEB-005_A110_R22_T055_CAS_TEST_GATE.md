# WEB-005 — A110 R22 L3 / T055 CAS fail-first acceptance and schema gate

**Task:** `WEB-005-T055-T110-A110-R22` · **Role:** A110 Basket Concurrency & Frontend State  
**Wave:** R22.1, 2026-10-15 Europe/Warsaw  
**Mode:** `L3 TEST-FIRST ONLY`, new tests/typed API acceptance contract, not production endpoint or DB implementation.  
**New source candidate:** [DRAFT PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55), branch `WEB-005-T055-CAS-R22-TEST_CONTRACT`, exact HEAD `c3a4ea00ba933cbab36b3582859cb3eff20f0204`, base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Changed app-source/test paths:** **one NEW test file only**: `artifacts/api-server/test/stage-basket-cas.integration.test.ts`, verified Git blob `f95f032f4146f33ccbba813a3d08b34dfb9bb929`; 316 additions, 0 deletions. **No production `.ts` service/router edits, no migration/DDL, no generated DTO changes, no UI code.**

**Owner-approved source:** [WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md](../../WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), blob `36a14ef3be7852c202cc003264bf17e67da2f022` (D1=B, D2=B, D3=B, D4=A, D5=B, D6=B). This supersedes R21 unsigned snapshot; **product approval is not implementation or test approval**.  
**Central R22 authorization:** [WEB-005_WAVE_R22_AGENT_PROMPTS.md](../../WEB-005_WAVE_R22_AGENT_PROMPTS.md), blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`, A110 is solely **L3**.

## 1. Exact contractual API/DB oracles in the new PR

| Test ID | Fail-first API / DB acceptance assertion |
|---|---|
| **CAS-01** | Two GETs for unchanged authorized tournament return the same **strong** ETag coherently bound to the graph; a different tournament receives a different token (no tenant mix). |
| **CAS-02** | A full-graph PUT without `If-Match` returns **428**, zero basket/route/participant/stage/authority-mode mutations. Existing legacy last-write-wins must be denied after cutover. |
| **CAS-03** | Malformed token returns fail-closed **400/422**, zero mutation; exact malformed 4xx not fixed by owner and can be finalized by A00/API review. |
| **CAS-04** | Matching current token commits authorized valid graph atomically; a follow-up GET returns changed token and exactly the saved graph. |
| **CAS-05** | Sequential stale V0 token returns **412** with `STAGE_BASKET_CONFIGURATION_STALE` and no modification of committed winner. |
| **CAS-06** | Two same-V0 HTTP PUTs concurrently result in exactly one 200 and one 412, winner graph intact, token advanced. |
| **CAS-07** | Foreign tournament's valid ETag cannot authorize target tournament write; target DB rows unchanged. |
| **CAS-08** | Relevant stage-version mutation after GET invalidates stale editor even though proposed basket payload is unchanged; 412, zero additional mutation. |
| **CAS-09** | Participant-roster mutation after GET invalidates stale basket editor; 412, zero additional mutation. |
| **CAS-10** | Unauthorized full-graph PUT cannot bypass actor check by supplying valid ETag; 401/403, zero modification. |

**Test architecture:** follows existing `stage-baskets.integration.test.ts` Node `test`+Supertest, approved `test-database.ts` `getSafeTestDatabaseConfig`/reset/cleanup, unique synthetic organizers/tournaments, and comparable valid explicit 4-player Swiss→SE basket graphs. DB snapshots include tournament authority mode, stage revisions, basket definitions, assignments and routes. Cases do **not** run in a browser or replace L2 frontend UX acceptance. No hardcoded auth secrets from actual users.

**Important:** These tests intentionally assert a **future** contract against a baseline that *does not have basket CAS*. They are **fail-first authored RED candidates**, **NOT_EXECUTED** in R22 by A110, *not* failed runtime measurements. Even source/compilation correctness is **pending real typecheck and A60 review**. Do not label as `RUNTIME_VERIFIED`, `10/10 PASS`, or source-accepted.

## 2. Physical PG16 safety gate and exact real commands

**STOP until A00 + A20 + owner/HQ have specifically approved** a physically isolated disposable nonproduction PostgreSQL16 instance, least privilege/test-only user, exact test-reset scope and trusted full clean checkout with Node22/pnpm10 frozen dependencies. The test harness resets/drops its dedicated schema as other approved `.integration.test.ts` files do. `DATABASE_URL` is **never** a permission to run.

In a clean checked-out PR #55 exact HEAD:

```bash
git rev-parse HEAD  # must be c3a4ea00ba933cbab36b3582859cb3eff20f0204
node --version
pnpm --version
pnpm --filter @workspace/api-server run typecheck
# ONLY after explicit signed disposal/reset approval and TEST_DATABASE_URL
export TEST_DATABASE_URL='postgresql://<test-only-role>:<secret>@<isolated-PG16-host>/<dedicated-test-db>'
export TEST_DATABASE_SCHEMA=tm_test_t055_r22
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
(cd artifacts/api-server && node --import tsx --test --test-concurrency=1 ./test/stage-basket-cas.integration.test.ts)
```

The placeholder URL above is **illustrative**, not a usable credential or invitation to fill production values. TEST DB identity, host classification, schema, owner reset approval, command/exit/TAP/skip and sanitized logs must be attached by **A50** and independently assessed by **A60**. If authorization or connected checkout is missing, keep `ENV_BLOCKED / NOT_EXECUTED`, no manual paid CI to compensate.

**Current source release:** [GET/PUT](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) forwards only baskets/routes; [stage-basket service](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L381) holds locks but has no client expected revision; [DB schema](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/db/src/schema/tournaments.ts) has `basketFlowAuthorityVersion` **mode** and stage `version`, **no approved persisted basketConfigRevision**. Missing client CAS = `SOURCE_CONFIRMED`, stale-editor lost-update = `STATIC_INFERRED` pending dedicated PG16 test.

## 3. Missing necessary acceptance coverage / A20/A90/typed DTO gates

**A20 DB revision and migration evidence, NOT R22 code authorized:**
- Choose exact schema column name and integer type; persisted monotonic behavior, atomic increment under tournament lock, compatibility with basketFlowAuthorityVersion and stage version, trigger/writer inventory including stage/roster external writes and ABA.
- Assess migration conflict and `0030/0031` ledger collision against existing independent PR38 migration source; do not apply DDL/SQL on shared/prod or any DB in R22.
- Ensure initial legacy implicit graph GET emits coherent revision ETag without mutating; stage/roster divergence must either make token stale or compare a stored editor context atomically with locks. **A single basket revision scalar alone does not automatically detect direct stage/roster changes**, so D5=B needs a justified mechanism.
- Once actual reviewed schema design is authorized, add a direct test for **persisted monotonic revision, rollback and replay/ABA** (no direct column assertion in PR55 because owner permits equivalent schema naming and A20 has not signed it).

**A90 Backup V3 integration, NOT R22 code authorized:** legal historical V2/V3 import/restore must preserve or intentionally rebase CAS revision according to owner-approved B2–B6. No silent adoption of current source `resultHistory.revision` or `matches.revision` as basketConfigRevision. New strict validator PR for A90 is separate. Post-restore coherent token and no old-token reuse need future A90/A20 dedicated fixtures and rollback.

**Typed API/OpenAPI/React L2, NOT R22 code authorized:** future A00 exact-file GO to add server ETag/If-Match headers and stable typed errors to API-Zod/OpenAPI/generated client, plus `StageBasketsPanel` implementation of D6=B — never discard local losing draft on 412, manual reload and user opt-in reconcile, no automatic stale-token retry, scope to proper tournament/private role, clear on logout/downgrade and preserve valid B edits. UI `UX044` Host dirty navigation remains separately owner-specified, not implemented by this PR. Required mounted RTL: stale A HTTP/route 0 unauthorized PUT into B, valid B, 412 preserves A draft and requires opt-in, legacy update banner.

**Existing integration test debt:** pre-CAS `stage-baskets.integration.test.ts`, `basket-participant-flow.integration.test.ts` and related source tests legitimately issue unconditional PUT and will fail after mandatory `If-Match` backend cutover. Their owners must update fixtures to GET matching fresh ETag first **with separate exact-file authorization**, not patch them under L3 in R22. No attempt to hide failures.

## 4. Independent QA / collision / formal handoff

**A60 prior independent R21** [report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`, covers older 21 unchanged source candidates and `HANDOFF_NOT_READY`, **does NOT independently certify new PR55**. Request **A60 R22 new exact-head independent source review** and record `QA_PENDING` until receipt. A50 latest R21 report [here](../A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md), blob `265e9acba87884dda43479c3a5baaee4d52aeb2b`, APP TESTS=0. PR55 has no full runtime test command exit/TAP.

**Existing other candidates unchanged at R22 inspection:** #43 `96a6068f69027574ac76e18d4d5a2c444b5a914a`, #50 `5457a74187edc263730c3a4b25a663bdf5531ee9`, #52 `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` A60 `SOURCE_ACCEPTED_CONDITIONAL`; #53 `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` A60 `SOURCE_ACCEPTED_SCOPED`, #54 `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` A60 `SOURCE_ACCEPTED_CONDITIONAL`. PR43/50/54 share `tournament-detail.tsx`; PR47/54 `stage-progress-view.tsx`. **PR55 tests touch no production/overlapping source.**

**New independent PR #55** is marked `R22_NEW_SOURCE_CANDIDATE` in its body; A10/A00 should register it as a new source-test candidate, never treat it as one of the historical 21 or as delivered production CAS. **Release still `1fdc401d...` unchanged, no merge/composite, no stage/live.**

**WEB004 R2:** original 38 cases (29 secondary IDs/9 unrecovered originals) and per-case signed dispositions remain independently outstanding. **EXEC-B** owner preference is NOT formal `FINAL_HANDOFF_GO`; transfer of unfinished test debt only after independent source/policy/history closeout, with full composite tests a hard SWARM-006 release STOP.

**A110 R22 conclusion:** `NEW_TEST_SOURCE_PR55_PUBLISHED / IMPLEMENTATION_NOT_STARTED / API/DB/FRONTEND_CAS_PENDING / QA_A60_NEW_SHA_PENDING / PG16_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`. Formal [R22 handoff](./WEB-005_A110_R22_HANDOFF.md) provides exact PR, tested commands or NOT_EXECUTED and owner dependencies.
