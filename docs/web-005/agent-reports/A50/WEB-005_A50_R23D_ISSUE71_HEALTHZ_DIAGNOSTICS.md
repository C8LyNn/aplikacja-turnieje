# WEB-005 — R23D / A50 — Issue #71: transient /api/healthz 503 diagnostics

**Agent:** A50 — Isolated Test Execution & QA Infrastructure · **Date:** 2026-10-16 · **Priority:** P1  
**Issue:** [#71](https://github.com/C8LyNn/aplikacja-turnieje/issues/71) · **Dispatch:** [R23D](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Verdict:** **`HEALTHZ_503_CAUSE_UNCONFIRMED / EARLIER_FAST_QUERY_FAILED_OBSERVED_SECONDARY / TARGET_WINDOW_LOGS_MISSING / MONITORING_DESIGN_READY / NO_CODE_CHANGE`**. No root-cause fix DRAFT PR is justified on existing evidence.

## 1. Read-only published deployment log inquiry: provenance and limits

A50 used the **connected Replit app inspection/ask workflow in READ-ONLY mode**, without starting/restarting the application, issuing test HTTP requests, querying DB, changing files or deploying. It returned a natural-language summary of a subset of historical deployment logs for **2026-10-15**, but **not raw exported immutable log files**. Treat these records as **secondary, independently unverified Replit Agent summaries**, NOT as original timestamped attachments or a certified complete audit log.

The Replit Agent reported that log searches for **20:30–21:15 UTC** (the approximately **20:41 UTC** incident window) and for **20:30–24:00 UTC** returned **no accessible logs**. No 503/200 transition at 20:41 UTC could be confirmed from this source. Absence of retrieved logs does **not** prove no incidents happened.

It reported these **separate earlier** events, do not conflate with 20:41 UTC:

| Date/time UTC | Reported observation | Whole HTTP request latency |
|---|---|---:|
| 2026-10-15 14:47:58.070–.071 | health database `query_failed`, GET `/api/healthz` 503 | **7 ms** |
| 2026-10-15 14:48:16.909–.910 | `query_failed`, GET `/api/healthz` 503 | **5 ms** |
| 2026-10-15 14:48:50.924–.925 | `query_failed`, GET `/api/healthz` 503 | **14 ms** |
| 2026-10-15 14:48:52.175 | `query_failed`, GET `/api/healthz` 503 | **7 ms** |

These 5–14ms request durations were reported as **total HTTP latency**, not time to acquire a PostgreSQL client or to execute `SELECT 1`. The explicit `query_failed` category is distinct from the outer 1,000ms `timeout`; a fast failure could occur at module import, pool acquisition, connection establishment, query execution or other causes. **No specific SQL or pool error code was provided.** It is not justified to claim slow query, exhausted connection pool, startup outage or confirmed recovery from these secondary observations.

## 2. Immutable GitHub release implementation audit

**GitHub release baseline:** `1db3734b8988940acc6be8b992420a58fc39624a`, **not** equivalent to local-only Replit deployment checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f`. Dispatch reports **140 Replit-vs-release differing paths** (90 local-only, 50 blob-different); A50 did **not** prove deployed `health.ts` has identical bytes. Any live root-cause claim requires deployed-runtime source parity first.

Read source on that **exact GitHub release**:
- `artifacts/api-server/src/routes/health.ts` Git blob **`7d60d98848f8f8775e710bf44d198fd20d18811f`**, 81 lines. Its default `databaseCheck` dynamically imports `@workspace/db` and calls `pool.query({text:"SELECT 1",query_timeout:1000})`, racing the whole promise against an **outer 1,000ms timer**. On any rejection, response is fail-closed **503** with fixed JSON `{"status":"error","database":"unavailable"}`; log includes only `errorType: "timeout" | "query_failed"`. There is no distinct acquisition/startup/SQL timing field and no raw DB error string in this endpoint's warning.
- `lib/db/src/index.ts` Git blob **`50cbf483d87a8a741f4965acde5edf6225fedd3e`**: `new pg.Pool({connectionString:process.env.DATABASE_URL})` and Drizzle wrapper; no available pool acquisition counters measured by current health route.
- `artifacts/api-server/src/index.ts` Git blob **`31b1ba194f1aa84d17787af70618e3f3664f5dec`**: starts API and logs `Server listening`; source contains startup mode but the relevant deployment logs were unavailable.
- `artifacts/api-server/test/health.test.ts` Git blob **`06209a5e0fb4b34601d35bb317941d69c4a2b657`**: three authored tests cover healthy 200, redacted query-failure 503 and never-settling timeout 503; **no test yet demonstrates slow connection versus slow SQL, 503→200 recovery or late query completion/pool resource safety.** Merely authored tests are not a new A50 test PASS.

**Important technical boundary:** `Promise.race` and clearing its timer **do not cancel** the underlying database operation. Thus a returned 503 alone does not prove a query or queued pool request has stopped. This is a source-level risk/monitoring gap, **not a confirmed production leak**. No automatic increase of 1000ms timeout is proposed.

## 3. Privacy-safe monitoring and prospective tests (NOT executed or deployed)

Before proposing a source fix, obtain **read-only, bounded, sanitized** deployment telemetry for the exact 20:41 UTC time range and deployed source fingerprint. Measure and correlate:
- `health_check_total_ms`, **pool/client acquisition wait**, and `SELECT 1` execution latency separately (use safe instrumentation with client release guaranteed in `finally` and bounded timers, reviewed by A30). A single global 1s Promise race cannot distinguish the stages.
- Aggregate `pool.totalCount`, `idleCount`, `waitingCount` and non-sensitive DB error **category** or SQLSTATE class where safe, without URLs, password, raw SQL data, connection string, actor ID, IP address or request headers.
- Deployment startup timestamps/readiness probes, cold start/restart/reconnect event timing, PostgreSQL connection error class and 503/200 counts before/during/after 20:41 UTC.
- Preserve fail-closed 503 semantics, avoid timeout increases as a guess, and avoid reading user data. Collect logs only through permitted read-only interfaces and sanitize before sharing.

**Proposed isolated test matrix** (no test executed by A50 R23D):
1. Success 200 and immediate fail 503, with synthetic/logged non-secret categories.
2. Artificially delayed connection acquisition versus delayed query; verify timing attribution and deterministic response.
3. Initial 503 then 200 recovery after DB reconnection without changing status semantics.
4. Timed-out query finishing *after* 503 and cleanup/release; prove no connection leak/unhandled rejection.
5. Logging excludes credentials/PII and does not expose raw exception text or DB host.

**Current A50 execution:** GitHub exact-blob source inspection **EXECUTED**; Replit read-only secondary log query **EXECUTED**; locally executed Node/tsx health tests, health HTTP against live, SQL/DB diagnostics, startup simulation and browser testing **`NOT_EXECUTED`** (no authorized complete repo with pnpm10 and no live-request GO). Native exit/TAP/PASS/FAIL/SKIP: **null**. No source modifications, test PR, SQL migration, reset, deploy or republish.

## 4. Exact owner/A00 unblockers and decision

**Needed to confirm incident root cause:** A00/owner grants access to the **original sanitized immutable Replit deployment log export** spanning 20:30–21:15 UTC (with 20:41) plus permitted DB pool metrics, startup/readiness chronology and the deployed `health.ts` file fingerprint. Replit summary currently cannot supply this record. A separate authorized trusted clean repo checkout (Node22/pnpm10/frozen dependencies) would allow offline injected health tests, but cannot establish a historical live root cause without the missing timeline.

**No DRAFT patch PR yet:** Issue explicitly says propose minimal fix **only when reproducible**. As source currently intentionally preserves fail-closed status and raw production error is not identified, introducing retries, higher timeout or altering pool behavior would be speculative. When original evidence reveals a mechanism, prepare a narrowly scoped non-game test-first DRAFT PR, never deploy directly; require independent A60 QA at new exact SHA and A30 safety check if logging behavior changes.

**Final Issue #71:** `ROOT_CAUSE_UNKNOWN / ORIGINAL_2041_UTC_LOG_MISSING / EARLIER_QUERY_FAILED_503_SECONDARY / NO_LIVE_ACTION / SOURCE_ONLY_MONITORING_PLAN / RELEASE_NO_GO`.
