# WEB-005 — A50 / WAVE5_HANDOFF — C01 API integration first-failure recovery

**Agent / Task ID:** A50 / `WEB005-A50-WAVE5-C01-API-FIRST-FAILURE`  
**Date:** 2026-10-18 · **Mode:** DEVELOPMENT FIRST, DB-free / read-only CI evidence.  
**STATUS:** **PARTIAL** — available safe QA complete; **API root cause BLOCKED** by absent first failing TAP.  
**INTEGRATION READINESS:** **NO** for C01 API full integration; **CONDITIONAL** for PR #105 diagnostic-only source review, after independent A60.  
**Immutable original C01 BASE SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` ([Draft PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60)).  
**Pre-WAVE5 PR #105 exact HEAD SHA:** `7befb8bbfc9d150469e5405859b0e8b4e789f8a6`.  
**Current final exact HEAD SHA:** read from [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) after publishing this report; do not substitute historic HEAD.  
**Changed files this wave:** **NO CODE CHANGES**. Only this A50 `docs/web-005/agent-reports/A50/WAVE5_HANDOFF.md` report.  
**Branch:** `fix/web005-c01-api-first-failure-evidence`; PR #105 OPEN/DRAFT/UNMERGED, original C01 source files and separate [Variant B Draft PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) not changed.

## 1. Live source and evidence checked (2026-10-18)

- PR #105 pre-wave head `7befb8bbfc9d150469e5405859b0e8b4e789f8a6`, based directly on immutable original C01 `fa3261...`. Source path delta since C01 contains only `qa/pack17/{failure-evidence.mjs,failure-evidence.test.mjs,run-gates.mjs,run-gates-exit.test.mjs}` plus A50 documentation W1–W4; no production API behavior or SQL fixture changes.
- PR #89 remains independently source-hardened with SHA `8b1b708d4b24cd94de4d15b2beed516b21da711a`, no PG16 execution approval. PR #101 C02 head observed `a5bfd07b822c223fd995604dc2e228935ab81498`; PR #134 C03 head observed `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`; no A50 edits to either.
- Issue [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) remains OPEN and still lacks a newly evidenced exact first failing integration assertion.
- Original exact-C01 GitHub Actions [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`: `BLOCKED: API integration tests execution failed exit 1; signal none`. Official retrieved job log **does not include the named first failing `not ok` in the API integration gate**, and the run exposes **zero retrievable artifacts**. Two other jobs on **different source SHAs** (`117669533771`, `117669487576`) likewise exited 1 without a discoverable first failing TAP; this is not evidence of a shared application root cause.
- Checked Google Drive targeted filename/text searches for C01/API TAP. No **authenticated, complete original 38736073793 raw TAP** was verified. Older `PACK17_PREVIOUS_FAILURE*.log` records were not verified as a complete trace of this run; do not treat them as C01 first-failure proof.
- Historical A50 C01 Windows DB-free 426/426 PASS and PR #105 standalone parser 16/16 PASS remain **historical separate-scope results**. Neither implies PostgreSQL integration PASS.

## 2. WAVE5 actually executed DB-free commands (container-local exact published source blobs)

