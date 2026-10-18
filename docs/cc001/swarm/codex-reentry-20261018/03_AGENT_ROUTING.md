# R17-W4 — Agent routing and session map

Use the five READY prompts below in **five independent Codex sessions/worktrees**. Each agent re-reads the W4 master dispatch, its existing Issue and the current branch HEAD before acting. Other workstreams must not wait for independent ones.

| Agent | Existing Issue | Existing work branch | Prompt file | Expected real deliverable |
| --- | --- | --- | --- | --- |
| A60 SOURCE G0 | https://github.com/C8LyNn/aplikacja-turnieje/issues/126 | feat/cc001-r17-w3-a60-baseline-qa | agents/A60_SOURCE_ADMISSION.md | Independent source-only PASS/HOLD report on original A60 branch |
| A73 MERGE PREFLIGHT | https://github.com/C8LyNn/aplikacja-turnieje/issues/136 | feat/cc001-r17-w4-a73-merge-preview | agents/A73_MERGE_PREFLIGHT.md | Actual read-only post-W3 ancestry/path/conflict report |
| A72 MANAGED CI | https://github.com/C8LyNn/aplikacja-turnieje/issues/113 | feat/cc001-r17-w4-a72-managed-ci | agents/A72_MANAGED_CI.md | Executable opt-in .NET9 CI workflow/script and honest test results |
| A40 LIFECYCLE | https://github.com/C8LyNn/aplikacja-turnieje/issues/92 | feat/cc001-r17-w4-a40-lifecycle-return | agents/A40_LIFECYCLE_IMPLEMENTATION.md | Narrow implemented/test-authored lifecycle/RETURN deltas or exact documented scope blockage |
| A50 FROSTGUARD | https://github.com/C8LyNn/aplikacja-turnieje/issues/138 | feat/cc001-r17-w4-a50-f02-physics | agents/A50_FROSTGUARD_F02.md | Minimal F02 production fix, red/green evidence or precise NOT_RUN |

## Shared source ownership (no collisions)
A60 ONLY docs/cc001/swarm/w3/A60/** and existing #126, READ-ONLY source.
A73 ONLY docs/cc001/swarm/w4/A73/**, READ-ONLY source.
A72 ONLY .github/workflows/cc001-r17-managed.yml, scripts/cc001/w4/a72/**, docs/cc001/swarm/w4/A72/**.
A40 ONLY Unity Core/LifecycleEffects.cs, Core/GameState.cs, Core/AbilityResolver.cs, Core/TurnSystem.cs, Tests/AbilityTests.cs, docs/cc001/swarm/w4/A40/**.
A50 ONLY Unity Core/ElementalEffects.cs, Physics/CollisionResolver.cs, Tests/ElementalTests.cs, docs/cc001/swarm/w4/A50/**.

Unity source root is unity/cc001-r16/CoreClash-V149-Unity/. No A40 edit to CollisionResolver.cs; A50 owns it exclusively. Neither A40 nor A50 can edit Tests/Program.cs or frozen V148. Different agent sessions MUST NOT share a writable worktree. Neither a source diff nor new test definitions justify PASS without actual compiler/test runs.

## WAIT roles
A70 #137 until G0 PASS + accepted A73 report; A71 #140 and A74 #141 after real integrated candidate SHA; A60 #139 after G1/G2; A20 #95 and A31 #94 after suitable G2 physical build. See 05_WAITING_AGENTS.md.

## Simple text to start each Codex session

PROJECT CC-001 / WAVE R17-W4. Keep existing role and history. Read the W4 MASTER DISPATCH and this Codex re-entry packet, especially 02_VERIFIED_STATE_AND_GATES.md, 04_HANDOFF_AND_TEST_EVIDENCE.md and YOUR OWN agents/Axx file. Refetch your GitHub Issue and branch, perform only your authorized READY task in your own isolated branch/worktree, run honest tests, push exact SHA and report HANDOFF to your existing Issue. No other agent's files, main merge, force push or release.

Append the exact per-agent prompt link to the text above. Reading the complete agent file is mandatory.
