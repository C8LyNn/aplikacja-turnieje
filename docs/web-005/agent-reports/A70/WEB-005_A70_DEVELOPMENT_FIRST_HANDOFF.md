# WEB-005 — A70 / DEVELOPMENT FIRST — authority-field closure hardening

**Mode:** TEST-FIRST PURE DOMAIN HARDENING — NO DATABASE, NO IMPORTER WIRING.
**Owner:** A70 Match Lifecycle & Undo.
**Base / upstream:** PR #64 exact SHA `7837e412626e88761c70f1a2ceeb822d7ed101e1` on `feat/web-005/t040-r23c-action-local-provenance`.
**New follow-up branch:** `feat/web-005/t040-development-first-undo-authority-hardening`.
**Independent A60 prior baseline:** PR #64 `PASS WITH CONDITIONS — ISOLATED STRICT SOURCE ONLY`; **not** evidence of execution.
**Outcome:** `DEVELOPMENT_FIRST_HANDOFF / SOURCE_PATCH_PUBLISHED / QA_PENDING / RUNTIME_NOT_EXECUTED`.

## Pre-edit exact allowlist and conflict check

This list is being published BEFORE any module or test edit.

1. `artifacts/api-server/test/backup-v3-action-provenance.test.ts` — focused **test-first** negative cases: operational Undo nesting cannot embed source action IDs / CAS tokens.
2. `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts` — add recursive rejection of source-authority-like fields in Undo object graph, preserve allowed opaque diagnostic data and legitimate `prevFeaturedMatchId`.
3. `docs/web-005/agent-reports/A70/WEB-005_A70_DEVELOPMENT_FIRST_HANDOFF.md` — preflight, tests, rollback and QA handoff (this file).

**No other writes allowed.** This follow-up intentionally modifies two paths *owned by A70's upstream PR #64*. It does NOT modify PR #64 itself: the isolated new branch starts at that verified SHA and will be proposed as a dependent Draft PR, not merged or repointed automatically. It has no file overlap with PR #56 strict core or PR #58 raw profile gate.

## Source-confirmed gap

The current PR #64 helper `checkAuthorityFields` rejects `sourceActionId`, `actionId`, `expectedCompletionActionId`, `expectedMatchRevision`, `expectedRevision`, `sourceCas`, `casToken` on top-level action/strict metadata. However `recognizedRefs` descends into Undo payloads and validates known player/match ID keys while treating other nested keys as opaque, so a payload such as `{type:"revert_match",matchId:21,nested:{expectedCompletionActionId:999}}` passes this local scan. **This is a strict source-validation gap, not proof of a successful attack against a wired importer** (PR #64 is NOT_WIRED).

Proposed narrow rule: reject action/CAS authority-shaped fields anywhere inside the operational Undo payload, including nested structures; allow harmless diagnostics and lawful historical `prevFeaturedMatchId`, including cross-stage prior match in same source tournament. Do not misuse validation success as clone authority.

## STOP / QA gates

No game logic or assets, `backup-v3.ts`, PR #56/#58, host/routes, DB/schema/migrations, historical Undo execution, protected merge, deployment or SWARM-006.
After code, source review and actual no-DB Node/TS test receipts must be separated. A60 must independently review exact new HEAD. If native execution is unavailable, record `NOT_EXECUTED`, never imply TAP PASS.


## Implementation and exact source receipts

**Dependent DRAFT PR:** [#104 — Nested source-action/CAS token hardening](https://github.com/C8LyNn/aplikacja-turnieje/pull/104). Target branch is A70's pre-existing [PR #64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64), not the protected release. PR64 prior A60 verdict `PASS WITH CONDITIONS — ISOLATED SOURCE ONLY` remains tied to its **unchanged** SHA `7837e412626e88761c70f1a2ceeb822d7ed101e1`; it cannot certify this newer patch.

**Test-first commit chain:**
- Preflight/allowlist published `b0730371d49c320a13f6e39dde5eedd8866aa1c5`.
- Regression tests first `8003cb03123564d48cd646642bf3633fd765d009`.
- Pure implementation second `35d874643c8ca274dc36e310fc525f3770a86763`.
- After this report update, use the **new live PR #104 HEAD** for independent review, never an inferred SHA.

**Exact affected code blobs before report update:**
- `backup-v3-action-provenance.ts`: `0c53833de5597a6809c8b21255e89de174c6f298` (+15 lines relative PR64).
- `backup-v3-action-provenance.test.ts`: `2f6c56fdbefdb22ff1bd82a086a1fe6b8327c442` (+48 lines relative PR64; 21 authored blocks total).

**Scope diff (verified against original PR64 exact HEAD):** 3 commits, exactly the three allowlisted paths; 0 other paths. No conflict with PR56 or PR58. This is **not** a new standalone importer/restore patch.

### Test and quality ledger

| Gate | Evidence |
|---|---|
| 3 new DF01/DF02/DF03 node:test definitions, total 21 authored | SOURCE_CONFIRMED; tests-first commit before code |
| 10/10 read-only static checklist predicates | PASS_SOURCE_INSPECTION only (source checks, NOT runtime execution) |
| Native `pnpm --filter @workspace/api-server typecheck` | **NOT_EXECUTED**, no exit code |
| Native `pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-action-provenance.test.ts` | **NOT_EXECUTED**, no TAP pass/fail/skip evidence |
| PG16/HTTP/Browser | NOT_REQUIRED for pure component and **NOT_EXECUTED** |
| A60 independent exact-new-SHA review | **PENDING**, cannot inherit PR64 review |
| A90 PR66 callback integration | **NOT_WIRED**, no import or tenant-clone authority |

This environment can inspect live GitHub blobs and create source commits but has no complete authorized local repository + frozen pnpm dependencies for running the actual module's node:test suite. The static check explicitly confirmed the new `NESTED_AUTHORITY_KEYS` guard is evaluated before normal recognized Undo ID handling, the distinct older `prevFeaturedMatchId` still has its lawful semantics, no DB or importer imports were added, and diff matches the three-file allowlist. **No TAP PASS asserted.**

**Functional impact:** fail-closed `SOURCE_AUTHORITY` for nested source action/CAS keys in operational Undo payloads, even when buried in objects or arrays; preserve historical diagnostic numbers and legally distinct previous featured matches. Generic opaque `id`/`revision` fields are not globally banned to avoid false-positive rejections of lawful legacy history; they must never become clone mutation tokens in any future importer.

**Residual dependencies and rollback:**
- A90 must use the PR66 preclone adapter only under separate A00 GO after issuer/trust/capability policy and match graph compatibility tests. The strict source marker is not producer authentication; `sourceActionOrder` is not clone LIFO authority without validated mapping.
- A30 should security-review nested key spoofing, unknown operational fields and raw boundary.
- A20 verifies any future DB/capability persistence only under separately signed migration safety.
- A60 reviews the **current PR104 SHA**, and A50 executes genuine pure tests on a trusted exact checkout with Node22, pnpm10, frozen deps. Any failure is `SOURCE_FIX_REQUIRED` with exact fixture and exit.
- To roll back this pure candidate, close/discard dependent Draft PR #104; no runtime, DB or deployed rollback is needed because neither PR64 nor the importer was changed.

**Deliver to A10/A40/A60:** register new dependent PR #104, its exact final HEAD, 3-file delta, +3 test declarations, static evidence and native-test absence. Do not silently merge or change PR64 acceptance.
