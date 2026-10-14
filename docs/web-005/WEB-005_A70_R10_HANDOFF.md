# WEB-005_A70_R10_HANDOFF

**Project:** WEB-005 — Website Recovery & Development  
**Agent:** A70 — Match Lifecycle & Undo  
**Task / wave:** WEB-005-T040-A70-R7 / R10  
**Mode:** SOURCE-ONLY / QA SUPPORT / NO CODE  
**Date:** 2026-10-14 Europe/Warsaw  
**Coordinator:** WEB-005 A00 (not global Queen)  
**Central task source:** docs/web-005/WEB-005_WAVE_R10_AGENT_PROMPTS.md @ chore/web-005/t000-wave1-control (version R10.1)

## GitHub source pin

| Source | Exact SHA | Current state |
|---|---|---|
| release/tournament-ops-20261013-01 | 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 | verified |
| PR #39 MP1 | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT / not merged |
| PR #42 MP2A | 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | OPEN DRAFT / not merged / FROZEN |
| PR #7 cancellation source | 4621fc1580c718b304b5526f74269d6bfe234c9f | OPEN DRAFT |
| PR #27 historical Undo source | 8e5a6e1fc613a0afacca22ac21bf86a38899e034 | OPEN DRAFT, PR #7 exact HEAD is its base |

**Actual changes in R10:** zero application source edits, no test/DB writes. Documentation-only files on \`docs/web-005/a70-r10-mp2b-source\`: \`WEB-005_A70_R10_MP2B_SOURCE_CONTRACT.md\`, \`WEB-005_A70_R10_HANDOFF.md\`. Existing PR #39/#42 left unchanged. No merge/cherry-pick.

## MP2A PR42 frozen: A50/A60 QA handoff

**Source fact:** PR #42 provides shared \`lockLatestUndoableAction\` under tournament mutation lock, including \`revert_match\`, and passes the same \`tx\` to \`revertMatch\`. Changed in that PR: \`artifacts/api-server/src/routes/tournaments.ts\`, \`artifacts/api-server/test/revert-match.integration.test.ts\`, its R9 report. \`revert-match.ts\` unchanged.

**Author's R9 source-contract checks:** 9/9 static checks passed (not application PASS). **R10 status:** no formal GitHub Review found on PR #42 and no workflow runs found on its branch. An independent QA report outside GitHub may exist but is not verified here.

**A50 test commands after approved disposable PG16 preflight** (\`TEST_DATABASE_URL\` must identify a dedicated test DB; \`NODE_TEST_CONTEXT\` populated by Node runner):
\`\`\`bash
export TEST_DATABASE_URL='postgresql://<isolated-user>:<password>@<isolated-host>/<dedicated-test-db>'
export TEST_DATABASE_SCHEMA=tm_test_t040_mp2a
export TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
\`\`\`
**Expected:** X selects action A and queues behind tournament lock; Y commits newer undoable action, X resumes and gets \`409 UNDO_ACTION_CHANGED\` for both \`revert_match\` and \`restore_status\`; no writes by X; committed Y remains. Confirm legal latest action still undoes once, action_log/result_history/stage/standings parity, deny unauthorized users. Collect command exit code, TAP, SHA, DB fingerprint (no secrets), DB before/after snapshots.

**Actual execution in A70 R10:** no Node/pnpm/typecheck/PG16 test command run. \`NOT_EXECUTED\` for runtime. No PostgreSQL isolation authorization asserted. Missing independent A60 acceptance means \`STOP MERGE\` and \`STOP DEPLOY\`.

**A60:** independent source review at pinned PR42 HEAD, evaluate test determinism and failure injection; confirm 409 and unchanged full DB state. Treat 9/9 static checks separately from real PG16 execution and assign \`SOURCE_ACCEPTED\`/\`RUNTIME_VERIFIED\` only on evidence. Critical defect affecting \`routes/tournaments.ts\` must be reported to A00 *before* any A70 fix (A100 exclusive R10).

## MP2B source-only design

**SOURCE_CONFIRMED:** direct \`POST /matches/:id/revert\` route does not parse body or pass expected match revision/completion action id. The domain \`revertMatch\` has optional \`expectedMatchRevision\` and \`expectedCompletionActionId\` checked after locks. OpenAPI has no requestBody, generated React function accepts only id, Host sends only id. This is the public request-CAS gap (OPS-02) and is **not** fixed by global LIFO MP2A.

**Proposed strict body after future GO**:
\`\`\`json
{"expectedMatchRevision":7,"expectedCompletionActionId":1234}
\`\`\`
Both required positive safe integers; malformed/missing 422, stale or ABA 409, zero writes; valid current completion id+revision succeeds while preserving downstream/approval/receipt guards. Request-level mandatory rollout vs existing POST {} clients is \`POLICY_OPEN\`. Completion action ID discovery may require a specific authorized read contract because generic action-log GET exposes only latest 50. Detailed 22-case negative matrix and file-by-file implementation contract: \`WEB-005_A70_R10_MP2B_SOURCE_CONTRACT.md\`.

**MP3 dependencies:** approve API field naming, OpenAPI → Zod / React deterministic generation, Host modal token snapshot, stale 409 refresh without silent re-submission, old-tab cutover policy; do not implement in A70 R10. **MP4:** complete regression after composite integration, including T050/T080 and approved DB ledger, independent A60.

## Ownership, blockers, GO/STOP

- R10 **A100 exclusively owns** \`artifacts/api-server/src/routes/tournaments.ts\`. A70 holds writes to PR #42 or that file.
- R10 **A80 exclusively owns** \`artifacts/api-server/src/application/matches/revert-match.ts\`. A70 holds edits.
- A00 must acknowledge/sequence these file locks before MP2B implementation; future GO must be explicit and must use an approved base, not rework PR39/42.
- Cancel \`expectedRevision\`/Host, historical malformed Undo payload strict parsing, terminal Swiss/RR/SE, migration ledger and production are **outside R10 A70 implementation**.
- **FINDING disposition:** OPS-01 MP2A patched as draft \`PATCH_PROPOSED\`; DB runtime \`NOT_EXECUTED\`; OPS-02 MP2B \`SOURCE_CONFIRMED, SOURCE-ONLY DESIGN\`; legacy compatibility and completion ID read-model \`POLICY_OPEN\`; no unsupported PASS.
- **NEXT ACTION:** A50 safely run PR42 PG16 isolated tests; A60 give independent exact-SHA verdict; A00 resolve naming, client compatibility, completion ID discovery and exclusive file handoff before optional MP2B GO.
- **MERGE / DEPLOY:** NOT AUTHORIZED. **SWARM-006:** NOT STARTED, no handoff until entire WEB-005 backlog formal closeout.
