# WEB-005 — A120 / R20 — PR54 frozen two-boundary QA oracle

**Agent:** A120 — Presentation & Bracket Views
**Task:** WEB-005-T100-A120-R20
**Date:** 2026-10-14 Europe/Warsaw
**Mode:** SOURCE ONLY — NO NEW CODE GO
**Authority:** central WEB-005_WAVE_R20_AGENT_PROMPTS.md, Git blob dabf0146a08ef8488400df9268b52210662cbb63, §§0–2, AGENT A120.
**Author disposition:** ORACLE_READY / PR54_FROZEN / A60_EXACT_SHA_NOT_VERIFIED / NATIVE_RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.

## 1. Verified immutable GitHub source pins

| Packet | Exact PR HEAD and state |
|---|---|
| Release base | release/tournament-ops-20261013-01 at 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7, unchanged |
| **P21 PR54** | https://github.com/C8LyNn/aplikacja-turnieje/pull/54 — OPEN DRAFT / UNMERGED, head **bfa9d075b431185aa8bbf87bf021d64dde8ae22f**, 11 commits beyond release, 4 files |
| **P14 PR47** | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 — OPEN DRAFT, head f09a13623faca8d7ab29b09a2c5b43907c2acd0b |
| PR43 CSV | OPEN DRAFT, head 96a6068f69027574ac76e18d4d5a2c444b5a914a |
| PR50 Backup | OPEN DRAFT, head 5457a74187edc263730c3a4b25a663bdf5531ee9 |
| PR53 security | OPEN DRAFT, head d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34; A100/A30/A60 owner |

**Exact PR54 source blobs, under artifacts/tournament-manager/src:**

- pages/tournament-detail.tsx: a3565b6638f9def4ee9aebb0126444c15a613338
- components/stage-progress-view.tsx: 2c50b5915572ec3721ad709ffd18ec58a597273f
- pages/tournament-detail.rr-readback.test.tsx: b5775b1305dabda8cdf6f5f482639be62c05b345
- components/stage-progress-view.rr-denied.test.tsx: eb282e0812c6daf9db8a2de04e5e9aca6308fe0b

**PR47 same-child code blob:** stage-progress-view.tsx at fd95b1fa4812e3af14a95c8146410dcb7aae4fa6. PR54 and PR47 independently descend from release; there is NO composite SHA and NO tested combined frontend.

**Independent evidence:** A60 R18 signed report, blob 656a8850a6358e5b4b2517220a5fc55f99dc014f, classified the OLD PR54 HEAD 9866e5d2e73c99e01c2934a38ca1c62455efd2ed as SOURCE_BLOCKED. That verdict cannot be applied to current bfa9d075 HEAD. At R20 preflight, PR54 has zero GitHub review submissions and zero inline review threads. A60 R19 exact-head report was not found in central A60 docs or available a60 branches. This is NOT proof that no other external report exists; source acceptance remains **NOT VERIFIED**.

## 2. Two-boundary source oracle for independent A60 review

**A. Parent availability / canonical refresh.**

In pages/tournament-detail.tsx, RoundRobinReadbackBridge compares the canonical RR stage/match snapshot (status, winner, current round, match revision/result). On changed prior RR fingerprint, it invalidates the exact generated stage-details key and tournament standings key, allowing refetch from server. It does not synthesize ranks or restart matches. After R19, the blanket historical RR401/403 cache guard no longer replaces all page Tabs. Existing outer readOk / AuthProvider stays intact. A historical RR31 detail denial alone must NOT hide legal DE32 or Overview. DE-only changes must not cause RR refetch storms; identical parent polls must not trigger invalidation.

**B. Selected-stage confidentiality.**

In components/stage-progress-view.tsx the manually selected stage ID is component-local state. For selected format round_robin only, when detailQuery.error carries HTTP status 401 or 403 (direct or response.status), selectedRrDenied is true and visibleDetails becomes undefined. All selected-stage participant/group/swiss/RR rendering paths AND derived stage winner use visibleDetails rather than retained detailQuery.data. StageNavigation stays mounted. Denied RR shows local role=alert with one selected detailQuery.refetch() manual action. The generic error panel is not duplicated for the denied RR; unrelated legal stage views should still work.

