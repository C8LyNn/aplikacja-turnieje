# CC-001 R17-W13 — A81 native frozen-telemetry CLI regression pack

**Review dependency:** A81 [W11/W12 Draft PR #200](https://github.com/C8LyNn/aplikacja-turnieje/pull/200) at exact HEAD `0754431cd22587bd62c7e249e00ad2b4331453d1`. This W13 pack deliberately changes ONLY `scripts/cc001/w13/a81/`; it is stacked on #200 rather than on the A70 frozen QA branch.

**Immutable W11 QA target:** `integration/cc001-r17-w11-qa-freeze-20261030` @ `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. Moving #207 DEV HEAD is NOT accepted as a substitute; no tests here require post-freeze `CC_W11_STATE_TX/RX`.

Native Node 22 test commands, in an exact checkout containing this W13 branch:

```sh
node --check scripts/cc001/w11/a81/verify-candidate207-telemetry.cjs
node --check scripts/cc001/w11/a81/verify-candidate207-telemetry.test.cjs
node --check scripts/cc001/w13/a81/frozen-telemetry-cli.test.cjs
node --test scripts/cc001/w11/a81/verify-candidate207-telemetry.test.cjs scripts/cc001/w13/a81/frozen-telemetry-cli.test.cjs
```

Expected: **38 existing W12 native unit tests + 15 new native child-CLI tests = 53 deterministic synthetic tests**. W13 child tests write separate temporary PC1/PC2 Player.log samples, invoke real child `node` processes through `spawnSync`, exercise actual filesystem and SHA256 receipts, fail closed on missing/nonoverlapping revisions, duplicate sessions, version-incompatible markers and false-positive action/period. They verify no report overwrite, rejection of same input path and no raw log/IP/path contents in successful report JSON.

The logs are **synthetic only**. Even `SAMPLED_DIAGNOSTIC_ONLY`/exit0 requires real A72 compiled binary provenance and A60/A31 independent 2-PC playtests before ANY G3/G4 acceptance. This kit does not build Windows, run Unity/.NET9, prove gameplay state parity or certify video smoothness. Frozen W11 source, Mitosis V148, Furnace FIRE zone periodic DoT, R16 HP, Protocol149, RC1, main and release are not modified.

**Handoff:** A70 selects W13 intake separately after W11 closes; A72 owns frozen Windows build; A60/A31 own paired physical QA. No automatic integration and no merge to main.
