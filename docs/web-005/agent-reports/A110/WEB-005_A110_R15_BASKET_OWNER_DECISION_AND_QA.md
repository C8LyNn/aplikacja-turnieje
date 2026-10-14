# WEB-005 — A110 R15 — Basket CAS owner decision and frontend QA

**Date:** 2026-10-14 (Europe/Warsaw)  
**Agent / TASK:** A110 Basket Concurrency & Frontend State / WEB-005-T055-T110-A110-R15  
**MODE:** SOURCE ONLY. No code, merges, new application PRs, tests against shared DB, deploy or SWARM-006.  
**Outcome:** SOURCE_REVALIDATED / T055_POLICY_OPEN / P10+P17+P19_PATCH_PROPOSED / A50_RUNTIME_NOT_CONFIRMED / A60_SOURCE_ACCEPTANCE_NOT_CONFIRMED / RELEASE_NO_GO.

## A. Immediate owner/HQ signature request — T055 / UX047

**To A00 → owner/HQ: Please sign D1–D6, select one explicit alternative per row, and issue a separate future scoped GO if an implementation should begin. This is an unsigned decision request, NOT approval to code.**

The [GET/PUT route on baseline](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) returns/replaces a whole basket graph. PUT forwards baskets and routes to replaceStageBasketConfiguration without a client expected revision. DB locking may serialize both PUTs but does not by itself reject a second stale full replacement. This is SOURCE_CONFIRMED missing concurrency precondition; two-editor runtime failure is NOT_EXECUTED, not a confirmed production incident. basketFlowAuthorityVersion is an authority/mode flag, NOT the required CAS version.

| Choice | Alternative A | Alternative B | OWNER signature |
|---|---|---|---|
| D1 token | Same-snapshot stage-ID/version vector, subject to inventory of ALL modifying writers and stage-set/ABA analysis (no SQL only if proven sufficient) | New monotonic persisted basketConfigRevision, requiring schema migration, A20/A90/Backup contract review | PENDING |
| D2 wire | JSON expectedStageVersions / expectedRevision | Server-issued opaque ETag and If-Match | PENDING |
| D3 stale response | 409 Conflict with stable domain stale code | 412 Precondition Failed with same stable domain code | PENDING |
| D4 missing/legacy precondition | 428 Precondition Required + client upgrade path | Another explicitly approved fail-closed 4xx; NEVER silently accept | PENDING |
| D5 invalidation | Changed stage set/version/roster makes the loaded draft stale | Basket-only revision with separately checked stage/roster writes, full writer coverage | PENDING |
| D6 UI conflict | Retain unsaved draft + server/local diff + explicit user rebase/discard | Retain unsaved draft, require explicit reload/reconcile before opt-in retry | PENDING |

**Invariants independent of alternatives:** GET graph and CAS token are coherent in one read; server checks expected base and organizer authorization under lock BEFORE any DELETE/INSERT/UPDATE. Two editors begin with same V0: only ONE success 200 and one D3-specific reject, loser zero writes, exact winner graph preserved, loser draft retained. No automatic resubmit/force overwrite. Missing legacy token fail-closed. Negative coverage: ABA, stage-set changes, roster drift, legacy-default graph/first save, missing/malformed token, unauthorized editor, failure mid-transaction and rollback. Positive: fresh single PUT advances token, GET returns the winning graph+new token, explicit user reconciliation.

**Decision record for owner (leave blank until signed):**

    D1=___; D2=___; D3=___; D4=___; D5=___; D6=___
    OWNER=___; APPROVED_AT=___; A20/A90/A100_REVIEW=___
    NEW_TASK_ID=___; A00_EXCLUSIVE_GO=___; IMPLEMENTATION_BASE_SHA=___

Reference: [A110 R14 unsigned one-pager](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_A110_R14_T055_OWNER_DECISION_1P.md). No owner signature was identified for this decision in the inspected central R15 instructions or policy file; POLICY_OPEN is retained.

### Next smallest *requested*, NOT currently approved, implementation lane

