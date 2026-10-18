# WEB-005 — W5R_A60_FINAL_QA
Date: 2026-10-18 (Europe/Warsaw)
Task ID: W5R-A60-FINAL-INDEPENDENT-QA / T130
Role: A60 — Independent QA & Release Gates
Status: DONE (two DB-free source acceptance reviews); RELEASE GATE: HOLD / NO-GO

## 1. Exact immutable identities (freshly rechecked)
Repo: https://github.com/C8LyNn/aplikacja-turnieje

| Pull request | BASE (40 chars) | HEAD (40 chars) | Independent verdict |
|---|---|---|---|
| #142 route async exists | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` | **PASS — SOURCE_ONLY / READY_FOR_QA_COMPOSITION; NOT LIVE** |
| #105 diagnostics Basic | `fa3261b2c9510e110ac9eba21726812d3401a525` | `be2b9557e7c555925b1c1e64755042e35c536932` | **PASS — SOURCE_ONLY / READY_FOR_QA_COMPOSITION; NOT API INTEGRATION** |
| #134 C03 | `a5bfd07b822c223fd995604dc2e228935ab81498` | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | **BLOCKED / RELEASE NO-GO** |

All three remained DRAFT at time of review. #142 is stacked on #103; #105 is stacked on immutable C01; #134 is stacked on C02. They are not a tested combined tree.

## 2. A60 isolated native execution
Executed **Node v22.16.0, Linux sandbox**, materialized individually verified GitHub exact-ref file contents, with EVERY code/test dependency's `git hash-object` equal to the retrieved Git blob SHA. This is exact-Git-blob native `node --test` in a minimal materialization, **not** a full monorepo checkout or installed pnpm workspace. Each invocation scrubbed environment using `env -i PATH="$PATH" HOME="$PWD" NODE_ENV=test`, with no inherited DB/PG/Replit credentials. No PostgreSQL, Docker, network service, asset mutation or paid CI.

Commands from isolated materialization root:
```sh
node --version # v22.16.0
node --check scripts/deployment/static-route-policy.mjs
env -i PATH="$PATH" HOME="$PWD" NODE_ENV=test node --test scripts/deployment/static-route-policy.test.mjs scripts/deployment/static-route-policy.async-exists.test.mjs
node --check qa/pack17/failure-evidence.mjs
env -i PATH="$PATH" HOME="$PWD" NODE_ENV=test node --test qa/pack17/failure-evidence.test.mjs qa/pack17/failure-evidence-w5r.test.mjs
node --check qa/pack17/run-gates.mjs
env -i PATH="$PATH" HOME="$PWD" NODE_ENV=test node --test qa/pack17/run-gates-exit.test.mjs
```

| Exact blob-pinned suite | Actual TAP | process exit | TAP log SHA256 |
|---|---|---|---|
| #142 original 10 + W5R 7 | **17 tests / 17 pass / 0 fail / 0 skipped / 0 todo** | **0** | `331a7d0b3e21b27b17300b310103dd327f602fc46e09d9ecacc0bf3be6056417` |
| #105 original 16 + W5R 7 | **23 tests / 23 pass / 0 fail / 0 skipped / 0 todo** | **0** | `bd84b5e02cbb0d53377188db0a7f08dc8de49b6e3cfdfb68ce3c81a0bfd77285` |
| #105 static runner exit-contract | **3 tests / 3 pass / 0 fail / 0 skipped / 0 todo** | **0** | `c7348a36f54fcd4c3175803357a1600f3286b9d3682b1300fc8c880d4962d50d` |

**Total 43/43 independent native tests PASS** on verified exact blob bodies. `node --check` of the three code modules exit 0. These successes do not substitute for browser, complete workspace tests, PG16, API integration, or live deployment.

Exact Git blobs:
- #142 helper `1b023671cd68116bb3876d1ef11d057c28a59265`; original tests `e6d3312f1ed951dacf307b9bfda42a9b655071c4`; W5R tests `d1f86241b55dd9198bfdb8528d97fc9c02d7b113`.
- #105 evidence helper `0b7a8df7bf946e2fa1a9817fbb75cccd89f7fc8c`; original tests `3ea61402b55cad03fa284bfbf39313c23dca4bb7`; W5R tests `5628bbc38a56b793363417d5db39ca05d0517ca0`.
- #105 runner `55b21d3752403e99feb2ac35a9e6cd1838576746`; runner tests `084bdbd86301f25b6392d608b15b03ad157625c8`; gate contract `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`.

