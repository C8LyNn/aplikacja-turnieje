# CC-001 R17-W11 — A74 Evidence Admission Gate

**Role:** A74 / Repository Hygiene. **Existing Issue:** #141. **HQ:** #97. **Purpose:** independent fail-closed, READ-ONLY admission of offline A44 PR #164 PC1–PC2 redacted log bundles before private QA sharing. NOT a replacement for the A44 packer, A31/A43 trace analyzers, A72 capture, or A60 acceptance.

## The source-confirmed A44 problem

As of A44 PR #164 SHA `e068171092d9c7e2f4c84f3a2796e8bf3398f23a`, `pack-multiplayer-evidence.cjs` redacts `access_token`, `password`, `secret` etc. but **not bare `token=`**. Its own synthetic host log contains `token=secret123`. A74 independently reproduced the leakage and reported the required A44-owner fix in [PR #164 comment 6529841409](https://github.com/C8LyNn/aplikacja-turnieje/pull/164#issuecomment-6529841409). **W11 update:** A44 subsequently fixed its own producer on PR #164 at exact `fc52e61ccb34629f6f56b9535da49fb46e199e01`; independently inspected source/test blobs now include bare `token`, `session_token`, `refresh_token`, bearer handling and a saved-output canary assertion. A44 reports 26/26 local synthetic tests; those tests have NOT been independently re-executed by A74. The A74 checker remains useful defense in depth and is NOT a substitute for A60 independent QA or manual review.

## Run (Node 22; all data stays on the operator's trusted workstation)

```powershell
node docs/cc001/swarm/w11/A74/evidence-gate.cjs --bundle 'C:\Evidence\W9_PAIR_001_REDACTED'
node --test docs/cc001/swarm/w11/A74/evidence-gate.test.cjs docs/cc001/swarm/w11/A74/evidence-gate.w12-compat.test.cjs
```

Requires exactly the THREE A44 outputs: `evidence-manifest.json`, `PC1_Player.redacted.log`, `PC2_Player.redacted.log`. Do not put originals or additional files inside the output bundle. This check does not read or copy original logs, does not upload, and never changes any input bytes.

| Process exit | Classification | Meaning |
|---|---|---|
| 0 | `PASS_BOUNDED_SCAN_NOT_QA` | Manifest and redacted log digests match; no recognized sensitive patterns in these two texts. **Still requires manual privacy check and independent A60 QA.** |
| 2 | `HOLD` | Invalid path, manifest, digest, source encoding, same-file evidence or unsupported bundle format; do not distribute. |
| 3 | `FAIL_SENSITIVE_PATTERN` | Sensitive pattern detected in one or both redacted files. **Do not distribute logs.** |

The machine-readable stdout includes **only** manifest/log hashes, byte counts, line counts, safe pattern category and line number, never actual matched secret text, raw network addresses, usernames or log lines. Uses deterministic file names to prevent path-traversal injection; rejects symlinks, extras, malformed UTF-8, duplicate peer bytes and size >32MiB per redacted log.

**Synthetic tests actually executed on Node v22.16.0:** `node --check` both source/test **exit 0**, `node --test` **23/23 PASS, exit 0** in W11; **W12: 31/31 PASS, exit 0** (23 unchanged original cases + 8 new A44 compatibility cases), including A44 `token=` canary (required exit 3), valid placeholder (exit 0), SHA tampering (exit 2), email/IP/token/Bearer/URL/user path scanning, path-traversal, symlinks, duplicate payloads, and read-only invariants. The committed source/test Git blobs must match those locally tested before any integration.

**NOT_RUN:** actual operator original A44 CLI output; real two-PC logs; native Windows run; Unity, .NET, complete privacy audit, gameplay interpolation, authoritative snapshot validation, or A60 QA.

## Integration constraints