Isolated execution location: `/mnt/data/web005_wave4/qa/pack17`, Node **v22.16.0** (not the operator's Windows v22.23.3), Git `2.47.3`.

Commands (no database/network access):

```sh
git hash-object run-gates.mjs
git hash-object run-gates-exit.test.mjs
git hash-object gate-contract.mjs
git hash-object failure-evidence.mjs
node --check run-gates.mjs
node --check run-gates-exit.test.mjs
node --test --test-reporter=tap run-gates-exit.test.mjs
```

True Node test process exit **0**, synthetic **3/3 PASS, 0 FAIL, 0 SKIP/TODO/CANCELLED**. The tests run `--static` in a generated **fake** workspace; they assert: (a) source-gate failure after 2 MiB TAP returns exit 1, redacted first failure and no next gate, (b) second-gate failure returns exit 1, not a false static PASS, (c) passing static gates return exit 0. **Zero PG16, API integration, Docker, SQL, image pull/build, migrations, production CI, merge or deployment.**

Git blob SHA-1 checked locally and matched exact published PR #105 source:
- `run-gates.mjs`: `55b21d3752403e99feb2ac35a9e6cd1838576746`
- `run-gates-exit.test.mjs`: `084bdbd86301f25b6392d608b15b03ad157625c8`
- `gate-contract.mjs`: `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`
- `failure-evidence.mjs`: `e8a6310305d78fe0c3dad857b9760a80388b6c09`

WAVE5 TAP log `wave5_pack17_static_gate_tap.log`, SHA256 `237e68158683ae76256260b87a7336e0091fdbafb2196e05b6394d89601b92bd`, saved as local conversation artifact (no GDrive upload or GitHub Actions invocation). Status is **DBFREE_TARGETED_PASS**, not release PASS.

## 3. Exact blocker and how to reproduce safely in future

**Blocked evidence:** the **first actual failing API integration test identifier/path/assertion, accompanying private full TAP and stderr, actual exit and environment** for exact original C01. Log snippets from passing subtests and intentional PG constraint exceptions are not sufficient to classify APPLICATION / FIXTURE / ENVIRONMENT. The PR #105 diagnostic-flush fix is independently DB-free proven but does NOT retroactively recover missing original raw TAP.

### Preferred path A — evidence recovery without executing PG16

1. A00/operator locate original private runner workspace, Actions trace retained by operator, or archived artifact with **run ID 38736073793, job ID 116425579970 and C01 source SHA**.
2. Verify file identity and complete end-of-process TAP boundaries/summary, compute raw SHA256, preserve raw data locally under restricted access and publish only a reviewed redacted extract.
3. Identify first `not ok`, precise test file/case and exception stack, relevant `stderr` and actual child/parent exit. If authentic first failure is absent, report `FIRST_FAILING_TAP_UNAVAILABLE`, **do not infer** the failed case from a preceding passing test.

### Conditional path B — one isolated future PG16 reproduction (NOT AUTHORIZED here)

**Separate approval needed from A00/HQ + A20 + named Windows operator**, bound to exact selected **source SHA, test command, disposable project/PGDATA volume, cluster/system identifier, controlled privileges, allowed phase, and later exact-resource cleanup**. A static plan or PR review is not permission to run SQL.

**Operator preflight STOP conditions (future only):**
- Immutable source checkout + clean working tree + `pnpm-lock.yaml` integrity against selected commit; Node 22/pnpm 10 and expected installed dependencies; no production/Replit/Windows-native secrets, foreign DB env or shadow dotenv.
- Brand-new uniquely labeled Docker PG16 cluster/volume and runner using A20's strict `network_mode:none` + shared loopback namespace; **no published host ports**, Docker socket, Windows PGDATA mounts or external network. Inspect **actual** containers/routes/mounts and separate Windows PG service no-touch baseline.
- Authenticate true PG16 system identity, fresh run-specific S1 BASE DB, scoped effective `LOGIN CREATEDB` test role and required grants; verify DB/schema/role OIDs. Distinguish one S1 + **four S2 slots** (catalog dev/prod/fresh, Drizzle) and **two `drizzle-kit push --force`** effects. Strict safety must account for **unchanged C01 fixture's known FORCE DROP after failed/ambiguous CREATE**.
- **Default STOP on unchanged C01**: original exact source contains unsafe teardown; physical isolation alone does not fix it. A source-hardened B run with new SHA (only after independent QA and specific authorization) is a **different experiment**, not strict exact-C01 historical reproduction. Alternatively an **exceptional, explicitly signed disposable-only residual-risk decision** for original C01 would be needed, not implied or issued here.
- Future execution records FULL PRIVATE original stdout, stderr, TAP (including all summary counters), subprocess exit/signal, first failed test and per-DB SQL server observation; redacts only when producing public/cloud reports. No blind retries/skipping/error suppression; ambiguous CREATE/DROP implies `CLEANUP_HOLD` and separately approved G5 exact-resource disposition.
- Immediately terminate/deny next gates on failure; do not run other agents' tests or perform merger/deployment. Source and physical facts must be independently reviewed at the exact run SHA.

**Future command identity (REFERENCE ONLY, NOT EXECUTED):** `pnpm --filter @workspace/api-server run test:integration` on the sealed disposable runner after all gates. To test the **PR #105 Pack17 diagnostic fix** as opposed to original source, run the authorized instrumented SHA and preserve exact provenance, then classify results separately. Do not claim that `--static` or native DB-free TAP reproduces original PG failure.

**Minimal next return to A50:** `{original_run_id, source_sha, selected_variant, approval_id, cluster_identity, command, first_failing_test_file, first_failing_test_name, assertion_or_error, true_exit, raw_private_tap_sha256, redacted_excerpt}`, with unknowns explicitly null/pending. A50 will issue a small, separate Draft PR only if a real API/fixture defect is demonstrated.

## 4. Known errors, conflicts, next owner

- **Confirmed / fixed in PR #105:** diagnostic stdout/stderr truncation risk from premature `process.exit`; synthetic first-failure STOP tests pass. **Unknown:** actual C01 API/fixture/environment failure; no application fix warranted.
- No code paths conflicted/modified in C02/C03, A40, A60, A140 or PG16 Variant B; WAVE5 report-only change.
- **Next owners:** A00/HQ + A20 + named Windows operator for authenticated full evidence or bounded PG16 run authorization; A60 for independent exact-SHA acceptance of #105, A10 source registry, A40 integration sequencing. **Do not mark #105 as C01 application fix.**

**FINAL:** `WAVE5_HANDOFF / PARTIAL / DBFREE_TARGETED_3_OF_3_PASS / FIRST_REAL_API_FAILURE_UNAVAILABLE / C01_API_ROOT_CAUSE_BLOCKED / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
