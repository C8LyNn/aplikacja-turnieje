# WEB-005 — A70 R20 / Final handoff to local coordinator 00

**Agent:** A70 — Match Lifecycle & Undo  
**Task:** WEB-005-T040-A70-R20  
**Wave:** R20 (2026-10-14 Europe/Warsaw)  
**GO:** SOURCE ONLY — PR42 frozen, public MP2B owner decision packet. **NO CODE GO**.  
**Central instructions:** `docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md`, §0–§2 / AGENT A70.  
**Coordinator:** local A00 Implementation Lead; single global Queen/HQ in separate project.  
**Release base:** `release/tournament-ops-20261013-01` at **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.  
**Required deliverable:** [WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md](../../WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md).  
**Final status:** `A70_R20_DOCUMENTED / PR42_SOURCE_ACCEPTED_CONDITIONAL / RUNTIME_NOT_EXECUTED / MP2B_POLICY_OPEN / WEB005_RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Current PR inventory and actual changes

| Package | Old R19 / new R20 exact head | Source / status |
|---|---|---|
| [P09 #42 Global Undo roster LIFO](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | **021bed269f9ea8ac8ce53caeea44263c098aa2dd** / **same** | OPEN DRAFT, unmerged. Independent A60 R18 SOURCE_ACCEPTED_CONDITIONAL at exact SHA. No R20 code changes. |
| [P06 #39 Cancel/Restore](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | 16053ee132756ca05b6f2cd1f0cabae823905387 / same | OPEN DRAFT, separate package |
| [P18 #51 historical Undo](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a / same | OPEN DRAFT, separate package |
| [#53 privacy](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34 | OPEN DRAFT, A100/A30/A60 scope, not modified by A70 |
| [#54 selected RR](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | bfa9d075b431185aa8bbf87bf021d64dde8ae22f | OPEN DRAFT, A120/A60 scope, not modified by A70 |

The PR42 R18 implementation is frozen at service blob `b47bc6e1452173fbc65b236909efe01aebf76116` (roster global latest Undo inside same locked transaction), route blob `6d9608104700bd0619754e362bc30d5af053bd0b` (typed HTTP 409 mapping), test blob `3479ab5fe888416858346f82691d4c57f369df25` (prior four roster regression cases). R20 A70 changed **zero** application source files and created **no** feature PR.

**Conflicts (future authorized integrator only):** `artifacts/api-server/src/routes/tournaments.ts` independently changed across PR39/42/44/46/51; `artifacts/api-server/test/revert-match.integration.test.ts` PR42/51. No composite SHA, merge, rebase or cherry-pick.

## 2. Independent QA R19 verification and accurate evidence level

- [A60 R18 signed exact-SHA source review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) independently reviewed **PR42 exactly 021bed269f9ea8ac8ce53caeea44263c098aa2dd** and assigned `SOURCE_ACCEPTED_CONDITIONAL` (global latest under tournament/roster transaction, 409 typed no-write invariant proposed). **Not a runtime PASS or app-level QA acceptance.**
- During R20 intake, no primary A60 R19 signed report could be verified at central `agent-reports/A60/WEB-005_A60_R19_HANDOFF.md` / `WEB-005_A60_R19_INDEPENDENT_QA.md` or branch query `a60-r19`. Do not conclude that a review never occurred in another uninspected location; the latest **directly verified** PR42 SHA verdict remains R18 conditional.
- [A50 R19 central receipt](../A50/WEB-005_A50_R19_RECEIPT.md), Git blob `412117e31c297353b35a3c21fbd616d41754d4b6` reports Node/Git preflight but **0 native API/React/PG16 app tests**. Real full trusted exact-SHA checkout, pnpm dependencies and isolated physical PG16 still missing.
- GitHub PR42 commit-linked Actions at pinned head: 0 observed, and submitted inline/formal PR review count: 0. The independently published A60 document remains real separate evidence.
- **Actual R20 A70 tests:** **NOT_EXECUTED**. Command names: N/A; exit codes: N/A; TAP counts: N/A; HTTP status/SQL snapshots: N/A. Static source verification and authored fixtures are not runnable evidence.
- Original WEB-004 38-case historical results remain 0 PASS, 3 external CI FAIL, 33 BLOCKED, 2 NOT_RUN; A10 R19 verified 29 original case IDs, **9 SOURCE_ID_NOT_AVAILABLE**, with NO complete signed dispositions. A70-related known CC-01 through CC-04 map to independent P06/P09/P18 but still have `NOT_SIGNED` owner statuses.

## 3. P09 PR42 concrete test execution contract for A50/A60

**One prerequisite A00 action:** grant A50 a trusted full Git checkout/CLI executor with exact SHA, Node22/pnpm10 and frozen monorepo dependencies. **Separate A20 + owner approval**: physically isolated disposable PostgreSQL16 TEST database; verify test-only `TEST_DATABASE_URL` without production/shared fallback, dedicated `TEST_DATABASE_SCHEMA=tm_test_t040_r20_roster`, explicit permission for `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA` scoped to this schema. No such safe environment was provided to A70.

**Only after that preflight, A50—not A70—executes:**

~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~

**Required actual fixture results:** deterministic X blocks on tournament FOR UPDATE (confirmed `pg_blocking_pids`), B commits newer undoable action Y, X returns 409 `UNDO_ACTION_CHANGED` and **does not modify the post-Y database state**; repeat for `delete_player` and `restore_player`. Valid latest roster Undo returns 200 exactly once; existing generic `restore_status` and completion `revert_match` global LIFO regressions remain correct. Capture exact SHA, actual commands/exits/TAP, PG/schema fingerprint with no secrets, before-after SQL snapshots of tournaments/players/action_log/matches/history/stages/picks. If checkout/isolation absent, report `ENV_BLOCKED / NOT_EXECUTED`, not PASS. [Signoff document §5](../../WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md) retains the detailed no-write and future Direct Revert matrix.

## 4. MP2B owner signoff, not an agent decision

**SOURCE_CONFIRMED:** public `POST /matches/:id/revert` currently forwards no expected revision/action ID; existing domain `revertMatch` has **optional** guards under its transaction. OpenAPI/React/Zod generated contract and Host do not send two-token CAS. Generic action-log endpoint is limited to 50 records, so cannot reliably discover older active completion id. New public strict CAS requires owner-approved authorized match read model/contract + coordinated Host client rollout, not a backend-only edit.

The published [MP2B owner-signable contract](../../WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md) offers EXACTLY three choices, all currently **UNSIGNED**:
- **A:** strict required pair `expectedMatchRevision` + `expectedCompletionActionId` for public revert; coordinated API/read model/Zod/React/Host cutover and old tabs refresh.
- **B:** strict new path plus separately named, time-boxed legacy client surface; sign actor restrictions, monitoring, expiry and owner of removal.
- **C:** explicit deferral with named review owner and residual risk, still no code.

Shared proposed negative behavior: missing/malformed request 422 `INVALID_REVERT_PRECONDITION` (malformed **raw** JSON 400-vs-422 owner choice), stale revision 409 `CONCURRENT_MODIFICATION`, stale completion action 409 `UNDO_ACTION_CHANGED`, all errors zero-write and duplicate/ABA safe; valid current pair 200 once. Must discover authorized revision-linked `activeCompletionActionId` beyond last-50 history, prevent automatic stale Host retry and preserve T050 internal correction receipts.

**OWNER/HQ signing fields still empty:** exact variant, canonical external key name (expectedMatchRevision vs expectedRevision), raw JSON mapping, both-stale priority, completion-id read path and roles, Host old tab compatibility/expiry, signer/timestamp/risk version. No A70 approval and NO R20 code GO. Any future MP2B patch requires new A00 task on exclusive file-reserved source base, independent A60 and actual A50 QA.

## 5. Final coordinator instructions / release hard STOP

- A00 sends [signoff packet](../../WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md) to named owner/HQ for actual signature or explicitly records `POLICY_OPEN`; A70 does **not** select policy.
- A00/A20 supply safe exact-PR42 PG16 execution route for A50 (or explicitly preserve `ENV_BLOCKED`), then A60 independently reconciles actual runner receipts. No test-debt waiver implied.
- A00/A10 recover authentic WEB-004 38-case sources, sign per-finding dispositions including CC-01–CC-04 and nine unresolved IDs; preserve 21-PR exact manifest and await PR53/54 independent exact-new-SHA source QA.
- A00 may request separately signed `HANDOFF_WITH_RUNTIME_TEST_DEBT` only after the remaining source/policy/38-case gates are independently closed; an explicit owner/HQ `FINAL_HANDOFF_GO` is still needed. Even an eventual transfer does not waive full composite SWARM-006 release testing.

**No code, no merge, no release/main rebase/cherry-pick, no unauthorized SQL/schema reset, no paid CI, no Replit staging/live, no SWARM-006 invocation or intermediate dispatch. WEB-005 remains IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD.**

**R20 A70 task completion: documentation + owner-signature request published; actual owner signoff and runtime verification pending.**
