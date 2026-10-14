# WEB-005 — A80 R18 FINAL HANDOFF TO A00

**AGENT / ROLE:** A80 — Stage Lifecycle & Sporting Rules
**TASK:** WEB-005-T050-T051-A80-R18
**WAVE / DATE:** R18, 2026-10-14 Europe/Warsaw
**GO:** SOURCE-ONLY, owner decision and PR45 exact-SHA QA readiness; NO code lane.
**FINAL:** A80_R18_SOURCE_ONLY_COMPLETE / OWNER_SIGNATURES_NOT_OBTAINED / POLICY_OPEN / P12_SOURCE_ACCEPTED_CONDITIONAL / PG16_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.

## 1. Published deliverables

1. [WEB-005_A80_R18_OWNER_DECISIONS.md](./WEB-005_A80_R18_OWNER_DECISIONS.md) — direct GitHub owner-signable sporting decisions, PR45 A50/A60 PG acceptance oracle and one conditional next code request. Created in control docs commit **152e3dd1138d78f1a10b3dece2441d6798b5fa9a**.
2. [WEB-005_A80_R18_HANDOFF.md](./WEB-005_A80_R18_HANDOFF.md) — this final report to A00 in docs/web-005/agent-reports/A80.
3. Reused, not modified: [A80 R17 signed-options queue](./WEB-005_A80_R17_POLICY_OWNER_QUEUE.md) (blob 9fbfeac486f0ee8b89fb06c2955c1b4eced01781), [R13 18-case conditional fixture matrix](../../WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json) (blob 280666688fb3727d70501ea8235ecaceadb8af59).

**No owner/HQ signature** selecting any sport semantics was present in current DECISIONS.md or supplied by the user. The new document is **an unsigned request for decision**, not evidence of owner approval.

## 2. Verified source identity, PRs and independent R17 QA

