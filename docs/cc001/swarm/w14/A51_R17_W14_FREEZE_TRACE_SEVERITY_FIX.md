# CC-001 R17-W14 / A51 — Frozen Trace Severity Classification

**HQ:** #97 · **Role:** A51 Simulation / Instrumentation · **Type:** real source bug fix + native Node regression; DRAFT, not release.

**Stacked parent:** A51 W13 PR #248 HEAD `f5ecf0c3e6e3ba4aa50b84139ec5c722b3d91314`; W13 depends on W12 PR #223, then W9/W11/W12 PR #172. W14's PR targets the W13 feature branch; all are **unmerged**. No Unity gameplay code changed.

**Frozen W11 source** `integration/cc001-r17-w11-qa-freeze-20261030` remains `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Moving A70 PR #207 is a distinct development source, never a substitute for exact-frozen Player provenance.

## Confirmed defect, red/green

Existing A51 W13 helper detects `INVALID_HOST_INTERVAL_SAMPLES` and `INVALID_CLIENT_SKIP_COUNTER`, but W12 freeze gate's `hard` code list omitted both. Consequently internally contradictory otherwise-complete analysis could return `HOLD_INCOMPLETE_TRACE` / CLI exit2 rather than `FAIL_PROFILE_OR_TRACE` / exit1. This does **not** make invalid data PASS, but blurs actual evidence corruption with genuinely missing coverage. Only two error codes are added to the existing severity list. No new independent analyzer, no changes to parser, packets or source authority.

**Before fix:** 8/12 W14 actual native Node regression tests FAIL, 4 PASS (including CLI classification reproduction). **After fix:** 12/12 W14 PASS. Full existing A51 W12 + W13 + W14 Node suites: **54/54 PASS, 0 FAIL, exit0** (Node.js v22.16.0). GitHub W12/W13 parent sources and tests were copied byte-exact (all original Git object IDs verified) before native testing; patched W12 source and new W14 test Git blobs also matched the byte-exact locally executed files.

**Run from repo root after checking out complete stacked W14 source:**

```sh
node --check scripts/cc001/w12/a51/freeze-trace-gate.cjs
node --check scripts/cc001/w14/a51/freeze-trace-severity.test.cjs
node --test scripts/cc001/w12/a51/freeze-trace-gate.test.cjs scripts/cc001/w13/a51/trace-accounting.test.cjs scripts/cc001/w14/a51/freeze-trace-severity.test.cjs
```

Source Git blob `3b1f380ecb937404cc3ba89ba35e2b72ce0b30f4` / SHA256 `78f6c30a08e6a1f72a8164d481b3d8109d71bf197578929d0e75e1e6e9ea7e4b`.
New tests Git blob `7334d045296d5fc2e478511095b738ad7128e516` / SHA256 `1f0d984dfeebb775e1bb1f7a0682986b9819b0cab0413b71742b89c640740aed`.
Native Node combined TAP SHA256 `2da3f68ceb3ed6709d0e62ecffce69de34479779c4057ea9a0a0ef5a4582beeb` (environment-dependent timing; not a portable test oracle).

## QA and ownership boundaries

A51 only validates already-extracted PC1/PC2 log metadata. A valid exit0 is `METADATA_CONSISTENT_ONLY`, **never native Player provenance, state-byte parity, frame smoothness, G3 or G4 PASS**. `HOLD` remains legitimate for missing second device, zero common sampled revisions and missing original evidence; corrupted complete counters now FAIL.

**W14 NOT_RUN:** native Unity 6000.4.0f1 Windows build, .NET9 managed C# tests, physical PC1/PC2 independent cross-device QA, original paired Player.log/frames. **A72** must build Player from exact frozen source with verified nested files, clean .NET9 test output and true binary SHA; **A60/A31** must independently verify same-original-binary PC1↔PC2, turns, aim/power, jitter, ball movement, teleports and state agreement; **A70** retains source SHA lock and controls integration.

**Protected:** V148 Mitosis exact, Furnace FIRE+periodic DoT only, HP R16, Protocol149, RC1, main, release, frozen QA branch untouched. No merge/deploy.

**Five axes:** DESIGNED YES / IMPLEMENTED YES / TESTED NODE54 PASS (real native Node only) / INTEGRATED NO (stacked DRAFT) / RELEASED NO.
