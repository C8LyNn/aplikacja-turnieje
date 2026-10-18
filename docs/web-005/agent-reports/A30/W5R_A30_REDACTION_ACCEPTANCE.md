# WEB-005 — W5R / A30 REDACTION SECURITY ACCEPTANCE

**Role / Task ID:** A30 — Security Coordination / `WEB005-W5R-A30-REDACTION-SECURITY-ACCEPTANCE`  
**Date:** 2026-10-18 · **Mode:** independent narrow review of diagnostic confidentiality and Pack17 fail-closed semantics; DB-free, no PostgreSQL, Docker, migration, merge or deployment.  
**Decision:** **`FAIL` — confidentiality acceptance withheld for publicly emitted failure diagnostics.** Standard Basic Auth regression fixed, but an additional reproducible **quoted Basic diagnostic** can still emit a synthetic Base64 credential. This is a narrow issue; it does not block unrelated DB-free work. **Not a verified leak of real secrets or a standard compliant on-wire Basic header bypass.**  
**Integration verdict:** `NEEDS_FIX / QA_FAIL_REDACTION / PACK17_EXIT_AND_SKIP_SOURCE_TEST_PASS / C01_API_ROOT_CAUSE_UNKNOWN / RELEASE_NO_GO`.

## Exact reviewed immutable inputs

- [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105): **HEAD `be2b9557e7c555925b1c1e64755042e35c536932`** (reconfirmed just before this publication); **BASE C01 `fa3261b2c9510e110ac9eba21726812d3401a525`**. GitHub OPEN, DRAFT, unmerged at inspection. No A30 edits to PR branch.
- [`qa/pack17/failure-evidence.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/failure-evidence.mjs) Git blob **`0b7a8df7bf946e2fa1a9817fbb75cccd89f7fc8c`**.
- [`qa/pack17/failure-evidence-w5r.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/failure-evidence-w5r.test.mjs) blob **`5628bbc38a56b793363417d5db39ca05d0517ca0`**.
- [`qa/pack17/failure-evidence.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/failure-evidence.test.mjs) blob **`3ea61402b55cad03fa284bfbf39313c23dca4bb7`**.
- [`qa/pack17/run-gates.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/run-gates.mjs) blob **`55b21d3752403e99feb2ac35a9e6cd1838576746`**.
- [`qa/pack17/run-gates-exit.test.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/run-gates-exit.test.mjs) blob **`084bdbd86301f25b6392d608b15b03ad157625c8`**.
- [`qa/pack17/gate-contract.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/gate-contract.mjs) blob **`eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`**.

**Trust of execution:** A30 independently transcribed these six exact GitHub file bodies into a disposable local-only scratch directory, then compared every file using actual `git hash-object` to the upstream blobs; all **six matched**. Tests used **native Node v22.16.0 on isolated Linux workspace**, no services or database credentials. A30 auxiliary tests are in local scratch **only**; this review does not claim an end-to-end app checkout or Windows production runtime.

## 1. Confirmed redaction failure: minimally reproducible

**Synthetic-only token:** `YTpi` (Base64 of a dummy `a:b`). Exact code:

```js
import { redactEvidence, firstFailureEvidence } from './qa/pack17/failure-evidence.mjs';
const fake = 'YTpi'; // synthetic data; NOT a real secret
redactEvidence('Authorization: Basic "' + fake + '"');
// Actual: Authorization: Basic "YTpi" — FAIL: credential remains
firstFailureEvidence('not ok 1 - Authorization: Basic "' + fake + '"\n# fail 1\n', '');
// Actual firstFailingTap still contains "YTpi" — FAIL
firstFailureEvidence('', 'Error: Authorization: Basic "' + fake + '" rejected\n');
// Actual firstDiagnostic still contains "YTpi" — FAIL
```

**Cause:** on reviewed source, `/\b(Basic)(\s+)[A-Za-z0-9+/_-]+={0,2}/gi` only matches an unquoted token beginning immediately after whitespace. It does **not** match an opaque credential quoted after `Basic`, or quoted in a `Proxy-Authorization` log. A50 tests cover JSON wrapping of `"Authorization":"Basic dXN..."`, but **not** `"Basic "dXN...""`-style log serialization. This is a **logged-message formatting edge**, not an observed leak from an actual request. The source redactor is described as best-effort; it should not be accepted as fail-closed for arbitrary diagnostic text while this known pattern remains.

**Scope of issue:** source returns unredacted `YTpi` through `redactEvidence`; `firstFailureEvidence` forwards it from **stdout first-failing TAP** or **stderr diagnostic**; `run-gates.mjs` prints those redacted fields into shared stderr. Thus a diagnostic in that formatting reaches shared logs with a synthetic-equivalent credential intact. No raw child stdout/stderr dump was observed in the reviewed runner path.

**A30 additional 10 native fail-expectation tests:** 5 PASS / **5 FAIL**, process **exit 1**, 0 SKIP/TODO. Failing cases A30-02..06: double/single quoted Basic, quoted Proxy Basic, quoted Basic inside stdout `not ok`, quoted Basic inside stderr `Error:`. Passing: ordinary Basic, PostgreSQL DSN, HTTPS credential URL, `PGPASSWORD` + `TEST_DATABASE_URL`, ordinary Basic from stderr. Local TAP SHA256 **`f332592f48c18dc970cadec9be5b567e70d63896b4c630b621276324683f5d2e`**. The intentionally failing security assertions are the basis for the `FAIL` verdict, not a broken test harness.

