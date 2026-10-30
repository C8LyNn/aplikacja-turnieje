# CC-001 R17-W9 / A44 PC1-PC2 evidence collector

**Status:** Implemented; Node 22 synthetic tests 7/7 PASS. NOT gameplay repair or G3 QA PASS.
**Frozen baseline:** RC1 commit 10f64e4d213f17a352ed8fa83bc75884a39549f0 (reference only; not live binary proof).
**Scope:** own scripts/cc001/w9/a44/ folder only. No Unity, R16, V148, Protocol149, CI, release or production edits.

## Purpose
- Consumes two previously collected Unity Windows Player.log files: PC1 host and PC2 client.
- Generates redacted copies named PC1_Player.redacted.log and PC2_Player.redacted.log, preserving CC_NET_* trace/owner/serial fields for the separate A31 analyzer.
- Records original/redacted file SHA-256 and byte sizes, session ID, UTC, declared device/seat, optional EXE hash comparisons. Original Player.logs remain untouched.
- Never writes the raw log into output. Rejects duplicate input, bad files, mismatched expected binary SHA, pre-existing output and missing arguments. Bundles are offline/private.
- Labels all evidence CAPTURED_UNVERIFIED_BY_A60. Role/seat claims are not authoritative; hash matching does not imply release certification.

## First private PC1/PC2 Windows run
1. Use the same independently approved game build on separate Windows PCs over a trusted private LAN. Do not port-forward unencrypted websocket port TCP 7777 to the Internet.
2. After the test, copy the two original Unity Player.log files to one private collection PC, e.g. C:\Evidence\PC1.log and C:\Evidence\PC2.log. Their original locations depend on Unity Player company/product settings. Inspect the matching game folder under %USERPROFILE%\AppData\LocalLow\ on each machine and preserve originals.
3. Install/use Node 22 on the collection PC, then run from repo root:

    node scripts/cc001/w9/a44/pack-multiplayer-evidence.cjs --host "C:\Evidence\PC1.log" --client "C:\Evidence\PC2.log" --session W9_PAIR_001 --out "C:\Evidence\W9_PAIR_001_REDACTED"

4. To compare the copied PC1/PC2 EXE bytes with an operator-supplied expected SHA, append:

    --host-exe "C:\Evidence\PC1_CoreClash.exe" --client-exe "C:\Evidence\PC2_CoreClash.exe" --expected-exe-sha 97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3

   The example expected EXE SHA is the historical A60-accepted RC1 W8 Windows Player from HQ #97, NOT any W9 repaired build. Substitute the approved new SHA when building future candidates. Tool labels an identical hash MATCHES_OPERATOR_EXPECTATION, never CERTIFIED.
5. Examine both sanitized logs manually for private identities, credentials, unusual secrets or links. Sanitization is best-effort. Only share reviewed redacted logs and manifest through authorized private QA channels. Do not publish raw LAN addresses or logs in a public GitHub issue.
6. After A70 integrates A31's independently developed W9 analyzer, feed the sanitized files:

    node scripts/cc001/w9/a31/analyze-network-logs.cjs --host "C:\Evidence\W9_PAIR_001_REDACTED\PC1_Player.redacted.log" --client "C:\Evidence\W9_PAIR_001_REDACTED\PC2_Player.redacted.log" --out "C:\Evidence\W9_PAIR_001_A31_ANALYSIS.json"

   This does not establish physical parity or prove one-way latency. A60 is responsible for independent acceptance.

## Reproduction notes
If the UI says Your Turn while the actual P2 is not active, record the displayed text versus host action serial and actual owner. Keep telemetry, timing, arrow/perspective and other bugs in separate findings with session ID, local UTC, affected PC, expected/actual state, steps and relevant approved screenshots. Do not fix during session.

## Test command
    node --test scripts/cc001/w9/a44/pack-multiplayer-evidence.test.cjs

Expected: 7/7 synthetic PASS. Real PC1/PC2 run: NOT RUN by A44.

## Ownership
A44 owns offline evidence capture; A31 networking diagnosis/repair; A60 independent QA; A70 integration; A40/A42 delivery and build. No merge to main, release, deploy, Unity gameplay modification, protocol mutation or claim of G3 PASS.
