# WEB-005 — A90 — DEVELOPMENT_FIRST_HANDOFF

**Date:** 2026-10-18 (Europe/Warsaw)  
**Role:** A90 / Backup V3 Integrity & Restore  
**Workstream:** DEVELOPMENT FIRST, independent of R23H destructive PostgreSQL 16 testing  
**Task:** T060 pure preclone validator-port synchronous completion hardening  
**Status:** `DEVELOPMENT_FIRST_SOURCE_PUBLISHED / TEST_FIRST / DRAFT_QA_PENDING / NOT_WIRED / RELEASE_NO_GO`

## 1. Existing issues, reports and exact dependencies checked

- [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) OPEN: owner trust/legacy and migration D01–D04 remain separately gated. Its earlier **NO CODE until GO** applies to trust architecture, live importer/exporter, migration and CAS integration. This narrowly scoped development-first user instruction authorizes pure-source forward work, **not** those blocked paths.
- [A90 R23D owner packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r23d-owner-trust-gate/docs/web-005/agent-reports/A90/WEB-005_A90_R23D_ISSUE76_BACKUP_TRUST_OWNER_GATE.md), blob `bc5fb427876452ba2a0e7604d96e4f485f65c725`; [A90 R23C adapter report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r23c-preclone-adapter/docs/web-005/agent-reports/A90/WEB-005_A90_R23C_PRECLONE_ADAPTER_HANDOFF.md), historical source/CI scope.
- Unmerged source dependencies: [PR #56 strict](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) `a7f71a7e7efdabd479b358a3cee80bc6359c4321`; [PR #58 profile](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) `e8100f7b0c1071c2a98880d4eb7947514fc58185`; [PR #64 A70 action-local](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) `7837e412626e88761c70f1a2ceeb822d7ed101e1` still not bound; [PR #67 A30 security acceptance](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) `880824f18b8913602955578dfd76eeac7976e32a` fail-first future ingress.
- **Pinned direct base [PR #66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) HEAD `7490c974b7c84404559fd590bd09817a71c2134f`** (A40 C01 composite ancestry). PR66 is OPEN DRAFT, `NOT_WIRED`. Its independent owner and source are NOT changed; this is a new dependent branch.
- **New isolated [DRAFT PR #100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100)** branch `fix/web-005/t060-development-first-sync-validator-ports`, base `fix/web-005/t060-r23c-preclone-adapter@7490c974b7c84404559fd590bd09817a71c2134f`, exact **HEAD `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`**. OPEN, unmerged.

## 2. Confirmed defect / minimal source fix

The pure `validateRawBackupBeforeClone(raw, ports)` adapter is synchronous. However TypeScript's `() => void` callback type can accept `async` functions, which return promises; before this change `semantic(parsed)` and `validateActionLocalV3(parsed)` return values were ignored. A Promise/nonvoid result could therefore be mistakenly recorded as `semanticValidated=true` or `actionLocalValidated=true` **before completion**. This does not grant import in today's pure adapter (all authorization flags remain false), but could produce a misleading security-validation receipt in future wiring.

**Source fix:** fail closed unless V2/V3 semantic validator and A70 action-local closure return **exactly `undefined` synchronously**. A Promise, thenable, false or any unexpected return is typed `SEMANTIC_VALIDATION_FAILED` or `ACTION_LOCAL_CLOSURE_FAILED`; flags stay false appropriately. Detect Promise-like versioned parser return and emit typed `PARSER_FAILED` before semantic evaluation. The accepted synchronous callback contract remains unchanged. Parser/validator exceptions and data mutation checks are retained. No new attestation/issuer interface or trust bypass.

**Exact commit sequence:**
1. Test FIRST `df209880d84bf6231279034c8f1c26ba24eb5155`.
2. Narrow production source fix `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`.

**GitHub compare pinned base → new head:** exactly 2 modified A90-owned paths, no other changed files:
- [`artifacts/api-server/src/application/backups/backup-preclone-adapter.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/6e198dc2c24cff651f8e75898c6e6e97eec9b0e4/artifacts/api-server/src/application/backups/backup-preclone-adapter.ts), Git blob SHA-1 **`0465e11b2420fa00f2de5cc14fa4d81858c76ff0`**.
- [`artifacts/api-server/test/backup-preclone-adapter.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/6e198dc2c24cff651f8e75898c6e6e97eec9b0e4/artifacts/api-server/test/backup-preclone-adapter.test.ts), Git blob SHA-1 **`51b658b1775f88c5d00ff721247ec6ede49feb86`**.

## 3. Regression tests and actual execution evidence

**Five new `node:test` declarations** on top of the existing 15, for **20 authored cases**: (1) async V2/V3 semantic port; (2) Promise-like/false/nonvoid semantic return; (3) async action-local port; (4) thenable/false action-local return; (5) async V2/V3 parser. Existing normal synchronous V2/V3/strict positives, absent A70 hook, marker stripping, unknown trust, malformed legacy BYE and non-authorized outputs remain unchanged.

**Actually executed independent author diagnostic:** connected GitHub returned exact immutable source/test blobs for PR56/PR58/PR66, test-first and final PR100. TypeScript-only annotations/imports were erased **in-memory**, and actual JavaScript function bodies ran in isolated V8 with a small assertion/test harness. This is **not native Node/TAP** and not a monorepo typecheck:

| Phase | Exact commit | V8 diagnostic |
|---|---|---|
| RED (new tests, old adapter) | `df209880d84bf6231279034c8f1c26ba24eb5155` | **15/20 pass, 5 fail**, demonstrating precisely the five new regressions |
| GREEN (same tests, fixed adapter) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | **20/20 pass, 0 fail** |

**Actual native CI receipt at exact HEAD:** No A90-initiated *local* `pnpm`, SQL, PG16 or browser runs; author-only local TAP is `NOT_EXECUTED`. However **automatically triggered GitHub Actions** [run #39125442053](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125442053), job [117669487576](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125442053/job/117669487576), **COMPLETED FAILURE overall**. Connected GitHub job logs explicitly contain `PASS workspace typecheck`; all **20/20 named R23C + development-first preclone adapter native Node/TAP subtests** appear as `ok` (0 named fail), including the five new tests at `ok 22`–`ok 26`. The later **aggregate API integration gate FAILED** with `BLOCKED: API integration tests execution failed exit 1; signal none`; root cause of that aggregate exit is not established here. **New adapter targeted native source/TAP PASS is distinct from aggregate release FAIL.** This automatic run does not authorize manual paid CI, production DB operations, source merge, live deploy or R23H PG16 execution.

**Safe exact-head command for A50/A60 on approved pinned full repo checkout (no DB required):**
```bash
git fetch origin fix/web-005/t060-development-first-sync-validator-ports
git switch --detach 6e198dc2c24cff651f8e75898c6e6e97eec9b0e4
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-preclone-adapter.test.ts
```
Capture actual exit/TAP and exact SHA; no manual paid CI, DB reset or Docker R23H permission implied.

## 4. Security, dependencies, rollback and handoff

- This patch is **pure and unwired**. Modern strict still returns `STRICT_ATTESTATION_REQUIRED`, old recognized V2/V3 still returns `LEGACY_COMPAT_RESTRICTED`; neither grants importer authorization, origin attestation or historical Undo/Revert/CAS.
- Future app wiring still requires actual full `validateBackupV2` and `validateBackupV3`, independently accepted A70 PR64 action-local closure, A30/HQ authenticated issuer design, true archival fixtures and durable capability enforcement. Unit-test callback stubs are **not** evidence these already exist.
- A00/HQ owner trust and D01–D04 signature gates from Issue #76 stay WAIT_OWNER, and R23H PG16 security G0/G1–G5 remain HOLD. Work is independent because it uses no PG16 or system release operations.
- **Rollback:** discard the isolated Draft PR #100 branch; its base PR #66 and all parent PRs remain byte-identical and unaffected. No database rollback applicable (no DB operations).
- **Handoff:** notify **A60** for independent exact-SHA source/TS/runtime QA; **A10** to append new PR100 SHA and blob lineage; **A40** to review dependency DAG only, not include into C02 without appropriate source approval. No protected merge, games/assets modifications, DDL, Replit publication or SWARM-006.

**Final:** `DEVELOPMENT_FIRST_HANDOFF / PR100_DRAFT / A90_TEST_FIRST_SOURCE_FIX / V8_GREEN_20_OF_20 / AUTO_NATIVE_TYPECHECK_PASS / AUTO_NATIVE_ADAPTER_20_OF_20_PASS / CI_AGGREGATE_API_BLOCKED / A60_INDEPENDENT_QA_PENDING / NOT_WIRED / RELEASE_NO_GO / SWARM006_HOLD`.
