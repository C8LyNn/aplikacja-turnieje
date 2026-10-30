# CC-001 R17-W12 / A71 — frozen W11 QA source gate

**Role:** A71 Source Integrity. **Purpose:** independently and locally reject the moving PR #207 head as a substitute for A70's frozen W11 QA source. This is a **source/object-integrity tool**, not a Unity build, a test of actual game networking, or a G3 release gate.

## Exact pins

- Frozen QA ref: `integration/cc001-r17-w11-qa-freeze-20261030`.
- Frozen QA commit: `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
- Frozen RC1: `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
- QA full tree: `7fb8a89143f77aa22488d92af32efa35cd323332`.
- QA Unity project subtree: `226ff427fadd0408a8e09cc1e7fcbe71f30c6c36`.
- Manifest Git blob SHA-1: `b7bed4fa2eea89146f089ee70cbb7258e2230dab` — exact 22 Git blobs; 14 modified and 8 newly added; no deletes.

## Actual local tests already executed (not Windows gameplay)

```sh
node --check scripts/cc001/w12/a71/w11-qa-freeze-gate.cjs
node --check scripts/cc001/w12/a71/w11-qa-freeze-gate.test.cjs
node --test scripts/cc001/w12/a71/w11-qa-freeze-gate.test.cjs
```

**Executed with Node v22.16.0, Git v2.47.3:** 26/26 PASS (exit 0), syntax checks both exit 0. The tests use simulated Git tree entries, adversarial hash/path/ref cases, tampered manifest, GUID collisions and a genuine Git-initialized empty directory to confirm **HOLD exit 2**, not fake acceptance. Committed source/test blob hashes were re-read on GitHub and matched the locally tested bytes.

## Operational invocation (requires a full Git object checkout)

From a **trusted tooling checkout containing this A71 tool and the exact RC1 + QA Git commit objects**, with either the local or remote-tracking **frozen QA ref** available:

```sh
node scripts/cc001/w12/a71/w11-qa-freeze-gate.cjs \
  --root . --ref 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3
```

The tool performs **no network fetch**, no build, no write to the game, and no merge. If the ref is absent, if the checkout is shallow and lacks the commits, or if the frozen branch no longer matches, it fails closed with exit 2. It validates both commit trees, all file paths/modes/hashes, 88 original Unity `.meta`, both paired new `.cs.meta`, the 90 GUIDs, and excludes Phoenix diagnostics. Success is `PASS_EXACT_SOURCE_ONLY` — **never** Windows Player PASS or PC1–PC2 G3 PASS.

It is intentionally **not compatible with the moving** `integration/cc001-r17-w11-multiplayer-qa-candidate-20261030` ref or older/later SHA values of PR #207. New W12 changes are reviewed and integrated independently from the frozen W11 QA snapshot.

## Nonduplication and ownership

A73 draft PR #177 also provides a pinned-source selection guard. **A70 chooses one primary intake process**; this A71 tool is an independently authored optional cross-check / `ALT_HOLD`, **not another mandatory build gate**. No auto-import of A71 PR #159 into frozen QA, RC1 or `main`; no CI changes. A72 owns actual Windows Unity 6000.4.0f1 build, A60/A31 own original 2-PC QA, A70 owns integration and final SHA selection.

**Owner decisions:** V148 Mitosis, Furnace FIRE-zone-only with periodic damage, R16 HP. Frozen RC1 game/catalog/ability/physics/Protocol149 protections remain intact. No release until actual native evidence.
