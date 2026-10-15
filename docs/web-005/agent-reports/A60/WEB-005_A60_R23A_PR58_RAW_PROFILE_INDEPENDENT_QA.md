# WEB-005 — A60 R23A FINAL INDEPENDENT QA — PR #58

**Task:** WEB-005-T130-A60-R23A-EXACT-SHA-CLOSEOUT · **Date:** 2026-10-15 Europe/Warsaw
**Independent verdict:** **PASS WITH CONDITIONS**, strictly for the isolated pure raw-profile classifier. **NOT_WIRED / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD.**

## Exact source and scope

- [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) confirmed **OPEN/DRAFT/UNMERGED**; HEAD **14204bc9ec24f5902fddc3deb48d7592747d450a**; release base **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**.
- Only two newly created source paths, independently read as complete files at exact HEAD: artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts (Git blob **c180da5b9d8aaedb44d83fcc8831aeb6fa70b988**, 403 lines) and artifacts/api-server/test/backup-v3-profile-gate.test.ts (blob **bf328acae3f3c4659f95f0fa1df4a836ceb15d0a**, 215 lines). Five PR commits, tests-first per GitHub history. No existing importer, exporter, routes, generated schema, DB or PR56 code changed.
- All results have authenticated=false and immutable false importAuthorized, historicalUndo, historicalRevert, historicalCasReplay flags; there is no claim of issuer verification or signature validation. A valid self-declared strict marker returns **STRICT_AUTH_REQUIRED** but cannot authenticate itself.
- Positive historical structural cases V2/V3 with optional extensions absent, empty result-history/actions or null old Undo are recognized as **LEGACY_COMPAT_UNATTESTED**. This is *recognition of structural shape only* and never proof of old-producer origin or permission to import.
- Missing marker with remaining modern-only sidecar, malformed/unknown marker, client supplied trust/issuer/signature, hybrid V2/V3, incorrect versions and critical IDs, malformed raw JSON or duplicate JSON object keys are rejected. Raw input caps: 1 MiB text, depth 32, nodes 25,000, array length 5,000, keys per object 128. Direct already-parsed JS objects cannot reveal duplicate keys lost by an earlier JSON.parse, hence future HTTP ingress must provide raw bytes.

## Source-specific defects and caveats

**P0: no demonstrated defect. P1: no demonstrated defect.**

**P2-01 — Positive historical fingerprint not equivalent to a semantically valid producer document.** The authored [V2 positive fixture](https://github.com/C8LyNn/aplikacja-turnieje/blob/14204bc9ec24f5902fddc3deb48d7592747d450a/artifacts/api-server/test/backup-v3-profile-gate.test.ts#L8-L22) declares a completed BYE but omits completedAt, player1BackupId and winnerBackupId; the preflight [legacyRecords routine](https://github.com/C8LyNn/aplikacja-turnieje/blob/14204bc9ec24f5902fddc3deb48d7592747d450a/artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts#L251-L323) does not enforce completed-result coherence. Actual immutable release **validateBackupV2** requires completedAt and valid system BYE winner/participants. A structurally classified result might thus be invalid for real import. This is not currently a privilege escalation (all capability flags false and module NOT_WIRED), but full V2/V3 semantic validation and producer-authentic old fixtures must remain mandatory before any integration GO.

**P2-02 — Scope and provenance:** Stripping *all* strict metadata to become byte-identical to legitimate legacy cannot be distinguished without trustworthy external origin. Current return is deliberately UNATTESTED; do not interpret it as downgrade-proof authorization. Nested opaque Undo data must be checked by a future actual importer/remapper. New strict marker must survive raw body and Zod parsing before separate authenticated checks, not rely on untrusted producer fields.

## Evidence and actual test classification

| Source | Count / result | Provenance |
|---|---|---|
| A90 authored PR58 pure Node tests | **16 test bodies authored; target execution not verified** | Exact test file read from PR58. No PASS inferred |
| A60 exact-PR58 tests | **NOT_EXECUTED; native command/exit/TAP null** | GitHub connector exposes source text but did not mount byte-exact local files. Direct raw.githubusercontent.com fetch from isolated Linux failed DNS (curl exit 6). No simulated classifier substituted |
| A50 R23A DB-free receipt | **0 new A50 native app executions; refers to PR56/57, not PR58** | [A50 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R23A_DBFREE_EXECUTION.md) |
| Current PR58 GitHub Actions | **FAILURE, not feature test result** | [Run 38718588832](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38718588832), job 116367250970: Pack19 source contract 7 PASS/1 FAIL on inherited readOnly:true versus actual accessMode:"read only". Subsequent steps SKIPPED, PR58 feature tests NOT_EXECUTED |

**No full pinned monorepo, pnpm test, TypeScript semantic typecheck, importer/exporter/HTTP or PostgreSQL integration was executed by A60.** Native target PASS/FAIL totals are *unknown*, not 16 PASS.

## Verdict and next actions

**PASS WITH CONDITIONS — RAW_PROFILE_SOURCE_ACCEPTED_SCOPED at exact SHA 14204bc9ec24f5902fddc3deb48d7592747d450a.** The source does not grant client-provided capabilities or claim verified strict identity, and retains safe UNATTESTED semantics. A90/A00 should strengthen authentic historical full-schema positives and add invalid-completed-shape negatives before wiring, enforce existing V2/V3 semantic validators plus restricted legacy Undo and unmodified raw body ingestion under a separate GO. Require real pinned native tests and renewed A60 review on any new HEAD.

**This verdict does not approve real Backup V3 import, HTTP preclone 400, rollback, identity/authenticated producer, B2–B6 integration, release or SWARM-006.** No code edits, SQL/DDL, merge, deployment or manually triggered paid CI.