After D1–D6 are signed and A00 separately authorizes exclusive files, propose **T055-PRECONDITION-L1 — backend CAS contract and transaction tests**. Scope: coherent token read; locked expected-version check; consistent domain error/missing-token mapping from selected policy; physically isolated PG16 two-editor test; exact zero-write rollback. Do not unilaterally choose token/status. The consumer editor + generated API upgrade and UX preserving the loser draft must be planned as coordinated L2 before integration; backend fail-closed alone is NOT a releasable end-to-end implementation with legacy UI. All future code goes on isolated source branch with A60 independent QA. NO R15 code GO exists for A110.

## B. Exact source pins (GitHub rechecked for R15)

**Release base**: 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7; **main**: c50cc48e6fa508592bda3f4838111e9cff5af80c. All listed PRs remain OPEN DRAFT, unmerged, same base.

| Packet | PR | Exact HEAD SHA | Source files | Authored case count |
|---|---|---|---|---|
| P10 CSV UX042 | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | 96a6068f69027574ac76e18d4d5a2c444b5a914a | hooks/use-tournament-csv-file-reader.{ts,test.tsx}, pages/tournament-detail.tsx | 5 |
| P17 Backup UX045 | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | 5457a74187edc263730c3a4b25a663bdf5531ee9 | hooks/use-scoped-backup-preview.{ts,test.tsx}, components/backup-restore-dialog.{tsx,test.tsx}, pages/tournament-detail.tsx | 10 (5+5) |
| P19 Stage UX046 | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | cce73ec47445102b216b3f8eceb4ec9de67eb1a7 | components/tournament-stages-panel.{tsx,test.tsx} | 7 |

**SOURCE_CONFIRMED mechanisms**: PR43 verifies tournament ID, generation and active FileReader even after abort, invalidates manual/route/close state. PR50 verifies scope, generation and active FileReader; on new backup file it resets new organizer/viewer/support credentials; modal remounts on route/close and TournamentDetail masks state until new ID. PR52 captures dialog-open tournament/stage/status/version/action, disables stale actions and fresh-refetches stage list at confirm; planned start also refetches readiness and sequential ceremony. These are SOURCE_CONFIRMED implementation elements, NOT evidence of correct runtime behavior or A60 independent acceptance. PR52 stage GET → POST still needs authoritative backend validation for TOCTOU.

**CI evidence**: GitHub Actions on each exact head reached baseline Pack19 stale matcher then FAILED; [PR43 run 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), [PR50 run 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), [PR52 run 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664). Source expects readOnly:true, release uses accessMode:"read only"; separate PR35 already proposes matcher update. Feature-specific RTL was NOT reached in these workflow runs. No manually triggered rerun. **A50 actual per-SHA terminal command logs/exit or A60 signed exact-SHA receipt URL were NOT LOCATED via central docs expected paths and available PR review events.** A50/A60 may have private or separately held reports; do not infer no work was done. All 22 authored cases remain NOT_RUNTIME_VERIFIED here.

## C. A50 executable frontend-only handoff (safe, per isolated HEAD)

These are **commands to run**, not results. Obtain complete checkout and frozen deps in isolated workspace, Node 22 / pnpm 10. Record exact SHA, OS, Node/pnpm versions, TAP pass/fail/skip, all command exits, logs and any test fixture dependency failures. Neither shared nor production DB is required for frontend-only suite. The real package scripts are typecheck = tsc -p tsconfig.json --noEmit, test = node ./test/run-tests.mjs; test runner sets TSX_TSCONFIG_PATH to test/tsconfig.json.

    # Repository root, Bash-like shell; use one immutable checkout at a time
    git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
    git rev-parse HEAD
    node --version; pnpm --version
    pnpm --filter @workspace/tournament-manager run typecheck
    (cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx)
    pnpm --filter @workspace/tournament-manager run test

    git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
    git rev-parse HEAD
    pnpm --filter @workspace/tournament-manager run typecheck
    (cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx)
    pnpm --filter @workspace/tournament-manager run test

    git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
    git rev-parse HEAD
    pnpm --filter @workspace/tournament-manager run typecheck
    (cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx)
    pnpm --filter @workspace/tournament-manager run test

