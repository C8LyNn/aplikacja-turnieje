# CC-001 R17-W12 — A51 frozen W11 trace profile

**Owner:** A51 — Simulation & Instrumentation. **HQ:** #97. **Source policy:** A70 QA freeze **exactly** `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`; never the moving PR #207 HEAD. This W12 patch is isolated on an A51-owned branch; it does **not** change the frozen player, Unity, networking, ability mechanics, Protocol149, RC1, or releases.

## Purpose / source constraint

A70's W11 QA freeze has A41 **`CC_W10_NET_HOST/CLIENT`** sampled metadata and a 20/12/8/4-Hz compressed-size-based policy. It **does not contain** the newer `CC_W11_STATE_TX/RX` full-state SHA-256 digest logger found in later commits on moving PR #207. Trying to require the newer digest for this older frozen SHA produces misleading QA results.

This gate consumes A51's **existing** JSON report; it never re-parses raw Player logs, never creates a competing digest comparator (A41), and never attests the Windows Player binary (A72/A60).

## Windows / Node 22 usage, when ORIGINAL same-run PC1/PC2 Player.log files exist

From a checkout containing A51 W11 and W12 scripts:

```powershell
node scripts/cc001/w11/a51/native-snapshot-trace.cjs --pc1 C:\QA\PC1\Player.log --pc2 C:\QA\PC2\Player.log --out C:\QA\a51-native-report.json

node scripts/cc001/w12/a51/freeze-trace-gate.cjs --analysis C:\QA\a51-native-report.json --source-sha 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3 --out C:\QA\a51-freeze-gate.json

node --test scripts/cc001/w12/a51/freeze-trace-gate.test.cjs
```

**Exit statuses:** `0=METADATA_CONSISTENT_ONLY`, `1=FAIL_PROFILE_OR_TRACE`, `2=HOLD_INCOMPLETE_TRACE` or input/output error. **Exit 0 is NOT build, same-run, network, visual, G3, G4, or release PASS.** No raw Player.log/IP/session token is written into the gate output. Both log hashes and source SHA supplied by the operator are *claims* until independently tied to original files/build.

The frozen profile requires two distinct non-empty log-source fingerprints, both sides' A41 samples, valid counters, no malformed/repeated revisions or cadence policy breaches, and zero **post-freeze-only** W11 digest markers. No paired sampled revisions => HOLD (not automatically packet loss). Presence of new digest markers => incompatible build/log profile and FAIL; do **not** relabel them as evidence for this freeze. Original packet-byte state parity, turn exact-once, rendering and binary identity cannot be established from sampled metadata.

## Checks and handoff

- Real local Node v22.16.0: `node --check` both JS files PASS; `node --test ...` **21/21 PASS**, exit0 (synthetic negative/positive fixtures + subprocess CLI).
- Local SHA256 script: `2f3fb315cbdfed982a80593f19b087130df6bdd6d9a7c8b74aed8de9c5ce8f9a`; tests: `bac95c3eeac2ca5a88a29240b89767d257936c96c164446d401f8ba3c3b5bdd6`.
- Git blob readback matches exact locally executed bytes: script `e514eaec744b4f1aa1f9a9f2c9e6070ff5461a4f`, tests `44c484f26437608654bbfdbde418654ce75e0940`.
- **NOT_RUN:** actual Windows Unity 6000.4.0f1 build, managed .NET9 C# tests, original PC1/PC2 Unity Player logs, latency/frames, physical host/client QA. G3/G4 HOLD.

**A72:** build from exact frozen source and preserve complete binary inventories/logs. **A60/A31:** independently verify the same original Windows binary on real PC1/PC2 and test P2 accepted once, authoritative revision/pose/turn, visual continuity/PORTAL, deck and input. **A70/HQ:** do not integrate W12 until W11 closure; do not merge to main/release. Mitosis V148, Furnace FIRE-only periodic DoT and HP R16 stay unchanged.
