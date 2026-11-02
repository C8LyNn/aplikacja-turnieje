# CC-001 R17-W15 — A81 bounded PC1/PC2 trace evidence

This isolated W15 package stacks on [A81 PR #259](https://github.com/C8LyNn/aplikacja-turnieje/pull/259) at exact parent `d6a041a171462ba02abc729197fb5d37c87c5cc9`. It is not a build, gameplay or network source change. Full proof manifest: `MANIFEST.json`.

## Confirmed defect and implementation
Previously `parse()` appended ALL malformed host/client marker errors with no limit even though `analyze().mark()` attempted to cap later comparison anomalies at 100. 1,501 malformed host records produced 1,501 detailed errors; larger corrupt 32MiB Player.logs could create a huge report and memory pressure. The original issue was reproduced by executing exact pre-W15 GitHub source.

The new `bounded-trace.cjs` retains the first 100 parser errors per device, counts every further omitted error, and caps accepted per-device trace markers at 20,000. The first overflow adds explicit `TRACE_MARKER_LIMIT_EXCEEDED` (or contributes to omitted-error counts if the 100-error buffer is already full). Thus excess data always causes an anomaly, not false green. Result JSON adds `omittedHostMarkers`, `omittedClientMarkers`, `omittedHostErrorDetails` and `omittedClientErrorDetails`, plus explicit notices; no silent truncated diagnostics.

This conservative limit expects captures trimmed to one match. At the 1Hz selected W11 sample cadence, the 20,000-marker cap is already much longer than routine sessions. No gameplay state, physics, snapshot cadence, binary hashing algorithm, owner IDs or network protocol are modified.

## Reproduce

```bash
node --check scripts/cc001/w15/a81/bounded-trace.cjs
node --test scripts/cc001/w15/a81/bounded-trace.test.cjs
node --test scripts/cc001/w15/a81/bounded-parser-integration.test.cjs
```

**Actually run:** native Node.js v22.16.0, **10/10 bounded module tests PASS**, exit 0; original transcript SHA256 `aaf2dade7327b69c0ba1521e27c8288c981c1883e49c101b21dae822d059249c`. Exact local `git hash-object` for module and test matches GitHub. **15/15 source-bound V8 test callbacks PASS**, including five full-parser integration cases on GitHub-readback code, but those were executed with controlled module/test shims and are **NOT a native Node integration run**. These results attest only synthetic offline validation logic, **NOT** the Windows Unity build, managed .NET9 or two-PC G3/G4.

The full earlier A81 W12/W13/W14 66-case native suite was **not re-run against the W15 parser**. A70/A60 should run the full stacked checkout before admission; do not transfer old results to this commit.

## P0 external work and protected decisions

Frozen **W11 QA source** remains `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Moving #207 and Phoenix #266 are separate. A72 has already selected the generated-report correction #262 into its owner [Draft PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188); do not duplicate.

**Authorized PC1 operator** must run the A72 freeze-pinned kit on Windows 11 with Unity 6000.4.0f1 + Windows Build Support + valid license, Node 22 and .NET SDK9, and return original fresh managed-test JSON/log, Unity build JSON/log/exit, complete Player root-relative nested file inventory including nonempty EXE and Assembly-CSharp.dll, original binary SHA256 and zip receipt. A60/A31 independently execute exactly the same Player on both physical PCs and inspect P2 turns, accepted-once intent, snapshot/state/visual parity, stutter and legitimate teleports. Tooling PASS does not close W11.

**Owner decisions protected:** Mitosis identical to V148; Furnace FIRE zone plus periodic DoT only; HP values R16. RC1, Protocol149, frozen QA SHA, main and release are unchanged. No merge authorized by A81. **G3/G4 HOLD.**
