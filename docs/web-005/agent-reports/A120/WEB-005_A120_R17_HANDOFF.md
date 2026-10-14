# WEB-005 — A120 / WAVE R17 FINAL HANDOFF FOR A00

**Agent:** A120 — Presentation & Bracket Views  
**Task:** `WEB-005-T100-A120-R17`  
**Date:** 2026-10-14 Europe/Warsaw  
**Authority:** `docs/web-005/WEB-005_WAVE_R17_AGENT_PROMPTS.md` Git blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`, §§0–2 and AGENT A120.  
**Mode:** `SOURCE-ONLY`, R17 code slots assigned A90/PR41, A70/PR42, A100/PR53.  
**Status:** `TEST_ORACLE_READY / R16_ARTIFACTS_UNAVAILABLE / PR54_SOURCE_BLOCKED_UI_SCOPE / RUNTIME_NOT_EXECUTED / PATCH_HOLD / RELEASE_NO_GO`.

## 1. Reconciled R16 provenance: explicit missing original, no fabricated historic work

- R16's real A120 assignment was `WEB-005-T100-A120-R16` (mixed historical RR403+DE legal display), source-only/test-first design and **no code**. Original central R16 prompt Git blob `688e9c149dcf542587125d5f05a4a9683f3ac156`.
- This A120 conversation records R15 followed by R17; no original R16 work, test execution, report, commit or attachment is available here.
- At R17 readback GitHub `docs/web-005/agent-reports/A120/` contained historical R9–R15 documents, **no** R16 report or mixed-fixture artifact. Branch queries `a120` and `r16` yielded no dedicated branch. External inaccessible work cannot be categorically ruled out.
- **New honest retrospective evidence receipt, published during R17:** [`WEB-005_A120_R16_RECOVERY_STATUS.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R16_RECOVERY_STATUS.md). It is **NOT** a recreated original R16 handoff and is **NOT** R16 acceptance.
- **R16 factual disposition:** `R16_ARTIFACTS_UNAVAILABLE / NO_ORIGINAL_A120_EXECUTION_EVIDENCE / NOT_EXECUTED`. Missing source-only design was produced now as actual **R17** deliverable, not backdated.

## 2. Exact current GitHub SHA, PR, source and QA

