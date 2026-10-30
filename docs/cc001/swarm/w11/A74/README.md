# CC-001 R17-W11 — A74 Evidence Admission Gate

**Role:** A74 / Repository Hygiene. **Existing Issue:** #141. **HQ:** #97. **Purpose:** independent fail-closed, READ-ONLY admission of offline A44 PR #164 PC1–PC2 redacted log bundles before private QA sharing. NOT a replacement for the A44 packer, A31/A43 trace analyzers, A72 capture, or A60 acceptance.

## The source-confirmed A44 problem

As of A44 PR #164 SHA `e068171092d9c7e2f4c84f3a2796e8bf3398f23a`, `pack-multiplayer-evidence.cjs` redacts `access_token`, `password`, `secret` etc. but **not bare `token=`**. Its own synthetic host log contains `token=secret123`. A74 independently reproduced the leakage and reported the required A44-owner fix in [PR #164 comment 6529841409](https://github.com/C8LyNn/aplikacja-turnieje/pull/164#issuecomment-6529841409). **This downstream gate is defense in depth; it does NOT remove the need for A44 to fix its producer.**

## Run (Node 22; all data stays on the operator's trusted workstation)

```powershell
node docs/cc001/swarm/w11/A74/evidence-gate.cjs --bundle 'C:\Evidence\W9_PAIR_001_REDACTED'
node --test docs/cc001/swarm/w11/A74/evidence-gate.test.cjs
```

Requires exactly the THREE A44 outputs: `evidence-manifest.json`, `PC1_Player.redacted.log`, `PC2_Player.redacted.log`. Do not put originals or additional files inside the output bundle. This check does not read or copy original logs, does not upload, and never changes any input bytes.

| Process exit | Classification | Meaning |
|---|---|---|
| 0 | `PASS_BOUNDED_SCAN_NOT_QA` | Manifest and redacted log digests match; no recognized sensitive patterns in these two texts. **Still requires manual privacy check and independent A60 QA.** |
| 2 | `HOLD` | Invalid path, manifest, digest, source encoding, same-file evidence or unsupported bundle format; do not distribute. |
| 3 | `FAIL_SENSITIVE_PATTERN` | Sensitive pattern detected in one or both redacted files. **Do not distribute logs.** |

The machine-readable stdout includes **only** manifest/log hashes, byte counts, line counts, safe pattern category and line number, never actual matched secret text, raw network addresses, usernames or log lines. Uses deterministic file names to prevent path-traversal injection; rejects symlinks, extras, malformed UTF-8, duplicate peer bytes and size >32MiB per redacted log.

**Synthetic tests actually executed on Node v22.16.0:** `node --check` both source/test **exit 0**, `node --test` **22/22 PASS, exit 0**, including A44 `token=` canary (required exit 3), valid placeholder (exit 0), SHA tampering (exit 2), email/IP/token/URL/user path scanning, path-traversal, symlinks, duplicate payloads, and read-only invariants. The committed source/test Git blobs must match those locally tested before any integration.

**NOT_RUN:** actual operator original A44 CLI output; real two-PC logs; native Windows run; Unity, .NET, complete privacy audit, gameplay interpolation, authoritative snapshot validation, or A60 QA.

## Integration constraints

This independent A74 tool is limited to `docs/cc001/swarm/w11/A74/**`, based on immutable RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`. It adds no runtime instrumentation, no new network packets, no source changes or CI workflow, and makes no performance/turn/teleport fix claim. A70 may include it in an isolated candidate after review; A44 must separately patch its producer. A60 decides any QA acceptance. R16/V148/Protocol149/RC1/main remain unchanged; no release or deploy.
