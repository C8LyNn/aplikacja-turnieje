# WEB-005 — A110 — R11 T055 POLICY & T110 UX QUEUE

**Task:** `WEB-005-T055-T110-A110-R4` • **Agent:** A110 / Basket Concurrency & Frontend State • **Wave:** R11 (2026-10-14) • **Mode:** SOURCE-ONLY • **Owner:** A00 and HQ  
**Source pinned:** release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` • current PR43 `96a6068f69027574ac76e18d4d5a2c444b5a914a` • **No implementation in R11; no PR43 changes.**  
**Companion:** [WEB-005_A110_R11_TEST_FIXTURES.json](./WEB-005_A110_R11_TEST_FIXTURES.json) (20 expected tests, none claimed run).

---

## PAGE 1 — OWNER/HQ DECISION: `POLICY-BASKET` (T055 / UX-047)

### Existing source evidence — not a policy choice

`GET /tournaments/:id/stage-baskets` returns a complete graph **without a CAS token**. `PUT` accepts only `baskets` and `routes`; [router at release L778–813](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L813). The [service L308–370](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L370) locks the tournament and stages but does **not** check the editor's base version, then [L441–532](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L441-L532) replaces the basket/route/participant graph and increments per-stage `stage.version`. Locks serialize writes; **two full PUTs from the same V0 can both commit successively, losing A's edits** (`SOURCE_CONFIRMED` missing precondition; simultaneous user behavior has not been runtime-reproduced). The `basketFlowAuthorityVersion` field is a legacy-vs-basket **0/1 mode marker, NOT a revision counter**. The frontend [StageBasketsPanel L928–939](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L939) submits the full graph without a precondition. **T055 is still unimplemented.**

### Required explicit owner choices — select one per row, sign, then create implementation slot

| Decision | Alternative A | Alternative B | Owner/HQ selection |
|---|---|---|---|
| **D1. Atomic token** | **SERVER-ISSUED ordered stage-version vector** `[{stageId,version}]` in same coherent GET basket snapshot; exact ID-set+versions compare under tournament/stage lock, no new DDL | **New persisted scalar `basketConfigRevision`**; atomic GET+PUT and monotonic increment (+1 per successful full graph replace); migration + A20/A90 coordination | **PENDING** |
| **D2. Wire precondition** | JSON `expectedStageVersions` or `expectedRevision` (matching D1), domain conflict response | `If-Match` with server-issued opaque basket ETag, verified under lock | **PENDING** |
| **D3. Stale response** | **409 Conflict** with stable `STAGE_BASKET_CONFIGURATION_STALE` domain code (typically body version) | **412 Precondition Failed** (typically HTTP `If-Match`) and same stable code | **PENDING** |
| **D4. Legacy clients without token** | **428 Precondition Required** + explicit version-upgrade UI | Another owner-signed **fail-closed** 4xx mapping, e.g. 400; **never silently accept** | **PENDING** |
| **D5. Invalidation** | Treat any current stage set/version or basket-relevant roster change as stale, with explicit message | Basket-only revision with separately verified stage/roster validity; exact writer inventory and no lost updates required | **PENDING** |
| **D6. Conflict UI** | Keep local draft and show side-by-side current server graph, explicit discard/rebase | Keep local draft with explicit reload/reconcile flow and visible diff; no auto overwrites | **PENDING** |

**Minimum invariants independent of choice:** Freeze the precondition with the graph actually loaded by the editor. Server must issue **coherent graph+token in one snapshot**; separately fetching stages afterward risks falsely attaching a newer token to an old graph. Check the precondition **under the mutation lock, before any DELETE/INSERT/UPDATE**. Reauthenticate organizer under lock. Exactly one of two valid V0 PUTs commits, the second returns policy-selected conflict with **zero DB changes**, no silent auto retry, loser retains draft. `stage.version` vector is a **candidate**, not yet proven sufficient for all mutation writers; investigate stage/roster writer coverage and dirty legacy-first-save paths before D1=A. Scalar option entails migration/adoption/Backup V3 semantics; cannot choose D1=B without A20/A90.

**Dual-editor fixture:** A and B both GET a fully valid V0; A changes a basket color one way, B a different way; concurrent PUTs with V0; independent isolated PostgreSQL16 lock interleaving asserts **one success, one controlled 409/412, exact winner graph, no partial rows, no revision increment by loser**. Test missing token, ABA, changed stage set, legacy-defaulted first save, stale roster, rollback fault and unauthorized actor. UI preserves rejected editor's draft. Tests are FUTURE/NOT_EXECUTED. **POLICY-BASKET remains OPEN until A00/HQ signs D1–D6.**

> **Owner decision record:** `D1=__ ; D2=__ ; D3=__ ; D4=__ ; D5=__ ; D6=__ ; approved_by=__ ; approved_at=__ ; GO_patch_lane=__ ; A20_A90_A100_dependencies=__`. **This document is a choice request, not an approval.**

---

## 2. R11 PR43 intake — P10, CSV UX-042

**[PR #43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43):** `OPEN DRAFT`, head `96a6068f69027574ac76e18d4d5a2c444b5a914a`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, not merged, 3 commits and 3 changed files (GitHub `compare` ahead=3/behind=0). Files:
1. `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.ts` (new, blob `82465e4fe28817a035a0b38f537d59bea39fb5ea`): owner tournament ID + generation epoch + active reader match; abort on invalidate; ignore stale callbacks.
2. `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.test.tsx` (new, blob `8f30ce89a6bc02add6fd6f930752da835dcd990d`): five prepared RTL tests, `FE-CSV-01..04` and current error recovery, using deferred FileReader.
3. `artifacts/tournament-manager/src/pages/tournament-detail.tsx` (modified, blob `7bb3b97d3a46c168ee85d07de948cded0667f2d7`): reset CSV state on ID change, protect file/manual/modal-close paths.

**Positive static outcome:** `SOURCE_CONFIRMED` presence of the guard and user-intent invalidation in PR43; changed files limited to UX-042 frontend code. **Unproven:** true `TournamentDetail` A→B navigation, negative actual `POST /api/tournaments/B/players/import`, browser behavior and frontend regression. Existing five tests mount a helper `Harness`, **not** the complete `TournamentDetail` route and do not exercise a real HTTP mutation.

**Observed GitHub CI for PR43 head:** Workflow run [`38590842415`](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415) `Tournament correction safety CI` concluded `failure` at 2026-10-14 15:37 UTC. Job `correction-qa` ID `115944973929`: `SE safety unit tests` SUCCESS, `Pack 19 snapshot consistency tests` FAILURE; TAP 7 pass / 1 fail, `qa/pack19/source-contract.test.mjs` snapshot assertion expected `/isolationLevel:"repeatable read",readOnly:true/`, exit code **1**. Remaining CI steps skipped. This failure is **NOT** a failed FE-CSV RTL test, because targeted/frontend tests were not reached. A50/A10/A40 must triage Pack19 independently; A110 does not edit Pack19. GitHub reviews/comments for PR43 were empty at inspection; separate QA report, if any, is not overridden.

**P10 release verdict:** `PATCH_PROPOSED`; `SOURCE_ACCEPTED=NOT_ESTABLISHED`; `FE_CSV_RUNTIME_VERIFIED=NO`; `CI_RUN=FAIL_UNRELATED_GATE_UNTIL_TRIAGED`; `QA_A60=PENDING`; `MERGE=STOP`. **No PR43 modifications in R11**.

## 3. Source revalidation of remaining T110 backlog (R11)

| Finding | Exact source and status | Small future patch, without selecting product policy? | Explicit exclusions |
|---|---|---|---|
| **UX-044 Host unsaved drafts** | [`tournament-host.tsx` L248–267](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L248-L267): `hasDraftScores` checks only score keys; guard only `beforeunload` and captured anchor click, not explicit Wouter popstate/programmatic navigation. `resultReason` written separately to walkover/no-contest; reason-only edits not reflected in `hasDraftScores`. **SOURCE_CONFIRMED coverage gap; browser loss HYPOTHESIS.** | **NOT YET.** Dirty predicate can be isolated, but navigation **block vs safe scoped retention** is a user-visible decision and A100 privacy boundary. Owner chooses first. | Do not replace existing match CAS / expectedRevision or claim actual data loss reproduced. |
| **UX-045 Backup async preview + new credentials** | [`backup-restore-dialog.tsx` L30–65](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/backup-restore-dialog.tsx#L30-L65) and [`tournament-detail.tsx` L231–238, L347–410](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-detail.tsx#L347-L410): two picker implementations use unguarded FileReader callbacks; choosing new file clears preview/error, **does not consistently clear new password fields**. **SOURCE_CONFIRMED missing callback-generation guard; stale preview effect HYPOTHESIS.** Import [`POST /tournaments/import`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L2950) creates a **NEW** tournament C with new credentials. | **YES, small independent future UI-only patch** can guard backup FileReader by selection/close/identity generation and prevent stale preview, without changing import product semantics. Separate password clearing on file/context/visibility needs A100 privacy signoff and explicit UX acceptance; do not bundle unapproved credential persistence. | No modifications to A90 `backup-v3.ts`, source history, existing B or real password logging. |
| **UX-046 Stage lifecycle modal stale snapshot** | [`tournament-stages-panel.tsx` L554–559, L735–795, L1033–1112](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/tournament-stages-panel.tsx#L735-L795): action stores stage ID, resolves refetched `actionStage` but does not freeze modal-opening `version/status/tournamentId`. It checks current `planned/active`, yet another actor may update a stage after dialog opened. **SOURCE_CONFIRMED missing opened-version predicate; illegal backend write NOT_PROVEN.** | **YES, future scoped frontend-only invalidation**: snapshot `(tournamentId, stageId, version, status, action)`, disable/close on mismatch; coordinate A80 on lifecycle truth. A true post-click race still belongs to backend, so do not invent a 409 contract. | No A80/revert-match changes, lifecycle policy rewrite, or backend CAS selected by A110. |

**Withdrawn and not resurrected:** (a) ordinary TournamentDetail A→B is **not proof** of StageBasketsPanel advanced-draft transfer (loading/auth remount path); (b) backup **does not overwrite existing B** on import. Any reclassification requires new source/runtime evidence and A00 triage.

**Future patch candidates without a new product policy, after A00 assigns a free lane:** candidate 1 `UX-045-PREVIEW-GUARD` — two backup picker callbacks, no credential policy; candidate 2 `UX-046-MODAL-VERSION-GUARD` — bounded FE fail-closed modal invalidation, requires A80 contract validation but no sport semantics change. `UX-044-HOST-NAV` remains `POLICY_OPEN`. Do not start either candidate during R11. PR43 is frozen during A50/A60 QA.

## 4. Test-first A50 and A60 contract (no runtime in A110 R11)

**Machine-readable matrix:** `WEB-005_A110_R11_TEST_FIXTURES.json` — 20 cases with `P10` / `UX044` / `UX045` / `UX046` / `T055` tags, layers, expected outcomes and `execution:false`. Existing R10 tests already cover 5 synthetic RTL cases but must actually run. New full-route and negative cross-write fixtures are **requirements**, not implemented tests.

| Group | Required scenario / expected invariant | Executor |
|---|---|---|
| **P10 targeted RTL x5** | A→B same-component, late `onload+onerror` after abort, two B file selections, manual input, modal-close/unmount, current error recovery. Zero A UI state in B. | A50 run existing test source, report command+SHA+exit |
| **P10 real-page RTL x4 + browser x1** | Mount real `TournamentDetail` with QueryClient, Wouter, auth and mocked fetch; same mounted route A→B, pending A reader; after A completion B text/result/error/replace flag unchanged. B's CSV select + explicit B import sends **only B CSV**, not A. Browser navigation covers lifecycle. | A50; A60 independent assertion mapping |
| **UX044 future browser x2** | Unsaved scored draft and reason-only no-contest/walkover, Back/Forward/programmatic navigate; block or preserve only per signed navigation/privacy policy. | Future implementation, A50/A60 |
| **UX045 future RTL x2 + HTTP x1** | A backup preview resolves after newer B selection or modal close; zero stale view/error; new credentials scoped to context; import creates C≠B, leaves B unchanged. | Future FE patch; HTTP/PG only in approved isolated DB |
| **UX046 future RTL x2 + HTTP x1** | Complete dialog stage active/v5 → refetch completed/v6: action disabled; start dialog A ID → B same stage ID: no action to B; true backend race yields existing controlled response/zero illegal write. | Future FE patch/A80 source contract |
| **T055 future PG x2** | Two V0 writers single success and one policy-selected conflict; old client missing token, ABA, stage set, legacy first save and read snapshot coherence; loser 0 writes, draft retained. | Only after signed POLICY-BASKET and safe PG16 |

**Runnable commands for A50 on exact PR43 checkout** (do not run if checkouts/dependencies unavailable; these commands must be logged with process exit code):

```bash
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