**Independent QA must falsify, not assume, this source result.** Prior successful cached data may remain in TanStack Query after 401/403. Test transitions from query error into refetching and back, including synchronous first-paint snapshots. A potential transient flash during this lifecycle is **UNVERIFIED**, not a known exploit. Full-tournament authorization revocation is A100/PR53-owned; do not read selected-stage availability as proof of global private cache clearance.

**C. Real test coverage limit.**

The existing R18 MIX401 and MIX403 tests inside tournament-detail.rr-readback.test.tsx render synthetic Overview and DE section children under RoundRobinReadbackBridge. They do **not** mount the complete real Organizer Tabs, real DE graph, or exercise whole-tournament auth. The R19 selected-stage child file supplies genuine StageNavigation and retained-cache fixtures but has no independently verified runtime execution or transient-frame proof. No test passing claim should be inferred from their existence.

## 3. Exact synthetic A50 and A60 acceptance matrix

Use test-only tournament 77, old RR stage31, current DE stage32, synthetic player701. The sentinels are RR_STALE_PRIVATE_RANK_701 from a previous authorized stage31 GET200, and RR_CANONICAL_AFTER_RETRY_701 from newly authorized GET200.

| ID / priority | Request and state ordering | Mandatory independent observable result |
|---|---|---|
| MIX-401 P0 | Stage31 has previously cached 200 private rank; subsequent GET stage31=401. Tournament77, Overview and DE32 GET200 | No full-tabs historical RR denial; Overview/DE navigation survives. No private old RR text in lawful views |
| MIX-403 P0 | Same case with historical stage31 GET403 | Identical lawful availability and old RR confidentiality |
| SELECT-401 / SELECT-403 P0 | Active selection DE32. Manually click History RR31 in StageNavigation. Selected GET401/403 with retained prior 200 data | RR-local alert; no old ranking table or private winner; DE32 remains navigable. Error does not become global |
| FIRST-PAINT P0 | Seed RR31 old cached data plus actual failed query status403. Select RR31 while a new refetch begins | Zero transient DOM exposure of old player/rank at every query status transition, not just after findByRole(alert) |
| RETRY-200 P0 | RR31 denied, click Spróbuj ponownie once, one selected stage31 GET200 returns new rank | Only canonical new sentinel displays after success; no old sentinel, no all-RR bulk retry, one selected read for that click |
| FULL-AUTH P0 | Separately revoke whole private tournament auth/session while DE32 appears selected | Entire unauthorized private view remains fail-closed under A100 contract; no cached participants, picks or ranking |
| RR-N+1 P1 | Other host increments RR match revision7→8, then reopens stage completed→active without match revision | Exact RR detail and standings invalidated/refetched; canonical backend rank/status used; not client-calculated |
| LATE-OLD P1 | Deferred older RR stage detail N resolves after successfully accepted N+1 | N cannot overwrite N+1; capture queryKey, abort/request ordering and final rendered stage identity |
| NO-STORM P1 | Historical RR31 cache retains 403; DE32 only updates; parent RR snapshot stays unchanged | No RR-driven refetch storm, lawful DE/Overview navigation still accessible |
| UNDO-409 P1 | Backend Revert/Undo returns 409 without canonical RR changes | No fabricated client stage reopen/final rank and no polling invalidation storm |
| IDENTITIES P1 | Switch 77→78 while 77 RR stage GET pending; navigate RR31→DE32→RR31 | No response from 77 leaks into 78 and no delayed old RR detail overwrites new selection |
| ERROR-500 P2 | Selected RR31 fails 500/network error, not auth denial | Explicit error handling, no freshly asserted server ranks; A60 evaluates stale-data policy without guessing owner decision |

**Existing authored test targets:**
- tournament-detail.rr-readback.test.tsx: F058-R13-01, -02, -04, -05, -06, and R18 MIX-401/403; old parent global-403 test replaced by child-owned guard.
- stage-progress-view.rr-denied.test.tsx: T100-R19-C01 for 401 and 403; T100-R19-C02 prior cached 403. Includes manual navigation and one selected retry.
- Future complete two-session/browser variant MUST show actual Organizer Tabs, actual response network chronology and DE graph only once separately authorized composition with PR47 is built. Current PR54 does NOT provide PR47 Upper/Lower/GF/Reset rendering.

## 4. Exact cross-PR integration collision contract (no merge in WEB-005)

