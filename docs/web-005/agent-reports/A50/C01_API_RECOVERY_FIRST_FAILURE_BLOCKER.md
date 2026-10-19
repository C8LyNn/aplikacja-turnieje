# WEB-005 / A50 — C01 API Recovery: first-failure evidence blocker

**Task:** DEVELOPMENT FIRST / C01 API RECOVERY · **Mode:** backend QA source, no approved PG16 G4.  
**Original immutable C01:** `fa3261b2c9510e110ac9eba21726812d3401a525` · [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60).  
**Original CI:** [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), job `116425579970`, 2026-10-15.  
**Separate security Variant B:** [Draft PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89), **unchanged** by this work.  
**Proposed narrow diagnostics:** branch `fix/web005-c01-api-first-failure-evidence`, based directly on exact C01, Draft PR (separate).  
**Disposition:** `C01_API_FIRST_TEST_BLOCKED_NO_FULL_TAP` / `API_ROOT_CAUSE_UNCONFIRMED`. **Do NOT label C01_API_ROOT_CAUSE_CONFIRMED.**

## 1. What exact CI really proves

The recorded `Static and database release gates` step failed at **API integration**, and `qa/pack17/run-gates.mjs` emitted:

```text
BLOCKED: API integration tests execution failed exit 1; signal none
```

In the **actual retrieved** GitHub job log, approximately line 5,177 is the fatal banner, immediately after line 5,176 ending a prior passing TAP case. The output around line 5,178 ends in an **incomplete** `duration_ms:` field; no `not ok <number> - <case>` for API integration and no named failing test is available in the accessible first-party workflow log. The step's raw TCP/PG stderr is not sufficient to assign application vs fixture failure, since many SQL negative tests deliberately provoke foreign-key/check constraint and other PostgreSQL errors. The workflow run returned **no Actions artifacts** on inspection.

**This is a precise missing-evidence blocker**, not evidence that API logic is correct or incorrect.

The original runner source (Git blob `8779ab2c1588cc62a2f3c5f63c57be9b55e86043`) captures up to 64 MiB per nested command then dumps the *entire* stdout and stderr for every gate, including passing `API unit tests`. Long CI logging obscured the failing integration test in the returned job log. The nested test runner `artifacts/api-server/test/run-tests.ts` (blob `da4188446aba4696f97eb7831fee0cc5824d212f`) launches Node TAP with `--test-concurrency=1` for integrations, and its parent propagates child exit. Actual C01 integration process **exit 1** is retained, but the first failing test is **not retained** in the shared evidence available here.

## 2. Differential diagnosis

| Layer | Confirmed | Not confirmed |
|---|---|---|
| API application | CI reported integration exit 1 | Failing assertion/case or production code bug |
| Fixture / PostgreSQL | CI used postgres:16 service and ran tests; multiple SQL errors in container logs | Which SQL errors were expected vs caused first failing TAP; unsafe FORCE fixture remains separate R23H issue |
| Toolchain/TypeScript | Earlier native TS6305 due missing built project declarations was resolved by `tsc -b lib/db lib/api-zod lib/stage-basket-flow` then `ApiTypecheck` 0 | No indication TS6305 caused CI integration failure |
| Node/pnpm Windows executor | A50/A60 independently accepted 426/426 DB-free C01 tests from owner Windows R23E-R2 | These are NOT original PG integration tests |
| Diagnostics/CI | First failing integration TAP absent from retrieved GitHub log; enormous successful TAP output is emitted before failure | No proof of exact cutoff mechanism in GitHub backend; diagnostic-output contract is inadequate |

## 3. Minimal separate code change — visibility, not an invented application fix

A narrow source branch based on the immutable C01 contains:
1. `qa/pack17/failure-evidence.mjs`: pure bounded redacted first-`not ok` extraction; preserves counters and explicit unknown state. No DB or IO.
2. `qa/pack17/failure-evidence.test.mjs`: 8 source-local pure Node tests for first/nested failure, incomplete output, counters and redaction.
3. `qa/pack17/run-gates.mjs`: retains existing mode/order, `spawnSync`, `maxBuffer`, `assertCompleteTap`, DB gates, exit propagation; stops streaming voluminous successful raw TAP into shared CI; on a failed command, emits first available failing TAP line plus bounded sanitized first diagnostic, counter and capture metadata **before** failing with the true nonzero exit.

No API behavior, routes, fixture SQL, migrations, business data, games, frontend, lockfile or CI workflow file changed. Raw stdout/stderr is no longer dumped to public/shared CI logs. This is **not a universal secret-redaction guarantee**; sensitive unredacted raw test logs must remain private and undergo separate review prior to cloud publication. No tests are skipped or ignored.

## 4. Test-first evidence (non-DB)

- **10/10 pure function regression checks PASS** performed before publication in an isolated ECMAScript test harness (not C01 integration).
- **8/8 actual Node `node --test` tests PASS**, 0 fail/skip/todo, process exit 0, using locally materialized exact Git blob files:
  - `failure-evidence.mjs` Git blob SHA-1 `ccf73457ab1cf33ae975c6e2e6f7588400743dfc`
  - `failure-evidence.test.mjs` Git blob SHA-1 `6575ef1989ea315756449e3ab5b206f60d049822`
  - Node `v22.16.0` Linux isolated environment; **not pinned owner's Windows Node v22.23.3**.
  - Command: `node --test qa/pack17/failure-evidence.test.mjs`
  - Locally captured TAP log SHA256 `ab4b340b39723c16c38674b1746303d7d6a94401d4c315f82e17d24a9203119f` for the rerun that exited 0.
- C01 `run-gates.mjs --full` **NOT_EXECUTED**; no integration, Docker, PostgreSQL, migration, image build, workflow dispatch or paid CI performed. `run-gates.mjs --static` as a whole was not rerun in this limited checkout. The code diff is subject to independent A60 review.

## 5. Exact next step required for first actual case

Only when A00/operator/A20 authorize a **physically isolated disposable PG16 execution** with verified source SHA, run the approved full integration test under new diagnostics and capture the named first `not ok`, full private raw TAP+stderr, actual exit code, reproducible source/environment/role/cluster fingerprints, and before/after redacted digest. Do not bypass R23H holds or use an existing production/native Windows PostgreSQL instance.

Required return: `FIRST_FAILING_TAP` (or explicit `NOT_FOUND_IN_CAPTURED_OUTPUT`), underlying assertion and source file/line, exit code, whether failure persisted on exact unchanged C01, and a clear classification **application / fixture / environment**. **Only then** write a minimal API code/fixture fix on another separate branch and attach relevant reproducible tests.

The source-only diagnostics PR itself must remain Draft/unmerged until independent review; commit messages and PR title intentionally use `[skip ci]` because the user prohibited unapproved CI and PG runs. The retained previous 426/426 DB-free PASS is independent historical evidence, not a newly executed suite.

**Status:** `C01_API_FIRST_FAILURE_EVIDENCE_BLOCKED / NO_UNAPPROVED_PG16 / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
