# WEB-005 — A110 / R14 — FRONTEND QA, OVERLAP AND BASKET POLICY

**Agent:** A110 — Basket Concurrency & Frontend State  
**Task:** `WEB-005-T055-T110-A110-R14` · **Wave:** R14.1 (2026-10-14, Europe/Warsaw)  
**Authorization:** **SOURCE-ONLY / QA HANDOFF**; no new implementation code lane, no PR edits, no merge, no SWARM-006.  
**Snapshot:** central prompts blob `e3fc34cee212e23c7516a2271af1080c96eff9a0`.  
**Release base:** `release/tournament-ops-20261013-01` = `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; **main:** `c50cc48e6fa508592bda3f4838111e9cff5af80c`.

## 1. Live per-PR pins and evidence (refreshed, NOT SOURCE_ACCEPTED)

| PR | Feature | Exact HEAD SHA | GitHub | Actual authored tests | Source-only finding |
|---|---|---|---|---|---|
| [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) / P10 | CSV UX042 | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | OPEN DRAFT, unmerged; 3 files | 5 hook RTL definitions | `SOURCE_CONFIRMED`: CSV scoped tournament ID + generation + active FileReader; manual edit, modal close, route reset invalidate |
| [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) / P17 | Backup UX045 | `5457a74187edc263730c3a4b25a663bdf5531ee9` | OPEN DRAFT, unmerged; 5 files | 5 hook + 5 actual BackupRestoreDialog RTL definitions | `SOURCE_CONFIRMED`: shared backup FileReader scope/epoch/reader, password reset on file change, keyed route/open dialog; TournamentDetail ID mask |
| [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) / R13 candidate | Stage lifecycle UX046 | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | OPEN DRAFT, unmerged; 2 files | 7 TournamentStagesPanel RTL definitions | `SOURCE_CONFIRMED`: snapshot `(tournamentId,tournamentStatus,stageId,version,status,action)`; stage list `refetch()` before write; start readiness refresh |
| [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) / A120 R13 | Round Robin readback | `dbba0eb82920b4f324866b1b983e1211459f52ec` | OPEN DRAFT, unmerged; 2 files | 6 A120 RTL definitions | **Dependency only**: same `tournament-detail.tsx` path; A120/A60 own its semantic QA |

All four target the **same exact release base SHA** and are distinct, unmerged source patches. A10 owns canonical P19–P21 mapping; this report does not assign a package ID to #52/#54. GitHub PR review events observed on #43/#50/#52: **none**; this **does not** prove that no separate A60 report exists. No independently signed `SOURCE_ACCEPTED` read from available evidence; no feature-specific native `RUNTIME_VERIFIED`.

**Automatic GitHub Actions (not manually rerun):** #43 run [38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), #50 [38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), #52 [38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664): **FAIL** on **Pack19 source contract** (baseline regex expects `readOnly:true`; actual source `accessMode:"read only"`), per logs from previous author waves. This is a real unrelated contract gate failure, **not a failure of CSV/Backup/UX046 targeted RTL**, which did not run in those workflows. PR35 already provides a separate correction to that matcher; **NO DUPLICATE PATCH**. R14's central document reports the same baseline for #53/#54. This packet does not claim CI PASS, native frontend tests or integrated runtime.

## 2. SOURCE QA readback — PR52 Stage modal

**Source:** [panel at exact PR52 HEAD](https://github.com/C8LyNn/aplikacja-turnieje/blob/cce73ec47445102b216b3f8eceb4ec9de67eb1a7/artifacts/tournament-manager/src/components/tournament-stages-panel.tsx#L558-L895) and [7 authored tests](https://github.com/C8LyNn/aplikacja-turnieje/blob/cce73ec47445102b216b3f8eceb4ec9de67eb1a7/artifacts/tournament-manager/src/components/tournament-stages-panel.test.tsx).

- Snapshot captures stage `version` already defined in the generated `TournamentStage` API; on local query-state mismatch the dialog reports changed stage and disables confirmation.
- Confirm does a fresh `stagesQuery.refetch()`; checks tournament ID, tournament lifecycle, stage ID/status/version, and fails closed for failed/missing reads. For start, then refetches readiness and sequential ceremony. No new backend CAS/HTTP error policy. Backend is **final atomic stage authority**.
- A60 must independently verify React Query behavior after failed refetch and after a stage list changes **during** fresh checks. Also inspect double-click mutex, button accessibility, reopening, DE completion and ceremony, correctness of unchanged-stage positive paths.
- **Important test gap:** the seven tests are authored but never run here. The A→B same-ID example is a React/Wouter harness; browser route replay is NOT_EXECUTED. The current preflight cannot prevent a separate actor changing data **between GET and POST**; this is expected TOCTOU limitation, not server-level concurrency mitigation.
- **Independence:** stage panel and its tests are unique to PR52 among #43/#50/#54, so no same-path conflict observed within these four PRs. This says nothing about all other future PRs.

### Acceptance A50 → A60 (negative and positive)

| Contract | Negative | Valid positive |
|---|---|---|
| Stage active v1 → externally completed v2 with confirmation open | Original complete button disabled, message visible; **0 POST**, reopen required | Unchanged active stage passes fresh GET; exactly one complete |
| Stage planned v1 → status same but version v2 | Original start disabled even though status still planned; **0 POST** | Reopened planned v2 with fresh readiness: one start |
| Server v3 arrives after last poll but before click | Confirm refetch detects version mismatch; **0 POST** | Stable version with success GET/readiness executes once |
| Tournament A→B same stage numeric ID; 503 stages GET; double-click | No A action transferred to B; 503 fails closed; no duplicate write | Current B form and state permit only deliberate user-triggered B action |
| Sequential seed/DE, rejected backend mutation | No false success, no invented completion/HTTP status, existing error visible | Existing valid ceremony and DE completion rules unchanged |

## 3. SOURCE QA readback — PR50 Backup preview

**Source:** [scoped preview hook](https://github.com/C8LyNn/aplikacja-turnieje/blob/5457a74187edc263730c3a4b25a663bdf5531ee9/artifacts/tournament-manager/src/hooks/use-scoped-backup-preview.ts), [backup dialog](https://github.com/C8LyNn/aplikacja-turnieje/blob/5457a74187edc263730c3a4b25a663bdf5531ee9/artifacts/tournament-manager/src/components/backup-restore-dialog.tsx), [TournamentDetail backup path](https://github.com/C8LyNn/aplikacja-turnieje/blob/5457a74187edc263730c3a4b25a663bdf5531ee9/artifacts/tournament-manager/src/pages/tournament-detail.tsx#L230-L260).

- Hook guards callback by **scope, generation and active reader identity** even if an aborted old FileReader queues `onload/onerror`; it reuses the existing Backup V2/V3 parser. Dialog remounts its state on close/open or route change; selecting a different backup resets newly entered organizer, private viewer and support passwords.
- Actual dialog RTL cases cover explicit B-only backup POST using mocked HTTP, but the full `TournamentDetail` route is **not mounted by those tests**. A50/A60 must add a real page test before claiming route-level privacy/negative write success.
- Do not conflate preview context with **in-flight import request**. The current patch does not add a new post-submit cancellation/revocation policy or credential redesign. `POST /tournaments/import` creates a **new** tournament C; it does not overwrite existing B.

### Acceptance A50 → A60 (negative and positive)

| Contract | Negative | Valid positive |
|---|---|---|
| Backup file A pending → choose B, then old A.onload/onerror after abort | Only B preview, no A error resurrected, passwords clear, **0 automatic POST** | Current B file v2/v3 parses and shows correct preview |
| Dialog open A → closed/reopened or route B while FileReader A pending | No stale A preview/credential field, old A result cannot populate B | B new credentials can be entered and submitted deliberately |
| `private_online` A → public B | Previous viewer/organizer/support passwords cleared and not sent | B visibility controls correct current password requirement |
| Real `TournamentDetail` A→B (same React component instance) | Deferred callback A cannot load A preview under B; no `POST` with A under B, no secret leak | B backup explicitly selected + B new password → request contains only B and creates a distinct C |
| Current malformed V1/JSON or failed reader | Parser error scoped only to current selection, no stale import | Valid current V2/V3 continues unchanged |

**Privacy rule:** never log passwords, tokens, backup contents or test real customer backup fixtures; compare only synthetic names/opaque fake non-secret tokens.

## 4. SOURCE QA readback — PR43 CSV late FileReader

**Source:** [CSV hook](https://github.com/C8LyNn/aplikacja-turnieje/blob/96a6068f69027574ac76e18d4d5a2c444b5a914a/artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.ts), [5 hook tests](https://github.com/C8LyNn/aplikacja-turnieje/blob/96a6068f69027574ac76e18d4d5a2c444b5a914a/artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.test.tsx).

- Hook uses tournament owner ID, selection generation and reader identity. The page resets CSV state after route change and invalidates on manual entry/modal-close; existing parser/import endpoint is unchanged.
- Five test definitions exercise a **harness**, not the full TournamentDetail page + HTTP. The negative cross-tournament request is a required follow-up, **NOT yet verified**.

| Contract | Negative | Valid positive |
|---|---|---|
| Pending A CSV read → navigate tournament B, late old A onload/onerror | No A CSV data/replace confirmation appears under B, **0 POST to B** | Explicitly selected valid CSV B parses and imports exactly into B |
| B new FileReader vs old A + manual pasted text | Manual text/latest B input wins, no stale overwrite | Current B selection displays correct file with no stale error |
| Close/unmount, read error, new selection | No late callback reopens/arms modal, no state after unmount | Current new selection clears error and can proceed |

## 5. Shared-file collision: PR43 + PR50 + PR54

**GitHub changed filenames verified per PR (exact HEADs above).**
- **PR43** `src/pages/tournament-detail.tsx`: imports CSV hook, CSV state and on-route effect around baseline lines 250; CSV file/manual/close handlers around 518–1050.
- **PR50** **same file**: replaces backup import parser import with backup hook, adds route-scoped backup state and `useEffect` around baseline 227–260 (adjacent to PR43 CSV state), modifies backup handler around 347–365 and cancel near bottom.
- **PR54** **same file**: adds RR bridge/ReactNode API imports, `RoundRobinReadbackBridge` component and `Tabs` wrapper; author A120 owns functional correctness.
- **Risk `STATIC_INFERRED`:** common import section + nearby React hooks in PR43/50 can produce textual conflict or a silently incorrect merged hook order, even if Git auto-merge succeeds. RR wrapper can change mounted lifecycle/query refresh behavior. Cross-PR regression tests must cover all three features on an **authorized future composite SHA**, not the individual HEADs.
- **R14 STOP:** do not merge, rebase/cherry-pick, touch a file or create a composite branch. **Only SWARM-006** later resolves integration after signed one-time final handoff. **A10/A00** record this explicit dependency graph: `#43 ↔ #50 ↔ #54`; `#52` separate stage panel.

