# WEB-005 — R23C / TEST DEBT & SECURITY TRANSFER BOUNDARY

**Task:** `WEB-005-T018-A10-R23C-COMPOSITE-REGISTRY` · **As-of:** 2026-10-15 Europe/Warsaw. The first candidate C01 is not a release.

## Actual SHA-pinned evidence

**Composite C01:** [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) `fa3261b2c9510e110ac9eba21726812d3401a525`, SHA source transfer 14/14, A60 source integrity PASS WITH CONDITIONS, integration **BLOCKED**. [Automatic Actions run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) has actual CI SE 23/23; Pack19–26 source 72/72 + domain 220/220; Pack17 source 12/12 + fail-closed 24/24; isolated GitHub ephemeral PG16 atomic 8/8; workspace typecheck PASS. **API integration exit 1**, root cause unknown and full CI FAILURE. Later frontend, API/frontend build NOT_EXECUTED. Swiss/Backup named standalone suites NOT_VERIFIED. A50 local native runs = 0 (executor ready; no authorized host).

**Never re-label isolated PG16 atomic correction as Basket CAS/Backup real import verification.** Individual new PR #61/#63/#64/#66/#67 tests are authored, without independent pinned native receipts. PR66 automatic CI also fails inherited API integration exit 1. PR67 13 test-first pure contracts are intended RED, six PG16 tests default SKIP; neither executed to a verified test PASS.

## Classification I — Mandatory WEB-005 source and safety completion before transfer

- **G01 — A00/A50:** Resolve B1-QA-01 API integration exit 1 at exact SHA; no green inference.
- **G02 — A110/A60:** Fix P27 GET 401/403 revoked-auth privileged draft retention, test fail-first, new exact-SHA QA before enablement.
- **G03 — A90/A70/A30:** Implement and independently QA real Backup ingress/importer/issuer/anti-downgrade, strict/legacy full validation, action-local Undo, raw-before-Zod, preclone no-write and rollback; pure modules alone not enough.
- **G04 — A20/A110/A00:** Finalize Basket CAS server persistence, lock/revision/epoch D1-D5, stage/roster writer coverage, frontend D6 guarded enablement; migration source planning.
- **G05 — A00/owners:** Reconcile all 19 omitted P01-P25 packets and P26-P30 source work, 15 overlap pairs in an authorized integration sequence with QA of resolutions.

All R23C new source candidates except P27 are conditional scope-only and none integrated into C01. P27/PR63 is **BLOCKED_FOR_ENABLEMENT**: authenticated GET failure HTTP401/403 retains local privileged draft and ETag. An A110 fail-first fix followed by A60 independent review on a new HEAD is mandatory. No activation just because new frontend files are unmounted.

## Classification II — Duly scoped debt potentially transferable to EXEC-B, but only after completion of WEB-005 source/safety and explicit owner handoff

- Composite-wide native CI reruns on an approved disposable integration SHA, with precise per-step TAP/process exit and strict baseline hash pinning.
- Physically certified disposable PostgreSQL16 integration tests, atomic rollback, migrations and restore, only with separate owner/A20 schema/test authority.
- Browser/device presentation and accessibility regression for bracket/standings/stage progress/tournament detail, after API/Undo/CAS semantics stabilize.
- Load and performance acceptance, clean builds, end-to-end release smoke and deployment rehearsal as documented EXEC-B work, contingent on HQ formally accepting its boundaries.

**Not automatically transferable:** an integration run already known to fail cannot be silently reclassified as harmless deferred testing. A00 must investigate B1-QA-01 enough to separate source defect from environment/infrastructure and either fix the WEB-005 scope or sign a precise risk-limited action. `API_INTEGRATION_EXIT_1` currently blocks an integration GO.

## Classification III — Explicit A00/HQ owner blockades

- Migration D01–D04 signatures remain PENDING_OWNER_APPROVAL; editor/release SQL 0030/0031 collide. T055 numerical migration ID is null and physical applied ledger unknown.
- Authorization of trusted A50 Node/pnpm runner host and install scope, separate PG16 observer/DDL/reset scope, integration composition scope and eventual cross-swarm transfer.
- WEB-004 original 38-case signed source/individual disposition: 29 secondary IDs are not canonical proof, **nine original IDs missing**. Never invent them. Aggregate historic 0 PASS /3 external CI FAIL/33 BLOCKED/2 NOT_RUN is not fresh verification.
- Owner must explicitly approve whether any residual noncritical test debt may be passed as EXEC-B; A10/A60 source-only cannot grant `FINAL_HANDOFF_GO`.

## Classification IV — Nontransferable security defects / prerequisites

- P27 401/403 GET revocation stale privileged draft (latent but confirmed): fail-first source fix + exact-SHA QA before frontend switch.
- Strict producer authentication / raw-before-Zod, legacy downgrade fail-closed, no caller-supplied trust, disallow legacy Undo/Revert/CAS, authentic archival corpus and real full-schema validator wiring. P23/P25/P28/P29 are still independent untrusted pure modules.
- Correct clone-local action/match/stage ID closure, tenant authorization and no privileged import before 400-zero-write/late rollback correctness; future P30 security contract is not an implemented secure route.
- Any uncured P0/P1 security/integrity bug or unreviewed privilege bypass stays WEB-005 mandatory; cannot be recategorized as EXEC-B test debt.

## Per-source R23C outstanding actual test matrix

| Source | Authored tests | Verified native exact-head / PG16 | Independent A60 |
|---|---:|---|---|
| **P26 / [PR#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61)** | 2 | NOT_EXECUTED / PG16 not verified | `PASS_WITH_CONDITIONS_TEST_SOURCE_ONLY` |
| **P27 / [PR#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63)** | 28 | NOT_EXECUTED / PG16 not verified | `BLOCKED_FOR_ENABLEMENT` |
| **P28 / [PR#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64)** | 18 | NOT_EXECUTED / PG16 not verified | `PASS_WITH_CONDITIONS_PURE_SOURCE_ONLY` |
| **P29 / [PR#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66)** | 15 | NOT_VERIFIED / PG16 not verified | `PASS_WITH_CONDITIONS_PURE_SOURCE_ONLY` |
| **P30 / [PR#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67)** | 19 | NOT_EXECUTED / PG16 not verified | `PASS_WITH_CONDITIONS_TEST_CONTRACT_ONLY` |

## Completion rule

**A source defect is CLOSED_SOURCE only when code and bounded tests have exact SHA and A60 reviewed its scope. It is not a native/integration pass.** A test can be EXEC-B debt only with owner-approved scope, source/safety prerequisites complete, clear fail-first/red/skip provenance, declared risks, and a concrete pending executable checklist. Anything else stays BLOCKED.

[Full R23C registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_REGISTRY.json) · [Composite exact hashes](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_C01_MANIFEST.json).

`FINAL_HANDOFF_GO=false / RELEASE_NO_GO / SWARM006_HOLD`. No SQL/merge/rebase/deploy/transfer by A10.
