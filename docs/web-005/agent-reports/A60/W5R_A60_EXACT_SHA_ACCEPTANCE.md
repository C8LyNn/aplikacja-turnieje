# WEB-005 / W5R — A60 EXACT SHA ACCEPTANCE
Date: 2026-10-18
Task ID: W5R-A60 / T130
Role: A60 Independent QA & Release Gates
Status: PARTIAL — source review completed; exact native execution NOT_RUN; awaiting A20/A50/A120 fixes
Integration verdict: BLOCKED (real working/E2E release); SOURCE_ONLY for current PR review.
No merge, deploy, DB, Replit, game or production SQL execution.

## Immutable refs inspected
Repository: C8LyNn/aplikacja-turnieje
- C03 PR #134: BASE a5bfd07b822c223fd995604dc2e228935ab81498; HEAD 80bb4ca7a9a359fbe76dbab1478a1af16ded0174; draft, changed files 2.
- Preflight PR #135: BASE 1db3734b8988940acc6be8b992420a58fc39624a; HEAD cfa69565ccf6bedb4f8e3e3b4be948132fb727ba; draft, changed files 4. Committed synthetic test source contains 13 test() declarations (not proof of execution).
- Diagnostics PR #105: BASE fa3261b2c9510e110ac9eba21726812d3401a525; HEAD 3beba777627fa01ad46e83984915234a5d230046; draft, changed files 9.
- Route policy PR #103: BASE 1db3734b8988940acc6be8b992420a58fc39624a; HEAD 9fb85b2ca5c137c6107a360bbdb45efec6bf1dde; draft, changed files 2.
- Transport tests PR #120: BASE 9fb85b2ca5c137c6107a360bbdb45efec6bf1dde; HEAD e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab; draft, changed files 2.
- Current W5R A50/A120 corrected heads: NOT YET OBSERVED as of this source review; require fresh ref verification before acceptance.

## CI evidence and correct attribution
C03 run https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753 job correction-qa concluded FAILURE. Official returned job steps show successful install, SE unit, packs 19–26; 'Static and database release gates' FAILED. MASTER DISPATCH and earlier A60 evidence record 20/20 adapter targeted PASS + workspace typecheck PASS, and API integration exit 1. Those are previous source-specific receipts; do not relabel the full workflow PASS. First failing API TAP assertion/root cause UNKNOWN; no E2E PASS.

## Independent source review: redaction gap (CONFIRMED)
At exact PR105 head qa/pack17/failure-evidence.mjs, redactEvidence removes URLs, Bearer credentials, and named keys matching PASSWORD/PASSWD/SECRET/TOKEN/API_KEY/ACCESS_KEY. A plain `Authorization: Basic dGVzdDp0ZXN0` is not covered; arbitrary base64 Basic credential survives current replacement patterns (except truncation when >400 chars). Synthetic negative acceptance vector: input `Authorization: Basic dXNlcjpwYXNz`; expected output MUST NOT include `dXNlcjpwYXNz`. Existing source will retain it. A50 must supply a patched new SHA plus failing-before/passing-after exact native TAP. A30 independently reviews DSN and credential mask.

## Independent source review: async exists gap (CONFIRMED)
At exact PR103 head, `if (exists(decoded))` and `return exists(index) ? ...` interpret a returned Promise as truthy. Synthetic negative acceptance vector: `resolveStaticRoute('/fonts/missing.ttf', async()=>false)` MUST NOT produce `{kind:'static',path:'/fonts/missing.ttf'}`; current code does. Missing `.wasm` and `.js` with async false likewise; indexed aliases also risk false STATIC. Fix should require synchronous boolean or intentionally async resolution; fail-closed on unexpected values. No real-host wiring exists; PR120 HTTP test uses synchronous Map.has fixture and does not prove live hosting.

## Acceptance matrix
| Scope | Verified source | Verified native tests on exact commit | FAIL | Blocked/Not tested |
|---|---|---|---|---|
| C03 #134 | PR/head/diff 2 files confirmed; prior SOURCE PASS | CI adapter target 20/20 and typecheck PASS per dispatch / prior report | Entire workflow FAIL, API integration exit 1 | E2E, first failing TAP unknown |
| Preflight #135 | committed test source 13 cases; base/head confirmed | NOT_RUN by A60 | none established for committed native test | exact committed Node --test requires controlled checkout |
| Redaction #105 | Basic gap confirmed from exact source | NOT_RUN by A60 | source acceptance criterion fails | corrected patch not yet received |
| Route #103/#120 | Promise-truthiness bug confirmed from exact source; synthetic HTTP harness uses sync callback | NOT_RUN by A60 | source acceptance criterion fails | corrected patch not yet received; browser/live E2E NOT_RUN |
| PG16/app | no permission to execute | NOT_RUN | no new independent execution failure attributed | PG16 G0 HOLD; no controlled DB-free complete checkout |

## Commands / execution environment
No local repository checkout with pinned committed blobs and toolchain was established in this A60 session; therefore ALL A60 native test commands: NOT_RUN; exit/TAP = N/A (do not synthesize). GitHub connector exact-ref source reads and official workflow job metadata were performed read-only. No env credentials consumed or logged. Potential native command after safe isolated checkout: `node --test scripts/qa/web005-local-readiness.test.mjs` at exact #135; `node --test <A50 committed redaction test>` and `node --test <A120 committed route test>` only after new SHA exists and files verified. Do not run umbrella pnpm test; it reaches PostgreSQL integration.

## Source / path ownership and conflicts
A60 modified ONLY this report (new docs path) on its own isolated branch; no changes to app or other agents' active files. #105 owns qa/pack17; #103 owns pure route policy; #135 owns scripts/qa; #134 owns preclone adapter/tests. No conflict detected in this report-only scope. No game/live/SQL files modified by A60. Presence or absence of modifications in future heads must be rechecked by the integration owner.

## Follow-up / decision
A20: supply actual Node22 native exact #135 test receipt or precise environmental blocker.
A50: fix Basic Authorization fail-closed redaction with test-first before/after, exact SHA, log nonzero exit.
A120: fix Promise/async exists fail-closed with negative cases, exact SHA and native TAP.
A30: minimal credential redaction security review.
A10: refresh immutable registry and SHA provenance.
A40: no C04 until accepted; no source composition from failing/unverified heads.
A00: keep C03 integration and release HOLD. Any separately isolated PG16 integration needs explicit owner decision, scope, safeguards and reproducible first-failure capture. Do not call this E2E ready.

Links: https://github.com/C8LyNn/aplikacja-turnieje/pull/134 | https://github.com/C8LyNn/aplikacja-turnieje/pull/135 | https://github.com/C8LyNn/aplikacja-turnieje/pull/105 | https://github.com/C8LyNn/aplikacja-turnieje/pull/103 | https://github.com/C8LyNn/aplikacja-turnieje/pull/120
