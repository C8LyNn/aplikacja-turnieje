# WEB-005 / A30 — W5R REDACTION SECURITY RECHECK

**Task ID:** `WEB005-W5R-A30-BASIC-REDACTION` · **Role:** A30 Security Coordination · **Date:** 2026-10-18  
**Status:** `DONE_SOURCE_REVIEW / NEEDS_FIX_A50 / NATIVE_TESTS_NOT_RUN`. This is a **one-page acceptance oracle**, not a patch or an API/PG16 security approval.  
**Exact reviewed A50 source:** Draft [PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), **HEAD `3beba777627fa01ad46e83984915234a5d230046`**, C01 BASE `fa3261b2c9510e110ac9eba21726812d3401a525`.  
**Readback source blobs:** `qa/pack17/failure-evidence.mjs` Git blob `e8a6310305d78fe0c3dad857b9760a80388b6c09`; `failure-evidence.test.mjs` blob `3ea61402b55cad03fa284bfbf39313c23dca4bb7`; `run-gates.mjs` blob `55b21d3752403e99feb2ac35a9e6cd1838576746`. Current PR #105 **does not include the W5R Basic Authorization fix**.

## Verified narrow finding

In [`redactEvidence`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3beba777627fa01ad46e83984915234a5d230046/qa/pack17/failure-evidence.mjs), current regexes cover ANSI, URL schemes, Bearer tokens and password/secret/token/key assignment labels, then bound output to 400 chars. They **do not cover `Authorization: Basic <opaque-base64>`** or `Proxy-Authorization: Basic ...`. `firstFailureEvidence` sends recognized `not ok` and `error:`/exception lines through that redactor; [`run-gates.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/3beba777627fa01ad46e83984915234a5d230046/qa/pack17/run-gates.mjs) prints the resulting first failure/diagnostic into shared stderr. **Confirmed source-level disclosure path conditional on a diagnostic carrying Basic credentials; not an observed real secret leak.** Existing tests have Bearer/URL/key vectors but **no Basic Auth negative assertion**. Existing URL DSN and `PGPASSWORD=` masking is partial best-effort, not proof of coverage for all libpq/serialized header forms.

## A50 acceptance oracle — synthetic-only input, expected public output

All examples are *invented nonsecret data*. Assert **no raw credential substring** in `redactEvidence`, `firstFailureEvidence().firstFailingTap`, `firstDiagnostic`, or logged `FIRST_FAILING_TAP` / `FIRST_TAP_DIAGNOSTIC`.

| ID | Synthetic input | Required observable behavior |
|---|---|---|
| **BASIC-01** | `not ok 1 - Authorization: Basic YTpi` | Preserve `not ok 1` and header type, replace opaque `YTpi` with `[REDACTED]`. |
| **BASIC-02** | `error: Proxy-Authorization: bAsIc YTpi` | Case-insensitive Basic redaction in diagnostic, no `YTpi`. |
| **BASIC-03** | `Authorization=Basic YTpi` and `authorization: basic "YTpi"` | Assignment/quoted forms scrubbed; reject unsafe unrecognized credential-bearing formats instead of publishing originals. |
| **DSN-01** | `not ok 2 - postgresql://fake:dummy@127.0.0.1:55432/test` | URL masked; no `fake:dummy` or full target DSN. |
| **DSN-02** | `error: PGPASSWORD=fakeSecret TEST_DATABASE_URL=postgresql://fake:dummy@localhost/test` | Both password value and DSN removed; no sensitive substrings. |
| **MIXED-01** | `not ok 3 - Bearer fakeToken Authorization: Basic YTpi` | Both auth schemes redacted; `not ok 3` preserved. |
| **SAFETY-01** | First `not ok` or `error:` on stderr; output exceeds 400 characters | Keep bounded, redacted earliest failure/diagnostic; no later raw fallback. |
| **EXIT-01** | Child integration suite status 1 / missing first TAP | Runner exits nonzero; `NOT_FOUND_IN_CAPTURED_OUTPUT` if unavailable, never invents a named test or converts failure to PASS. |

**Acceptance:** A50 adds failing-before and passing-after native Node 22 tests on a **new exact source SHA**, handles HTTP Basic opaque base64 incl. padding and mixed case without decoding it, preserves useful failure identity/TAP counters and redaction of Bearer/URL/secret assignments. Verify both stderr and stdout and the actual `run-gates` failure emission without ever using real secrets. For unknown/ambiguous credential syntax, suppress the unsafe line rather than log it raw. A60 independently inspects the patch and executed TAP/exit. **Optional future DB-free command, NOT_EXECUTED by A30:** `node --test qa/pack17/failure-evidence.test.mjs qa/pack17/run-gates-exit.test.mjs` in a verified isolated checkout with no inherited DB/prod secrets.

**Current verdict:** `A50_REDACTION_NEEDS_FIX`; **no W5R source patch exists on checked HEAD**. Root cause of C01 API integration exit 1 remains **UNKNOWN** (Issue [#73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73)); no inferred PG/SQL authorization. **No file ownership overlap:** A30 writes documentation only, not A50 `qa/pack17` code. **Integration:** `NEEDS_FIX` for public diagnostic exposure; DB-free development unaffected outside the log-publication seam. **Next:** A50 implement + test, A60 independent review, A10 update SHA registry, A00 owner decision.