A50 may need to install frozen dependencies in approved environment using existing lockfile; record install method and failures; do not modify lockfile or ignore security settings. For Windows PowerShell, set environment variables via $env:TSX_TSCONFIG_PATH to the full test/tsconfig.json path before node, then unset when switching directories. Never reuse test outcomes across distinct SHA. Any real DB-backed test requires A20/A50 physical isolation preflight and owner permission.

### Negative + positive A60 acceptance matrix

| Surface | Negative (no stale/unauthorized action) | Valid positive (no regression) | Missing proof |
|---|---|---|---|
| CSV #43 | A CSV file A delayed onload/onerror after A→B never arms import into B; manual B text/new B file beats A; zero automatic POST | Deliberately selected B CSV imports only into B; current file error recoverable | Full TournamentDetail mounted A→B + observed HTTP |
| Backup #50 | A backup preview deferred callback after choose B/route/close cannot resurrect A; three new passwords cleared; 0 A import under B | Valid current V2/V3 B previews, explicit import POST produces **new C** with B-new credentials | Full TournamentDetail route A→B and real UI request; do NOT imply overwrite existing B |
| Stage #52 | Status/version change or route A→B same stage ID after dialog open blocks old confirmation, zero POST; failed fresh GET blocks action | Unchanged valid stage start/complete executes once with fresh GET/readiness/ceremony; backend remains authoritative | True mounted route and HTTP, TOCTOU between GET/POST still server contract |

A60 must sign source review on *exact PR HEAD*, separate from real A50 runtime proof, and inspect positive/negative coverage, privacy and rendering compatibility. No author self-certification.

## D. Inter-agent cross-cutting dependencies, NOT implementation authorization

- **A100 / A30 (S2B privacy):** [PR53 auth query predicate](https://github.com/C8LyNn/aplikacja-turnieje/blob/6a8f0c3e5775eb056df75ebdd7b33df7cbc78979/artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts#L46-L100) only matches query keys beginning with /api/tournaments/:id; previously reported noncanonical ["tournaments", id, "player-bans"] and ["matches", matchId, "game-picks"] are not matched. Separate privacy-state concern: PR50's transient backup import form and PR43's CSV draft in component state cannot be assumed purged solely by React Query eviction. Notify A100/A30 to scope-test auth downgrade/logout while file read is pending and while sensitive forms are mounted; do NOT add global cache clear or alter A100 code. Privacy fixtures must use synthetic credentials and never emit secrets.
- **A120 (same source path):** PR43 and PR50, plus [PR54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) all independently change artifacts/tournament-manager/src/pages/tournament-detail.tsx (imports, state/effects, RR Tabs wrapper). Real integration must preserve hooks order, page navigation, CSV/backup guards and RR canonical query invalidation; run combined regression only on future authorized composite SHA. A110 does NOT merge or edit PR54; PR52 has independent stage-panel file ownership among these four.
- **UX044 Host:** Baseline [host dirty guard](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L245-L267) checks score-entry keys and beforeunload/anchor click, not reason-only draft or all SPA/popstate transitions. SOURCE_CONFIRMED incomplete guard coverage; actual loss is HYPOTHESIS. Owner must choose **block navigation vs private scoped draft retention**; neither silently selected.
- **UX016:** no new, exact source-confirmed finding from R15; do not resurrect without original R2 evidence and source. Previously withdrawn ordinary StageBasketsPanel A→B advanced draft transfer and alleged backup overwrite of already-existing tournament B remain WITHDRAWN.

## E. Stop/next actions, no cross-swarm dispatch

**A00/HQ now:** return signed D1–D6 T055 answer or explicitly keep POLICY_OPEN; only after signatures consider a distinct T055-PRECONDITION-L1 source-code GO (currently not approved). **A50:** publish exact executable run receipts and logs on immutable #43/#50/#52 HEAD. **A60:** publish direct independent exact-SHA verdict links. **A100/A30/A120:** use dependency flags above. **A10/A00:** track dependencies in existing internal registry; no interim transfer. **Release:** NO-GO, SWARM-006 HOLD until entire WEB-005 accepted backlog completed and formal HQ decision.

**Companion:** [A110 R15 final handoff](./WEB-005_A110_R15_HANDOFF.md).
