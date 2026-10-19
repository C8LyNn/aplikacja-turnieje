# WEB-005 — WAVE 6A / A30 QUOTED BASIC RECHECK

**TASK:** `WEB005-W6A-A30-QUOTED-BASIC-SECURITY` · **ROLE:** A30 Security Coordination · **DATE:** 2026-10-19 (Europe/Warsaw)  
**STATUS:** **PARTIAL — independent old-HEAD repro DONE, A50 new-HEAD dependent reacceptance BLOCKED (NEW SHA NOT PUBLISHED)**.  
**DECISION:** **FAIL (existing PR #105 HEAD)** for arbitrary diagnostic confidentiality until quoted-Basic synthetic cases are scrubbed; **new A50 code review: NOT_RUN because new SHA does not exist at observed time**. This is the same bounded finding as W5R, not a new R23H review.  
**INTEGRATION VERDICT:** `NEEDS_FIX / A50_NEW_HEAD_REQUIRED / A30_CONFIDENTIALITY_FAIL / SOURCE_ONLY / NO_C04 / RELEASE_NO_GO`.

## 1. Exact frozen inputs and dependency

- [A50 Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105), checked twice in W6A: **HEAD `be2b9557e7c555925b1c1e64755042e35c536932`**, **BASE C01 `fa3261b2c9510e110ac9eba21726812d3401a525`**, OPEN/DRAFT, branch `fix/web005-c01-api-first-failure-evidence`.
- Exact reviewed [`qa/pack17/failure-evidence.mjs`](https://github.com/C8LyNn/aplikacja-turnieje/blob/be2b9557e7c555925b1c1e64755042e35c536932/qa/pack17/failure-evidence.mjs) Git blob **`0b7a8df7bf946e2fa1a9817fbb75cccd89f7fc8c`**; A30 recreated code byte-identically in isolated scratch then verified it with actual `git hash-object`. The old 7-case A50 W5R test blob is `5628bbc38a56b793363417d5db39ca05d0517ca0` and **does not cover quoted token forms**.
- [C03 Draft PR #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) HEAD `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`; separate lineage, **not modified by this report**. C01/C03 whole integration failure does not become PASS from redaction tests.
- Prior immutable [W5R A30 FAIL acceptance](https://github.com/C8LyNn/aplikacja-turnieje/blob/22d12222104907ab08e8bcc18033dcdf7f5f11f6/docs/web-005/agent-reports/A30/W5R_A30_REDACTION_ACCEPTANCE.md): 23/23 old A50 positive regression, 3/3 runner tests and 6/6 A30 extra runner probes, but 5/10 A30 negative confidentiality cases FAILED as expected. **Not rerun as unchanged**.
- No A50 HEAD after `be2b955...` found on current fetch. Per W6A gate, **new-SHA independent acceptance cannot yet be executed** and must be recorded as `NOT_RUN / BLOCKED_DEPENDENCY`.

## 2. Minimal synthetic reproduction (only fake Base64)

```js
import {redactEvidence, firstFailureEvidence} from './qa/pack17/failure-evidence.mjs';
const fake = 'YTpi'; // dummy Base64("a:b"); not a real credential
redactEvidence('Authorization: Basic "' + fake + '"');
// Actual: Authorization: Basic "YTpi" (fake token retained)
redactEvidence("Authorization: Basic '" + fake + "'");
// Actual: Authorization: Basic 'YTpi'
redactEvidence('Proxy-Authorization: Basic "' + fake + '"');
// Actual: Proxy-Authorization: Basic "YTpi"
firstFailureEvidence('not ok 1 - Authorization: Basic "' + fake + '"\n# fail 1\n','').firstFailingTap;
// retains YTpi; source parser/runner may emit that field to shared log
firstFailureEvidence('', 'Error: Authorization: Basic "' + fake + '"\n').firstDiagnostic;
// retains YTpi in stderr-origin diagnostic
```

**Source cause:** `/\b(Basic)(\s+)[A-Za-z0-9+/_-]+={0,2}/gi` begins Base64 matching immediately after whitespace, excluding a quote. Standard `Basic YTpi` is handled; *quoted diagnostic text* is not. No actual leaked user secret was inspected or reproduced.

**Required narrow A50 patch:** test-first cases for double/single quoted Basic, quoted Proxy Basic, stdout first failing TAP and stderr `Error:`; mask whole quoted token or suppress ambiguous credential-bearing line before bounded public logging. Preserve normal Basic/Bearer/URL/DSN masking and `exit 7`/nonzero propagation/STOP, skip/TODO rejection and 400-character bounding. Supply a new 40-char HEAD and real native Node TAP/exit; A30 and A60 independently review exact SHA. Do not rewrite shared runner or touch DB/API.

## 3. W6A actual DB-free evidence — rerun of existing failing SHA only

**Environment:** isolated scratch `/mnt/data/w6a_a30_synthetic`; **Node v22.16.0**, Git 2.47.3, Linux; no pnpm, no PG/SQL, secrets, HTTP or Replit. The 10-case test file was reused unchanged from the preceding A30 synthetic evidence archive; no code edited in GitHub.

```sh
git hash-object /mnt/data/w6a_a30_synthetic/failure-evidence.mjs
# 0b7a8df7bf946e2fa1a9817fbb75cccd89f7fc8c, MATCHES PR105
cd /mnt/data/w6a_a30_synthetic
node --test --test-reporter=tap a30-security-negative.test.mjs > negative_quoted_basic.tap 2>&1
# actual exit 1
# tests 10 ; pass 5 ; fail 5 ; cancelled 0 ; skipped 0 ; todo 0
sha256sum negative_quoted_basic.tap
# c7e92035ad47139bd5708abb884558b0309fe1d5a14282162938e48b067b16d7
```

**Failing negative acceptance assertions:** A30-02 double quotes, A30-03 single quotes, A30-04 proxy quoted Basic, A30-05 stdout `not ok`, A30-06 stderr `Error:`. **Passing cases** A30-01 ordinary Basic, A30-07 DSN URL user/password, A30-08 HTTPS userinfo, A30-09 `PGPASSWORD` / DSN assignment, A30-10 ordinary stderr Basic. This *intentional* negative security exit1 proves existing redaction is not yet sufficient and **must not be labelled a passing security gate**.

**New-SHA tests:** `NOT_RUN`; **no new A50 source SHA** available. W5R prior real runner test results remain historical, not rerun/claimed as a new W6A 23/23 receipt.

## 4. W6A_HANDOFF

| Field | Result |
|---|---|
| ROLE / TASK | A30 / `WEB005-W6A-A30-QUOTED-BASIC-SECURITY` |
| STATUS | **PARTIAL** — old SHA FAIL confirmed, **BLOCKED** for dependent NEW-HEAD acceptance |
| SOURCE BASE / HEAD (reviewed PR105) | `fa3261b2c9510e110ac9eba21726812d3401a525` → `be2b9557e7c555925b1c1e64755042e35c536932` |
| A30 DOC base | `22d12222104907ab08e8bcc18033dcdf7f5f11f6` |
| CHANGED PATHS | This A30 `W6A_A30_QUOTED_BASIC_RECHECK.md` and optional checksum only; **NO CODE CHANGES** |
| REPRO DEFECT | Quoted fake Basic `YTpi` survives raw log redaction → public first failing TAP/stderr fields |
| ACTUAL TEST / EXIT | `node --test --test-reporter=tap a30-security-negative.test.mjs` → **exit1, 5 PASS / 5 FAIL, no SKIP**, file blob hash verified |
| FIRST FAILED APP TEST | **UNKNOWN**: original C01 API integration exit1 lacks authentic named first TAP; this task did not run app tests |
| PR / OVERLAP | PR105 A50-owned `qa/pack17/*` untouched; A30 docs-only and own scratch; no collision with A50/A40 |
| NEXT OWNER | **A50** publish narrow quoted-Basic fix and native evidence; **A30/A60** independently test NEW HEAD; A10 register; A00 gate |
| INTEGRATION | **NEEDS_FIX** for diagnostic publication; no C04, no PG16, no protected merge, no live deploy |

**Operator prerequisite:** No PC action is needed for this pure-source reproduction. Full local monorepo/app runtime remains separately `OPERATOR_REQUIRED` under A20 scope, **not** completed by A30.

**STOP:** Do not turn old FAIL into PASS because standard Basic passes. No broader R23H, PostgreSQL, shared database, package install, game assets, or production access.
