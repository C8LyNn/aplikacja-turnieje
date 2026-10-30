# CC-001 R17-W12 / A10 — P2 aim geometry contract

**Status:** isolated test-only proposal. **Frozen W11 QA parent:** \`3f972cdbaea6289a7e33ce608f5d3256cfdab0a3\`. The QA freeze branch, RC1, V148, R16 HP, Furnace, Protocol149, main and release are unchanged.

## Purpose
12 executable C#/.NET9 cases for the existing wall-only \`AimGuide.Trace\`, true \`LaunchGesture.Release\`, \`MatchPerspective\` P2 vertical mirror, and \`AimUiStatus\`. These are game-design guardrails for the known P2 local-up/arrow defects, **not** proof of physically rendered arrow rasterization, NGO state replication, Unity FPS, or Win11 PC1/PC2 performance.

## Run in a real .NET 9 checkout
\`\`\`sh
dotnet run --project unity/cc001-r16/CoreClash-V149-Unity/Tests/R17W12A10/R17W12A10.csproj
\`\`\`
Produces named PASS/FAIL and exits 0 iff all cases pass. Works with managed source in the repo's existing Tests project; no edit to existing \`Program.cs\`. The runner is deliberately isolated from A72's protected exact-SHA Windows build.

**Safety:** Do not cherry-pick onto QA freeze during W11. If A70 approves, import only the two test files after formal W11 closure onto a new W12 source SHA. A60 must execute C#/Unity/PC1-PC2 gates independently. This test's guide remains a **geometric wall-only hint**, not a full physics/ability prediction.