## 6. R14 runnable A50 commands — isolated checkout PER PR HEAD

The existing [frontend test runner](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/test/run-tests.mjs) loads Node `--import tsx`, `test/setup-dom.mjs` and **sets `TSX_TSCONFIG_PATH` to test/tsconfig.json**. Reproduce that environment for targeted tests (Node22 / pnpm10; frozen dependencies already installed in an isolated clone). At every HEAD: `git rev-parse HEAD`, record actual node/pnpm versions, command, exit status, TAP pass/fail/skip and log; never reuse previous SHA evidence.

**Suggested runner procedure from repository root (run each block only in an actual isolated checkout):**

```bash
# PR43 / CSV: checkout only P10
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD
node --version && pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$(pwd)/test/tsconfig.json"
node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx
cd ../..

# PR50 / Backup: independent checkout; never cherry-pick PR43
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$(pwd)/test/tsconfig.json"
node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx
cd ../..

# PR52 / Stage: independent checkout; no other PR patches
git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$(pwd)/test/tsconfig.json"
node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx
cd ../..
pnpm --filter @workspace/tournament-manager run test
```

**All commands above are HANDOFF CONTRACTS, NOT EXECUTED by A110**. For full suite on PR43 and PR50 similarly run `pnpm --filter @workspace/tournament-manager run test` at each exact HEAD. A50 and A60 must distinguish successful source/harness tests from true whole-page/browser and real HTTP behavior. A60 makes independent acceptance, not the author.

