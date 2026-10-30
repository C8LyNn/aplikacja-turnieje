# CC-001 R17-W13 — A51 frozen-trace accounting gate

**HQ:** #97 · **Owner:** A51 Simulation / Instrumentation · **Parent:** A51 W12 Draft PR #223 at `90fb05f4ce8686aa25381213bae0e1f58f0ebc81` (stacked on PR #172). Isolated W13 development only.

**Immutable W11 source QA target:** `integration/cc001-r17-w11-qa-freeze-20261030` → `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. The older baseline `173273122c11cbf738e8b954e32506a6196fe8ec` remains a *cadence-policy label* inside the original A51 W11 parser, not the build-source identity. Moving A70 PR #207 and A41 W13 network-traffic branch are unrelated and NOT included in this W11 freeze.

## Confirmed W12 diagnostic weakness and code fix

The existing offline `scripts/cc001/w12/a51/freeze-trace-gate.cjs` validated individual integer domains but could admit self-contradictory *aggregate* metadata as `METADATA_CONSISTENT_ONLY` (exit0): for example `hostRows=2, pairedRevisionRows=1, unpairedHostRows=0`. This is not a discovered game/network defect; it is a **false-confidence gap in supplementary QA evidence**.

The W13 addition `scripts/cc001/w13/a51/trace-accounting.cjs` validates the *already reported* A51 V2 summary, without re-parsing logs or duplicating the A41/A81/A60 tools. It asserts:

- hostRows = pairedRevisionRows + unpairedHostRows; clientRows = pairedRevisionRows + unpairedClientRows;
- hostCadencePolicyChecks = hostRows and violations never exceed checks; per-host intervals match host samples and belong to the frozen policy's 50/83/125/250 ms;
- client skip counter is nonnegative safe integer;
- paired rows imply `MATCHED_METADATA_ONLY`, zero pairs imply `NOT_PROVEN`;
- no fabricated one-way latency, payload-hash pairs, frame coordinates, authoritative state parity, smoothness, G3 or G4 PASS;
- the A51 cadence policy reference label is the original exact source constant, NOT an EXE attestation.

One narrow import into the **existing** W12 gate makes contradictions `FAIL_PROFILE_OR_TRACE`. Original missing/one-sided source cases retain `HOLD_INCOMPLETE_TRACE`. Three new W12 regression cases and fixture updates preserve earlier intended outcomes. No new independent CLI or competing parity/binary gate introduced.

## Tests actually executed

- Native local Node.js `v22.16.0`: `node --check` on new W13 helper and tests **PASS**, `node --test scripts/cc001/w13/a51/trace-accounting.test.cjs`: **18/18 PASS, exit0**, 0 FAIL. Original locally tested helper SHA256 `502c056576cdf520b3efae4e771298711ad5740b942eb5251580f9e4c5e46b70`, tests SHA256 `2b1482762b07319a163b1099b403e1e5d3f97cff806b09adc50beeb83eeb5794`. Their exact Git blobs match Github byte-for-byte: `baf6366320c98c5a604cefdd3dccedb850123ecb` and `a69a93a68f36d9207634d98007aa8b13545e84ad`.
- Actual final GitHub-readback W12 gate + W12 test bodies evaluated under isolated V8 with mocked Node built-ins: **21/21 non-CLI assertions PASS**; **3/3 child-process tests NOT_RUN** in that V8 environment. Thus **full updated W12 Node CLI test suite NOT_RUN**; do not conflate with earlier parent W12 native 21/21 results.
- No actual Unity6000.4.0f1 Win64 Player build, .NET9 managed C# execution, real PC1+PC2 Player.log, same-run binary integrity or A60/A31 physical gameplay QA executed in A51.

**Operator:** In full authorized Windows checkout run `node --test scripts/cc001/w12/a51/freeze-trace-gate.test.cjs scripts/cc001/w13/a51/trace-accounting.test.cjs`, then independently attach real raw Player logs to A60. Exit0 from metadata gate remains **METADATA_CONSISTENT_ONLY**, never G3/G4 PASS.

**Protections:** zero edits to V148 Mitosis, Furnace (FIRE zone+periodic DoT only), R16 HP/catalog, Protocol149, frozen W11 source, gameplay/physics/UI, main, RC1 or release. No merge/deploy.

**Five axes:** DESIGNED YES / IMPLEMENTED YES / TESTED real Node18 and V8-scoped21, native W12 CLI+Unity+2PC NOT_RUN / INTEGRATED NO (isolated Draft stack) / RELEASED NO.
