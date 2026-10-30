# CC-001 R17-W12 — A73 Git source admission hardening (isolated development)

**Role:** A73 / Git Integration / Issue #136. This is a concrete code patch to the existing, open [A73 Draft PR #177](https://github.com/C8LyNn/aplikacja-turnieje/pull/177), **NOT** a gameplay change or W11 release action.

## Defect and repair

Existing `verify-stacked-addon.cjs` compared allowed Git paths, diff statuses and Git blob SHA-1 but not the Git tree **file mode / object type**. A malicious or mistaken contributor could introduce an executable-mode `*.cs` at the expected path and with its own correctly-pinned blob hash while still obtaining `PASS_SOURCE_SCOPE_ONLY`. New `Assets/*.cs` could likewise omit the required Unity `.cs.meta`, because earlier logic checked new `.meta`→`.cs` but not the reverse direction.

W12 code fixes both admission gaps **without touching game sources**:
- For **every changed file**, use `git ls-tree -z <pinnedSha> -- <path>`, require exactly one matching entry of **regular blob mode 100644**, reject symlinks `120000`, executable bit `100755`, Git links `160000`, and malformed entries. The result now records mode/type alongside the pinned SHA.
- For an **added C# under Unity `Assets/`**, require the same diff to contain a corresponding added `*.cs.meta`. Existing new-meta→source and meta format checks remain. New managed C# test sources outside `Assets/` do not require Unity .meta.
- Existing W11 freeze SHA and 22/10 exact manifest file identities are unchanged. Does **not** alter protected RC1, V148, R16 HP, Furnace, Protocol149, A70 QA freeze, or the moving PR #207.

## Real tests

```sh
node --check docs/cc001/swarm/w11/A73/verify-stacked-addon.cjs
node --check docs/cc001/swarm/w11/A73/verify-stacked-addon.test.cjs
node docs/cc001/swarm/w11/A73/verify-stacked-addon.test.cjs
node docs/cc001/swarm/w11/A73/w11-finalize.test.cjs
```

**Local Node 22.16.0 / Git 2.47.3 actually executed:** syntax exit 0 for changed source/test, **16/16 synthetic real Git fixture assertions exit 0** (13 original, 3 new: symlink, executable bit, missing Unity .meta), plus unchanged W11 dual manifest wrapper **14/14 exit 0**. The source/test file Git SHA-1 of bytes actually tested are `668155d9a562d20a158e0b726cc96ca2b096ce3a` and `e8dc7e75c7aea6d595cff54f144d6d1dc2a13ec5`. GitHub tree metadata independently confirmed that **all 22 frozen W11 changed paths are regular blobs mode 100644** and that both new Unity Assets C# files have corresponding new .meta files.

**Important execution limit:** This is **Git-source admission regression testing**, not a native Unity compile or a complete private Git checkout source gate. Real Windows Player build and PC1↔PC2 G3 remain the exclusive A72/A60/A31 responsibility.

## W11 and W12 gates

- **A70 immutable-by-policy QA freeze:** `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
- **W11 closure:** HOLD until A72 produces a true Windows Player built from the freeze and A60/A31 independently test both physical PCs. A72 build scripts must be repinned to that exact ref/SHA by A72; no bypass of fail-closed launch guards.
- **W12 development:** this A73 PR remains isolated DRAFT; no integration into RC1/main or release without owner authorization and W11 formal gates.
