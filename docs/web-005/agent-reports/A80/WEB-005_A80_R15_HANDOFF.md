# WEB-005 — AGENT A80 / R15 FINAL HANDOFF TO COORDINATOR 00

**Agent/role:** A80 — Stage Lifecycle & Sporting Rules
**Task:** WEB-005-T050-T051-A80-R8
**Wave/date:** R15 · 2026-10-14, Europe/Warsaw
**Authorization:** SOURCE-ONLY; no backend sport code change, no new code PR or composite, no SQL/CI/deploy.
**Evidence status:** POLICY_OPEN / PR45_PATCH_PROPOSED / PG16_NOT_VERIFIED / A60_PENDING.
**Release gate:** RELEASE_NO_GO / SWARM-006 HOLD.

## 1. Direct published R15 artifacts

**[A80 R15 SPORTING OWNER DECISIONS](./WEB-005_A80_R15_SPORTING_OWNER_DECISIONS.md)** — canonical new owner/HQ signature form and A50/A60 PR45 verification gates; created on central documentation branch in commit **7081308576096a645a204a55ed40baa8942be4d8**. No owner policy is signed by this agent.

**[A80 R15 HANDOFF](./WEB-005_A80_R15_HANDOFF.md)** — this final document, published on central branch at docs/web-005/agent-reports/A80/WEB-005_A80_R15_HANDOFF.md. This path is directly readable by A00; no automatic cross-thread message delivery is asserted.

**Supporting unchanged baseline:** [A80 R14 owner options](../../WEB-005_A80_R14_OWNER_SPORTING_DECISIONS.md), [R13 18-case acceptance matrix](../../WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json), [R11 model fixture](../../WEB-005_A80_R11_DETERMINISTIC_FIXTURES.json).

## 2. Exact refs/PR SHA and GitHub review evidence (R15 readback)

| Evidence | Verified value |
|---|---|
| Central R15 instruction | docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md blob **e6950cbff7e521ed9b3ff774e7787e8d598a966d**; read §0–§2 and AGENT A80 |
| Release / PR32 | release/tournament-ops-20261013-01 @ **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**; OPEN/unmerged against main **c50cc48e6fa508592bda3f4838111e9cff5af80c** |
| [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) A80/P12 | OPEN DRAFT, unmerged; HEAD **a7a87bc019731191dbfa44bee6939e3fa25e27f4**, base release |
| [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) A70/P09 | OPEN DRAFT, unmerged, HEAD **1ae0ccb801f4177052bff1ec7041e55b8c992c8b** |
| [PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) A70/P18 | OPEN DRAFT, unmerged, HEAD **2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a** |
| PR45 reviews/comments | 0 GitHub review submissions and 0 discussion comments at R15 readback. Separate signed A60 evidence could exist, but is **NOT_VERIFIED_BY_A80** |
| PR45 Actions | [run 38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) completed failure at upstream Pack19 snapshot consistency; downstream gates skipped; RR4 application test not demonstrated by this run |

**PR45 exact changed paths (reviewed):**
- artifacts/api-server/src/application/matches/revert-match.ts, changed source blob **956e934fbdf0494cbb32db0751ed058eecc0c835**.
- artifacts/api-server/test/round-robin-terminal-reopen.integration.test.ts, blob **e429e8d04ef08f662dcff0239b8d30c2124a6bfc**.
- docs/web-005/WEB-005_A80_R10_HANDOFF.md.
- docs/web-005/WEB-005_A80_R10_T050_RR_PATCH.md.

**Other inspected source:** release application/stages/stage-lifecycle.ts blob **e344fd4198e081a3a4574d976829665bea71fb6a**, domain/tournament/swiss.ts blob **aa00b4ef445aaff7eb48152eb5d6c2063befbf7a**. Existing 18 acceptance scenarios JSON blob **280666688fb3727d70501ea8235ecaceadb8af59**. R14 owner card blob **8a5ac59afcf42dc5d12abf0c6111be33ed972853**, unsigned.

## 3. T050 / PR45 actual finding disposition and precise physical test

**Original SOURCE_CONFIRMED defect:** terminal multi-stage Round Robin Revert globally reactivated players by tournament ID, including earlier nonqualifiers. **PR45 PATCH_PROPOSED:** select/lock only terminal RR stage roster; update player status to active with tournament ID + stage roster ID filter and affected row parity. No new edit authorized R15.

**A50 isolated PG16 acceptance:**
- Checkout exact PR45 HEAD noted above and install locked Node22/pnpm10 dependencies. Dedicated physically isolated, disposable PostgreSQL16 test DB confirmed by A20/A50, with owner/HQ-approved DROP of one unique test schema; use TEST_DATABASE_URL explicitly, TEST_DATABASE_SCHEMA=tm_test_a80_r15, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA. No shared/prod DB, no fallback, no secrets in logs. The actual test helper performs DROP SCHEMA CASCADE.
- In artifacts/api-server, run the commands independently (only A50 after preflight):

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

- At workspace root additionally: pnpm --filter @workspace/api-server typecheck.
- Test SE8→terminal RR4 in the authored dedicated test: 8 initial entrants, 4 advance into RR, 6 RR matches completed and terminal stage finalized; direct Revert final RR match in standalone PR45 must set match pending, stage/tournament active and winner IDs null; keep exactly four RR members active and four previous nonqualifiers globally eliminated with previous nonqualifier memberships intact; preserve RR stageSeed, clear terminal finalRank, retain immutable history, undo exactly one completion action, record exactly one Revert audit event. Correct and re-complete: exactly one RR4 champion, still no nonqualifier resurrection, new result revision appended.
- A50 should snapshot previous **qualified** first-stage memberships separately: a compatibility trigger may project global player statuses into their historical stage-1 membership; do not declare all stage-1 rows untouched without actual evidence. Record exact HTTP statuses, command + OS exit code, redacted connection fingerprint, Node/pnpm/PG versions and evidence URLs. A60 must independently judge actual vs expected at exact SHA.
- Direct Revert under PR45 and global Undo-last under PR42/PR51 have potentially different latest-action precedence because terminal stage_completed is newer than final match_result_submitted. This remains A70/public Direct Revert CAS policy, not silently decided by A80 or by an unbuilt composite.

