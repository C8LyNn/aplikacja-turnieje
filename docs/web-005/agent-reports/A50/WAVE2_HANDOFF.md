# WEB-005 / A50 — DEVELOPMENT FIRST / WAVE 2 HANDOFF

**Role:** A50 Backend / API — C01 integration diagnostics. **Priority:** P0 root-cause evidence.  
**Date:** 2026-10-18.  
**Exact immutable original C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` — Draft [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60), unchanged.  
**Continued independent diagnostic Draft PR:** [#105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), branch `fix/web005-c01-api-first-failure-evidence`, review base `review/web005-c01-api-recovery-base` pinned to exact original C01.  
**Previous diagnostic head:** `779fa705fd585fe15d2cf56f23c0357e0cbe5a44`.  
**Wave 2 implementation checkpoint before this handoff:** `39918760335209cd86baf9b9aadc2cfd3c844530`.  
**Authoritative final exact SHA:** PR #105 HEAD *after* this documentation commit.  
**Separate PG16 Variant B:** Draft [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) unaffected. **No C02 work by A50.**

## 1. Original first-failure evidence: reproducible blocker

Immutable GitHub Actions [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`, source exact C01 `fa3261b2...`:

```text
BLOCKED: API integration tests execution failed exit 1; signal none
```

Retrieved official full job log contains no identified `not ok` in the relevant integration step; output ends a prior TAP snippet at an incomplete `duration_ms:`, then shows only the exit code banner. No Actions artifacts were exposed for that run. PostgreSQL container stderr contains expected failure cases (FK/check constraint violations, intentional failures); cannot treat the first SQL `ERROR` as the first *failing test*. This is an **evidence availability/diagnostic defect**, not demonstrated application, fixture or physical environment root cause. `FIRST_REAL_FAILING_TEST=UNKNOWN`, `ROOT_CAUSE_CLASS=UNDETERMINED`.

