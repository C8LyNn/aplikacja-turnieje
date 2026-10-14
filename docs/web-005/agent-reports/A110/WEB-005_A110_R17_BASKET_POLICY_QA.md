# WEB-005 / A110 / R17 — BASKET CAS POLICY & FRONTEND QA

**Wave:** R17.1 · 2026-10-14 Europe/Warsaw  
**Agent / task:** A110 Basket Concurrency & Frontend State / `WEB-005-T055-T110-A110-R17`  
**Authorization:** `SOURCE-ONLY`; **NO CODE**, no API/product semantics changes, no new PR, merge, staging, SQL, paid CI, SWARM-006.  
**Release base:** `release/tournament-ops-20261013-01` SHA `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; `main` SHA `c50cc48e6fa508592bda3f4838111e9cff5af80c`.  
**R17 directive:** [central R17 prompts](../../WEB-005_WAVE_R17_AGENT_PROMPTS.md), blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`.  
**Result:** `SOURCE_REVALIDATED / R16_ARTIFACTS_UNAVAILABLE / T055_POLICY_OPEN / A60_SOURCE_ACCEPTED_CONDITIONAL_P10_P17_P19 / RUNTIME_NOT_VERIFIED / RELEASE_NO_GO / SWARM006_HOLD`.

## 0. R16 provenance — do not fabricate

The original [A110 R16 assignment](../../WEB-005_WAVE_R16_AGENT_PROMPTS.md) gave SOURCE-ONLY instructions, expected `WEB-005_A110_R16_BASKET_POLICY_GATE.md`. **No original A110 R16 work/report/file could be confirmed** from the current A110 conversation, its GitHub agent-reports folder, or matching branch search. Existing A110 report/owner packet are R15, not R16. A standalone **R17-created**, non-retroactive [R16 recovery status](./WEB-005_A110_R16_RECOVERY_STATUS.md) has been published as `R16_ARTIFACTS_UNAVAILABLE`. This is not a claim that no unsent work could exist. **A00 must not count A110 R16 as delivered.**

## 1. T055 / UX047 — six signable OWNER/HQ decisions: still unsigned

**Source evidence:** On the release [GET/PUT stage-baskets route lines 778–813](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L813), full graph PUT accepts `baskets` and `routes` without the editor's expected revision/token. Locking serializes operations, but absent a comparison against the editor's V0 means a stale second full replacement is not atomically rejected. **SOURCE_CONFIRMED missing precondition**; real concurrent users/PG16 race **NOT_EXECUTED**, not a proved production incident. `basketFlowAuthorityVersion` is legacy-vs-explicit authority **mode**, NOT a monotonic version.

**Direct owner request to A00/HQ:** sign **each** choice below before any implementation work, including the choice of 409 vs 412. Do not infer defaults from common REST conventions.

| Decision | Alternative A | Alternative B | Owner sign |
|---|---|---|---|
| **D1 — authoritative revision** | Atomic GET graph + ordered `stageId/version` vector; require verified full writer coverage, stage-set identity and ABA handling; no DDL only if proven sufficient | New persisted `basketConfigRevision` monotonic scalar; DDL/migration review via A20/A90 and Backup compatibility | ___ |
| **D2 — transport** | JSON `expectedStageVersions` / `expectedRevision` body | Server-issued opaque ETag with HTTP `If-Match` | ___ |
| **D3 — conflict** | **409 Conflict** + stable `STAGE_BASKET_CONFIGURATION_STALE` | **412 Precondition Failed** + same stable domain code | ___ |
| **D4 — absent token / legacy client** | **428 Precondition Required** + guided upgrade | Owner-chosen alternative fail-closed 4xx with upgrade; **never accept silently** | ___ |
| **D5 — other writers** | Any changed stage identity/set, version or basket-relevant roster invalidates draft | Basket-only revision plus separately validated stage/roster transitions and all writer inventory | ___ |
| **D6 — loser UI** | Preserve local draft, show server-vs-local diff and explicit rebase/discard | Preserve local draft, require explicit reload/reconcile/opt-in retry | ___ |