## 7. Remaining scoped queue and owner blocker

**T055:** [R14 one-page unsigned Basket CAS decision](./WEB-005_A110_R14_T055_OWNER_DECISION_1P.md); six choices D1–D6 and fail-closed contracts. **POLICY_OPEN**, implementation blocked until product owner/HQ and A00 grant separate task-scoped GO. The baseline [GET/PUT router](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) has no client revision precondition; a source race is plausible, but not reproduced in authorized concurrent PG16. A50 future test requires physically isolated disposable PG16 and explicit owner approval.

**UX044 Host dirty navigation:** [`tournament-host.tsx` baseline L248–268](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L248-L268) sets `hasDraftScores` from keys in score object and guards `beforeunload` and anchor clicks only. A reason-only input and SPA/popstate navigation are not included in the same guard. **SOURCE_CONFIRMED coverage gap, actual draft loss HYPOTHESIS**; owner should decide **block navigation vs scoped private retention** before any code. No UX044 PR in R14.

**UX016/other R2 items:** no independently reverified source record or executable fixture for UX016 was established in this A110 R14 inspection; **DO NOT escalate, invent or reclassify**. A00 reconciles the original WEB-004 HANDOFF R2 entries with distinct owners. Previously withdrawn **ordinary StageBasketsPanel A→B advanced draft transfer** and **backup import overwrites existing tournament B** remain **WITHDRAWN**; backup import creates C.

**One actionable R14 unblocking request:** A00 route the signed T055 D1–D6 owner decision and arrange **A50 exact-SHA Node22/pnpm10 targeted frontend execution + A60 source acceptance**. Record which is a policy gate versus environment gate; neither author docs nor the historical Pack19 CI failure settles them. Until then `RELEASE_NO_GO`; **NO SWARM-006 DISPATCH**.
