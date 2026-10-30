# CC-001 R17-W14 / A81 — frozen 2-PC log evidence input hardening

## Dependency / target

This W14 patch **stacks on A81 W13 [Draft PR #244](https://github.com/C8LyNn/aplikacja-turnieje/pull/244)**, which in turn depends on A81 W11/W12 [Draft PR #200](https://github.com/C8LyNn/aplikacja-turnieje/pull/200). It is **not** a change to the frozen QA source or to the moving #207 development branch.

**Frozen W11 source:** `integration/cc001-r17-w11-qa-freeze-20261030` exactly `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.

## Implemented, narrowly scoped changes

1. A81's offline `scripts/cc001/w11/a81/verify-candidate207-telemetry.cjs` now enforces the **actual source enum** from frozen `Assets/CoreClash/Core/GameState.cs`: `MatchPhase { Aiming, Moving, Over }`. Previously any syntactically valid token (e.g., `Banana`) could match on PC1 and PC2 and yield `SAMPLED_DIAGNOSTIC_ONLY`/exit 0.
2. `run()` now requires **two distinct regular source files**: same-path, hardlink aliases and symlinks are rejected before reading. This is a **basic input alias safeguard**, not proof of two physical PCs; A60 still independently authenticates device identity and full binary SHA.
3. Filesystem errors in the CLI now print only the stable OS error code; local absolute/private paths are not echoed on stderr. Normal bounded user-facing argument errors remain readable.
4. New `scripts/cc001/w14/a81/frozen-log-identity.test.cjs` adds **13 native Node tests**, including actual child process exit0/1/3, hardlink, symlink, missing files, path privacy and the previously false-green phase example.

## Reproducible local tests

```sh
node --check scripts/cc001/w11/a81/verify-candidate207-telemetry.cjs
node --check scripts/cc001/w11/a81/verify-candidate207-telemetry.test.cjs
node --check scripts/cc001/w13/a81/frozen-telemetry-cli.test.cjs
node --check scripts/cc001/w14/a81/frozen-log-identity.test.cjs
node --test scripts/cc001/w11/a81/verify-candidate207-telemetry.test.cjs scripts/cc001/w13/a81/frozen-telemetry-cli.test.cjs scripts/cc001/w14/a81/frozen-log-identity.test.cjs
```

**Executed on Node v22.16.0:** **66/66 synthetic/unit/child-CLI tests PASS, exit 0**, all four syntax checks exit 0. Git blobs of the two W14 changed files match exact locally executed bytes: analyzer `e16a669c3253a3c1594c753abff018dcdcb15c35`; new W14 suite `a9a48dc6b6d6f78a86b9db3650a38aa5415d276b`. Raw test transcript SHA256: `8c04c17ceb7c9b19407ba0ae58eac9ee360b5557c76d7ed2bc99f77c7274b610`. Test data is fictitious and **cannot** attest Windows Unity, real PC1-PC2 match, G3/G4, frame pacing, gameplay, physics, teleport, or managed .NET9 tests.

## Owners and integration

A70 decides separately whether to accept this isolated log validator after earlier gates; no automatic merge, no main, release, or protected-source modifications. A72 owns a real frozen Unity 6000.4.0f1 Windows x64 and fresh .NET9 evidence, including nested Player hashes. A60/A31 own physical identical-binary PC1-PC2 playtest and original log evidence. The missing authorized Windows operator remains the concrete P0 blocker. **W11/G3/G4 HOLD**.

Owner contract unchanged: **Mitosis exact V148, Furnace FIRE-zone periodic DoT only, HP R16**.
