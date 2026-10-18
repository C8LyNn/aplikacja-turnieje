# R14 — safe integration QA handoff

Baseline: R13 source candidate. This is a **testability/validation** increment, not a gameplay release.

Read `docs/R14_INTEGRATION_QA_PL.md`; `Tests/IntegrationR14Tests.cs` registers four cross-wave tests. Run the isolated PowerShell 7 runner `Tools/r14-qa.ps1` on Windows with .NET 9, Node 22, and optional Unity Editor. The Node `Tools/r14-qa.cjs` variant can perform static checks from Linux, but its C# stage will show BLOCKED without dotnet.

Evidence from R9 is historic and must never be rewritten in place. R14 runners work on copied project files, storing each attempt's logs under a unique run folder. Historical SHA checks are mandatory. No published release, no Git push, no Replit sync.

Known gate: no managed or Unity builds were executed in the analysis environment. Keep certification statuses at 37 UNITY_READY / 32 PARTIAL / 158 DATA_ONLY until independently verified.
