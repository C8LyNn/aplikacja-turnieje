# WEB-005 — A80 R13 HANDOFF TO A00

**AGENT:** A80 — Stage Lifecycle & Sporting Rules  
**TASK:** WEB-005-T050-T051-A80-R6  
**WAVE:** R13, 2026-10-14 Europe/Warsaw  
**AUTHORIZED:** SOURCE ONLY; no implementation / PR / merged branch / test database.  
**FINAL STATUS:** SOURCE_ONLY_COMPLETE / POLICY_OPEN / PR45_QA_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO.

## 1. Exact baseline, refs and actual source ownership

- Central R13 prompt, control branch blob: ec765236516cb63c1dd62e0e9257943ad9c9cc71.
- Release/tournament-ops-20261013-01 = 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7; PR #32 OPEN, unmerged; main base c50cc48e6fa508592bda3f4838111e9cff5af80c.
- A80 [PR #45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) terminal RR scoped reactivation = a7a87bc019731191dbfa44bee6939e3fa25e27f4; OPEN DRAFT, unmerged, same base; unchanged by A80 in R13.
- A70 PR #42 Global Undo = 1ae0ccb801f4177052bff1ec7041e55b8c992c8b; A70 PR #51 malformed Undo = 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a; both OPEN DRAFT and unmerged. PR49/PR50 unchanged at verified R13 preflight HEADs 99298b81501c3e7764d653604923522a19b9f05c / 5457a74187edc263730c3a4b25a663bdf5531ee9.
- PR45 actual files: artifacts/api-server/src/application/matches/revert-match.ts; artifacts/api-server/test/round-robin-terminal-reopen.integration.test.ts; docs/web-005/WEB-005_A80_R10_HANDOFF.md; docs/web-005/WEB-005_A80_R10_T050_RR_PATCH.md.
- PR42/PR51 both touch routes/tournaments.ts and revert-match.integration.test.ts; no overlap with future Swiss domain/tournament/swiss.ts or test/swiss.test.ts. **No cross-PR integration attempted.**
- PR45 GitHub review/comment arrays empty at inspection; no independent A60 signoff is independently established by this check.
- GitHub Actions run [38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) on PR45 = FAIL due earlier Pack19 source matcher, downstream skipped. No native RR4 PG acceptance demonstrated; separate PR35 already patches Pack19 matcher.

## 2. Real deliverables (docs only, committed to existing control branch)

1. [WEB-005_A80_R13_POLICY_SIGNOFF_QUEUE.md](./WEB-005_A80_R13_POLICY_SIGNOFF_QUEUE.md) — formal owner signature queue for terminal Swiss, SE pointer, Swiss rematch/BYE/NC and DE rank; source evidence PR45, CI and Undo audit coupling; one conflict-free future Swiss pairing patch candidate.
2. [WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json](./WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json) — **18** conditional acceptance scenarios for A50/A60, with exact PR45 SHA and tests, option-specific terminal Swiss outcomes, SE pointer, Swiss5/6 optimality controls, DE GF/Reset; labels clearly mark future policy/open tests.
3. This [WEB-005_A80_R13_HANDOFF.md](./WEB-005_A80_R13_HANDOFF.md).

Reused unchanged [R11 fixture source](./WEB-005_A80_R11_DETERMINISTIC_FIXTURES.json), blob a44147b1da905509277395f7fcaee6331cbd7844. The R12 package [SPORT_POLICY_AND_QA](./WEB-005_A80_R12_SPORT_POLICY_AND_QA.md) remains valid as source-only precedent.

**Application files changed by A80 in R13:** 0. **New code branch / draft PR:** 0. **Merges / deployments:** 0. **SQL / test DB mutations:** 0.

## 3. Findings and QA classification

| Finding | Evidence/status R13 | Owner/next action |
|---|---|---|
| A52-F019 terminal RR reactivates earlier eliminated players | Release SOURCE_CONFIRMED, PR45 PATCH_PROPOSED at exact SHA; independent PG16 and A60 review PENDING | A50 isolated SE8→RR4 test; A60 exact-SHA review, including stage1 trigger side effects |
| A52-F022 completed terminal Swiss revert inconsistent finalization | SOURCE_CONFIRMED missing Swiss reopening guard; resulting invalid persisted state STATIC_INFERRED; POLICY_OPEN | owner/HQ selects TS-A DENY_409 zero-write vs TS-B ATOMIC_REOPEN stage+tour+winner+roster and audit compensation |
| A52-F018 SE currentRound after feeder revert | SOURCE_CONFIRMED preserves max generated pointer; actionable semantics POLICY_OPEN | owner/HQ chooses actionable vs generated, public UI/API semantics |
| BIZ-21-17 Swiss avoidable rematches | SOURCE_CONFIRMED greedy implementation; Swiss5/6 optimum MODEL_CHECKED; BYE/NC priorities POLICY_OPEN | owner/HQ chooses pairing objective, deterministic tie-break, solver complexity, BYE/NC historical treatment |
| BIZ-21-19 DE runner-up and ranks 3–N | SOURCE_CONFIRMED winner then nonchampions seed order, not elimination order; DE decisive GF model cases MODEL_CHECKED; rank policy OPEN | owner/HQ signs decisive GF/Reset runner-up and 3–N tie/wave placement |
| BIZ-21-18 RR stageSeed | Release source corrected; regression only, no new patch | A50/A60 cyclic RR3 inverted-seed integration test |
| WEB-004 withdrawn A52-F001/F002, BIZ-21-09/12 | WITHDRAWN in accepted source | never re-open as unproven new fixes |

**A70 collision:** PR45 standalone Direct Revert expects success even after stage_completed audit action, while PR42 uses Global Undo LIFO; PR51 malformed history handling changes a separate route. Public Direct Revert strict CAS and latest-action semantics are still owner/HQ POLICY_OPEN. No author-level composition judgment.

## 4. Test evidence: exact distinctions

**Performed in R13 by A80:** GitHub connector source/PR/CI/decision reads and one independent in-memory Code Mode JS fixture recheck of **11** cases (Swiss5/6 greedy 1 vs feasible 0 rematches and deterministic repeat; Swiss4 forced1/exhausted2, BYE P4/P5, completed NC vs cancelled, GF/Reset A>D/A>D/D>A). **Evidence = MODEL_CHECKED only**. Code Mode succeeded without exception; this is not a Node OS shell test and has no process exit code.

**Not performed by A80:** native TypeScript/Node app tests, HTTP API runtime, PostgreSQL16, typecheck, React/RTL/browser, independent A60 peer certification, safe A50 DB preflight. All = NOT_EXECUTED / QA_PENDING, not PASS.

**A50 commands after authorization**, exact PR45 SHA, dependencies pinned, isolated PostgreSQL16/test DB/schema tm_test_* with explicit reset preflight (cwd artifacts/api-server):

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

Workspace root: pnpm --filter @workspace/api-server typecheck. Record actual exit codes and redacted env/test logs; never use production/shared database. A60 independently reviews on SHA. Other R13 Swiss/SE/DE future conditional tests **cannot** be mandatory before product policy signature and actual code/test authorization.

**Expected A50 output on standalone PR45:** SE8→RR4 nonqualifier set remains eliminated on reopen, four terminal members become active; terminal stage/tournament status and both winner IDs revert consistently; result_history immutable, audit Revert exactly once; recomplete and re-finalize consistent. Migration trigger 0002/0006 can change previous qualifier membership, so compare both stages and distinguish those changes. Do not claim this passed until executed.

## 5. Policy queue and NEXT ONE nonconflicting candidate

**Signatures pending:**
- POLICY-TERMINAL-SWISS (TS-A 409 zero writes vs TS-B atomic reopen + rollback and stage_completed audit semantics)
- POLICY-SE-ROUND (earliest actionable vs highest generated)
- POLICY-SWISS-PAIRING and POLICY-SWISS-BYE-NC (rematches, score-groups, BYE and completed no_contest)
- POLICY-DE-GF-RUNNERUP and POLICY-DE-RANK-3-N (decisive final loser and tie/wave/seed)

**Conditional future candidate without PR45/PR42 overlap:** T051-SWISS-DETERMINISTIC-PAIRING in domain/tournament/swiss.ts + test/swiss.test.ts, only AFTER signed Swiss policy, explicit A00 free source lane and refreshed ownership. Test-first with Swiss5/6, min fallback 1/2, BYE NC controls, deterministic no-ghost constraints. No R13 GO. A terminal Swiss DENY guard necessarily edits PR45's revert-match.ts and may touch A70-owned HTTP error mapping; therefore it is **not** collision-free and remains separately HOLD for later owner/A00 coordination.

**Next action for 00:** obtain explicit owner/HQ Swiss and terminal decision signatures; have A50 physically validate standalone PR45 exact SHA, A60 independently review. Do not exchange this for more speculative draft PRs. Maintain all packets as INTERNAL_BUFFER until whole WEB-005 accepted backlog is dispositioned.

## 6. GO/STOP and closeout

**GO SOURCE-ONLY completed:** exact code/state/source check, current policy queue, deterministic per-option acceptance fixture, future nonconflicting patch plan, GitHub artifacts and A00 handoff.

**HARD STOP observed:** no sporting source code or PR45 modification; no new application branch/PR; no fourth code lane; no merge/rebase/cherry-pick/composite; no paid manual CI or unsafe shared/production DB; no migrations, staging, live or Replit; no SWARM-006 interim handoff.

**FINAL:** A80_R13_SOURCE_ONLY_COMPLETE / P12_PG16_AND_A60_PENDING / OWNER_POLICIES_OPEN / RELEASE_NO_GO.
