# WEB-005 — A40 R15 HANDOFF / Implementation Lead A00

**AGENT:** A40 — CI Contract Recovery / Pack19 + Pack17  
**TASK:** WEB-005-T010-T017-A40-R15  
**MODE:** READ ONLY / SOURCE-ONLY TEST GUIDANCE  
**DATE:** 2026-10-14 (Europe/Warsaw)  
**R15 central document:** R15.1, blob e6950cbff7e521ed9b3ff774e7787e8d598a966d  
**STATUS:** REPORT_PUBLISHED / GUIDANCE_DELIVERED / RELEASE_NO_GO / SWARM-006_HOLD

## 1. Mandatory publication and scope

**Primary technical deliverable (direct GitHub URL):**  
[WEB-005_A40_R15_REPRODUCIBLE_TEST_COMMANDS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A40/WEB-005_A40_R15_REPRODUCIBLE_TEST_COMMANDS.md)

This handoff is the separate required R15 status report, stored under docs/web-005/agent-reports/A40 on the central documentation branch. Both are **documentation only**. No application code, tests, runners, workflow, branch composition, PR content, release or production system was modified by A40.

## 2. Verified refs and reviewed paths

**BASE:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.

| PR / packet | Verified HEAD | State | Reviewed source paths |
|---|---|---|---|
| #35 / P01 | 7cb283aa82273a1e22daf9051a82311eef53760c | OPEN DRAFT, unmerged | qa/pack19/source-contract.test.mjs |
| #36 / P02 | 85ad0b86136fc3491c9ef18663d9b01396179349 | OPEN DRAFT, unmerged | qa/pack20,21,25,26 source contracts (prior reviewed patch), CI dependency |
| #40 / P07 | 9a8287271299a59fc9291b8d253299a8d109a35d | OPEN DRAFT, unmerged | qa/pack17/gate-contract.mjs; gate-contract.test.mjs; run-gates.mjs |
| #43 / P10 | 96a6068f69027574ac76e18d4d5a2c444b5a914a | OPEN DRAFT, unmerged | src/hooks/use-tournament-csv-file-reader.test.tsx |
| #47 / P14 | f09a13623faca8d7ab29b09a2c5b43907c2acd0b | OPEN DRAFT, unmerged | src/components/stage-progress-view.test.tsx; src/pages/public-stage-views.test.tsx; tournament-audience.test.tsx |
| #50 / P17 | 5457a74187edc263730c3a4b25a663bdf5531ee9 | OPEN DRAFT, unmerged | src/components/backup-restore-dialog.test.tsx; src/hooks/use-scoped-backup-preview.test.tsx |
| #52 / R13 | cce73ec47445102b216b3f8eceb4ec9de67eb1a7 | OPEN DRAFT, unmerged | src/components/tournament-stages-panel.test.tsx |
| #53 / R13 | 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979 | OPEN DRAFT, unmerged | src/lib/tournament-auth-query-cache.test.tsx |
| #54 / R13 | dbba0eb82920b4f324866b1b983e1211459f52ec | OPEN DRAFT, unmerged | src/pages/tournament-detail.rr-readback.test.tsx |

All relative frontend paths above are under artifacts/tournament-manager. Additional reviewed files: artifacts/tournament-manager/{package.json,test/run-tests.mjs,test/setup-dom.mjs,test/tsconfig.json,scripts/stage-animated-effects.mjs}; artifacts/api-server/package.json; package.json; pnpm-workspace.yaml; .github/workflows/tournament-correction-ci.yml; tournament-se-correction-readiness.ts; the PR40 helper and runner.

**Source blobs:** release Pack19 matcher 8d5e8466cbc651a510acf3c072fac4d6821b56b5; corrected PR35 matcher 5726986dca6a6fd7309bb883eb1106d2d19fb14e; unchanged real read-only backend route bcd4413c1df18aef8bcc3399a9272fd3e6332757. PR40 three blobs: eae350a60a684d7b14af3e481baf7bd6c4a2b2fc / f59a65509009fbdf74a38239693238704b1af583 / 8779ab2c1588cc62a2f3c5f63c57be9b55e86043.

## 3. Actual test runs, precise provenance

**A40 R15 new application test commands:** NOT_EXECUTED.  
**A40 R15 database tests:** NOT_EXECUTED / physical isolated PG16 authorization absent.  
**A40 R15 paid CI:** NOT_EXECUTED, no manual reruns requested.  
**A40 R15 code changes / PR merges:** NONE.

