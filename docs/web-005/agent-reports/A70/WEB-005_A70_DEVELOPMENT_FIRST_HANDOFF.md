# WEB-005 — A70 / DEVELOPMENT FIRST — authority-field closure hardening

**Mode:** TEST-FIRST PURE DOMAIN HARDENING — NO DATABASE, NO IMPORTER WIRING.
**Owner:** A70 Match Lifecycle & Undo.
**Base / upstream:** PR #64 exact SHA `7837e412626e88761c70f1a2ceeb822d7ed101e1` on `feat/web-005/t040-r23c-action-local-provenance`.
**New follow-up branch:** `feat/web-005/t040-development-first-undo-authority-hardening`.
**Independent A60 prior baseline:** PR #64 `PASS WITH CONDITIONS — ISOLATED STRICT SOURCE ONLY`; **not** evidence of execution.
**Outcome:** pending test-first patch and independent exact-SHA QA.

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