| Target | Exact observed R17 state |
|---|---|
| Release base | `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` unchanged |
| **P21 / PR54** | https://github.com/C8LyNn/aplikacja-turnieje/pull/54 · **OPEN DRAFT / UNMERGED** · HEAD `dbba0eb82920b4f324866b1b983e1211459f52ec` · 5 commits / 2 changed files |
| PR54 modified code | `artifacts/tournament-manager/src/pages/tournament-detail.tsx`, blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d` |
| PR54 authored RTL | `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx`, blob `21eaad81248eb26c9430dfcd77ccb261ca11f191` |
| P14 / PR47 | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 · OPEN DRAFT · HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`; stage selected-state is inside `src/components/stage-progress-view.tsx`, blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6` |
| PR43 CSV | `96a6068f69027574ac76e18d4d5a2c444b5a914a` · OPEN DRAFT, also changes `tournament-detail.tsx` |
| PR50 Backup Preview | `5457a74187edc263730c3a4b25a663bdf5531ee9` · OPEN DRAFT, also changes `tournament-detail.tsx` |
| PR53 A100 auth cache | `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979` · OPEN DRAFT, own L3 |
| CI PR54 | Auto GitHub workflow `38606249912`, job `115997784820`: **FAILURE on upstream Pack19 step**, before target T100 RTL/typecheck/build |
| GitHub PR54 reviews | No posted GitHub review submission/thread on the PR itself at R17 check; signed A60 verdict **exists separately** in the actual A60 R15 report |

**Independent exact-SHA A60 source verdict:** [A60 R15 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) (Git blob `195f23368f3932889552f83a5981a90994a28cdf`); machine matrix `WEB-005_A60_R15_PACKAGE_MATRIX.json` (blob `2f3e3575da341cac87c1a54e8fee09ff41d8cecb`). For P21 PR54 HEAD: **`SOURCE_ACCEPTED_RR_REFRESH_ONLY; SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE`**. Not a full A60 approval, and not runtime acceptance.

**A50 evidence:** [A50 R15 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) (blob `86b89937c32a01cb62253019f3d3808890b47c24`) records **0 native application tests**, no full checkout/pnpm/isolated executor. No new exact-SHA native app PASS verified by A120 R17.

## 3. Actual scope defect and strict evidence taxonomy

**`SOURCE_CONFIRMED`:** `RoundRobinReadbackBridge` in PR54 enumerates **all** RR stage IDs (including historical), checks any cached stage-detail query error 401/403 via `rrStageIds.some(...)`, then returns a full replacement `role=alert` instead of its children, which wrap **all** `<Tabs>` in `TournamentDetail`. Thus an old RR detail 403 has a code path to suppress lawful Overview, selected DE and other tabs. This is an objectively source-backed conditional, not a demonstrated real-user 403 exploit.

**`STATIC_INFERRED`:** A tournament with history RR31 GET403 and currently lawful DE32/Overview GET200 may lose lawful tabs because of the global RR guard. Exact mixed case requires A50/independent A60 simulation or browser test before `RUNTIME_VERIFIED`.

**`SOURCE_CONFIRMED` second boundary:** `StageProgressView` (PR47) holds manually chosen `selectedStageId` **inside itself** and can still render `detailQuery.data` with a detail error. A page-only denial workaround based on `tournament.activeStageId` cannot cover manually selected historical RR stage; a complete safe fix likely requires an expressly authorized selected-stage-local guard in the PR47-owned child or an equally narrow, explicitly reviewed selection contract.

**`PATCH_PROPOSED`:** Existing PR54 RR N→N+1 canonical refresh is source accepted **narrowly** by A60, not modified in R17. A60 must review any future change as a new exact-SHA candidate.

**`RUNTIME_NOT_EXECUTED`:** A120 ran **no** React RTL, typecheck, build, browser, API integration or PG16 tests in R17; there are **no A120 test commands, environment runtime exits, test pass/fail counts or screenshots**. Authored test definitions/markdown do not equal test execution. Pack19 existing CI failure is **not** feature-test FAIL nor PASS.

## 4. The R17 deliverable and A50/A60 exact oracle

**Published report:** [`WEB-005_A120_R17_PR54_TEST_ORACLE.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R17_PR54_TEST_ORACLE.md). Detailed cases, response timeline, future patch boundary and rollback are there.

**P0 synthetic MIXED fixture:** tournament77 has historical RR31 completed with a prior authorized cache but now stage-detail `GET /stages/31` **403**; current DE32 GET200 and `GET /stages/32/double-elimination` GET200; Overview tournament/stats GET200. Tests assert:

1. **MIX-01/02:** current DE32 Bracket Upper/Lower/GF/Reset and Overview remain visible; RR31 cached ranks/players not visible; historical 403 does not blanket the Tabs.
2. **MIX-03:** selecting historical RR31 *through StageProgressView navigation* yields local RR error, no stale RR participants, other tabs still accessible.
3. **MIX-04/05:** explicit retry **only RR31**, authorized 200 recovers canonical RR data; repeated 401/403 never reveals old cached rows or launches a refetch storm.
4. **AUTH-06:** a genuinely denied **whole tournament**/revoked auth remains fail-closed under A100 policy — no A120-created bypass.
5. **REFRESH-07 / LATE-08 / NONRR-09:** external RR match revision N→N+1 invalidates canonical stage read and aggregate standings, old deferred N cannot override accepted N+1, DE-only updates do not invalidate RR or suppress lawful DE.
6. **ID-10 / ERR-11:** tournament ID isolation; 500/network failure not portrayed as fresh final rank.
7. **Browser BR-MIX-01..06:** isolated synthetic fixture + response-status/request traces/screenshots and stage switch; no live tournament/secret, no backend policy assertion.

