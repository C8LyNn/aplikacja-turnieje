# WEB-005 — A40 R20 FINAL HANDOFF to 00

**Agent/task:** A40 CI Pack19/Pack17 · WEB-005-T010-T017-A40-R20  
**Authority:** R20 central instructions blob `dabf0146a08ef8488400df9268b52210662cbb63` · **Mode:** SOURCE ONLY  
**Repo:** C8LyNn/aplikacja-turnieje · **Date:** 2026-10-14 Europe/Warsaw  
**Final:** `SOURCE_WORK_COMPLETE / RUNTIME_NOT_EXECUTED / LAST_SIGNED_A60_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`

## Published deliverable

**[WEB-005_A40_R20_CI_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R20_CI_GATE.md)** includes exact underlying source Git blobs, GitHub Actions job evidence, PR53/54 frontend tests, PR41/42 isolated PG16 commands, nine Pack17 gates, and a separately qualified TAP parser issue. This file is the required R20 `WEB-005_A40_R20_HANDOFF.md`. Both documents are published to central **documentation** branch only. A40 did not modify any code or PR branch.

## Verified exact refs and paths

**Release base** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

| Packet PR | HEAD read from GitHub | Exact A40-reviewed paths / acceptance limit |
|---|---|---|
| P01 #35 | `7cb283aa82273a1e22daf9051a82311eef53760c` | `qa/pack19/source-contract.test.mjs`; existing corrected matcher, no duplicate |
| P02 #36 | `85ad0b86136fc3491c9ef18663d9b01396179349` | Pack20/21/25/26 source contracts, no duplicate |
| P07 #40 | `9a8287271299a59fc9291b8d253299a8d109a35d` | `qa/pack17/gate-contract.mjs`, `gate-contract.test.mjs`, `run-gates.mjs`; source scoped, --full absent |
| P08 #41 | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | `test/stage-basket-route-execution.integration.test.ts` under api-server; PG16 not run |
| P09 #42 | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | `test/revert-match.integration.test.ts` under api-server; PG16 not run |
| P20 #53 | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | `src/lib/tournament-auth-query-cache.test.tsx`, `src/hooks/use-tournament-auth.test.tsx`; exact-SHA A60 verdict needed |
| P21 #54 | `bfa9d075b431185aa8bbf87bf021d64dde8ae22f` | `src/pages/tournament-detail.rr-readback.test.tsx`, `src/components/stage-progress-view.rr-denied.test.tsx`; exact-SHA A60 verdict needed |

All above are OPEN, DRAFT, UNMERGED on the same base at readback. PR53/54 include R19 modifications and were **not** independently source-accepted at their new SHA in the signed R18 QA. Verify HEAD anew on each A50 run.

## Actual evidence and honest runtime classification

- [GitHub PR35 run 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899): actual Pack19 source **8/8 PASS**, subsequent Pack20 **6/7 FAIL**, overall workflow FAILURE.
- [PR53 exact R19 head run 38631806899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631806899), [PR54 run 38631912235](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235): **actual** upstream baseline Pack19 source **7/8 FAIL** after 23/23 safety and 26/26 Pack19 domain PASS; Pack20–26 and Pack17 **SKIPPED**. Obsolete `readOnly:true` matcher versus actual `accessMode:"read only"`; feature RTL NOT EXECUTED by those workflows.
- **A40 R20 executed real React/API/PG16 tests:** `NOT_EXECUTED`. There is no new A40 test command exit code, native TAP transcript or backend PG fixture claim. **A50 R19 published `ENV_BLOCKED` / 0 native app tests**, due to no complete trusted full checkout/pnpm10/isolated PG16.
- **Independent A60:** [R18 original source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) signed narrow P01/P02/P07 but formal R18 final gate **HANDOFF_NOT_READY**. A60 R19 source-verdict report was not located in bounded control-branch, branch-name and relevant PR-comment checks; this is **NOT_VERIFIED**, not a claim of nonexistence. Author-written R19 PR53/54 tests cannot replace A60 signoff.
- **T017-QA-01** is source-observed TAP counter-vs-test-record integrity risk at unchanged PR40 helper; older pure synthetic probes exposed fabricated-count acceptance. Real child nonzero exit remains blocked. **A60 separate finding/severity was not verified; NOT classified as independently confirmed blocker and no code GO**.