Additional comparison: C02 separate CI in [PR #101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) also reported API integration exit 1, but without verified first `not ok`; cannot use it to infer a C01 root cause.

**Prior independent accepted baseline:** Original C01 owner Windows **426/426 DB-free TAP PASS** with Node22/pnpm10, typecheck after `tsc --build` exit 0; these do not include PostgreSQL API integration. Old TS6305 declaration build ordering issue is **separate and resolved for native typecheck**, not explanation of original GitHub CI exit 1.

## 2. Selected Wave 2 task — deterministic pure TAP triage

No source change to API app or DB fixture is justified without first failed assertion. Instead, continue the narrowly scoped diagnostic fix in PR #105.

**Changed files relative to prior diagnostic HEAD**:
- `qa/pack17/failure-evidence.mjs` — remove repeated whole-TAP regex scans; traverse stdout and stderr once each, capture first `not ok`, prefer true TAP counters from stdout, inspect stderr fallback, capture bounded `Error:` diagnostic, redact URLs including HTTPS credentials and common secret-bearing fields.
- `qa/pack17/failure-evidence.test.mjs` — expand 8→16 DB-free node:test cases: stderr-only TAP, stderr `Error:`, 180k passing TAP lines before first failure, HTTPS token masking, null counters for missing TAP, first-of-many, ANSI+CRLF, secret-bearing title.

**Other existing PR #105 paths remain unchanged**:
- `qa/pack17/run-gates.mjs` — existing first failure + bounded stdout/stderr diagnostics, original process status, TAP completeness checks, DB gate, and original execution order retained.
- `docs/web-005/agent-reports/A50/C01_API_RECOVERY_FIRST_FAILURE_BLOCKER.md` — immutable earlier evidence summary.

**Scope:** No API domain fix, SQL, schema, integration fixture, games, Unity, frontend, migration, .github workflow, lockfile, deployment, Variant B or Replit live changes.

## 3. Exact test-first evidence (actual Node execution)

- Original PR #105 parser with expanded 16 synthetic source-local Node assertions: **13/16 PASS, 3 FAIL**. Failing cases: `stderr-only not ok`, `stderr Error:` without TAP, and general HTTPS credential leakage. This is a RED unit baseline **not API integration CI failure**.
- Modified local source (byte-identical to published GitHub files by Git blob SHA-1) at Node `v22.16.0`:
  `node --test /mnt/data/c01_api_recovery_qa/failure-evidence.test.mjs` → process **exit 0**, **16/16 PASS**, **0 FAIL, 0 SKIP, 0 CANCELLED, 0 TODO**.
- Exact green-source Git object SHA-1:
  - `qa/pack17/failure-evidence.mjs`: `e8a6310305d78fe0c3dad857b9760a80388b6c09`.
  - `qa/pack17/failure-evidence.test.mjs`: `3ea61402b55cad03fa284bfbf39313c23dca4bb7`.
- Raw test-source SHA256: helper `194c515f10b32ebb63f317cd9a5c2f5720902d4d740790177659bf7c0abf0044`, test `2bcf65417fb725e8f14a19d240198722ab49e0be285a44eabfba2a20314ce5ad`.
- Native TAP log SHA256: `297b6fbb99e7c188a8b0067f70d93269b6bc7fd2e1adb9b0b23046fa974e9406`, 2671 bytes, saved in conversation artifact `/mnt/data/c01_api_recovery_qa/WAVE2_NODE22_TAP.log` (not uploaded to repository).
- Node syntax check `node --check failure-evidence.mjs` → exit 0.
- **Not run:** C01 full Pack17, original PG integration, CI, Docker, migrations, SQL, build images, deployments; native real test with actual complete C01 repository and pinned Node22.23.3/pnpm10.34.7 remains **PENDING**. Pure unit tests are not validation that all secrets will be redacted on unknown real logs.

## 4. Reproduction and unlock criteria

Reproduce the first actual API test failure only in an independently authorized **fresh disposable PG16** with A00/A20/operator phase/resource approval, physical cluster isolation checks, one-time G4, no native Windows/prod/Replit DB connection. A22/A31 reported unsafe unchanged-C01 failed-CREATE → FORCE DROP fixture behavior; no permitted shortcut by running old C01 unsafely. Safest available path requires separately QA-approved Variant B/new SHA, which is **not** reproduction of the historical unmodified C01. Alternatively, obtain an authentic complete original CI TAP from a trusted immutable evidence source; current run has no retrievable artifact.

Before any app/fixture fix, must provide: exact source SHA and execution approval; full private stdout/stderr/TAP and true process exit/signal; FIRST `not ok` (test file/name and assertion); independently verified cluster identity; redacted and reviewed public extracts. Then classify **APPLICATION / FIXTURE / ENVIRONMENT**, add focused test-first reproducer, and create another tiny Draft PR *only for a confirmed defect*.

## 5. Handoff responsibilities

| Recipient | Need and status |
|---|---|
| A10 — change register | Track PR #105 current exact SHA, original C01 base, two new file blobs, DB-free 16/16; exclude from root-cause resolved / C02-ready classification. |
| A40 — C02 source integration | Do not integrate diagnostic PR #105 as application fix or mask original integration failure; C02 remains source-only draft/hold. |
| A60 — independent QA | Inspect changed two-file parser and test diffs, original runner's `run-gates` invariants, unit TAP and Git blobs; return exact-SHA source review. Do not declare PG integration pass. |
| A00 — execution gate | If real first failure must be obtained, secure A20/operator signed *future* physical PG16 test authorization only. |
| A50 — API root cause | Await evidence; do not change business code on hypothesis, do not extend R23H security line. |

**Outcome:** `WAVE2_HANDOFF / A50_DIAGNOSTICS_SOURCE_PATCHED / DBFREE_16_16_PASS / API_ROOT_CAUSE_UNCONFIRMED / C01_API_FIRST_FAILURE_EVIDENCE_BLOCKED / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
