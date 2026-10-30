# CC-001 — R17-W11 / A73 Stacked Git Integration Gate

**Read-only, role-scoped.** This is a mechanical Git source provenance gate for the **A30 PR #189 addon** on **A70 PR #181**, not gameplay/build QA or approval to merge into A70/RC1/main.

## Exact pinned source

- Frozen RC1: `10f64e4d213f17a352ed8fa83bc75884a39549f0`
- Current A70 base #181: `3d377767e72473cebd90e49293a0cd5dada70464`
- A30 addon #189: `3a6fb11f70cbdd354ca319b6c48e5c080a1ae193`
- Expected delta: **18 paths** (13 modified, 5 added), including two added `.cs.meta` paired with new `.cs` files, and tests wiring.
- Retention: seven pinned blobs from the A70 base, including V148, Protocol149 implementation, R16 source manifest and original A33 diagnostics.

The JSON pins were independently obtained by A73 using GitHub exact ref + `compare_commits` + 18 `fetch_file` Git SHA-1 reads and seven before/after blob readbacks. A manifest is **evidence input**, not proof of gameplay correctness or owner authorization to merge.

## Reproduce from a complete authenticated disposable Git clone

```sh
node --check docs/cc001/swarm/w11/A73/verify-stacked-addon.cjs
node docs/cc001/swarm/w11/A73/verify-stacked-addon.test.cjs
node docs/cc001/swarm/w11/A73/verify-stacked-addon.cjs --manifest docs/cc001/swarm/w11/A73/w11-a30-on-a70-exact.json
```

Fetch both named refs and frozen RC1 commit first. The CLI rejects missing objects, ref drift, wrong parent/ancestry, unlisted or mismatched change type, wrong Git blob IDs, unmatched new `.cs.meta`, invalid metadata, forbidden protected paths and retained blob loss. Git commands are *read-only*, unlike a merge or reset. `PASS_SOURCE_SCOPE_ONLY` (exit 0) certifies only the pinned source contract; semantic/network correctness remains untested. A reported `HOLD` (exit 1) or missing/invalid Git evidence (exit 2) blocks admission. The guard performs no network requests, ref writes, branch updates, commit mutations or deployments.

## W11 handoff and limitations

PR #189 is an independently authored candidate, not yet integrated into A70 branch #181. It chooses A41 W10 size-aware host cadence + stale ACK handling, A34 single non-authoritative visual smoother with PORTAL snap, A20 aim/no-meter, A32 local deck and A30 Y-only P2 view/input transform. These are *source-selected* fixes. Actual new .NET9/codec/Unity compile, Windows build SHA-256, and 2-PC parity/smoothness/turn/aim/G3/G4 QA remain **NOT_RUN or HOLD** until A70 chooses a final exact SHA and A72/A60 execute their gates. The A72 kit for the older A70 SHA is **stale for PR #189**.

Do not treat this A73 guard as A71's exhaustive metadata GUID check; the new `.meta` pairing is only a structural gate. No RC1/main/Stage2/R16/V148/Protocol149 updates, no release.