**R15 A80 runtime test status:** native application TypeScript/HTTP/PG16/typecheck/browser **NOT_EXECUTED by A80**. No confirmed A50 command/exit receipt for exact PR45 in accessible inspected GitHub/central materials. Do not self-issue SOURCE_ACCEPTED or RUNTIME_VERIFIED. Existing PR45 CI failure is Pack19 prerequisite, not a target-feature verdict.

## 4. T050/T051 owner policy readiness and historical dispositions

**New R15 owner decision artifact:** [WEB-005_A80_R15_SPORTING_OWNER_DECISIONS.md](./WEB-005_A80_R15_SPORTING_OWNER_DECISIONS.md). Decision keys pending:
- POLICY-TERMINAL-SWISS: **TS-A DENY_409 zero writes** vs **TS-B ATOMIC_REOPEN** stage+tournament+winner/roster/statuses+immutable history+stage_completed audit and rollback. Both have explicit compatibility and organizer correction UX impact. Neither signed.
- POLICY-SE-ROUND: earliest actionable pointer vs max-generated pointer with separate actionable UI projection.
- POLICY-SWISS-PAIRING and POLICY-SWISS-BYE-NC: priority of minimum rematches vs score bands, deterministic solver, impossible-repeat fallback, BYE fairness and completed no_contest versus cancelled historical opponent treatment.
- POLICY-DE-GF-RUNNERUP / POLICY-DE-RANK-3-N: loser of decisive GF/played reset, reset BYE, second-loss elimination waves and seed/tied rank policy.
- BIZ-21-18 RR stageSeed is fixed in release source → regression-only. WEB-004 A52-F001/F002 and BIZ-21-09/12 stay WITHDRAWN. No ghost patch/new audit.

**Source consequence for terminal Swiss:** current revert-match.ts terminal reopen switches only SE/RR. A Swiss final match can be reset while stage and tournament remain completed (STATIC_INFERRED, not PG incident confirmation). CompleteMatch requires active stage. An owner signature and safe independent native repro must precede coding.

**Offline model evidence actually obtained in R15:** 11 cases, via independent JS code in connector execution: Swiss5 and Swiss6 greedy 1 rematch vs optimal 0; forced SW4 examples min 1/min 2; BYE recipients P4/P5; completed no_contest counted, cancelled not; 3 DE GF/Reset champion/runner pairs (A,D),(A,D),(D,A). MODEL_CHECKED only; no OS subprocess/exit code and not native project code tests.

## 5. EXACTLY ONE later source patch candidate — conditional HOLD

**T050-TERMINAL-SWISS-DENY-GUARD** only **IF** owner signs TS-A DENY_409, A00 receives supporting native/A60 QA as required, and A00 grants a separate precise code GO with selected base SHA and exclusive file/hunk ownership. Future test-first dedicated terminal-swiss-revert.integration.test.ts, then narrow fail-closed guard in application/matches/revert-match.ts after lock/action/history validation and before writes; 409 owner-approved domain mapping, all status/history snapshots unchanged on reject. Do not modify active or nonterminal Swiss semantics.

**File conflicts:** PR45 already modifies exactly revert-match.ts; PR42 and PR51 modify routes/tournaments.ts and revert-match.integration.test.ts. Route 409 mapping needs A70/A00 file release. Never implement by modifying any of those PR branches here; no composite branch or merge. If owner selects TS-B, the TS-A proposal is cancelled; separately scope wider atomic stage/tournament reopen and audit compensation under a different explicit future GO. Do not combine with T051 Swiss pairing.

**R15 rule:** only potential conditional code lane A100 S2B; A80 has SOURCE-ONLY and no new implementation authorization. Candidate is not GO.

## 6. Final execution record, publication and A00 next action

**Actual A80 R15 actions:** GitHub read common/A80 R15 instructions, PR32/42/45/51 metadata & changed files, PR45 source diff/test and workflow jobs, prior R14 policy/hand-off, current DECISIONS/BACKLOG, R13 acceptance and R11 model data. Published required owner policy document and this report **on central GitHub documentation branch**.

**App/source paths changed by A80 R15:** none. **New implementation PR:** none. **Real runtime app command with OS exit:** none / NOT_EXECUTED. **Independent A60 verdict:** PENDING/NOT_VERIFIED, not a self-review. **No actual test database writes.**

**Hard STOP complied with:** no source-code mutations or PR45 edits, no new app PR, no merge/cherry-pick/rebase, no shared/prod SQL/DDL/backup, no manual paid CI rerun, no staging/live/Replit, no SWARM-006 activation.

**Next for coordinator A00:** record exact GitHub R15 links and SHA in register; obtain signed owner/HQ terminal Swiss option and independent SE/Swiss/DE decisions, get A50 exact-SHA physically isolated PG16 receipt for PR45 or precise BLOCKED runbook, obtain signed A60 exact-SHA review. Then decide future code-hunk GO only if evidence/ownership/policy allows. Whole WEB-005 approved backlog closeout and final-only SWARM-006 transfer remain separate decisions.

**FINAL:** A80_R15_SOURCE_ONLY_COMPLETE / OWNER_POLICY_OPEN / PR45_QA_NOT_VERIFIED / RELEASE_NO_GO / SWARM-006_HOLD.
