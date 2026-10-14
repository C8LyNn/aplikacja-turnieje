# WEB-005_A70_R14_HANDOFF — coordinator 00

**Agent:** A70 — Match Lifecycle & Undo  
**Task:** WEB-005-T040-A70-R14  
**Wave:** R14.1 / 2026-10-14 / Europe/Warsaw  
**Authorized mode:** SOURCE-ONLY / QA and owner policy; NO application code.  
**Coordinator:** WEB-005 A00; HQ/owner signs policy and release.  
**Central instructions:** docs/web-005/WEB-005_WAVE_R14_AGENT_PROMPTS.md on chore/web-005/t000-wave1-control.  
**Baseline SHA:** release/tournament-ops-20261013-01 = 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7.  
**R14 document branch:** docs/web-005/a70-r14-policy-qa (created separately from baseline, no implementation PR).  
**Primary deliverable:** docs/web-005/WEB-005_A70_R14_MP2B_POLICY_AND_QA.md.

## 1. Verified live candidate state

| PR | HEAD_SHA | State | Main collision |
|---|---|---|---|
| #39 MP1 Cancel/Restore | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT / unmerged | routes/tournaments.ts, OpenAPI/Zod |
| #42 MP2A global LIFO | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT / unmerged | routes/tournaments.ts, revert-match.integration.test.ts |
| #51 historical Undo parser | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT / unmerged | routes/tournaments.ts, revert-match.integration.test.ts |

Shared route also overlaps independent A100 PR #44 at 2f0187b7242681c394c09058b5ef647667206bd6 and #46 at 7f60849e389a7ed35fdd39dd5493c4c267d860. There is no integrated code branch or composite SHA; all drafts remain isolated. R14 A70 did not write to any of them.

## 2. Actual R14 evidence and command status

**SOURCE_CONFIRMED** via GitHub readback: #39 has Cancel/Restore API/source and authored revision regression tests; #42 includes postlock global latest Undo recheck for generic and revert_match plus same-tx revert; #51 safely parses persisted malformed Undo history and has 17 authored cases (11 table-driven+6 individual). Full detailed test fixture, exact per-PR commands and negative matrix H01-H17 are in MP2B_POLICY_AND_QA.

**CI:** #39 exact HEAD workflow run 38573594642 completed FAILURE at Pack19 snapshot consistency tests. Later feature-specific PostgreSQL behavior not certified. PR #42 and #51 branch Actions queries returned 0 runs.

**Independent A60:** Formal GitHub pull-request review counts for #39/#42/#51 were 0. The A10 R13 package manifest from the project Library cites an A60 R12 source matrix and classifies #51 at exactly 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a as SOURCE_ACCEPTED_CONDITIONAL, but PG16 HTTP NOT_EXECUTED and QA_ACCEPTED false. This secondary report was inspected; its claimed original A60 source matrix was not directly verified on GitHub. Accordingly no unconditional A60 acceptance is claimed.

**NATIVE TEST EXECUTION by A70:** NOT_EXECUTED. No Node/pnpm/typecheck command, test process, PostgreSQL connection, test reset, actual exit code or TAP transcript. Static source checks carried forward are author-level evidence, not runtime PASS. No paid manual GitHub Actions reruns.

## 3. A50 / A60 immediate execution and rollback gate

A50 must verify a physically isolated disposable PostgreSQL16 test database (no shared/production URL), Node22/pnpm10, TEST_DATABASE_URL containing dedicated test DB, TEST_DATABASE_SCHEMA=tm_test_*, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA with explicit owner consent for limited schema reset. Separate exact SHA checkouts, no cherry-picking or pseudo-composite.

After per-checkout typecheck:
- PR39: pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts
- PR42: pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
- PR51: pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts

