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


## W13 integrity fix — require the actual clean QA build checkout

**Concrete false-admission risk fixed:** the W12 gate verified the frozen Git objects but could return `PASS_EXACT_SOURCE_ONLY` when the operator's **actual checked-out files** had uncommitted/ignored edits or were on another HEAD. W13 now calls `verify-frozen-checkout.cjs` as a **mandatory step inside** `w11-qa-freeze-gate.cjs`. A read-only Git tree is not by itself proof of the source compiled by Unity.

Use **two separate directories**: one checkout of the optional A71 PR #159 tooling, and a distinct freshly staged, **clean/detached** checkout of the QA freeze SHA. The latter must contain the frozen ref and both original Git commit objects.

```sh
# From any working directory, after separately preparing both checkouts:
node /path/to/A71-tooling/scripts/cc001/w12/a71/w11-qa-freeze-gate.cjs \
  --root /path/to/QA-clean-frozen-checkout \
  --ref 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3
```

**W13 fail-closed conditions:** QA worktree `HEAD` exactly equals the source SHA; `git status --porcelain -z` is clean (including staged, modified and untracked); no ignored/untracked imported Unity code in `Assets`, `Packages`, `ProjectSettings`, `Tests`, `BuildTools`; no `assume-unchanged` or `skip-worktree` tracked paths; all **1758 expected tracked files** are regular files confined to the checkout and each on-disk Git blob SHA-1 matches the pinned frozen tree (including byte-identical assets). POSIX executable mode is checked; on Windows executable mode is validated by Git tree+index and file bytes, not the Windows filesystem permission bit.

**Actual new executable regression suite:** `node --test scripts/cc001/w12/a71/verify-frozen-checkout.test.cjs` **17/17 PASS, exit 0** using real disposable Git repositories (including dirty staging, ignored source, hidden index flags, HEAD drift, byte mismatch). Both new source and test files passed native Node v22.16.0 syntax checks. Original W12 26/26 remains a separately previously executed suite, **not rerun in this W13 execution**. A final full `run()` positive invocation against the private exact frozen source checkout is still **NOT_RUN**; therefore no real W11 Unity source-checkout PASS is claimed.

This is a read-only source preflight to use *before* launching Unity on the actual QA checkout. It is **not** a runnable Windows Unity player, compiled C# test, hash receipt for EXE/DLL, cross-machine parity proof or an A60 G3 verdict. The W13 change remains optional `ALT_HOLD` until A70 explicitly selects A71 source tooling alongside/beside A73 #177; do not install a second mandatory duplicate gate.
