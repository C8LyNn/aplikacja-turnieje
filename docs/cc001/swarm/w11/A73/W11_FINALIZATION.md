# CC-001 — A73 / W11 FINALIZATION — exact moving-source gate for PR #207

**Current observed candidate snapshot:** A70 [PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207) branch `integration/cc001-r17-w11-multiplayer-qa-candidate-20261030`, commit **`3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`**. The owner's originally dispatched **`173273122c11cbf738e8b954e32506a6196fe8ec`** and the intermediate **`8fce19b9...`**, **`d1ec2a60...`** remain ancestors, but MUST NOT be described as current build inputs when the live ref points elsewhere.

**Frozen RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`. **Selected source ancestor A30 #189:** `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`. **Original A40 author `Tests/AbilityTests.cs` blob:** `93202589e0a80f43935b7cfed96c5a7666980e67` imported byte-for-byte to PR #207 (original five cases, not the separately proposed W11 A40 #213 extra test).

## New actual executable tooling

- `w11-finalize.cjs`: requires BOTH independently pinned Git ranges, exact immutable ref names and SHAs, source file Git blob identity, original A40 test blob, protection retention, plus old `verify-stacked-addon.cjs`. Both Git ranges must be `PASS_SOURCE_SCOPE_ONLY` or exit with HOLD. It **never** grants game/Windows/G3/G4 acceptance.
- `w11-finalize.test.cjs`: 13 actual Node tests, including **old dispatched 173273 SHA explicitly rejected**, intermediate d1ec rejected, wrong author SHA, missing path, wrong blob, wrong parent and protection counts, second partial-pass rejection.
- `w11-rc1-to-207-full.json`: current RC1→PR207 **22 paths** (14 modified, 8 added), exact leaf blob SHAs, **97 retained Git blobs**, including all 88 originally existing Unity `.meta` (new two paired `.cs.meta` only); V148, R16 source manifest, Protocol149 and preserved original simulation/core.
- `w11-a30-to-207-delta.json`: current A30 #189→PR207 **10 modified paths**, exact leaf blob SHAs, **100 retained blobs** including all 90 metadata entries present on A30, A33/Unity diagnostics and source/test registration.
- `W11_FINALIZATION.md`: this handoff.

**Repeatable command on a complete authorized disposable checkout with RC1, A30 and live A70 refs fetched:**

```sh
node docs/cc001/swarm/w11/A73/w11-finalize.test.cjs
node docs/cc001/swarm/w11/A73/w11-finalize.cjs \
  docs/cc001/swarm/w11/A73/w11-rc1-to-207-full.json \
  docs/cc001/swarm/w11/A73/w11-a30-to-207-delta.json
```

Exit **0 = PASS_SOURCE_SCOPE_ONLY**, **1 = HOLD**, **2 = tool/input missing/HOLD**. The tool reads Git objects and does NOT update branches, index, working tree, CI, main, R16, RC1 or release. If A70 moves PR #207 after this snapshot, the exact ref match intentionally rejects the moved candidate; request a NEW A70 final SHA and re-pin with evidence, do not guess or silently accept changed source.

**Actually executed by A73:** Node22.16.0 local `--check` on both new scripts exit0, 13/13 unit cases exit0, prior 13/13 underlying synthetic Git fixture previously executed exit0 (not repeated without cause). Independently fetched untruncated Git trees (RC1=1959 entries, A30=1971, W11=1971), GitHub exact compare RC1→current ahead18/behind0 and A30→current ahead5/behind0, created current 22/10 exact-path pinned manifests and 97/100 retained checks. Direct A40 AbilityTests exact blob parity PASS. **Not run:** complete private repo local Git checkout and actual script on original remote Git objects, .NET9/Unity build, physical Windows/PC1-PC2 QA. Source-readback/meta scope PASS is NOT runtime PASS.

**Gates:** A73 owned executable source tools TESTED, PR207 current Git source scope PASS_REMOTE_ONLY. A70 official release-candidate selection still subject to moving HEAD; A72 Windows builder must consume **ONLY formally frozen final SHA**, not stale 173273 or d1ec or the old W10 kit; A60/A31 independently certify native P2 authoritative/physics and visual position parity on TWO real PCs. G3/G4=HOLD; W12=STOP until W11 formal closure; no merge to main/release/deploy.

**Owner constraints preserved (not reimplemented by A73):** Mitosis exact V148, Furnace FIRE+periodic damage only, original R16 HP.