## 3. #142 source acceptance: PASS, fail-closed, SPA/404 preserved
Delta from #103 is **exactly two files**: pure `scripts/deployment/static-route-policy.mjs` plus `static-route-policy.async-exists.test.mjs`; no changes to unrelated PR120 test-only branch or live host integration.
- New `checkedExists` accepts **only sync boolean**. Promise(false), Promise(true), thenable, nonboolean, thrown/rejected checker give `not_found` (never a static authorization, never SPA shell). Rejected promises consumed to avoid an unhandledRejection.
- 7 negative/positive async tests PASS; original 10 route tests PASS: existing built assets, portfolio/stream indexes, missing `.ttf` / `.js` / `.wasm` -> 404 decisions, encoded invalid paths denied, extensionless Wouter SPA deep routes -> index.html.
- **Confirmed fixed in pure classifier** vs original #103 Promise-truthiness bug. Not an actual Replit/HTTP fix: helper remains UNWIRED. Real browser/host HTTP status and MIME tests: NOT_RUN; stacked #120 is NOT integrated in #142.
**Verdict: DB-FREE SOURCE PASS / READY_FOR_QA_COMPOSITION. RELEASE/DEPLOY NO-GO.**

## 4. #105 source acceptance: PASS, credentials + exit/STOP
The specific W5R correction relative to previous #105 HEAD `3beba777627fa01ad46e83984915234a5d230046` changes **only** `qa/pack17/failure-evidence.mjs`, adds `failure-evidence-w5r.test.mjs`, and adds A50 W5R report. Full PR #105 has earlier scoped runner/test/report changes, but not API implementation/SQL/migrations.
- Basic Authorization and Proxy-Authorization credentials in plain/JSON/TAP/stderr synthetic vectors are replaced with `Basic [REDACTED]`, including lower-case `basic` and base64 padding. Existing Bearer, HTTP(S)/PostgreSQL DSN URL, named secret, counter and 400-character bounds regressions pass.
- `firstFailureEvidence` keeps first available failing TAP, diagnostic and counters; never fabricates a passing result. Native 23 cases PASS.
- Exact-code `run-gates.mjs` + `run-gates-exit.test.mjs` + `gate-contract.mjs` verified: failure in gate 1 or 2 retains **child exit 1**, logs first failure and blocks subsequent gates; synthetic success exits **0**. Native 3/3 PASS; actual failures are not silently skipped. Runner uses `process.exitCode` rather than premature `process.exit` for controlled errors.
- Redaction is **best effort for supported formats**, not a proof that arbitrary secret strings cannot leak in every future log. No new real first failing API assertion captured.
**Verdict: DB-FREE SOURCE PASS / READY_FOR_QA_COMPOSITION. API/PG16 RELEASE NO-GO.**

## 5. Exact #134 C03 CI verification: whole run FAIL
Official source: https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753
Job `correction-qa`, job ID `117691909864`, overall **FAILURE**. A60 fetched first-party official job steps **and decoded raw job logs**:
- Source contracts TAP 12/12 PASS, gate fail-closed contracts TAP 24/24 PASS, PostgreSQL atomic correction gate 8/8 PASS (original GitHub Actions environment, not rerun by A60).
- Workspace typecheck log includes `artifacts/api-server typecheck: Done`, tournament-manager and scripts Done, `PASS workspace typecheck`.
- `BLOCKED: API integration tests execution failed exit 1; signal none` recorded in the raw job log. **Full CI FAIL / release NO-GO**. First true failing API integration assertion remains UNKNOWN.
- Targeted adapter **20/20 PASS** is carried as the prior A60/A40 targeted execution receipt recorded in W5R dispatch and #134 chain; #134 test source has exactly **20 `test(` registrations**, but the retrieved combined C03 Actions raw log does **not expose a standalone 20/20 adapter TAP section**, so A60 cannot independently reauthenticate that separate TAP from *this* log alone. No conflation with the full workflow, and no claim of a fresh local native C03 adapter run.
- Browser E2E, merged composition, independent real PG16 API tests, app/release smoke: **NOT_RUN** in this A60 task.

## 6. Files, conflicts, remaining blockers, owner actions
A60 modified **only this QA report**, on a separate report-only branch; tested source files remain unchanged on #142/#105/#134. No game code/assets, Steam auth, Replit live, PostgreSQL, migration, SQL, merges, CI reruns, deployments or production changes by A60.

File ownership: #142 changes `scripts/deployment/`; W5R #105 changes `qa/pack17/` + report; #134 changes its backup preclone adapter and test. No direct overlapping changed paths across these three. DAG is nevertheless stacked on distinct bases; **source PASS is not combined-build approval**. Separate PR #120 is sibling child of #103 and remains uncomposed.

| Gate | Final status | Next owner |
|---|---|---|
| #142 pure routing correction | PASS, SOURCE_ONLY; no real Replit routing evidence | A120/A40 |
| #105 Basic redaction + fail propagation | PASS, SOURCE_ONLY; security best effort, API root cause unknown | A50/A30/A40 |
| C03 exact Actions typecheck and local scope | typecheck PASS, prior target 20/20 receipt; entire workflow FAIL | A40/A00 |
| C01 first failing API integration TAP | BLOCKED (first assertion unknown) | A50/A00 |
| Actual E2E / PG16 / release | NOT_RUN / HOLD; owner authorization required before any physically isolated PostgreSQL exercise | A00/operator |

**Final: ACCEPT both narrow DB-free fixes at exact inspected SHA for subsequent, separately gated source composition; NO-GO for C03 merge, runtime integration, live, or product release.**
