# CC-001 / A73 — W13 Pairwise Source Admission (re-pinned after A83 #229 update)

## Current source pins (do not substitute a moving head)

- **W11 QA freeze:** `integration/cc001-r17-w11-qa-freeze-20261030` → **`3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`**, unchanged.
- **A41 PR #228 (ALT_HOLD):** `72e57524ec4fe32e7a5e50141cc8204afb89c49f`, 3 source/test/docs changes.
- **A83 PR #229 (canonical DEV_ONLY):** **`cce672566b57e22402ba6793e038b076c178f3aa`**, 8 changes including `LocalSeatVisuals.cs` + valid new `.cs.meta`, `Program.cs`, `CoreClash.Tests.csproj`, `R17W11A83SeatVisualTests.cs`. A83 #210 was closed unmerged, SUPERSEDED; do not double-cherry-pick.
- **Old A83 SHA `69d20ca863aa7f195a9b0a506032025a477ba68b` and old unreferenced tree `8f2571b1c7860d81ee3df035c06327d9e0e313ef` are HISTORICAL / STALE / DO NOT INTEGRATE.** A83 owner explicitly requested re-pin in PR #237 comment #6533172880.

## Concrete executable code and tests

`verify-pair.cjs` validates frozen ref and both owner refs/heads, RC1 descendant, exact per-file Git tree blob SHA/mode 100644, complete diff allowlist, regression test registration, no protected gameplay/protocol/HP/etc edits, and no cross-owner path overlap. In addition, new W13 corrective code checks:
- newly added `.cs.meta` belongs to an added Unity C# file; added Unity C# must have matching `.meta`;
- newly added Unity `.meta` has exactly `fileFormatVersion: 2` and a lower-case 32-digit hexadecimal `guid` field;
- duplicate GUIDs among newly added metadata across the two owner PRs are rejected;
- modified original `.meta` files are rejected; file modes/symlinks/executables remain blocked.

**Run on a complete, disposable authenticated Git checkout with all three refs fetched:**

```sh
node --check docs/cc001/swarm/w13/A73/verify-pair.cjs
node --check docs/cc001/swarm/w13/A73/verify-pair.test.cjs
node docs/cc001/swarm/w13/A73/verify-pair.test.cjs
node docs/cc001/swarm/w13/A73/verify-pair.cjs --manifest docs/cc001/swarm/w13/A73/a41-a83-source-pins.json
```

`PASS_PAIRWISE_SOURCE_ONLY` / exit0 does **not** mean native compilation/gameplay acceptance, merged PR, A70 approval or W11 completion. Any SHA drift / malformed or overlapping diff fails closed. The local fixture selftests **ACTUALLY RAN on Node22.16.0/Git2.47.3, 20/20 PASS exit0** (original 15 + valid Unity metadata positive, malformed metadata, orphan meta, duplicate new GUID, stale author SHA). Real private-source CLI could NOT be executed because local container GitHub DNS access fails; real Git merge-tree against the full private repository remains NOT_RUN.

## Actual GitHub object-level readback, updated

Independently fetched *full, untruncated* frozen/A41/current-A83 Git trees. Both owner branches are freeze descendants (A41 ahead3, A83 ahead9), exact common merge-base freeze. **11 source/test/docs paths (3 A41 +8 A83), ZERO overlap**, all exact author Git SHA-1 blobs and regular mode 100644; all other files on each owner branch unchanged versus freeze.

Built an **UNREFERENCED** GitHub tree from original frozen root `7fb8a89143f77aa22488d92af32efa35cd323332` and 11 exact author Git leaf blobs, result **`58c0404b092289fba9918472df347b577437ab7a`**. Independently re-read both full trees and confirmed **11/11 author changed paths and 1751/1751 untouched frozen files** retained without extra/missing paths; base 1758 Git blob files → result 1762 (new A41 doc, A83 source/meta/test). Machine-readable pinned evidence: `github-tree-union-evidence.json`. No merge commit or branch ref was created from this preview, and no compiled C# or native Unity Player results exist.

## Gates and owner decisions

- A70 alone may select post-W11 integration; this PR remains **Draft**, separate review-only base, ALT_HOLD pending owner choice and W11 real G3.
- A72 must actually run frozen SHA .NET9 managed tests and Windows Unity 6000.4.0f1 build with original Player EXE/DLL/all-files SHA256, log and exit evidence. A60/A31 must independently test physical PC1+PC2 on the same binary. Both remain NOT_ATTESTED/HOLD here.
- Moving PR #207 has newer development changes and cannot be substituted for freeze. Preserve Mitosis V148 exact, Furnace FIRE-zone/periodic damage only and R16 HP. RC1, QA freeze, main and release untouched.