A50 captures tested exact SHA, environment/version fingerprint (never credentials), commands, exit codes, TAP totals and before/after DB snapshot receipts. PR39 CAS/ABA/generic PATCH negative -> 409/422 zero-write; PR42 X queues behind tournament lock while Y commits a newer Undo action -> X 409 and Y remains; PR51 invalid persisted JSON or foreign match -> 409 and zero-write with no older-action bypass. Positive normal Cancel/Restore and newest Undo must remain valid. If test process fails, discard only the dedicated isolated test fixture with explicit reset authorization; a cleanup is NOT evidence of request rollback.

A60 independently reviews SOURCE/FAIL/CONDITIONAL on each exact SHA; verifies real A50 receipt rather than the existence of authored test cases; determines whether separate SOURCE_ACCEPTED_CONDITIONAL from R12 is still valid and actionable. No self-certification by A70.

## 4. T040 Direct Revert CAS owner policy, not a product choice by this agent

**SOURCE_CONFIRMED gap:** public POST /matches/:id/revert forwards no request-level match revision or completion action identifier; domain revertMatch has optional expectedMatchRevision and expectedCompletionActionId guards under its transaction. OpenAPI has no requestBody; generated Zod and React client and Host do not support direct revert CAS; tournament action-log read returns at most 50 latest entries.

**T040-MP2B-DECISION-R14 requires one signed A00/HQ decision packet:**
1. STRICT required pair expectedMatchRevision and expectedCompletionActionId (recommended for public route when deployed end-to-end), or explicit versioned/time-boxed legacy Host transition, or DEFERRED.
2. Exact external field name expectedMatchRevision vs expectedRevision, no accidental aliases.
3. Missing/malformed request 422 INVALID_REVERT_PRECONDITION versus parser-specific 400 decision; stale revision 409 CONCURRENT_MODIFICATION; stale action/ABA 409 UNDO_ACTION_CHANGED; all 4xx zero-write.
4. Authorized activeCompletionActionId read model linked to match revision, not last-50 action log; role/privacy and result-history exposure policy.
5. Host old-tab rollout, OpenAPI/Zod/generated React parity and sunset if compatibility is temporarily supported. Never silently auto-retry a stale reversal.

**Future smallest code request, NOT GO:** after written policy and exact independent PR39/42/51 QA receipts plus exclusive routes/tournaments.ts ownership, A00 may approve test-first public Direct Revert body validation/forwarding from an approved source base. Internal T050 correction stage-vector/receipt semantics unchanged; client/read-model coordinated separately. The R14 branch contains docs only.

## 5. History and conflict scope

Existing migration 0028 match revision, historical action_log.undoPayload snapshots and result_history correctness require cautious legacy acceptance; latest malformed action must never be skipped or historical rows silently mutated. A70 Undo-route parser is distinct from domain result_history completion-match provenance and A90 Backup V3 portable history/legacy B2. A20 owns SQL ledger/preflight; A80 owns sporting correction use case. A00/SWARM-006 alone decide future authorized source composition after project-wide closeout.

## 6. R14 status and next exact action

- TASK SOURCE/QA handoff: DONE as documentary preparation.
- Three existing PR source candidates: PATCH_PROPOSED, OPEN DRAFT, NOT MERGE READY.
- Independent exact-SHA A60 source verdict: conditional secondary evidence for #51, original report confirmation requested; no unconditional verdict on #39/#42/#51.
- RUNTIME_VERIFIED: NOT_ESTABLISHED/NOT_EXECUTED for independent real isolated PG16 HTTP suites.
- MP2B strict public CAS: POLICY_OPEN / CODE STOP until signed owner decision.
- Actual application code files changed in R14: ZERO.
- Docs: two new R14 files on isolated documentation branch; no new implementation PR.
- Conflict: routes/tournaments.ts (#39/#42/#44/#46/#51) and revert-match.integration.test.ts (#42/#51).
- RELEASE: NO-GO; merge, rebase, cherry-pick, Replit, staging, production SQL, deployment and SWARM-006: STOP.

**ONE next action to A00:** obtain A50 disposable PG16 exact-SHA receipts and A60 primary source/runtime verdicts for PR39/42/51, then sign or explicitly defer one T040-MP2B-DECISION-R14 policy packet and reserve the future code lane. No implicit authorization arises from this handoff.