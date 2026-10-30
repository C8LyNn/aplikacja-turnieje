# CC-001 R17-W10 / A32 — Local deck content stacked on A30
Base: A30 PR #175 at SHA `e6470dce9ff02fc294c4df15bde82952350b42b2` (child of protected RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`).

Repaired on A30 code: desktop, compact landscape, phone cards now read network LOCAL seat stock, not active seat. Offline hotseat still uses active-turn deck. P2 sees nine own stock entries during P1 turn, with actions disabled until P2 authoritative turn. Invalid network seats fail closed without showing opponent stock. A30's 20Hz cadence, turn-copy, P2 view/aim and protocol are preserved.

A32 only: pure presentation helper in new LocalDeckContent.cs plus Unity .meta, test project registration and six managed regression cases. No Core/Networking/Physics/catalog/V148/Protocol149 changes. P2 power bar and network/ball stutter remain A10/A31/A34/A72/A60 owned, not claimed fixed.

QA: C# compile/tests and physical PC1/PC2 still pending; deterministic source gates performed separately. A70 should selectively merge compatible hunks, not overwrite any A20/A21/A33/A34 candidates. This branch is stacked on A30 source, not independent final integration approval.
