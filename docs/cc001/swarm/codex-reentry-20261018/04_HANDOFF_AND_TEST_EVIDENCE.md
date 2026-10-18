# CC-001 / W4 — Common Codex execution, evidence and HANDOFF contract

## Start checks, before modifying any files
- Check repository owner/name and git remote; fetch full W4 MASTER DISPATCH and your agent Issue (including newest comments).
- Check git status is CLEAN before branch switching; preserve any user uncommitted work (never discard/reset without explicit authorization).
- Fetch branch HEAD and compare to the latest ref recorded in the packet. If moved, inspect delta first; do not overwrite another agent's commit.
- Ensure OWN branch in OWN isolated worktree. Do NOT implement on the packet branch, frozen A70 branch, main or someone else's feature branch.
- Inspect allowed source file paths under unity/cc001-r16/CoreClash-V149-Unity/ and all relevant prior accepted contracts/reports.
- When testing, use a disposable checkout if scripts mutate evidence, generated Unity files, project settings or output directories.

## Authority
Master W4 dispatch: https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
Documentation packet itself confers NO new authority. All permissions come from existing W4 dispatch and GitHub Issues; the most restrictive file ownership rule wins. Conflicting instructions -> HOLD and ask HQ via original Issue.

## Expected genuine outputs
- An actual targeted change or independent QA result within your assigned scope, NOT another generic plan-only statement unless the role is explicitly read-only or an actual blocker is demonstrated.
- A source/test diff and exact base/new SHA.
- Tests executed with command, runtime/OS/tool versions, actual exit code, PASS/FAIL count and where log/evidence is saved. Tests NOT executed explicitly marked NOT_RUN. Do not silently count syntax or static checks as compiled managed PASS.
- Negative controls where relevant; no fixing tests merely to force green.
- Review that the source files modified are within your own allowlist, and protected assets/Protocol149 unaffected.
- Push to only your assigned branch and read it back; if push unavailable, provide patch/diff and explain NOT_PUBLISHED. The existing issue remains open until independently accepted.

## Mandatory Issue comment and report template

PROJECT: CC-001
WAVE: R17-W4 recovery
AGENT: <Axx, unchanged role>
ISSUE: <existing issue number and URL>
FROZEN R16 SOURCE COMMIT: de1fe4b88fce3bd08ef383165dc2cd622af2536b
W4 MASTER DISPATCH SHA: 661660d3a3dc8a4fa2c9afea489050247f64c38c
START BRANCH AND HEAD: <exact>
FINAL BRANCH AND HEAD: <exact, or NOT_PUBLISHED>
CHANGED PATHS: <complete explicit list>
SCOPE DIFF: <summary + test-first sequence when applicable>
SOURCE/REFERENCE/PROTOCOL INTEGRITY: <verified, NOT_RUN, or HOLD>
TESTS ACTUALLY RUN: <exact commands, environment, exit code, relevant counts, evidence>
NOT RUN: <precise layers and reasons>
DESIGNED: <YES / PARTIAL / NO>
IMPLEMENTED: <YES / PARTIAL / NO>
TESTED: <source static / managed / Unity / device, exact>
INTEGRATED: <NO unless A70 actually performed authorized candidate assembly>
RELEASED: NO
GATE: <PASS / HOLD / NOT_RUN, with scope>
BLOCKERS / REQUIRED HQ DECISIONS: <specific>
HANDOFF LINK: <published report + exact commit URL>
HANDOFF TARGET: A00/HQ and A60 (+ relevant owner)

## How to distinguish layers
- Source integrity PASS ≠ managed compile PASS.
- A static syntax/geometry check ≠ Unity GUI test.
- Historical R16 269/269 + codec 13/13 ≠ new W4 test run.
- A GitHub branch named 'integration' with only one coordination document ≠ integrated candidate.
- 42/51/134 ability readiness is unchanged absent independent acceptance.
- No physical network/device PASS without measured separate actual devices.
- A60 G0 source admission ONLY ≠ A60 #139 exact-candidate release gate.

## Terminal action
Comment on the existing Issue with handoff. Include final exact SHA and explicit permission status (never presume permission to merge). Notify HQ #97 only with links to meaningful results; no multiple duplicate issues.
