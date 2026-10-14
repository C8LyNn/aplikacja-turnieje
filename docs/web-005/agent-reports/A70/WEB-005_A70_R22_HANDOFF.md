# WEB-005 — A70 R22 final handoff to A00

**Task / role:** WEB-005-T040-A70-R22 — A70 Match Lifecycle & Undo  
**Wave:** R22.1 · 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE/DESIGN ONLY — no R22 code GO  
**Detailed deliverable:** [WEB-005_A70_R22_TS_B_SCOPE.md](../../WEB-005_A70_R22_TS_B_SCOPE.md)  
**Release baseline:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Coordinator:** WEB-005 A00 under external global HQ/Queen  
**Outcome:** `TS_B_R23_SCOPE_PUBLISHED / NO_CODE / NO_TEST_RUNTIME / MP2B_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`

## 1. Owner authorization and independent QA

[Owner sport policy](../../WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md) explicitly approves **S1 TS-B**: atomic terminal Swiss match+stage+tournament+winner+active stage+terminal-only entrant roster correction, with immutable history, completion audit compensation, concurrency correctness, rollback and legal re-finalization. Existing S2/S3/S4/S4-H/DE, T055 D1–D6 and Backup B1–B6 decisions were read and are not new A70 choices. Sport TS-B approval **is not a source-code GO nor public MP2B Revert CAS/Host approval**. The R21 owner packet §4 and [DECISIONS.md](../../DECISIONS.md) keep MP2B RA/RB/RC **POLICY_OPEN**.

[Independent A60 R21 gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`, says **HANDOFF_NOT_READY**, inherits P09 PR42 `SOURCE_ACCEPTED_CONDITIONAL` but not a runtime pass. [A50 R21 environment receipt](../A50/WEB-005_A50_R21_NATIVE_TEST_OR_OWNER_BLOCKER.md) records **0 native tests** (no approved connected full checkout/pnpm or physically isolated PostgreSQL16). A70 R22 ran **no native commands**; real command exit, TAP and database status: **NOT_EXECUTED**.

## 2. Exact PR/source provenance

| Source | Verified exact HEAD | State |
|---|---|---|
| [PR39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) Cancel/Restore | `16053ee132756ca05b6f2cd1f0cabae823905387` | OPEN DRAFT, unmerged, untouched |
| [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) global Undo LIFO | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | OPEN DRAFT, unmerged, untouched |
| [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) RR final reopen | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | OPEN DRAFT, unmerged, **future revert-match.ts conflict** |
| [PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) historical Undo | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | OPEN DRAFT, unmerged, untouched |

Pinned release source `artifacts/api-server/src/application/matches/revert-match.ts`, blob `0cb16ad0d82da754bac0553a946a3513db70e1ee`, handles terminal SE/RR but **does not atomically reopen terminal Swiss tournament+stage when resetting its final match**. `artifacts/api-server/src/application/stages/stage-lifecycle.ts` finalizes Swiss standings and champion via `completeStage()`, updates global `players.status`, terminal `stage_participants`, tournament/stage lifecycle and writes an immutable `stage_completed` action with `undoPayload=null`. This is a **source-confirmed TS-B gap**, not a physically observed database failure.

## 3. R23 exactly scoped contract (design only)

Detailed [12-step same-transaction proposal, ownership map and TS01–TS12 QA matrix](../../WEB-005_A70_R22_TS_B_SCOPE.md) covers:

- Current write actor/tenant and actual terminal Swiss completed-state checks; no approved qualification/route or started later stage; refuse stale/malformed history.
- Canonical PG row/action lock ordering (tournament → stages → matches/membership/players → history/audit), reviewed **against the existing differing order in completeStage/revertMatch before implementation**; controlled match revision/completion action/correction receipt checks under one transaction.
- **Do not conflate match winner with Swiss standings winner**: `no_contest` has nullable match winner. Restore terminal stage only, change `stage.version`, reopen tournament and `activeStageId`, clear old champion, restore only genuine terminal-stage entrants and **never** reactivate players eliminated in earlier SE.
- Preserve all `result_history`; compensate old `stage_completed` with traceable new audit, without turning audit-only `undoPayload=null` into an independently global-Undo-eligible action. If structured provenance needs schema changes, A20 requires a separate GO.
- Re-finalize through a newly run `completeStage()` after a corrected result; recalculate Swiss standings/champion, write fresh completion event, keep previous result/history/audit immutable. Full rollback and 409 zero-write on concurrent completion, Undo, routing, stale receipt and fault-injection.
- **Proposed R23 single-author ownership:** reserve `artifacts/api-server/src/application/matches/revert-match.ts` plus **new** `artifacts/api-server/test/terminal-swiss-revert.integration.test.ts` in ONE new explicit A00-authorized feature branch/PR. A70 can be designated sole author **only after** separate GO; A80 T050 sporting peer review and PR45 overlap resolution required. `stage-lifecycle.ts`/old lifecycle tests and any A20 audit/schema/migration modifications are **NOT** automatic scope. PR39/42/45/51 source and public routes/Host remain untouched.

**Native future targeted commands after A20+owner-approved disposable PostgreSQL16 / exact SHA checkout, not run R22:**
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/terminal-swiss-revert.integration.test.ts
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts ./test/tournament-stages-lifecycle.integration.test.ts
~~~
A50 must collect real exit/TAP and post-Y/failed-X full-state snapshots; A60 independently rechecks exact new SHA. No author test self-certification.

## 4. One action for A00 / hard STOP

**A00 next:** inspect [TS-B R23 scope](../../WEB-005_A70_R22_TS_B_SCOPE.md), appoint one exclusive author for `revert-match.ts` against PR45, review canonical lock ordering and audited compensation with A20/A80/A60, then issue new exact-SHA/file GO if safe. **MP2B public RA/RB/RC remains WAIT_OWNER**; TS-B is not permission to change external CAS wire.

**R22 A70 writes:** two documentation files only, **0** application files and **0** new source PRs; no tests actually executed, no merge/cherry-pick, SQL/DDL, staging/live, paid CI or SWARM-006. `WEB005_IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD`.
