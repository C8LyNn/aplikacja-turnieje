# WEB-005_A70_R15_HANDOFF — Formal A70 report to coordinator 00

**Agent / role:** A70 — Match Lifecycle & Undo  
**Task / wave:** WEB-005-T040-A70-R15 / R15.1 (2026-10-14 Europe/Warsaw)  
**Authorization:** SOURCE-ONLY; NO CODE, MERGE, RELEASE or SWARM-006 dispatch.  
**Coordinator:** WEB-005 A00 Implementation Lead; single global Queen/HQ is elsewhere.  
**Task source:** [WEB-005_WAVE_R15_AGENT_PROMPTS.md](../../WEB-005_WAVE_R15_AGENT_PROMPTS.md), §§0–2 and AGENT A70.  
**Release baseline:** release/tournament-ops-20261013-01 @ **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.  
**Publication location:** \`docs/web-005/agent-reports/A70/WEB-005_A70_R15_HANDOFF.md\` on \`chore/web-005/t000-wave1-control\`.  
**Owner-signable policy:** [WEB-005_A70_R15_MP2B_SIGNABLE_POLICY.md](../../WEB-005_A70_R15_MP2B_SIGNABLE_POLICY.md).  
**Status:** DOCUMENTED / POLICY UNSIGNED / APP PG16 NOT_VERIFIED / RELEASE_NO_GO.

## 1. Actual GitHub SHA, state and paths

| PR | Exact HEAD verified R15 | Base / state | Changed paths |
|---|---|---|---|
| [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) MP1 | **16053ee132756ca05b6f2cd1f0cabae823905387** | release 1fdc401d..., OPEN DRAFT / UNMERGED | \`artifacts/api-server/src/routes/tournaments.ts\`, \`artifacts/api-server/test/match-revision.integration.test.ts\`, \`lib/api-spec/openapi.yaml\`, four generated Zod/type artifacts |
| [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) MP2A | **1ae0ccb801f4177052bff1ec7041e55b8c992c8b** | release 1fdc401d..., OPEN DRAFT / UNMERGED | \`artifacts/api-server/src/routes/tournaments.ts\`, \`artifacts/api-server/test/revert-match.integration.test.ts\`, \`docs/web-005/WEB-005_A70_R9_MP2A_PATCH.md\` |
| [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) historical Undo | **2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a** | release 1fdc401d..., OPEN DRAFT / UNMERGED | \`artifacts/api-server/src/routes/tournaments.ts\`, \`artifacts/api-server/test/revert-match.integration.test.ts\`, two R12 docs |

All three remain frozen and isolated; the shared \`routes/tournaments.ts\` also collides with A100 [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) @ 2f0187b7242681c394c09058b5ef647667206bd6 and [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) @ 7f60849e389a7ed35fdd39dd5493c4c4c267d860. \`revert-match.integration.test.ts\` overlaps #42 and #51. No composite branch/SHA, source PR changes, migrations, or deployment were made by A70 R15.

**Other source files read at release SHA:** \`artifacts/api-server/src/application/matches/revert-match.ts\`, \`artifacts/api-server/test/test-database.ts\`, \`lib/api-spec/openapi.yaml\`, \`lib/api-client-react/src/generated/api.ts\`, \`artifacts/tournament-manager/src/pages/tournament-host.tsx\`.

## 2. Source findings

- **MP1 PR39 / SOURCE_CONFIRMED:** dedicated Cancel/Restore source and authored \`match-revision.integration.test.ts\` cover CAS/revision ABA, invalid generic PATCH bypass, duplicate writers and valid cases. Authoring does not prove execution.
- **MP2A PR42 / SOURCE_CONFIRMED:** \`revert-match.integration.test.ts\` contains two deterministic X-queued / Y-newer-commit global LIFO race cases using \`pg_blocking_pids\`; locked code rechecks latest Undo for generic status and result reversal in shared transaction. Runtime not independently verified.
- **Historical PR51 / SOURCE_CONFIRMED:** documented parser guards persisted invalid JSON/action family and checks target identity/ownership before Undo; test source has **11 table-driven plus 6 individual = 17** new cases. Runtime not independently verified.
- **MP2B gap / SOURCE_CONFIRMED:** public \`POST /matches/:id/revert\` does not accept/forward required revision/completion token, despite optional domain guards. OpenAPI lacks the request body, Zod/React generated parity absent, Host \`revertMatch.mutate({id})\` has no CAS, and tournament action-log endpoint \`.limit(50)\` cannot reliably expose older current completion logs. Direct Revert CAS is still POLICY_OPEN, no code change authorized.
- **Legacy data caution:** action-log Undo parser and global Undo LIFO are T040. Domain result_history verification and correction receipts remain A80/T050, portable history and Backup V3 B2 A90/T060, PG migration ledger A20. Do not "repair" malformed old history by silently undoing an older log or fabricating a match/stage link.

## 3. Real QA receipts, independent verdict and blockers

| Evidence | Actual observed result |
|---|---|
| GitHub CI #39 HEAD | Run [38573594642](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38573594642) **FAIL** on *preceding Pack19 snapshot consistency tests*; not a scoped MP1 HTTP/PG test verdict |
| GitHub commit-linked Actions #42, #51 | 0 matching runs found |
| Formal GitHub PR reviews #39/#42/#51 | 0 submitted reviews found |
| A50 native typecheck/API/PG16 tests executed by A70 R15 | **NOT_EXECUTED**; no command, exit code, TAP or DB snapshots |
| A60 exact-SHA primary signed report | **NOT_VERIFIED_BY_A70** on accessible GitHub; R14 A10 manifest secondarily cites \`SOURCE_ACCEPTED_CONDITIONAL\` for #51 at same SHA via A60 R12 matrix, **NOT runtime acceptance** |
| A70 R15 app code modified | **ZERO** |
| Future policy / release | **POLICY_OPEN / RELEASE_NO_GO** |

**Critical distinction:** tests authored or synthetic/static source checks are NOT application runtime PASS. Without physical PG16 preflight / repository checkout, status is BLOCKED/NOT_EXECUTED and needs the A50 real evidence.

## 4. A50 isolated PG16 / A60 exact-SHA handoff

Preflight (A20/A50/owner): physically isolated disposable PostgreSQL16, no shared/prod credentials; test-only \`TEST_DATABASE_URL\` (DB name includes "test"), \`TEST_DATABASE_SCHEMA=tm_test_*\`, explicit \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\`, Node22/pnpm10 and pinned lockfile checkout. No paid CI rerun, no real user data or unsanctioned schema cleanup.

**Each PR needs its own exact-SHA checkout, typecheck and dedicated fixture:**

| PR + checkout SHA | Typecheck | Targeted suite |
|---|---|---|
| #39 / 16053ee132756ca05b6f2cd1f0cabae823905387 | \`pnpm --filter @workspace/api-server typecheck\` | \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts\` |
| #42 / 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | same | \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts\` |
| #51 / 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | same | same \`revert-match.integration.test.ts\` at DIFFERENT source SHA |

**Expected outcomes:**
- #39 stale/ABA => 409 zero-write, generic PATCH cancel/restore bypass => 422 zero-write, valid Cancel/Restore succeeds once.
- #42 deterministic queued stale Undo X while Y commits newer undoable action => X 409 UNDO_ACTION_CHANGED with no X-originated writes; Y remains committed; legit latest Undo 200.
- #51 latest corrupt stored payload / mismatched match/tenant => 409 UNDO_ACTION_CHANGED, zero-write, no automatic skip to older history; valid legacy Undo and result_history parity still hold.
- SQL snapshots of matches (including revision/status/score/winner), action_log, result_history, tournaments, stages, stage_participants, players, match_game_picks, downstream and correction receipts. Capture actual CLI exit/TAP, PG version, exact git SHA and environment fingerprint **without secrets**. A failed test runner or fixture timeout is FAIL/BLOCKED, not an optimistic PASS; cleanup schema is not proof of request-level rollback.
- A60 must independently source-review exact SHA and reconcile actual A50 receipts. No author self-certification.

**Entire executable runbook and expected negative/positive matrix:** \`WEB-005_A70_R15_MP2B_SIGNABLE_POLICY.md\` §5.

## 5. MP2B owner-signable TWO-OPTION decision — NO A70 choice

[Signable policy packet](../../WEB-005_A70_R15_MP2B_SIGNABLE_POLICY.md), ID \`WEB-005-T040-MP2B-DECISION-R15\`, presents ONLY:
1. **OPTION A STRICT:** all public Direct Revert requests require both \`expectedMatchRevision\` and \`expectedCompletionActionId\` after coordinated API+Host cutover; old tabs must refresh and cannot bypass CAS.
2. **OPTION B EXPLICIT TIME-BOXED LEGACY:** new client strict; a named/versioned legacy route or allowlist with signed sunset, owner and telemetry retains legacy access temporarily; never a silent permanent optional-CAS fallback.

Shared proposed behavior: missing/malformed request → 422 \`INVALID_REVERT_PRECONDITION\` (raw JSON 400/422 requires signoff); stale revision/action/ABA → controlled 409 + zero-write; good current request 200 once; no silent retry; authorized read model supplies \`activeCompletionActionId\` coupled to current revision even beyond newest 50 actions; OpenAPI, backend Zod, generated React and Host parity. Protect T050 internal correction/stage-vector semantics.

**REQUIRED SIGNATURE:** owner/HQ chooses A/B/DEFER, canonical wire key, error precedence, read roles, old-Host cutover/sunset, signing authority/date and distinct A00 code GO. The policy document is **UNSIGNED**, default **DEFER / CODE HOLD**.

## 6. Future smallest patch / conflict gate / next action

Future implementation request only **after** the signed policy, exact-SHA A50/A60 evidence and one exclusive A00 source window: focused public revert POST body validation+forwarding to existing domain CAS and test-first negative HTTP 422/409/ABA, with approved active completion read channel and separately coordinated OpenAPI/Zod/React/Host change. Do NOT edit \`routes/tournaments.ts\` while #39/#42/#44/#46/#51 authors own conflicting changes; no A70 patch/code GO in R15. Preserve A80 \`revert-match.ts\`, A90 Backup V3 history ownership and A20 SQL preflight.

**ONE NEXT ACTION for A00:** route signable binary MP2B packet to owner/HQ for approval or explicit deferral; in parallel collect exact-SHA isolated A50 PG16 execution receipts and primary signed A60 review links for PR39/#42/#51 before authorizing any new file window.

**FINAL R15 DISPOSITION:** Document publication DONE / implementation code STOP / no merge, staging, Replit, prod SQL, GitHub paid rerun or SWARM-006. WEB-005 remains IN_PROGRESS / RELEASE_NO_GO.
