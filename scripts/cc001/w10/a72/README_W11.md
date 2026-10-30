# CC-001 R17-W11 — A72 frozen Windows QA build

**Approved immutable QA source:** `integration/cc001-r17-w11-qa-freeze-20261030` → `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
**RC1 base:** `10f64e4d213f17a352ed8fa83bc75884a39549f0`.
**Tools:** existing A72 draft PR #188; only scripts/docs changed.

**NO native build was run here:** connected executor is Linux without Windows/Unity/.NET9; physical PC1/PC2 absent. Updated builder requires .NET SDK 9 managed C# tests in an isolated worktree BEFORE real Unity6000.4.0f1 Windows x64 build. It never treats a static check or old binary as Windows PASS.

Use `README_W11_PR207.md` for complete Windows execution and evidence handoff instructions. Historical `URUCHOM_W11_PR207.cmd` filename now pins **QA-freeze**, not moving PR #207. Source SHA drift = HOLD; no fallback SHA. Mitosis V148 / Furnace FIRE ticks / R16 HP protected. No main/RC1 merge or release.

**G3/G4 HOLD, W11 NOT CLOSED, W12 FINAL INTEGRATION HOLD** pending real Windows Player and A60/A31 two-PC QA.