**Hard invariants for any signed selection:** (a) GET returns a **coherent** complete graph and matching CAS token; never pair stale graph with token fetched later from a separate stage GET; (b) under transaction/lock, reauthorize organizer and compare the original client precondition **before any mutation**; (c) if editors A/B both load V0 and race, **exactly one 200** and one selected 409/412 with loser **zero DB writes**, preserved winner graph; (d) no implicit overwrite/force-retry and loser keeps draft; (e) missing token fails closed with explicit legacy migration guidance; (f) test stage set, roster changes, ABA, first legacy save, rollback/partial writes, unauthorized actor, plus valid single-author positive flow.

**Signable record (currently all UNAPPROVED):**

```text
D1=___ D2=___ D3=___ D4=___ D5=___ D6=___
OWNER=___ APPROVED_AT=___
A00_POLICY_GO=___ A20/A90/A100_REVIEW=___
T055_PATCH_TASK_ID=___ T055_EXCLUSIVE_FILE_LANE=___ BASE_SHA=___
```

**Narrowest future request, NOT a current GO:** `T055-CAS-L1` after signatures + an explicit future A00 task, exclusive backend owner and **test-first** locked-precondition contract (graph/token coherence, missing/stale errors and physically isolated PG16 two-writer/zero-write tests); coordinate generated API/client token and preserve-the-loser-draft UI contract before any complete release claim. If D1 requires new persistence, A20/A90 migration and Backup semantics must be approved first. No T055 source edits or PR in R17.

**Existing unsigned policy reference:** [R15 A110 T055 D1–D6](./WEB-005_A110_R15_BASKET_OWNER_DECISION_AND_QA.md), [R14 owner 1-page](../../WEB-005_A110_R14_T055_OWNER_DECISION_1P.md). A00/HQ signature **NOT FOUND** in reviewed R17 control / decisions / A110 status. Keep `POLICY_OPEN`.

## 2. GitHub recheck: PR43, PR50, PR52 and independent A60 verdicts

All PRs below use base SHA `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; rechecked via GitHub PR metadata, exact changed paths and `compare_commits`. They remain **OPEN DRAFT, unmerged**, ahead of release (no backports).

| Packet | PR / exact HEAD | Files / compare | A60 independent *source-only* result | Runtime |
|---|---|---|---|---|
| **P10** CSV / [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43), `96a6068f69027574ac76e18d4d5a2c444b5a914a` | 3 files, ahead 3 / behind 0 | **SOURCE_ACCEPTED_CONDITIONAL** on exact SHA | **NOT VERIFIED**; 5 authored RTL cases |
| **P17** Backup / [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50), `5457a74187edc263730c3a4b25a663bdf5531ee9` | 5 files, ahead 6 / behind 0 | **SOURCE_ACCEPTED_CONDITIONAL** on exact SHA | **NOT VERIFIED**; 10 authored RTL cases (5 hook + 5 dialog) |
| **P19** Lifecycle / [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52), `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | 2 files, ahead 5 / behind 0 | **SOURCE_ACCEPTED_CONDITIONAL** on exact SHA | **NOT VERIFIED**; 7 authored RTL cases |

**Independent QA provenance is REAL, and must not be understated:** [A60 R15 independently signed source report](../A60/WEB-005_A60_R15_INDEPENDENT_QA.md), [R15 21-PR matrix](../A60/WEB-005_A60_R15_PACKAGE_MATRIX.json) and [R17 updated independent matrix](../A60/WEB-005_A60_R17_PACKAGE_MATRIX.json), blob `af4e3d4a62913cf67278c80cea4d04f1103d83da`. It carries forward **the same conditional source acceptances on unchanged exact SHA**, but no independent application runtime receipts. GitHub PR review events on #43/#50/#52 are empty; A60's separately published source report is the acceptance provenance.

