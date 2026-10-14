# WEB-005 — A90 R21 / Backup B2 owner decision receipt

**Role:** A90 — Backup V3 Integrity & Restore · **Wave:** R21.1 · **Date:** 2026-10-14 (Europe/Warsaw)
**Authorization:** SOURCE-ONLY / OWNER DECISION INTAKE. **Result:** `WAIT_OWNER / NO_NEW_EVIDENCE / NO_CODE_GO`.
**Task:** receive T060 Backup B2 decisions B1–B6, preserve legal V3 compatibility, identify conditional next implementation/test scope. **No B2 decision was made or signed by this agent.**

## 1. Decision document readback

- [R21 central owner packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DECISION_PACKET.md), exact Git blob `18dcc781f420c2aaa1f9839b6bf61e5db467d065`, §3 Backup T060 B2. It explicitly states **DRAFT FOR OWNER SIGNOFF; zero approved policies**.
- [WEB-005 DECISIONS ledger](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md), readback blob `7907a7c47ced7232289c6164b3c27e1e64c6ebd2`. No signed T060 B2 B1–B6 owner selection verified. It is not valid to infer a choice from prior A90 design or A60 source review.
- [A90 R20 preexisting decision and QA contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r20-backup-b2-decisions/docs/web-005/agent-reports/A90/WEB-005_A90_R20_BACKUP_B2_DECISIONS.md), blob `3e177948127306e75e4aac708e7bf7a02d5aa9c1`. **Reused by reference**, not duplicated into another unsigned packet.

| Decision ID | Owner choice / required evidence | Actual R21 result |
|---|---|---|
| **B1** | Modern strict capability marker versus older lawful V3/V2 compatibility | **UNSIGNED / WAIT_OWNER** |
| **B2** | Latest resultHistory and completed-match tuple parity; sparse/BYE/NC exceptions | **UNSIGNED / WAIT_OWNER** |
| **B3** | Portable DB `matches.revision` CAS version vs separate `resultHistory.revision`; A20 migration 0028 proof | **UNSIGNED / WAIT_OWNER** |
| **B4** | Completion-action provenance, active Undo and deterministic action order; A70 dependency | **UNSIGNED / WAIT_OWNER** |
| **B5** | Remapping nested old match/player IDs, reject or restricted legacy Undo | **UNSIGNED / WAIT_OWNER** |
| **B6** | Strict preclone `400 INVALID_BACKUP_V3` vs restricted import, late rollback and warning UX | **UNSIGNED / WAIT_OWNER** |

**Mandatory product behavior:** legal old V3 `resultHistory:[]` and `actionLog:[]` must not be reclassified as corrupt without an explicit product/compatibility contract; these fields are required arrays in current generated V3 but can be empty. Missing serialized `matches.revision` cannot be reconstructed by equating it with history revision. Nested Undo `map.get(oldId) ?? oldId` and missing original action-log IDs are unresolved risk, not a verified data-leak finding. No automatic strict rejection or retroactive Undo rewrite.

**Conditional, not authorized, minimum future B2 fix:** **only after** named B1–B6 signed options + legal V2/old V3/new V3 positive matrix + A20 CAS/trigger and A70 action-order contracts + A00 new exact-file CODE GO: a narrowly profiled pure validation module, a preclone import hook, negative/legacy-positive test-first fixtures. New serialized fields/migrations require separate API/DB GO. Until then **CODE HOLD**; no ghost patch.

## 2. Exact PR/QA/runtime snapshot

| Candidate | R20 → R21 verified HEAD | Accepted level |
|---|---|---|
| [P08 B1 / PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` → unchanged | OPEN DRAFT/unmerged, **A60 SOURCE_ACCEPTED_CONDITIONAL** on exact SHA; PG16 not executed |
| [P15 B3A / PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` → unchanged | OPEN DRAFT/unmerged, **A60 SOURCE_ACCEPTED_CONDITIONAL** carried on unchanged exact SHA; PG16 not executed |

Independent source: [A60 R20 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R20_INDEPENDENT_QA.md), Git blob `bdcb24f0eb572bc58e65b4022d4490f3d6237ba1`. Global verdict **HANDOFF_NOT_READY**. [A50 R20 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R20_RECEIPT.md), blob `dffce7bf7ffd799bf33d9bb0b360d7f13ad188cb`: no full trusted checkout/pnpm10, no A20+owner-approved physically isolated disposable PG16/reset; **0 actual native application tests**.

A50 pending B1 test matrix: valid approved QP/QPE/OP/route modern and legal old/explicit-null V3, valid numeric position after clone, 7 new + 12 legacy corrupt mutations → `400 INVALID_BACKUP_V3`, zero clone rows, independently induced late `INTEGER` error with total rollback. B3A pending two actual two-connection MVCC writer-barrier old E/new E2 tests, independent checkout at PR48 SHA. **Test authored does not mean tested**.

**A90 R21 executed commands:** GitHub API readback/document publication only; **no** git checkout, application typecheck, API/HTTP tests, Node TAP, PostgreSQL16 SQL/reset, CI dispatch. `TESTS_NOT_EXECUTED`, app exit codes and TAP = N/A. PR41 and PR48 both edit `backup-v3.ts` and the focused integration test; future integration conflict belongs to SWARM-006 **only after** authorized single final handoff.

## 3. Required owner action and release hold

**One actionable next input:** owner/HQ signs **B1–B6 explicitly** (or individually signed deferred/blocked dispositions with accountable signer, accepted compatibility/Undo risks, review date/trigger and release consequence), publishes a dated decision permalink via A00, and provides a legal legacy compatibility matrix. A00 can then request future bounded implementation, rather than assume choices. Separately A00/A20/A50 decide physically isolated PG16 and native QA or, **only after all source/policy/38-case gates close**, an explicit final runtime-debt transfer exception.

**Status:** `A90_R21_RECEIPT_DELIVERED / B2_WAIT_OWNER / PR41_PR48_FROZEN / PG16_NOT_EXECUTED / WEB005_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