**Historical R14 A40 local tests at unchanged PR40 SHA:** Node v22.16.0, node --test --test-reporter=tap qa/pack17/gate-contract.test.mjs = 24/24 PASS, exit 0 (author's contract tests only; not a real full app test). This is cited as historical evidence and was NOT re-run as part of this R15 task.

**Existing GitHub Actions on exact feature PR SHAs:** PR43 run 38590842415; PR47 run 38596198607; PR50 run 38600542147; PR52 run 38605694664; PR53 run 38606179795; PR54 run 38606249912. All completed FAILURE at **Pack19 snapshot consistency tests** with old release matcher readOnly:true, earlier Pack19 domain tests completed, and Pack17 plus other later gates SKIPPED. In logs examined for #43 and #53, test reports **not ok 1** and outdated matcher. This is **OLD_BASELINE_PACK19_FAIL**, NOT feature-specific FAIL and NOT real frontend RTL execution.

PR35 run [38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) delivered scoped Pack19 8/8 PASS but Pack20 6/7 FAIL, overall FAILURE. P01 fixes one contract; P02 remains a separate unmerged candidate. For PR40 no PR-head Actions run was found at inspection. No formal GitHub review submissions were found on PR35/36/40; this does NOT exclude separate A60 reports. Signed exact-SHA A60 source acceptance **not verified by this agent**.

## 4. Source and gate contract evidence

**SOURCE_CONFIRMED:** frontend test runner discovers all src/*.test.ts[x] and spawns Node with --import tsx, --import ./test/setup-dom.mjs, --test; package-root cwd and TSX_TSCONFIG_PATH to test/tsconfig.json. JSDOM bootstrap exists. Independent direct per-SHA targeted commands in the technical deliverable execute this real runner stack without earlier CI Pack19 blockage. Correct package filter: @workspace/tournament-manager. Optional breadth gates: typecheck, full test and build.

**SOURCE_CONFIRMED:** frontend build stages Animated Effects via pnpm/npm_execpath before Vite. Run through pnpm run build; do not strip it to claim green. Separately needed eventual codegen/browser checks are not silently included.

**SOURCE_CONFIRMED:** Pack17 --full from PR40 requires nine sequential gates (source, helper, isolated PG16 atomic correction, workspace typecheck, API unit with 3 TAP summaries, API integration, frontend tests, API build, frontend build). --static exit 0 explicitly means STATIC ONLY / RELEASE STOP. Standalone Pack19–26 contracts run earlier in GitHub workflow, not inside --full. Full composite testing belongs only to eventual SWARM-006 after formal owner authorization and final WEB-005 closeout.

**KNOWN OPEN SOURCE ISSUE, NOT NEW:** T017-QA-01 TAP parser accepts adversarial counter-only stdout or a not ok line plus forged PASS counters. Prior R10–R14 synthetic repro exists; no demonstrated false-PASS from an actual Node test subprocess. Needs independent A60 finding/disposition. No new unrelated Pack19/17 source regression confirmed during this R15 review.

## 5. A50/A60 actions and failure policy

**A50:** use exact per-SHA commands in the linked guide; confirm fresh disposable checkout, exact HEAD, Node22, pnpm10, frozen install, preloader/tsx/tsconfig, then test. Record command, environment (without secrets), exit code, actual TAP summaries, precise log URL/checksum. Explicitly distinguish NOT_EXECUTED vs FAIL vs RUNTIME_VERIFIED. Never use generic native workflow FAIL as the verdict on feature tests it skipped.

**A60:** independently review source and A50 receipts on same exact HEAD; disposition T017-QA-01 and independently confirm whether any new CI-contract regression needs A00 GO. On #53 also examine known auth-cache missing-key/fixture risks, owned by A100/A30/A60 — not reassigned to A40. Do not let author test definitions count as signed release acceptance.

**PG16 STOP:** disposable and physically isolated PostgreSQL16, authorized test-only TEST_DATABASE_URL, schema tm_test_*, explicit limited DROP_TM_TEST_SCHEMA reset and A20/A50 preflight + owner signoff required. Never use production/shared environment or print credentials. No PG work by A40.

**File conflicts / dependencies:** P01 #35 → P02 #36 → P07 #40 are separate prerequisites for **future** composite CI. Backend routes, Backup V3, and frontend tournament-detail cross-PR conflicts are owned by A00/integrator, not A40. A40 created no branch and made no integration edits.

## 6. GO/STOP, release status, exact next action

**GO:** A50 isolated per-PR frontend test execution with real exit evidence; A60 independent exact-SHA review; A00 evaluate those receipts and signed blockers.  
**STOP:** new P01/P07 implementation, A40 runner rewrite, source contract downgrade, paid CI rerun, merge/cherry-pick, composite branch, deployment/staging/live, production DB, SWARM-006 dispatch.

**P01:** SOURCE_READY / SCOPED_PACK19_CI_PASS / FULL_CI_NOT_PASSED.  
**P07:** SOURCE_READY / AUTHOR_UNIT_CONTRACT_PASS_HISTORIC / PG_FULL_NOT_EXECUTED / A60_ACCEPTANCE_NOT_VERIFIED.  
**WEB-005:** IN_PROGRESS / RELEASE_NO_GO / SWARM-006 HOLD.

**Next owner:** A50 supplies first actual exact-SHA targeted React test log; A60 independently signs/rejects same-SHA source+runtime evidence; A00 controls any future defect-specific GO and final project handoff. No promise of background execution.
