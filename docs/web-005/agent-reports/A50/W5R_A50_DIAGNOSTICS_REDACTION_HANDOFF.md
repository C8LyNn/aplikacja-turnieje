# WEB-005 — A50 / W5R — C01 FIRST-FAILURE DIAGNOSTICS / BASIC AUTH REDACTION

**TASK ID:** WEB-005-A50-W5R-PR105-BASIC-AUTH-REDACTION  
**ROLE:** A50 — Backend / API, TRACK-C DIAGNOSTICS  
**MODE:** DEVELOPMENT FIRST / SCOPE qa/pack17, DB-FREE ONLY  
**STATUS:** **DONE for confirmed Basic Authorization redaction defect; PARTIAL for original C01 API root-cause recovery**  
**INTEGRATION VERDICT:** **READY_FOR_QA** for the narrow diagnostic-only patch / **BLOCKED** for C01 full API integration; **NOT** release-ready.

**Immutable C01 BASE SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` — [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60).  
**Prior A50 PR #105 HEAD:** `3beba777627fa01ad46e83984915234a5d230046`.  
**W5R PATCH HEAD before report:** `3970795606f156453535d396907ad2f7fdb6a931`; **final HEAD:** read [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) after this document commit.  
**Branch:** `fix/web005-c01-api-first-failure-evidence`, owned by A50; [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), not merged.

## Exact changed paths (WAVE 5 → W5R)

1. `qa/pack17/failure-evidence.mjs` — **one-line source fix**, line 9: redact token in `Basic <synthetic-token>` including Authorization/Proxy-Authorization, before printing bounded first TAP failure or diagnostic. Preserves original URL, Bearer, key-value and bounded output handling. Git blob SHA-1 **`0b7a8df7bf946e2fa1a9817fbb75cccd89f7fc8c`**.
2. `qa/pack17/failure-evidence-w5r.test.mjs` — **seven new synthetic DB-free regression tests**: Basic header, lowercase Proxy-Authorization and padded Base64, JSON header, first failing TAP, stderr diagnostic, existing Bearer/DSN coexistence, missing-token non-fabrication. Git blob SHA-1 **`5628bbc38a56b793363417d5db39ca05d0517ca0`**.
3. This `docs/web-005/agent-reports/A50/W5R_A50_DIAGNOSTICS_REDACTION_HANDOFF.md` — report only.

No changes in `qa/pack17/run-gates.mjs`, C01 business API, C02, C03 PR134, PostgreSQL fixtures, migrations, game/Unity sources, frontend route policy, A20 preflight, GitHub workflow, lockfile or Replit live.

## Test-first RED → GREEN (actual Node 22.16.0, Linux isolated scratch)

**Input:** exclusively synthetic placeholder-like Base64 and dummy DSNs, no real headers or credentials.  
**Exact source:** local `git hash-object` checked equal to published GitHub blobs; existing prior 16-test file `failure-evidence.test.mjs` Git blob `3ea61402b55cad03fa284bfbf39313c23dca4bb7`.

**RED baseline** on exact old source Git blob `e8a6310305d78fe0c3dad857b9760a80388b6c09`:
`node --test --test-reporter=tap failure-evidence-w5r.test.mjs` ⇒ **exit 1, 1/7 PASS, 6/7 FAIL**. Reproduced Basic credential disclosure in header/TAP/stderr; one absence-of-token control already passed. Raw RED log SHA256 `3da1f5bad5475ab5578d4be5a04f94f8d604dd3fe6949b70c7b3e834f899a074`.

**GREEN** with one-line patch:
- `node --check failure-evidence.mjs` → exit 0;
- `node --check failure-evidence.test.mjs` → exit 0;
- `node --check failure-evidence-w5r.test.mjs` → exit 0;
- `node --test --test-reporter=tap failure-evidence-w5r.test.mjs` → **exit 0, 7/7 PASS, 0 FAIL/SKIP**, individual TAP SHA256 `36af2ee47df5d0b9bc8566fb61352b8a7f32d1232fc38d250249b0589f28fdaf`;
- `node --test --test-reporter=tap failure-evidence.test.mjs failure-evidence-w5r.test.mjs` → **exit 0, 23/23 PASS, 0 FAIL/SKIP/CANCEL/TODO**, full TAP SHA256 `d5583d44bc62555aa5394ffe6bb3e51274c7b104d7bae5c9eee9d895418d46ce`, 3,882 B.

Exact Green source Git blobs matched against GitHub after upload: `0b7a8df7...` (implementation), `5628bbc38...` (7-case test) and `3ea61402...` (old 16-case test). Environment is **Node v22.16.0**, not owner's pinned Windows v22.23.3.

**Tests NOT RUN:** full API integration, actual PostgreSQL, Docker, database fixtures, migration SQL/Drizzle FORCE, CI workflow, browser/E2E, native Windows exact version, production deployment. This is **not** proof of complete secret redaction for arbitrary unknown log formats. A30 independent source review, A60 independent exact-SHA execution acceptance still PENDING.

## Original C01 API integration root cause: still UNKNOWN

[GitHub Actions original C01 run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793) had `BLOCKED: API integration tests execution failed exit 1; signal none`. No authenticated first failing `not ok`/test assertion and no accessible original full private TAP artifact have been verified. [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) remains open. C03 [workflow 39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) has reported 20/20 adapter targeted PASS but full API integration exit 1; **not** a full E2E PASS, and not proof of same C01 root cause. Do NOT reclassify an expected PostgreSQL negative fixture error or preceding passing TAP as an actual failed API assertion.

## Narrow operator reproduction contract (future only / NO PG16 authorization)

**Preferred no-execution option:** recover *authentic original* complete private C01 TAP+stdout+stderr with source commit/run+job identifier, file hash, true exit and failing test file/name/assertion. Redact only reviewable public extracts; retain raw under operator ACL.

**Otherwise** A00/HQ + A20 + named Windows operator must independently authorize exactly one separate **fresh disposable PG16** project, image/volume/source SHA, test command, and SQL-destructive fixture risk. Preflight actual isolation: `network_mode:none` for PG16 and runner sharing private loopback namespace; no published ports, foreign routes, Docker socket, native Windows PGDATA, Replit/prod DSN; positive server system identifier, actual TEST DB+role+permissions, and all four S2 scratch DBs/Drizzle two FORCE calls scoped to that disposable cluster. Use A20's minimal disposable PG16 plan. Physical isolation does NOT fix the unchanged historical C01 failed-CREATE ⇒ FORCE DROP hazard; no G4 without a separately approved risk-scoped safe variant and exact SHA (source-hardened B is a different experiment) or an independently signed one-off C01 exception. Reject missing evidence, mismatched connection or ambiguous CREATE/DROP as `STOP/CLEANUP_HOLD`; cleanup requires separate exact-resource authorization.

**Required result to A50:** exact source/approval/run/cluster identity; first failing test and assertion stack; raw private TAP SHA256; true process exit and signal; redacted reviewed excerpt; classification application vs fixture vs environment. Only after obtaining real evidence should A50 prepare a minimal application/fixture Draft PR.

## Ownership and handoff

- **A30:** narrow independent Basic/DSN/Bearer masking and fail-closed review; do NOT infer full assurance from regex.
- **A60:** verify exact PR #105 HEAD and independently rerun DB-free 23-case suite, review 7 negative cases and absence of code/CI/SQL mutation.
- **A10:** register current exact SHA; PR #105 = diagnostics **READY_FOR_QA**, NOT C01 application bug fix.
- **A40:** preserve C03 PR134 exact-source freeze; no C04/merge and no automatic inclusion of diagnostics as functional fix.
- **A00:** decide whether authentic CI TAP retrieval or future separately approved physical PG16 run is the unblock route.

**STOP/GATES:** `W5R_A50_REDACTION_SOURCE_FIXED_DB_FREE_23_OF_23_PASS / READY_FOR_QA / C01_API_ROOT_CAUSE_UNKNOWN / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