This independent A74 tool is limited to `docs/cc001/swarm/w11/A74/**`, based on immutable RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`. It adds no runtime instrumentation, no new network packets, no source changes or CI workflow, and makes no performance/turn/teleport fix claim. A70 may include it in an isolated candidate after review; A44's own producer fix remains owned by A44; A74 does not modify it. A60 decides any QA acceptance. R16/V148/Protocol149/RC1/main remain unchanged; no release or deploy.

## W12 — exact A44 `[USER]` placeholder compatibility fix

A44 #164 replaces `C:\\Users\\name\\...` with `C:\\Users\\[USER]\\...` and `/home/name/...` with `/home/[USER]/...`. Before W12, A74's user-path scan incorrectly rejected **both** already-redacted forms. W12 excludes only a standalone `[USER]` path segment from its Windows/Unix profile patterns; unredacted usernames, `C:\\Users\\[USER]someone`, other raw profile paths on the same line and any exposed `token=` remain rejected. The verdict still means `PASS_BOUNDED_SCAN_NOT_QA`, never complete de-identification or G3/G4 success.

W12 actual locally executed Node v22.16.0: both test files and production JS passed `node --check` (exit 0), `node --test` across W11 + W12 suites **31/31 PASS, exit 0**. Exact tested Git blob SHA-1 source `d06d02f9d0ac8b76210cfd556151593c305caef0`, W11 original test `ca6978fff40b321f91c9f7d4027a90ae72b393b2`, new W12 test `2a2844d90bcdb22d8d49b08bd7f4f66f3d7c82fc`.

**Important QA isolation:** A70's separately frozen W11 candidate is `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`; later #207 updates are NOT part of that tested SHA. This A74 PR remains isolated and does not advance the QA branch, compile Windows Player, merge to main or approve the game. A72/A60 must prove the exact frozen Windows build + two physical PCs independently.

**Separate real source-to-source synthetic integration run (Node v22.16.0):** downloaded-by-exact-Git-blob reconstruction of A44 #164 `pack-multiplayer-evidence.cjs` at blob `14e9f01c281227ef7ab0052ba755b32b91e3a289` was executed via its real exported `capture()` against two temporary **synthetic** raw Player.log inputs containing Windows and Unix profile paths, IP, token and Bearer credentials. Its generated 3-file bundle was consumed by **exact tested A74 source blob** `d06d02f9d0ac8b76210cfd556151593c305caef0` via exported `inspect()`: `PASS_BOUNDED_SCAN_NOT_QA`, 2 distinct peers, 0 findings, both original input bytes unchanged; temporary files deleted. This is genuine cross-module **offline Node execution**, NOT a Windows/Unity/gameplay/physical-PC1–PC2 run and NOT blanket privacy certification.

## W13 — WebSocket and UNC private-LAN privacy regression

**Issue fixed:** previously `scan()` recognized `http://` and `https://` but not `ws://`/`wss://`; it also missed raw Windows UNC shares such as `\\\\LAN-NAS\\private\\Player.log`. The A44 collector PR #164 at exact source Git blob `14e9f01c281227ef7ab0052ba755b32b91e3a289` does **not** redact these schemes/shares either. Therefore an A44-produced redacted bundle could previously obtain A74 `PASS_BOUNDED_SCAN_NOT_QA` with a private WebSocket hostname or UNC network share still visible. This is an evidence-sharing *privacy* gap, not a multiplayer transport or gameplay fault.

**Implementation:** existing `evidence-gate.cjs` extends its `WEB_URL` pattern to `ws://` and `wss://` and adds `UNC_SHARE_PATH`. It rejects matching redacted logs with **exit 3 / FAIL_SENSITIVE_PATTERN**. No private host/path value is included in the report, only pattern category and source line. A correctly sanitized `[URL_REDACTED]` placeholder and W12 `[USER]` user-profile placeholders remain accepted; actual review and manual redaction are still required. **Do not publish unreviewed real PC1/PC2 logs.**

**Reproducible test command (Node 22):**

```powershell
node --test docs/cc001/swarm/w11/A74/evidence-gate.w13-lan-privacy.test.cjs
```

**Actual W13 test execution:** Node `v22.16.0`, `node --check` both updated source and new tests exit 0, **9/9 native Node tests PASS, exit 0**. Exact locally executed source and test Git blobs: `37729a6b17c1710d7734e46e5d2e06cc0f8e868b` and `84fae20fefc2e3e688309e96446c88d4d9b0eb7e`. The 31 older W11/W12 tests were previously executed unchanged, **not all rerun in W13**; do not call it a new 40/40 test run.

**Actual cross-module proof (synthetic, native Node):** reconstructed byte-identical A44 #164 source (Git blob verified) ran `capture()` on temporary host/client sample logs containing `ws://` and a UNC share; the generated A44 three-file bundle was read through exact prior A74 `inspect()` blob `d06d02f9d0ac8b76210cfd556151593c305caef0`, which incorrectly returned `PASS_BOUNDED_SCAN_NOT_QA`. The updated A74 source, on the **same bytes**, correctly returned `FAIL_SENSITIVE_PATTERN` (`WEB_URL`, `UNC_SHARE_PATH`) and CLI exit 3, without echoing host/path data. Raw synthetic input bytes unchanged; temporary files deleted. **No real Windows Player.log, Unity build, .NET9 or physical PC1–PC2 was tested.**

