# WEB-005 / A80 / R15 — SPORTING OWNER DECISIONS

**STATUS: AWAITING OWNER/HQ SIGNATURE — POLICY_OPEN.** This document is a decision proposal, not an approval or code authorization.

**Agent:** A80 — Stage Lifecycle & Sporting Rules
**Task:** WEB-005-T050-T051-A80-R8
**Wave/date:** R15 / 2026-10-14 Europe/Warsaw
**Authority:** SOURCE-ONLY; no backend sport code, new PR, merge, test database writes, or SWARM-006 dispatch.
**Central source:** R15 instructions Git blob e6950cbff7e521ed9b3ff774e7787e8d598a966d.
**Base:** release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.
**Frozen P12:** [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) @ a7a87bc019731191dbfa44bee6939e3fa25e27f4, OPEN DRAFT.

## D1 — Terminal completed Swiss: TWO exclusive choices

**SOURCE_CONFIRMED:** Current RevertMatch has terminal stage/tournament reopening for Single Elimination and Round Robin, but not for terminal Swiss. A Swiss match can be reset pending while the completed stage/tournament and winner status remain unchanged; this invalid persisted outcome is STATIC_INFERRED until a real isolated PostgreSQL16 reproduction. CompleteMatch requires the stage to be active.

**Invariant applying to EITHER decision:** no successful Revert may commit a required pending terminal Swiss match while the terminal stage/tournament remain completed. Match, stage, tournament, winner IDs, activeStageId, completedAt, player/stage-participant statuses, history, versions and audit must agree.

| Choice | Required operation | Product/compatibility impact |
|---|---|---|
| **TS-A: DENY_409** | Completed terminal Swiss Revert returns a controlled HTTP 409 with a SIGNED domain code; absolutely zero writes to match, result_history, action_log, player/status, membership/rank, stage/tournament/version/winner. | Fail-closed and narrow scope; organizer cannot correct a finalized Swiss via this endpoint and must use a separately authorized correction flow. Existing clients must display a meaningful controlled error. No silent Undo reversal. |
| **TS-B: ATOMIC_REOPEN** | Under canonical locks and latest-action/CAS validation, single transaction resets only selected match; activates terminal Swiss stage and tournament, clears their winners and stage completedAt, sets correct terminal activeStageId, restores only terminal-roster player eligibility, preserves eliminated earlier nonqualifiers, and handles audit compensation. Entire transaction rolls back on any failure. | Allows final-result correction and re-completion, but touches more entities and requires compatibility checks for standings, audit actions, revisions, triggers, current stage pointer, Direct Revert vs Global Undo and client readback. No stage_completed ghost action or premature qualification reversal. |

**Mandatory positive/negative acceptance:** final played, walkover and completed no_contest (the match winner may be NULL), system BYE (still protected/409), stale actor or revision, post-lock latest action race, non-terminal/active Swiss legitimate corrections, downstream stage already active or approved routing, 8→4→terminal Swiss4 preserving nonqualifiers, and fault injected between match reset and stage/tournament restoration. For TS-A compare **all** relevant tables before/after 409; for TS-B require full transactional rollback evidence, immutable result_history and one coherent correction audit path.

**Decision entry to sign:** POLICY-TERMINAL-SWISS = [ ] TS-A DENY_409 [ ] TS-B ATOMIC_REOPEN.
Owner name: __________  Date: __________  DECISIONS ID: __________.
Approved external error identifier + HTTP: __________.
Organizer UI/correction permission and Direct Revert/Undo-last precedence: __________.
How to compensate or preserve stage_completed action: __________.
Backward compatibility and rollback owner: __________.

Until that entry is signed: **POLICY_OPEN / CODE STOP**. A signed sport policy is not itself source-code GO.

## D2 — Independent sporting-policy decisions; none auto-selected

| Owner key | Evidence and explicit alternatives |
|---|---|
| **POLICY-SE-ROUND** / A52-F018 | SE4 R1 feeder reverted after R2 bracket generated. R2 losing feeder slot clears, other feeder untouched. Choose EARLIEST_ACTIONABLE (stage/tournament currentRound rewinds from 2 to 1), or MAX_GENERATED (remain 2 with a separate actionableRound=1 UI/API projection). Sign Host, bracket and public API semantics. |
| **POLICY-SWISS-PAIRING** / BIZ-21-17 | For Swiss5 and Swiss6 R3 synthetic histories, current greedy pairing has 1 repeated encounter even though complete 0-repeat pairing exists. Sign objective precedence: minimum rematches vs score-group distance vs retaining greedy, plus deterministic tie-break and solver size/work bounds. Forced SW4 histories have true minimum 1 and 2 repeats, so cannot require impossible zero repeat. |
| **POLICY-SWISS-BYE-NC** | Source chooses lowest-ranked entrant without an earlier BYE, and falls back to lowest-ranked even when all had a BYE. Completed no_contest currently counts as earlier opponent in pairing but is excluded from standings wins/Buchholz; cancelled does not count. Sign whether these exact source rules remain and define BYE fairness scope, exception cases and walkover behavior. |
| **POLICY-DE-GF-RUNNERUP** / BIZ-21-19 | DE4 decisive final examples: A>D with reset system BYE → A champion, D runner-up; GF D>A then played reset A>D → A,D; GF D>A then played reset D>A → D,A. Current preview ranks winner then other players by stageSeed and can put a different seed second. Sign runner-up as loser of decisive **played** GF or Reset, or explicitly choose a different contract. A system reset BYE is not a second played loss. |
| **POLICY-DE-RANK-3-N** | Choose rank according to second-loss elimination wave, equal-place ties or deterministic stageSeed tie-break inside wave, with non-power-of-two bracket and BYE cases. Do not silently use seed as historical elimination order. |