**A50 executable commands proposed — not run by A120** from a verified isolated exact PR54 checkout with Node22/pnpm10, frozen dependencies:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Focused `artifacts/tournament-manager` package cwd: `TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx`. New MIXED cases are presently a **documented test-first oracle**, not committed .test.tsx source because R17 prohibits A120 code writes. If no A50-accessible real checkout/pnpm/browser fixture: `BLOCKED` with specific owner action, no fake PASS. Backend PG16 separate owner/preflight.

**A60 QA ownership:** approve/reject only on **new exact HEAD** after authorized change and real A50 evidence, check stage-selected guard, distinguish stage-local 403 from tournament-wide revocation, verify original accepted RR refresh and non-RR no-storm, and check privacy interaction with A100 PR53. A120 does not self-certify.

## 5. Smallest future fix, collision and slot restrictions

**Current STOP:** three exclusive R17 code lanes allocated **A90 PR41 L1**, **A70 PR42 L2**, **A100 PR53 L3**. **No code lane A120** and **no new PR54 commit** authorized. Do not duplicate revisions from those agents.

**Patch-ready future boundary:**
- In `tournament-detail.tsx` keep fingerprint invalidation observer mounted across tabs but remove the `if(any historical RR error) return alert replacing entire Tabs` branch. Do not turn this into hidden global purge.
- For a **complete privacy-preserving** selected-RR denial rule, the real selected stage is controlled by PR47's `stage-progress-view.tsx`. After independent A60 oracle acceptance and separate A00 exclusive file/hunk GO, move the deny/error/retry *rendering* to **selected RR stage only**, suppress cached detail payload on 401/403, retry selected stage only, keep StageNavigation usable. No change to DE graph, winnerId policy, ranking or other sport rules.
- If A00 grants ownership of **only** `tournament-detail.tsx`, that can address unrelated lawful tabs but **cannot be declared full fix** for RR manually selected inside StageProgressView; issue remains `SOURCE_BLOCKED_SELECTED_RR_CACHE_GUARD`.
- **Real file-level overlap:** PR54, PR43 CSV, PR50 Backup share `tournament-detail.tsx`; no verified same-hunk conflict or merge attempted. PR47 owns adjacent `stage-progress-view.tsx`; A100 PR53 controls global auth/cache and must remain a separate review lane. Integrator SWARM-006 handles actual composite only after later full WEB-005 closeout GO.

**Owner decision requested:** after the three existing R17 lanes free capacity, A00 may explicitly schedule a **new test-first narrow correction GO** against PR54 (and separately authorized StageProgressView if needed), with exclusive hunks, A60 accepted oracle, A50 runtime execution and privacy boundaries. Not in this R17. **RELEASE_NO_GO / SWARM006_HOLD**.

## 6. Actual R17 changes/publishing and final disposition

**GitHub changes in R17 by A120: docs only, on control branch** `chore/web-005/t000-wave1-control`:
- `docs/web-005/agent-reports/A120/WEB-005_A120_R16_RECOVERY_STATUS.md` — R17 retrospective unavailable original R16 evidence receipt.
- `docs/web-005/agent-reports/A120/WEB-005_A120_R17_PR54_TEST_ORACLE.md` — actual R17 new test oracle and future patch sketch.
- `docs/web-005/agent-reports/A120/WEB-005_A120_R17_HANDOFF.md` — this direct-to-A00 handoff.

No application source/test changed, no PR54/47 head changed, no merge/rebase, no SQL/PG, no paid CI rerun, no staging/live, no SWARM-006. No further work claimed asynchronously.

**Final A120 R17 verdict:** `R17_DOCS_PUBLISHED / R16_ARTIFACTS_UNAVAILABLE / PR54_SOURCE_BLOCKED_FULL / TEST_ORACLE_READY / PATCH_HOLD / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO`.
