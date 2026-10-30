# CC-001 R17-W9 / A73 — Git integration gate (DEV ONLY)

**Agent:** A73, Git Integration. **Base:** frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

This is executable Git integration tooling, NOT a gameplay/network fix, code merge, Unity verification, or release approval. Ownership: A31/A41 networking and interpolation; A20 presentation and P2 aim; A10 design; A60 QA; A70 final integration. No gameplay, V148, Protocol149, R16, RC1 or CI files are changed by this PR.

## Run on a disposable complete Git clone

```sh
node docs/cc001/swarm/w9/A73/guard-short.test.cjs
node docs/cc001/swarm/w9/A73/guard-short.cjs --manifest /path/to/HQ-approved-W9-manifest.json
```

Manifest structure (replace **all** example author ref/SHA/path entries using the current HQ-approved ownership decision; this example is NOT a scope authorization):

```json
{
  "schemaVersion": 1,
  "baseSha": "10f64e4d213f17a352ed8fa83bc75884a39549f0",
  "candidates": [{
    "owner": "A31",
    "ref": "<actual A31 branch>",
    "expectedSha": "<exact full 40-hex commit SHA>",
    "allowedPaths": [
      "unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NetworkGameSession.cs",
      "unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs"
    ],
    "requiredTests": [
      "unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs"
    ]
  }]
}
```

Checks: immutable RC1 ancestry, exact branch HEAD, per-agent exact changed paths, missing changed regression test, source ownership collisions, forbidden protected/generated files, and pairwise non-mutating `git merge-tree --write-tree` previews. Output JSON `PASS_SOURCE_SCOPE_ONLY` (exit 0), `HOLD` (exit 1), or invalid manifest/tool error (exit 2). Do not treat PASS as network synchronization, player-turn, native Unity or PC1–PC2 test PASS. `git merge-tree --write-tree` can write unreachable tree objects into the disposable clone's Git object database; it does not change HEAD, branch refs, index or worktree.

**Tested:** 7/7 Node22/Git 2.47 synthetic repository assertions, including two disjoint source+test branches, SHA drift, scope violation, test required, cross-agent overlap, protected Program.cs and unchanged author/main refs. Actual W9 source candidates not yet available during preparation: **no production diff/merge test has been run**. No protected-ref updates or release.
