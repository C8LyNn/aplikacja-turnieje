# WEB-005 — A70 R11 HANDOFF TO IMPLEMENTATION LEAD 00

**Agent / task / wave:** A70 — Match Lifecycle & Undo / WEB-005-T040-A70-R8 / R11  
**Mode:** SOURCE-ONLY, no production code authorization  
**Date:** 2026-10-14 (Europe/Warsaw)  
**Central instructions:** WEB-005_WAVE_R11_AGENT_PROMPTS.md, version R11.1  
**Verified release base:** release/tournament-ops-20261013-01 / 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7  
**Existing MP1:** PR #39 / 16053ee132756ca05b6f2cd1f0cabae823905387 / OPEN DRAFT  
**Existing MP2A:** PR #42 / 1ae0ccb801f4177052bff1ec7041e55b8c992c8b / OPEN DRAFT / FROZEN  
**Historical PR #27:** 8e5a6e1fc613a0afacca22ac21bf86a38899e034 / OPEN DRAFT  
**Other owners' dependencies:** A100 PR #44 at 2f0187b7242681c394c09058b5ef647667206bd6; A80 PR #45 at a7a87bc019731191dbfa44bee6939e3fa25e27f4.

## Deliverables

1. WEB-005_A70_R11_MP2B_AND_HISTORY_GATE.md — source evidence, MP2B Direct Revert request-level CAS, separate historical Undo parser MP2C contract, scoped test-first matrix and A00/HQ decisions.
2. WEB-005_A70_R11_QA_FIXTURES.json — 15 synthetic, machine-readable scenario definitions; they are NOT executed tests or actual DB data.
3. This WEB-005_A70_R11_HANDOFF.md — coordinator summary and exact evidence status.

All under documentation branch docs/web-005/a70-r11-mp2b-history, based on prior A70 R10 documents. **Production source/code changes in R11: NONE**; PR #39/#42 not updated. No PR for documentation necessary.

## Test evidence: explicit separation

- SOURCE inspection actually RUN via GitHub at PR #42 HEAD: **10/10 static source predicates present**, checking postlock global latest action check, generic and revert_match paths, candidate identity, shared tx, 409 mapping and test definitions. This is STATIC_INFERRED/source contract evidence, NOT a Node typecheck, build or PostgreSQL test.
- Native application commands in R11 by A70: **NOT_EXECUTED**; no exit code, TAP output, Node/PG fingerprint or safe isolated database. A50 owns physical tests after authorization.
- PR #42 GitHub Actions: zero runs found on branch at R11 check; formal GitHub PR reviews: zero. Independent A60 offline/other reporting cannot be ruled out; do not equate absence of GitHub review to absence of all QA.
- Previous R9 author check: static 9/9, not PG PASS. R11 new static 10/10, also not PG PASS.

## Findings and disposition

| Finding | Evidence level | R11 disposition |
|---|---|---|
| OPS-01 global Undo LIFO after lock including revert_match | SOURCE_CONFIRMED | PR42 PATCH_PROPOSED / QA and PG16 pending |
| OPS-02 direct public POST revert omits expected revision and completion ID | SOURCE_CONFIRMED | MP2B design ready / POLICY_OPEN, no implementation |
| Historical action_log.undoPayload parsed via unchecked JSON.parse before and after lock | SOURCE_CONFIRMED | Separate MP2C parser contract and fixtures / no code |
| Malformed history potentially resulting HTTP 500 | STATIC_INFERRED | needs independent HTTP/PG16 reproduction; no runtime claim |
| Missing generated React/Host client parity for strict revert | SOURCE_CONFIRMED | MP3 rollout/ownership dependency |
| Completion ID visibility beyond most recent 50 action log entries | SOURCE_CONFIRMED read-model limitation | A00 design decision before strict CAS |

## A50 / A60 handoff — exact PR42 SHA

Only with physically isolated, explicitly authorized PostgreSQL16, correctly installed Node22/pnpm10, test-only TEST_DATABASE_URL, tm_test_* schema and intentional DROP_TM_TEST_SCHEMA confirmation:
~~~bash
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Capture each command, process exit, TAP counts, checkout HEAD, connection fingerprint (no secrets), and exact before/after DB snapshots. Tests must include X awaiting lock after selecting action A, Y committing newer undoable action, X returning 409 UNDO_ACTION_CHANGED with no write, once for revert_match and once for restore_status. Confirm valid latest undo and authorization, result_history and action_log exactness.

Later separately approved MP2B / MP2C fixtures are in the R11 JSON manifest and full gate doc. Do NOT run them on shared/production DB, and do not claim execution from their existence.

## Conflicts / policies / go-stop

- R11 A100 owns artifacts/api-server/src/routes/tournaments.ts; A70 must not edit.
- R11 A80 owns review of revert-match.ts / PR45 frozen; A70 must not edit.
- No edit to OpenAPI, backend generated Zod, generated React API, Host, SQL, migration ledger, existing PR39/42, or production.
- **A00/HQ open decisions:** external CAS naming; mandatory Host rollout vs compatibility; authorized completion action ID read channel >50 log rows; stored malformed Undo 409 policy, legitimate historical payload fallback and manual repair; distinct future patch GO for MP2B versus MP2C.
- PR27 remains source reference only, not merge/cherry-pick candidate.
- Existing release NO-GO; no composite branch; SWARM-006 entirely HOLD until formal WEB-005 closeout.

**NEXT ONE STEP:** A00 request A50/A60 exact-SHA PR42 execution/review on approved isolated PG16, and record owner/HQ CAS/history policy decisions before authorizing any MP2B or MP2C source-code lane.

**Final status:** R11 documentation and test-first specification DONE; MP2B & MP2C CODE NOT AUTHORIZED; PR42 runtime acceptance BLOCKED/NOT_EXECUTED in evidence available to A70; MERGE/DEPLOY/SQL/SWARM-006 NOT AUTHORIZED.