## 2. What actually passed

| Check | Exact native command in isolated `qa/pack17` directory | Result | TAP SHA256 |
|---|---|---|---|
| Existing 16 + new 7 redaction tests | `node --test --test-reporter=tap failure-evidence.test.mjs failure-evidence-w5r.test.mjs` | **exit 0; 23/23 PASS; 0 FAIL/SKIP/TODO** | `62664608df9b1ee7d2fff827ffb214d53ebe3b222e63510af49ebcec7309bda2` |
| Runner exit/STOP suite from PR #105 | `node --test --test-reporter=tap run-gates-exit.test.mjs` | **exit 0; 3/3 PASS; 0 FAIL/SKIP** | `29c0971a88d916f9c5b46337d97677919f3113580e95af893fcddc808e96a32c` |
| A30 extra TAP/exit/skip probes (scratch-only) | `node --test --test-reporter=tap a30-runner-security.test.mjs` | **exit 0; 6/6 PASS; 0 FAIL/SKIP** | `aeacdbd98db4eaa4bdc9fc8a9c14e7ece167dced95219e28fd78188e098b2316` |
| A30 extra negative log redaction probes (scratch-only) | `node --test --test-reporter=tap a30-security-negative.test.mjs` | **exit 1; 5 PASS / 5 FAIL as expected; 0 SKIP** | `f332592f48c18dc970cadec9be5b567e70d63896b4c630b621276324683f5d2e` |

**Confirmed for ordinary formatting:** standard HTTP Basic Base64 (also padded and case-insensitive `basic`), Bearer, `postgresql://user:pass@host/db`, `https://user:pass@host/`, `PGPASSWORD`, `TEST_DATABASE_URL` and common token/secret label assignments are masked in exercised cases. **Not claimed:** exhaustive arbitrary DSN formats, all third-party log serialization, generic security guarantees, or actual original CI stdout/stderr.

**Exit/skip behaviors:** `run-gates.mjs` passes a failing child status through `GateFailure` and sets `process.exitCode`; in the A30 controlled subprocess an injected child **exit 7 was preserved as parent exit 7**, no next gate. The genuine PR test suite verifies two child exit-1 STOPs and one clean `--static` exit 0. `assertCompleteTap` rejects missing summary, nonzero skipped/todo/cancelled, failures, and incomplete test accounting: A30 explicitly ran extra native synthetic skip/TODO/summary cases, with runner returning **exit 1** on a skipped first gate despite the child test process exiting 0. No evidence of deliberate skipping or false successes in reviewed static gate.

## 3. Required minimal A50 action and owner handoff

**A50 (implementation owner):** add two or three test-first negative synthetic cases for `Authorization: Basic "YTpi"`, `Authorization: Basic 'YTpi'` and `Proxy-Authorization=Basic "YTpi"`, including `firstFailureEvidence` stdout TAP and stderr diagnostic. Then minimally change `redactEvidence` to scrub the **entire token including optional quotes**, or suppress the matching auth-bearing evidence line on ambiguous formats; preserve fail-closed 400-char bound, TAP identity and counters, standard Basic/Bearer/URL masking, and true exit. Prefer small scope, not a redactor rewrite; no real secrets, no PG16. Publish **new full HEAD SHA**, real before/after Node TAP/exit. A60 independently reviews exact updated SHA. A00 determines if any residual nonstandard format is acceptable as documented limitation.

**No accepted A50 fix has been implemented by A30; no change to A50 branch or files.**

**Next owners:** A50 fix; A60 independent acceptance of rerun; A10 source SHA registry; A00 decision re publication of shared diagnostic outputs. [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) continues to track C01 API first assertion, still **UNKNOWN**; this redaction verdict does not diagnose database/fixture/API root cause.

## 4. W5R security handoff contract

| Field | Value |
|---|---|
| Task / role | `WEB005-W5R-A30-REDACTION-SECURITY-ACCEPTANCE` / A30 |
| Decision / status | **FAIL** for known quoted Basic diagnostic leakage; **DONE** with independent DB-free executed tests |
| Reviewed source BASE/HEAD | `fa3261b2c9510e110ac9eba21726812d3401a525` → **`be2b9557e7c555925b1c1e64755042e35c536932`** |
| A30 publication BASE | `7da6b243ab67177718b5874c43b5f63782500862` |
| Changed files in GitHub by A30 | This `docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md` plus checksum sidecar only |
| Native environment | Isolated Node v22.16.0 Linux, six exact file Git object hashes checked; no production/test DB env or network calls |
| Native tests | 23/23 PASS; 3/3 PASS; 6/6 PASS; security-negative 5/10 PASS + 5 FAIL, all with explicit exit/TAP digest above |
| PR / Issue | [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), [A50 Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73); no new code PR |
| File conflicts | **NONE**: A30 docs-only publication, A50 `qa/pack17` files unchanged |
| Integration verdict | `NEEDS_FIX` only for shared diagnostic publication; DB-free source work continues independently; C01 API full integration remains HOLD |
| Not performed | No full integration/browser/Windows E2E, PostgreSQL/Docker/SQL, merge, deploy, game asset edit or Replit sync |

**This FAIL is a bounded confidentiality assessment of the specified log-redaction change**, not a new broad R23H audit and not a global application release gate.
