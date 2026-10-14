# WEB-005 — A80 R11 / ONE FUTURE PATCH PLAN (NO R11 CODE)

**AGENT:** A80 | **TASK:** `WEB-005-T050-T051-A80-R4` | **WAVE:** R11  
**STATUS:** `FUTURE_ONLY / POLICY_GATE / A00_NEW_GO_REQUIRED`  
**Current release:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Frozen dependency:** [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) HEAD `a7a87bc019731191dbfa44bee6939e3fa25e27f4`, [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) HEAD `1ae0ccb801f4177052bff1ec7041e55b8c992c8b`.

## 1. Proposed single next patch

**Candidate:** `T050-L1-TERMINAL-SWISS-SAFETY` (P0 integrity), **only if owner/HQ signs `POLICY-TERMINAL-SWISS=DENY_409`**. This is a conditional scope proposal, **not** approval, implementation or a choice of sporting policy.

Why one small patch first: in the current source a completed Swiss match can be reverted while terminal stage and tournament remain completed, leaving a required match pending and stale winner. Denying this single illegal transition can be very narrow if DENY is authorized, and avoids invoking new restoration rules. Alternative `ATOMIC_REOPEN` would be a **different** planned patch with multi-table status restoration, trigger/version/Undo tests, and larger review; do not treat DENY scope as authorization to implement REOPEN.

**Allowable smallest diff if DENY selected:** in `artifacts/api-server/src/application/matches/revert-match.ts`, after fetching and locking tournament/stage/match and validating historical action, and *before any mutation*, check `stage.format==='swiss' && stage.status==='completed' && tournament.status==='completed' && stage is final`; fail with controlled 409, no transaction writes. Prefer **new explicit terminal error** only if A00 permits API evolution and A100 route ownership; existing `DOWNSTREAM_BLOCKED` is the minimal no-route-touch alternative but also needs explicit approved external error contract. **Do not** change completed but nonterminal Swiss handling or active Swiss correction.

**Test-first:** create one new `artifacts/api-server/test/terminal-swiss-revert.integration.test.ts`, avoiding PR42 existing `revert-match.integration.test.ts`; create deterministic fixtures TS01–TS08 from `WEB-005_A80_R11_DETERMINISTIC_FIXTURES.json`. Exact status and write-set oracles:
- Terminal Swiss4/2R completion, winner and stage ranks established, final match completed; direct Revert returns approved 409; compare before/after entire snapshot `matches`, `result_history`, `action_log`, `stage_participants`, `players`, `tournament_stages`, `tournaments`, approvals/routes (if present).
- Undo-last of same completion action must be separately evaluated under T040 MP2A global-LIFO and action semantics; do not assert outcome for a newer `stage_completed` action without verifying canonical action ordering. Policy may require specific undo-last rejection before reaching Revert.
- Negative system BYE remains 409; no_contest completed-final match also 409; active Swiss final round still reversible; earlier-round Swiss with downstream matches remains blocked; source completed, successor already started/qualified output approved remains blocked.
- At least one 8→4→Swiss4 fixture confirms no earlier nonqualifier reactivation. Denial must not increment stage/match revision or insert audit actions.
- Unit/HTTP error-code contract; concurrent independent calls each return deterministic controlled conflict with zero writes; history remains immutable.

**Important history nuance:** `stage_completed` action may be newer than `match_result_submitted`. If public direct Revert/Undo latest-action policy in A70 differs, hold test assertion and route to A70/A00 rather than redefining Undo LIFO.

## 2. Collision and staging contract

| Location | Existing owner / current change | Future handling |
|---|---|---|
| `artifacts/api-server/src/application/matches/revert-match.ts` | PR45 A80 RR scoped reactivation, frozen; R11 A80 SOURCE-ONLY | A00 explicit release of R11 lock and new implementation lane; minimal Swiss-specific hunk, preserve PR45 |
| `artifacts/api-server/test/revert-match.integration.test.ts` | PR42 A70 MP2A modifies existing test | **DO NOT TOUCH**; create dedicated new integration test |
| `artifacts/api-server/src/routes/tournaments.ts` | A100 R11 S1B-D DELETE, PR42 Undo and PR39 MP1 also routes | **NO R11 EDIT**; future only if new error code approved and A100 file released |
| `artifacts/api-server/src/application/matches/complete-match.ts` | baseline active-stage check, RR stageSeed code | read-only; regress correctness, do not change |
| `artifacts/api-server/src/application/stages/stage-lifecycle.ts` | DE placement pending policy | no overlap in TS-A proposal; separate future T051 |
| `artifacts/api-server/src/domain/tournament/swiss.ts` | Swiss rematch algorithm POLICY_OPEN | not part of TS-A; future independently scoped T051 |
| `lib/db/migrations/**` | A20-ledger policy | NO SQL/DDL/migration changes |

**Branching:** following renewed A00 GO, create isolated branch pinned to an explicit chosen base SHA; do not mutate PR45/PR42/PR39. A00 decides whether to branch from release and later combine or use a specifically tested composition. Composite compatibility and merge belong to later authorized integration; no stacked undocumented ancestry. Changes to direct Revert semantics require independent A70/Udo audit.

**DoD before author claims:** test source added first, minimal code patch separate commit, no policy defaults, exact base/head SHA, source diff and negative table, A50 runtime independent PG16 execution and command/exit evidence, A60 independent exact-SHA review, A00 backlog/policy acceptance. Release and SWARM-006 remain NO-GO.

## 3. Other tracks remain separate future tasks

1. **If owner selects `ATOMIC_REOPEN`** instead of DENY, do **not** use the one-file fail-closed implementation plan; design separate transactional reopen with PG trigger, lifecycle version, winner, roster, history and rollback test matrix. Requires new GO and possibly routes coordination.
2. **SE `currentRound`** is no-code until semantics (earliest actionable vs maximum generated) signed and API/UI consumers inventoried.
3. **T051 Swiss matching** is independent `domain/tournament/swiss.ts` plus `test/swiss.test.ts` only *after* BYE/rematch/no_contest/fallback complexity policy. Evidence for Swiss5 and Swiss6 and forced fallback is fixture-only, not application runtime.
4. **T051 DE placement** is independent `application/stages/stage-lifecycle.ts` plus DE API/PG tests only *after* placement ranking 3–N and GF/Reset semantics approved. RR stageSeed only regression.
5. **P12 PR45** must be source-reviewed and PG16-tested on its own HEAD before *any* claim that RR resurrection fix is accepted.

## 4. Future GO request to A00 — not issued automatically

Only when R11 L1/L2/L3 work and at least one source-code slot is released, owner signs the relevant terminal Swiss policy, A70/A100 file ownership is clarified, and A50 has an independently safe test environment, A00 may grant a **new** `GO SOURCE-CODE ONLY` for **one** chosen patch. If any prerequisite absent: `HOLD CODE` and report policy/ownership blocker. No SWARM-006 activation.

**Status:** `DESIGN_COMPLETE / CONDITIONAL_FUTURE_PATCH / CURRENT_IMPLEMENTATION_STOP`.