- R18 common §0–§2 and AGENT A80 task were read in central [R18 prompt](../../WEB-005_WAVE_R18_AGENT_PROMPTS.md), blob **fd08cedcbd2db3222e4a444403180414d1666f6c**. No other agent task performed.
- Release base release/tournament-ops-20261013-01: **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**; PR #32 OPEN and unmerged against main SHA **c50cc48e6fa508592bda3f4838111e9cff5af80c**.
- [PR #45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) P12 terminal RR, **OPEN DRAFT / unmerged / unchanged HEAD a7a87bc019731191dbfa44bee6939e3fa25e27f4**, base release. Changed exact files: artifacts/api-server/src/application/matches/revert-match.ts, artifacts/api-server/test/round-robin-terminal-reopen.integration.test.ts, and two R10 documentation files. Source blobs: revert-match.ts **956e934fbdf0494cbb32db0751ed058eecc0c835**, test **e429e8d04ef08f662dcff0239b8d30c2124a6bfc**.
- Related [PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) A70 Undo HEAD **021bed269f9ea8ac8ce53caeea44263c098aa2dd** at final verification (initial R18 preflight **25b09f1a48a85ae882b817118f5d8c23bffbe383**), OPEN DRAFT; [PR #51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) A70 malformed Undo HEAD **2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a**, OPEN DRAFT. These are R18 preflight snapshots, not future merge compatibility claims; A70 PR42 has its own R18 code GO and may move while this report is authored.
- [A60 R17 independent report](../A60/WEB-005_A60_R17_INDEPENDENT_QA.md) blob **ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d**; [21-packet R17 matrix](../A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) blob **cc6f24f582d216e99d8870d0e3519ff497fd8ad3**, P12 source_verdict **SOURCE_ACCEPTED_CONDITIONAL**, exact PR45 SHA, historical R15 signed narrow source review carried forward unchanged HEAD. QA_ACCEPTED_FULL false; runtime = no exact-SHA A50 application receipt / NOT_EXECUTED_OR_BLOCKED; RELEASE NO-GO.
- [A50 R17 actual receipt](../A50/WEB-005_A50_R17_RECEIPT.md), blob **da3b9892a2675748263091c6193306c61995ce27**, reports Node/Git preflight, absent runnable full checkout/pnpm/physical disposable PG16, **0 executed native RTL/API/PG16 app tests**. There is no A80 execution and no claim of a shell process exit. A60 source review must not be mistaken for PG runtime PASS.
- PR45 GitHub Actions [38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) completed FAILURE at inherited Pack19 old source matcher; later application/release gates skipped. PR35 holds separate matcher correction. Target round-robin integration test has not been demonstrated to run in Actions. Zero PR45 GitHub review submissions observed, not contradicting separately published signed A60 source matrix.
- Current DECISIONS.md blob **9f2123c49741d0df00ea77ccf8f21b812d0f265e** still lists terminal Swiss/SE/Swiss/DE signoffs among POLICY_OPEN; A80 makes no default choice.

### Final concurrent PR42 readback

After A80's initial R18 GitHub snapshot, A70 advanced **PR42** from 25b09f1a48a85ae882b817118f5d8c23bffbe383 to **021bed269f9ea8ac8ce53caeea44263c098aa2dd** (2 commits ahead / 0 behind). Compare shows changes to artifacts/api-server/src/application/players/tournament-roster.ts (+21/-1) and src/routes/tournaments.ts (+1/-1). No workflow runs were returned for the new HEAD at this snapshot. **This belongs to A70's separately authorized R18 lane, not to A80.** A60's R17 blocked verdict was tied to the prior PR42 SHA and cannot automatically certify the new code; exact independent R18 A60 re-review is required. PR45 remained OPEN DRAFT unchanged at a7a87bc019731191dbfa44bee6939e3fa25e27f4.

## 3. PR45 exact QA acceptance and source finding

**Before PR45 SOURCE_CONFIRMED:** terminal multi-stage RR match Revert reactivated all global tournament players, including earlier eliminated nonqualifiers.

**PR45 PATCH_PROPOSED / A60 SOURCE_ACCEPTED_CONDITIONAL:** in a terminal RR reopen path, lock stage_participants roster and globally reactivate only those player IDs inside tournament ID; reject affected row count mismatch. The authored SE8→RR4 test checks earlier excluded players, reopened stage/tournament winners/status, immutable result history, audit and successful correction/re-finalization. This is **test source authored**, not test runtime.

**A50 exact positive persisted oracle:** 8 registered SE entrants -> top 4 terminal RR members, first 4 SE matches completed, 6 RR matches completed, final stage/tournament with one champion. Revert last RR match on *standalone PR45* should return HTTP 200: selected match pending, terminal stage+tournament active, both winner IDs cleared, activeStageId current RR4, only 4 RR entrants active globally; 4 earlier nonqualifiers remain eliminated with their first-stage nonqualifier membership unchanged. RR4 stageSeed and roster unchanged, final ranks reset, existing result_history immutable, one completion action marked undone and one Revert audit event. Correct and complete again: legal RR champion, nonqualifiers remain eliminated, second revision appended. Capture previous *qualified* stage rows independently due to migration 0002/0006 compatibility sync trigger. Negative stale/double/unauthorized/mismatch cases must fail atomically. PR45 direct Revert result must NOT be extrapolated to PR42/51 Global Undo latest-action CAS/Host semantics; public Direct Revert policy remains owner-signed separately.

**Authorized only for A50/A20/owner after physically isolated PG16 preflight:** exact PR45 HEAD, full per-SHA checkout, Node22/pnpm10 locked deps, owner-approved dedicated disposable PG16 TEST_DATABASE_URL (never DATABASE_URL fallback), unique TEST_DATABASE_SCHEMA=tm_test_a80_r18, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA and *explicit* schema reset authorization. Helper uses DROP SCHEMA CASCADE. Commands from artifacts/api-server (each separate process):

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

From repository root: pnpm --filter @workspace/api-server typecheck.

**Needed A50 receipt:** exact checkout/test blobs, Node/pnpm/PG versions, redacted host/DB fingerprint and schema, command and actual process exit, PASS/FAIL/SKIP, table snapshots, logs permalink. Without verified isolated execution host and separately signed destructive reset: **BLOCKED/NOT_EXECUTED**, never PASS. A60 certifies actual result independently at same SHA.

## 4. Sport owner signoff queue and constraints

See [R18 OWNER DECISIONS](./WEB-005_A80_R18_OWNER_DECISIONS.md) for six individually signable decisions:
1. POLICY-TERMINAL-SWISS: **TS-A DENY_409 zero writes** vs **TS-B ATOMIC_REOPEN** match/stage/tournament/winner/roster/history/audit/rollback. No owner selection; source lacks terminal Swiss reopen and invalid persisted outcome STATIC_INFERRED, not runtime-proven. Error code, organizer UI and global Undo/latest-action compensation require owner.
2. POLICY-SE-ROUND: earliest actionable vs maximum generated stage/tournament currentRound (separate actionable projection and Host/bracket contract if generated kept).
3. POLICY-SWISS-PAIRING: minimum rematches vs score bands vs current greedy. Swiss5 and Swiss6 existing greedy 1 repeat but zero-repeat witness, SW4 forced minima 1 or 2 — policy must define deterministic objective and bounded fallback.
4. POLICY-SWISS-BYE-NC: current lowest-ranked new-BYE / repeat when exhausted, completed no_contest prior encounter vs cancelled ignored, scope of fairness and standings/walkover.
5. POLICY-DE-GF-RUNNERUP: loser of decisive played GF/reset and reset BYE interpretation, or explicit alternative; example champion/runner-up (A,D),(A,D),(D,A).
6. POLICY-DE-RANK-3-N: second-loss wave, shared ties or seed tiebreak, byes/nonpowers-of-two. Current source sorts champion then rest by stageSeed.

**Historical findings:** WEB-004 A52-F001/F002 and BIZ-21-09/12 are WITHDRAWN and remain WITHDRAWN. BIZ-21-18 RR stageSeed already source-corrected and regression-only. No source task created from these. Prior R11/R13 Swiss/DE in-memory fixture MODEL_CHECKED status cannot be promoted to TS/PG app PASS; A80 did not rerun application tests.

## 5. Exactly one next policy-dependent code scope — NOT R18 authorization

**Priority proposal to A00 after explicit owner signoff + independent native evidence:** close the terminal Swiss finalization invariant ahead of optional pairing/ranking changes. For a **signed TS-A**, a narrow later test-first **T050-TERMINAL-SWISS-DENY-GUARD** would add a new terminal-swiss-revert.integration.test.ts and minimal fail-closed guard to application/matches/revert-match.ts, refusing finalized Swiss Revert 409 with zero writes before mutation. Owner must first approve HTTP error code, actor/UI and Direct Revert/global Undo semantics; A00 separately grants exact base SHA and exclusive file hunk GO. **PR45 already owns revert-match.ts; PR42/PR51 own routes/tournaments.ts and existing revert-match.integration.test.ts.** No file edits, new draft PR, or composite from A80 R18.

If **TS-B is signed instead**, abandon the TS-A guard request and separately plan multi-table, transactional reopen with stage_completed audit compensation and fault rollback; do not implement either option without future A00 GO. The priority is conditional, not a preselected sport policy.

## 6. Handoff / owner runtime-debt and final STOP gate

R18 common contract permits proposing formal owner/HQ **RUNTIME_DEBT_TO_SWARM006** waiver *only* if all non-waived source blockers are closed, all approved WEB-004 R2 findings have documented disposition, A10 records exact 21-PR manifest and A60 independently judges remaining source/risk. A separate explicit **FINAL_HANDOFF_GO** is still required; neither this A80 document nor a completed R18 wave grants it. If owner declines waiver, A50 must supply actual per-PR native evidence first. Any later SWARM-006 integration/composite QA and deploy remains STOP until approved release gates.

**A80 R18 actual changes:** only two A80 R18 markdown files on control documentation branch; application source changes = **0**; new PRs = **0**; merge/CI rerun/runtime application tests/SQL reset/deploy = **0**. Work done: GitHub R18 prompt, exact PR45/42/51 SHA/files/diff, R17 A60 signed matrix, A50 native blocker, DECISIONS policy queue and safe PG test helper inspected; owner decision packet and final report published.

**TO A00:** retrieve these direct GitHub URLs; record P12 unchanged SOURCE_ACCEPTED_CONDITIONAL at exact SHA with native PG debt; obtain explicit owner/HQ TS-A/TS-B, SE/Swiss/DE signatures or documented owner-approved exceptions; get A50 isolated executor or written runtime-debt waiver via proper final gate; independently A60 approve later SHA as appropriate. Do not count A80 signature card as actual policy approval.

**FINAL:** A80_R18_SOURCE_ONLY_COMPLETE / P12_PR45_SOURCE_ACCEPTED_CONDITIONAL / OWNER_SIGNOFF_PENDING / P12_PG16_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD.
