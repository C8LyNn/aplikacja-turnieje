# CC-001 R17-W9 — A70 multiplayer repair integration gate

**Scope:** Integration/release tooling owned by A70; **no gameplay, UI or networking implementation**. This isolated tool does **not** perform a merge, change Git refs, execute Unity or attest G3. Its goal is to reject unauthorized file/author/source combinations before A70 imports future independently authored W9 fixes.

## Usage (local source checkout containing RC1 and the candidate)

```powershell
node scripts/cc001/w9/a70/rc1-integration-gate.test.cjs
node scripts/cc001/w9/a70/rc1-integration-gate.cjs --repo=C:/repo/aplikacja-turnieje --candidate=<exact-40-hex-new-W9-sha> --manifest=C:/review/HQ-approved-w9-paths.json
```

Generate the **manifest only after** HQ assigns exact path owners and independent agent branches produce precise Git blob SHA1 values. Example of the format (PLACEHOLDERS — **NOT** an approved manifest):

```json
{
  "schema": "CC001_R17_W9_A70_INTEGRATION_ALLOWLIST_V1",
  "baseSha": "10f64e4d213f17a352ed8fa83bc75884a39549f0",
  "changes": [
    {
      "path": "unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NetworkGameSession.cs",
      "owner": "A31",
      "blobSha": "REPLACE_WITH_REAL_PINNED_40HEX_GIT_BLOB_SHA"
    }
  ]
}
```

**Do not reuse this example as authorization**. The tool checks that paths are explicitly authorized in the separate HQ manifest, only in-place Unity C# modifications are present, each actual candidate blob equals its approved SHA1, RC1 branch is still at its frozen pinned SHA, RC1 is a linear ancestor of the candidate, and no protected original paths/diagnostic Phoenix marker slip in. It will fail on new C# files, docs, metadata, manifests, packages, catalog, protocol or other paths until an appropriately scoped integration policy is separately reviewed; do **not** broaden it silently. Path-owner names are labels from the manifest, **not cryptographic proof** of which GitHub account authored a change. The manifest's origin requires independent HQ verification.

**Exit codes:** 0 = `SOURCE_ONLY_PASS` (not runtime QA); 1 = `HOLD`; 2 = invalid CLI invocation/JSON. Outputs JSON with checked SHAs, changed paths and errors. Running without authorization or before any W9 C# changes must return HOLD.

**Covered by synthetic Git tests:** legitimate exact owner blob, no-op rejection, wrong hash, missing owner, unlisted file, Protocol149 mutation, W7 diagnostic marker, nonlinear history, missing manifest, traversal path, pinned base, empty authorization (12/12 PASS). Tests build and remove an isolated temporary local Git repo; never touch RC1.

**Current status at tool creation:** RC1 `integration/cc001-r17-w8-phoenix-rc1` = `10f64e4d213f17a352ed8fa83bc75884a39549f0`; W9 gameplay/network P0 fixes are **not yet integrated or tested by A70**. The operator has reported actual PC1↔PC2 LAN connection but P2 HUD incorrect, animation teleport/stutter and aim-perspective faults. No G3 PASS, no new candidate source, no merge into RC1 or main, no deployment/release. Owners A31/A41 handle networking/seat/authority, A20 UI, A10 game-design strength bar contract, A60 independent gameplay/network QA. A70's next stage is exact blob integration after those source patches and independent test artifacts exist.