**Regression / historical disposition:** BIZ-21-18 RR stageSeed selection is source-corrected in release and remains regression-only. Withdrawn WEB-004 A52-F001/F002 and BIZ-21-09/12 remain WITHDRAWN. No ghost patches or new WEB-004 audit.

**Evidence limitation:** 11 deterministic R11 fixtures were rechecked in an independent small model during R15: Swiss5/6 greedy=1 vs possible=0, forced fallback=1/2, two BYE examples, no_contest vs cancelled historic encounter filter, three decisive DE outcomes. These are **MODEL_CHECKED**, NOT native TS, HTTP, PostgreSQL16 or A60 acceptance. The 18 conditional cases in [R13 acceptance JSON](../../WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json) are expectations conditional on product policy, not test executions.

## PR45 P12: precise independent QA required before acceptance

- PR45 still changes only terminal RR roster-scoped player reactivation, a dedicated SE8→RR4 integration test, and R10 docs. The prior original global all-player reactivation is SOURCE_CONFIRMED; the fix is PATCH_PROPOSED.
- A50 must use exact PR45 HEAD above, Node22/pnpm10 locked install and physically isolated disposable PostgreSQL16, owner-approved restricted schema reset, nonproduction TEST_DATABASE_URL, unique TEST_DATABASE_SCHEMA=tm_test_a80_r15, and TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA. Helper performs DROP SCHEMA CASCADE; regex test safety is **not** proof of physical isolation. No credentials in logs. No fallback to shared DATABASE_URL.
- A50 targeted commands from artifacts/api-server; each as a separate Node test-runner process after preflight:

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

- From repository root, independently: pnpm --filter @workspace/api-server typecheck.
- **Must observe:** SE8 qualifies 4, terminal RR4 roster exactly 4, complete all 6 RR matches/final stage; Revert last RR match (standalone PR45 expectation 200) sets match pending and tournament/terminal stage active, clears winners, restores terminal activeStageId, makes **only RR4 members globally active**, preserves four prior nonqualifiers as eliminated and their earlier stage membership unchanged, retains RR stage seeds, clears final ranks and appends exactly one Revert action while previous result_history remains immutable. Re-complete/finalize: one champion from RR4, previously excluded four remain eliminated and corrected result gets next history revision.
- Record before/after first-stage **qualified** membership separately: compatibility trigger might propagate global player status into their earlier stage row. Do not claim every previous-stage row is untouched without observing.
- Completing the stage writes a later stage_completed action. Global Undo-last in [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) and malformed-history safeguards in [PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) may impose distinct latest-action conditions. **Do not** infer composite behavior or quietly impose a new public Direct Revert CAS policy.
- A50 logs exact checkout SHA, redacted environment/DB fingerprint, command, actual exit code, PASS/FAIL/SKIP, migrations and artefact URL. A60 independently checks and signs exact SHA. No such accepted PG16 outcome or GitHub PR45 review was verified by A80 on R15 preflight: **NOT_VERIFIED / A60_PENDING**.

## D3 — EXACTLY ONE proposed next narrow implementation request (FUTURE HOLD)

**Candidate only if TS-A is SIGNED:** T050-TERMINAL-SWISS-DENY-GUARD. It is potentially the smallest P0 containment: test-first one new dedicated terminal-swiss-revert.integration.test.ts then one narrow fail-closed terminal Swiss guard in artifacts/api-server/src/application/matches/revert-match.ts after locks/action/history validation and before any writes. Explicit HTTP/domain code per owner signature; no active/nonterminal Swiss behavior change.

**Conflicts requiring future A00 resolution:** PR45 touches that same revert-match.ts; [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) and [PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) touch routes/tournaments.ts plus the existing revert-match.integration.test.ts. Avoid editing A70 test/route without exclusive file ownership; create new dedicated test. A00 selects exact base/ancestry, file hunk lock and grants **separate** post-evidence code GO. R15 has NO A80 code lane. If owner selects TS-B, STOP this narrow denial plan and design a separate multitable atomic-reopen patch with stage_completed audit handling. Do not code both.

**Final outcome:** OWNER_DECISIONS_READY / ALL_UNSELECTED / P12_QA_PENDING / SOURCE_ONLY / RELEASE_NO_GO. SWARM-006 remains HOLD until formal WEB-005 final closeout and a distinct owner/HQ authorization.