**A44 ownership:** A44 should adjust its own `redact()` if these log formats are generated; A74 changes only the *downstream* gate. Source frozen W11 QA ref `integration/cc001-r17-w11-qa-freeze-20261030` remains fixed at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`; later DEV PR #207 source excluded from that build/QA. No merge to main, release or certified G3/G4.

## W14 — partial redaction suffixes must never return bounded PASS

**Confirmed false PASS on exact previous source blob** `37729a6b17c1710d7734e46e5d2e06cc0f8e868b`: a redacted log with `token=[REDACTED]secret`, `password=[REDACTED]secret`, `session_token=[TOKEN_REDACTED]secret`, or bare `Bearer [REDACTED]secret` exited **0** (`PASS_BOUNDED_SCAN_NOT_QA`). A74 actually executed the prior exact Git blob as a native Node22 CLI against SHA-matching, distinct PC1/PC2 synthetic bundles, showing the false acceptance.

**Fix (existing gate, no competing scanner):** `CREDENTIAL_ASSIGNMENT` and `BEARER_AUTH` now exempt a redaction marker **only when it ends at a token delimiter** (end of line, whitespace, comma or semicolon). A marker with non-delimiter trailing characters is classified sensitive; CLI returns **exit3 / FAIL_SENSITIVE_PATTERN** without printing the redacted fragment or suffix. Exact A44 `[REDACTED]` and prior `[TOKEN_REDACTED]`, `[SECRET_REDACTED]` standalone placeholders still pass; previously implemented Windows/Unix `[USER]`, ws/wss and UNC checks remain in place.

**New executable test:** `node --test docs/cc001/swarm/w11/A74/evidence-gate.w14-token-suffix.test.cjs`. Native Node `v22.16.0`, both source and test `--check` exit0; **16/16 new tests PASS exit0**, with 10 negative suffix variants, 3 positive placeholder/delimiter variants, mixed-line rejection, W13 regression check, metadata-only output/no-file-mutation assertion. **Actual TAP transcript SHA256** `cdc913968f2b8fd6a37290624ddaa11897ab54412fb308b64c6ec3e0a5579706`. **Exact tested Git object SHA-1:** source `85e1c15ff131f187c335107946bf3f7422d50c70`, W14 test `41973cdfd324f26b0368e8c7691e5f21e072081c`. Each was independently fetched from GitHub after commit and matched `git hash-object` of actually tested local bytes.

**Test accounting:** the older W11 23, W12 8 and W13 9 test cases were **not rerun** in W14, so report **W14 native 16/16**, never synthetic cumulative 56/56. The original two code paths were narrowly updated and no older test fixture modified. The rule-based scanner remains **bounded**, not an exhaustive guarantee that all possible secrets were removed; manual privacy inspection of real A44 logs remains mandatory.

**Ownership and hard gate:** A74 only changes own `docs/cc001/swarm/w11/A74/**` in Draft PR #203. A70's W11 QA freeze `integration/cc001-r17-w11-qa-freeze-20261030` remains `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` by authenticated GitHub readback; W14 A74 source is NOT the Windows Player code. A72 has now FIXED native Player nested-file validation and managed-result freshness in its own PR #188 at exact HEAD `94404b3b92318a86be638bcf3008d3710427523c` (native Node synthetic regression only), but must still RUN exact Unity6000.4.0f1 Windows+dotnet9 on licensed Win11 host; A60/A31 alone can certify actual identical-binary two-PC G3/G4 after originals. No change to Mitosis V148, Furnace FIRE periodic only, HP R16, Protocol149, RC1, main or release.

## W15 — JSON-style credential field detection, native Node 22

**Confirmed prior false PASS:** exact prior source Git blob `85e1c15ff131f187c335107946bf3f7422d50c70` executed with native Node v22.16.0 produced **no findings** for `{"token":"secret"}`, `{"password":"secret"}` or `{"token":"[REDACTED]suffix"}`. Its assignment pattern understood `token=value` but not a JSON key enclosed in quotes. A44 #164's owner producer `redact()` likewise does not replace quoted JSON key/value forms, so stored redacted logs could be marked bounded PASS with recognizable secrets. This is a reproducible **synthetic confidentiality leak**, not a claim that private real logs were distributed.

**W15 implementation** modifies only the existing A74 `evidence-gate.cjs`: `JSON_CREDENTIAL_FIELD` detects quoted sensitive key/value forms, including pseudo-JSON single quotes, quoted string values with spaces/escapes, numeric values and dangerous suffixes after a placeholder. Reporting is strictly metadata-only (role, pattern category, line, hashes), and preserved safe values include exact `[REDACTED]`, `[TOKEN_REDACTED]`, `[SECRET_REDACTED]`, JSON `null` and empty strings. Previous W12-W14 categories remain active. Bounded rules cannot certify that every secret is removed; **manual inspection is mandatory** before sharing.

**Reproduce on Node22** from the repository root:

```powershell
node --check docs/cc001/swarm/w11/A74/evidence-gate.cjs
node --check docs/cc001/swarm/w11/A74/evidence-gate.w15-json-credentials.test.cjs
node --test docs/cc001/swarm/w11/A74/evidence-gate.w15-json-credentials.test.cjs
```

**ACTUAL native Node v22.16.0 execution:** `node --check` both files exit0; `node --test` **22/22 PASS, 0 FAIL, process exit0** on actual temporary on-disk distinct A44-format PC1/PC2 evidence packages with SHA256-correct manifest and spawned Node CLI processes, including 12 JSON leak negatives, 7 safe-value positives and 3 legacy regressions. For sensitive cases, the files remained byte-identical and stdout/stderr did not include secret values. TAP transcript SHA256 `6f4a83eef119fd36d3a26eb24e024ddef643fc08ade1693bb3a28721b6dbf513`. Exact executed Git SHA-1 blobs source `b057e10aec9dbefd38c6e07e561ff3c2ed59844c`, tests `1fbdc9bd7883e1ea4bc7107c5516ab92732f3814`. Both independently checked against the committed files. Machine-readable package evidence: `R17_W15_A74_MANIFEST.json` blob `ad0042318d7ac08a81621b3491a09e41c829169a`.

**Test-scope honesty:** Older A74 suites (W11 23, W12 8, W13 9, W14 16) were previously run in their respective waves but have **not all been rerun on W15 code**. Therefore W15 status is **22/22 new native Node PASS**, not a claimed fresh 78/78. Real Windows Unity/.NET9, authentic Player.log privacy review and two physical PC1/PC2 remain NOT_RUN by A74.

**W15 integration constraints:** A70 freeze `integration/cc001-r17-w11-qa-freeze-20261030` pinned at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. A72 canonical operator toolkit [PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) exact `aa6e047cd7661961978fedcc91ff14dfc29a02f4` has adopted #262 generated-report correction on its OWN feature branch only; #207 and Phoenix #266 remain dev-only. Do not alter the freeze or mix A74 tool-only changes into native game source. A72 needs an actual trusted Windows11 Unity6000.4.0f1 + Windows Build Support + .NET SDK9 + Node22 run and signed-off original log/EXE/DLL/full Player SHA256 output; A60/A31 independently verify physical two-PC matches and gameplay state. No G3/G4 PASS, no main merge/release.

### W15 producer-consumer execution / updated A44 dependency

The A44 upstream [PR #164](https://github.com/C8LyNn/aplikacja-turnieje/pull/164) advanced after earlier W13 source inspection. Current source HEAD **`457d2bf2c3ccb0c6768aa0d2abab05392c56e0f5`**, packer Git blob **`8453b2fe55d1d1ddb5da1acfa35ced92b1e8f63f`**, already repairs the **separate** WS/WSS and UNC producer-redaction gaps. The remaining JSON credential-field gap was verified on that **new** producer; owner notified at [PR #164 comment 6578386851](https://github.com/C8LyNn/aplikacja-turnieje/pull/164#issuecomment-6578386851). The W13 source statement about missing WS/UNC redaction describes only the earlier A44 blob `14e9f01...`, **not the latest A44 source**.

**ACTUALLY EXECUTED native A44→A74 test:** cloned published A44 packer bytes locally with independent `git hash-object` **exactly `8453b2fe55d1d1ddb5da1acfa35ced92b1e8f63f`**; invoked original exported A44 `capture()` on two separate temporary synthetic host/client log files containing ordinary `token=`, private WebSocket endpoint and JSON `{"token":"..."}`. A44 sanitized the ordinary token and WSS host but not the JSON key's value. Fed the genuine saved A44 manifest+redacted logs directly into updated A74 `inspect()`, then ran its actual Node CLI on the same three-file output: **`FAIL_SENSITIVE_PATTERN`, CLI exit3, 2 peer records, one `JSON_CREDENTIAL_FIELD` class, no private value printed, raw originals byte-identical, temp evidence removed**. Native E2E output SHA256 `7ce576b9b6db0d2c19a2a13eda910cf9fcc8e0e788d4e4c7735e015061db2eaf`. Still **synthetic offline**, NOT Win11 Unity / real PC1-PC2 / G3 approval. Updated authoritative W15 machine manifest Git blob `08f0c6547bd6f62369bf116c3daef1477d3f9121`. 