**Revalidated source elements, no new claim of app PASS:**
- **PR43:** `src/hooks/use-tournament-csv-file-reader.ts` blob `82465e4fe28817a035a0b38f537d59bea39fb5ea`, uses tournament ID + generation + reader identity to ignore aborted/delayed old CSV reads. `src/pages/tournament-detail.tsx` adds route/modal/manual user-intent invalidation. No evidence yet of complete mounted A→B page and actual HTTP zero-write.
- **PR50:** `src/hooks/use-scoped-backup-preview.ts` blob `623f4012c570b8389c14216e8f5a5f7071b37b62`, uses scope+generation+reader identity; backup dialog resets new organizer/viewer/support passwords on selection/context change; existing V2/V3 parser retained. Backup import creates **new tournament C**, not overwrite existing B. No full-page/privacy regression test actually executed.
- **PR52:** `src/components/tournament-stages-panel.tsx` blob `efe8da984c2c730e198554219a88f7b400700ee2`, captures open-time tournament/stage identity, status, `version`, action; fresh `stagesQuery.refetch()` preflight before complete/start, with fresh readiness and sequential ceremony for start; stale message/button disable. Server remains responsible for concurrent writes between GET and POST. 7 prepared RTL definitions are not 7 passed tests.

**Actual GitHub Actions (automatic, at exact HEADs):** [PR43 run 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), [PR50 run 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), [PR52 run 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) all `completed/failure` at old Pack19 matcher (release expects `readOnly:true` instead of actual `accessMode:"read only"`). PR35 independently owns fix. Target frontend RTL **did not execute** in those CI runs. No paid manual rerun made here.

**A50 environment / receipt:** [A50 R15 receipt](../A50/WEB-005_A50_R15_RECEIPT.md) documents 15 actual environment/launcher safety calls, but **0 real app tests**; [R14 environment](../A50/WEB-005_A50_R14_HANDOFF.md) confirms Node22/Git, absent full checkout/pnpm/physically isolated PG16. [A60 R17 21-row QA matrix](../A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) still independently verifies **0** exact-SHA app-runtime receipts. These statements describe observed evidence, not a promise that no external actor can ever execute tests.

## 3. A50 executable targeted React RTL/typecheck contract — NOT EXECUTED by A110

**Prerequisite:** Owner/A00 provides trusted full checkout with installed locked dependencies, Node22 and pnpm10, distinct immutable per-PR worktrees/checkouts, explicit authorization. No PG16 for this frontend-only test plan. The actual `@workspace/tournament-manager` package supports `typecheck` and `test`; repo's `test/run-tests.mjs` uses Node `--import tsx`, `./test/setup-dom.mjs`, `--test` and `TSX_TSCONFIG_PATH`. Below use **POSIX shell** in isolated clone; for PowerShell set `$env:TSX_TSCONFIG_PATH` instead. **Record SHA, command, Node/pnpm version, environment, TAP, exit and logs for each invocation; no cross-SHA test borrowing.**

```bash
# CHECKOUT PR43 only, from repository root
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD; node --version; pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx)
pnpm --filter @workspace/tournament-manager run test

# CHECKOUT PR50 only, separate isolated worktree
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx)
pnpm --filter @workspace/tournament-manager run test

# CHECKOUT PR52 only, separate isolated worktree
git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx)
pnpm --filter @workspace/tournament-manager run test
```

*These blocks are illustrative checkout switches only in an approved isolated workspace. Their `git checkout` is NOT a merge/cherry-pick/rebase and is NOT performed by A110. Avoid running them over a colleague's worktree. A50 must establish reproducible exact-head checkout and non-secret fixtures.*

**A50/A60 negative and valid positive acceptance:**

| Surface | Mandatory negative | Valid positive |
|---|---|---|
| CSV #43 | File A delayed after route A→B, old `onload/onerror` ignored, no A CSV loaded into B; **0 import POST to B** without user's B intent | Valid user-selected B CSV parses and imports B only; new file/read-error recovery |
| Backup #50 | Old A FileReader callback after new B choice, route or close cannot resurrect A; A credentials cleared; **0 stale import POST**; no prior viewer password for B | Valid V2/V3 B backup with newly entered credentials, deliberate import creates separate C, no credential leak |
| Lifecycle #52 | Modal stage version/status changes, route A→B with same stage ID, or fresh GET 503: stale button disabled and **0 POST**; no double mutation | Unchanged stage fresh GET/readiness and valid ceremony produce **exactly one** legitimate start or complete; DE behavior unchanged |