**A60 quality gate:** distinguish existing `Harness` tests from route-level true E2E; review early-return auth remount and `FileReader.abort()` callback-after-abort path; assert no B HTTP mutation with A payload; check exact commit, code differences and results. CI Pack19 failure must not be misreported as P10 RTL FAIL, but blocks a blanket CI PASS. **No PG/CI/build commands were executed by A110 in R11.**

## 5. Dependencies, files and owner handoff

- **A00/HQ:** decide D1–D6, authorize a future code slot, approve whether UX045 preview guard/UX046 modal guard are independent backlog patches. No new owner policy signed here.
- **A20/A90:** review new scalar basket revision only if D1=B; migration numbering, V3 portable schema and historical revision handling remain blocked without their contracts. A90 currently owns R11 backup export B3A.
- **A100:** privacy of new password fields, private preview, 401/403/logout and per-tournament authentication context; PR44/S1A and current DELETE S1B-D ownership respected.
- **A80:** stage status/version lifecycle contract; R11 `revert-match.ts` reserved source-only; no touch.
- **A50:** prioritize actual P10 frontend tests and E2E negative no cross write; report full command, environment, SHA and exit code. T055 PG only after owner approval and isolated test setup.
- **A60:** independent acceptance at exact PR43 head; verify future UX fixtures when implemented; test source itself does not certify PASS.
- **A10:** P10 remains internal buffer; handoff is not SWARM-006 dispatch.
- **File collision:** `tournament-detail.tsx` belongs to A110 SOURCE-ONLY in R11; PR43 **FROZEN**. A120 owns presentation files only. Avoid cross-branch edits to live patch.