## A50 exact first executable tests, separate clean checkout per PR

**Precondition:** trusted owner-approved full per-SHA repo, Node22/pnpm10 installed, `pnpm install --frozen-lockfile`, `git rev-parse HEAD` equals target SHA, absolute `TSX_TSCONFIG_PATH` pointing to `artifacts/tournament-manager/test/tsconfig.json`. Native repo test runner uses `node --import tsx --import ./test/setup-dom.mjs --test` from frontend package cwd.

~~~powershell
# PR54 HEAD bfa9d075b431185aa8bbf87bf021d64dde8ae22f
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/pages/tournament-detail.rr-readback.test.tsx src/components/stage-progress-view.rr-denied.test.tsx

# PR53, OTHER checkout, HEAD d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test --test-reporter=tap src/lib/tournament-auth-query-cache.test.tsx src/hooks/use-tournament-auth.test.tsx
~~~

Capture each native exit, TAP tests/pass/fail/skipped/todo, sanitized logs and independent A60 review. Then run frontend typecheck, full test and build (Animated Effects) separately on same SHA.

**Backend physical safety:** Only with A20/owner approved **isolated disposable PG16 test database**, verified actual target identity and written `tm_test_*` schema reset/DROP scope, secret-safe `TEST_DATABASE_URL`, `NODE_ENV=test`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`. No shared or production fallback. On **separate** PR41 and PR42 exact checkouts:

~~~powershell
# PR41 isolated PG16 test:
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/stage-basket-route-execution.integration.test.ts
# PR42 isolated PG16 test:
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 --test-reporter=tap test/revert-match.integration.test.ts
~~~

## Release gates / owner disposition / STOP

Pack17 `--full` requires nine ordered source/atomic PG/typecheck/API/frontend/build checks, API unit exactly 3 TAP summaries; `--static` = **RELEASE STOP**. Separate Pack19–26, codegen, browser and future composite integration all required. `--full` was **NOT_EXECUTED**.

A10 R19 verified only 29 original WEB-004 IDs out of 38; **9 SOURCE_ID_NOT_AVAILABLE**, owner-signed 38 per-row dispositions still absent. Outstanding product policies include Basket CAS, sporting Swiss/SE/DE, Backup B2, Direct Revert/Host, Steam/session and historical orphan cache. A60 newest PR53/54 source/privacy exact-SHA verdict and formal closing gate must precede any owner/HQ final handoff decision. Owner may discuss `HANDOFF_WITH_RUNTIME_TEST_DEBT` **only after** source/38-case/policy closure and by explicit signature; it is not an implicit runtime PASS or deployment authorization.

**One concrete owner action:** connect A50 to an approved full checked-out per-PR execution PC/VM with Node22/pnpm10/frozen install and written test GO; separately A20/owner certify dedicated isolated PG16 and reset before API tests. A60 then verifies actual native receipts, PR53 privacy, PR54 two-boundary history/selected-stage UI, T017 severity.

**HARD STOP:** no A40 code edits/new PR, paid Actions reruns, merge/rebase/cherry-pick, shared/prod SQL, staging/live, automatic SWARM-006. FINAL-ONLY transfer requires independent closeout and separate explicit user/HQ GO.

**A40 final:** `SOURCE_ONLY_COMPLETE / ARTIFACTS_PUBLISHED / A50_RUNTIME_ENV_BLOCKED / A60_R19_NOT_VERIFIED / T017_A60_CLASSIFICATION_PENDING / WEB005_HANDOFF_NOT_READY / SWARM006_HOLD`.