Hook harness is not actual mounted `TournamentDetail` A→B/browser/HTTP proof. To claim end-to-end acceptance, A50 must add a real mounted route/browser/HTTP negative/positive receipt on exact relevant SHA, with A60 independent correlation. No real secrets or user backups in fixtures.

## 4. Remaining UX and cross-agent dependencies

**UX044 Host pending product choice:** baseline `artifacts/tournament-manager/src/pages/tournament-host.tsx` lines 248–270 uses `hasDraftScores = Object.keys(scores).length > 0` and guards beforeunload plus captured anchor clicks; separate `resultReason` edits and SPA/popstate may not be covered. **SOURCE_CONFIRMED limited guard; actual loss HYPOTHESIS**. Owner/HQ must explicitly pick **BLOCK navigation** vs **RETAIN private scoped draft** before any UX044 code lane.

**WITHDRAWN, DO NOT RECIRCULATE:** the alleged ordinary advanced StageBasketsPanel A→B transfer and backup-import overwrites existing B. A backup import creates new C. UX016 remains without new exact source-confirmed A110 R17 finding.

**File overlap for future integration ONLY:** PR43 + PR50 + [PR54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) all change `artifacts/tournament-manager/src/pages/tournament-detail.tsx`, including React import/hook state, route cleanup and RR Tabs presentation wrapper. The overlap establishes an integration dependency, **not a proven unresolvable merge conflict**. Preserve all three invariants when the authorized future integrator SWARM006 eventually combines after WEB005 formal closeout. PR52 touches only its own stage panel/test in this group. Reference notice to A120: [PR54 dependency comment](https://github.com/C8LyNn/aplikacja-turnieje/pull/54#issuecomment-6175443180).

**Privacy-state interdependency with [PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53):** A60 R17 matrix records `SOURCE_BLOCKED` for noncanonical `["tournaments", id, "player-bans"]` and `["matches", matchId, "game-picks"]` cache keys and existing `AuthProvider` fixture lacking QueryClientProvider. PR53 cache eviction does **not automatically prove** cleanup of transient CSV/Backup component form state; A100/A30 should test synthetic logout, role downgrade, and pending read, not globally clear unrelated caches. **HYPOTHESIS of a potential privacy leak is NOT runtime-proved leakage**. Reference prior notice: [PR53 dependency comment](https://github.com/C8LyNn/aplikacja-turnieje/pull/53#issuecomment-6175442528). A110 makes no PR53 changes.

## 5. Exact next action / signoff

- **A00/HQ:** return signed T055 D1–D6 or explicitly retain `POLICY_OPEN`; similarly choose UX044 block vs retain. T055 implementation not authorized by R17. Arrange A50-accessible trusted checkout + Node22/pnpm10 with execution GO. Dedicated physically isolated PG16 only via separate A20/HQ preflight.
- **A50:** execute the specific commands above against immutable PR43/50/52 HEADs; publish actual exit/TAP and browser/HTTP negatives/positives. Harness/preflight-only calls do not count.
- **A60:** carry forward exact `SOURCE_ACCEPTED_CONDITIONAL` on unchanged SHA, and sign new independent runtime/source verdict only when new evidence exists; never relabel existing authored tests as run.
- **A10/A00:** log R16 A110 recovery as `UNAVAILABLE`, not completed; maintain exact SHA and three-way file-overlap DAG.
- **Hard stop:** no A110 patch or new PR, no merge/cherry-pick/rebase, staging/live/SQL, paid GitHub CI, SWARM-006.

**Bottom line:** `R17_A110_SOURCE_ONLY_COMPLETE / R16_ARTIFACTS_UNAVAILABLE / T055_POLICY_OPEN / P10_P17_P19_A60_CONDITIONAL_SOURCE_ACCEPTANCE / APPLICATION_RUNTIME_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.  
**Formal [A110 R17 handoff](./WEB-005_A110_R17_HANDOFF.md).**