## 6. R11 outcome for A00

`AGENT=A110` • `TASK=WEB-005-T055-T110-A110-R4` • `BASE=1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` • `PR43_HEAD=96a6068f69027574ac76e18d4d5a2c444b5a914a` • `PR43=OPEN_DRAFT`.  
**CHANGES:** documentation only: this policy/queue file and one 20-case JSON; **NO APPLICATION CODE MODIFICATIONS, NO NEW IMPLEMENTATION PR**.  
**REAL TESTS:** `NOT_EXECUTED` in A110 R11, no CLI exit code; externally observed **PR43 CI Pack19 gate FAIL (exit 1)** on run `38590842415`, distinct from FE CSV tests.  
**QA:** `SOURCE_CONFIRMED` findings, `PATCH_PROPOSED` frozen PR43, `RUNTIME_VERIFIED=NO`, A60 `SOURCE_ACCEPTED=NOT_ESTABLISHED`.  
**POLICY:** `POLICY-BASKET OPEN`; Host navigation/privacy not chosen; Backup V3/history unaffected.  
**GO/STOP:** `GO DOCUMENTATION / STOP CODE, MERGE, RELEASE, SQL, SWARM006`.  
**NEXT ACTION:** A00/HQ sign `POLICY-BASKET` D1–D6 **and** route PR43 to A50 real targeted RTL + A60 review; no assumptions of release readiness.

**Signed A110 R11:** `POLICY REQUESTED / UX QUEUE SOURCE-REVALIDATED / P10 QA PENDING / RUNTIME NOT_EXECUTED / WEB005_IN_PROGRESS / RELEASE NO-GO`.