**PR47 vs PR54 same child:** PR47 stage-progress-view.tsx adds the useGetDoubleEliminationStage canonical dedicated endpoint and read-only DoubleEliminationBracket showing Upper, Lower, Grand Final and Reset with stage mismatch/403/500 handling. PR54 same path instead adds selectedRrDenied and visibleDetails to the older release-based StageProgressView. These implementations are not yet combined. Future authorized integrator MUST preserve both the canonical DE graph (canManage=false, canReset=false, selected-stage ID isolation) and the local historical RR privacy guard/retry. Otherwise one PR can silently overwrite the other. A60 needs source + actual combined React/browser evidence on final composite SHA before release gate.

**PR43 + PR50 + PR54 same parent:** tournament-detail.tsx is modified independently for CSV import/FileReader, Backup preview and RR canonical readback. This is a confirmed file-level overlap, NOT proof of an unavoidable same-hunk merge conflict. Actual merge/hunk resolution and combined browser tests are SWARM-006 work only after final HQ approval. Never cherry-pick into WEB-005 just to test.

**PR53 / A100:** Separate legacy ownerless private game-picks A→B cache rebind and revocation; local RR error hiding is not global query cache sanitation. Backend PR45 terminal RR roster and PR42 Undo remain separately accepted under their own policies; no frontend override of legal sports rules.

## 5. Actual QA / CI evidence truth and A50 commands

**A120 R20:** source/metadata inspection only; native React RTL, typecheck, build, browser, API integration and PG16 are **NOT_EXECUTED**, no process exit/TAP counts. Authored tests and source reasoning are NOT executable PASS.

**A50 R19 receipt:** https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md (blob 412117e31c297353b35a3c21fbd616d41754d4b6), reports zero native application tests and missing trusted full checkout/pnpm10/frozen dependencies/isolated PG16. A00 owner action: grant A50 approved execution shell + full clean per-SHA workspace and Node22/pnpm10; separate isolated PG16 test and reset written GO needed for backend, not for mocked React.

**Existing GitHub Actions on PR54 HEAD:** https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38631912235, job 116085745327 completed FAILURE on upstream Pack19 old matcher, TAP 7 PASS / 1 FAIL, exit 1: expected readOnly:true versus actual Drizzle accessMode:"read only". Target T100 RTL/typecheck/build NOT reached; the failure is not feature-specific. PR35 owns CI matcher repair, unmerged. No paid/manual rerun by A120.

**A50 exact checkout commands from monorepo root (proposed only):**

    git rev-parse HEAD
    node --version
    pnpm --version
    pnpm install --frozen-lockfile
    pnpm --filter @workspace/tournament-manager test
    pnpm --filter @workspace/tournament-manager typecheck
    pnpm --filter @workspace/tournament-manager build

**Focused from artifacts/tournament-manager (POSIX):**

    TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx src/components/stage-progress-view.rr-denied.test.tsx

Capture exact git SHA, cwd, Node/pnpm, frozen install, exact command/exit, TAP PASS/FAIL/SKIP, fixture ID and redacted logs. If unavailable, ENV_BLOCKED plus one action for owner; no fake green.

## 6. Conditional minimal next patch and A00 final gate

R20 provides **NO NEW CODE GO**. If independent A60 on exact bfa9d075 SHA finds a reproducible fail (e.g. transient cached row flash between error and refetch, query stage identity leak, or incorrect retry), A00 must issue NEW written fix-specific GO naming the reproducible scenario, exact SHA and exclusive smallest file/test hunk. A120 must not code speculatively in R20 or self-sign source acceptance. Any policy wider than selected RR presentation belongs owner/HQ or A100.

WEB-005 remains IN_PROGRESS: no signed A60 exact R19 QA, A50 zero app tests, PR53 security pending, original WEB-004 38 cases (A10 R19 29 traceable IDs and 9 SOURCE_ID_NOT_AVAILABLE), numerous unsigned owner semantics (Basket CAS, Swiss/SE/DE, Backup B2, Direct Revert, Steam/session). A runtime-test-debt waiver can be requested separately by A00/HQ ONLY after independent source/policy/backlog closeout and NEVER grants deployment. SWARM-006 final-only transfer remains HOLD.

**STOP respected:** no PR54 code, new PR, merge/rebase/cherry-pick/composite, production SQL/PG resets, paid CI, staging/live, self-acceptance or SWARM-006.

**FINAL:** R20_QA_ORACLE_PUBLISHED / PR54_FROZEN / A60_EXACT_SHA_NOT_VERIFIED / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.
