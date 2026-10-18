# CC-001 — A72 R17-W4 Managed .NET 9 / codec CI HANDOFF

**Date:** 2026-10-18  
**Agent:** A72 Build & CI  
**Issue:** #113 — https://github.com/C8LyNn/aplikacja-turnieje/issues/113  
**Wave:** R17-W4 RECOVERY / W4-02  
**Verdict:** IMPLEMENTED / STATIC CHECKS PASS / MANAGED + CODEC NOT_RUN / G1 HOLD

**Frozen R16 commit:** de1fe4b88fce3bd08ef383165dc2cd622af2536b  
**W4 dispatch + initial branch commit:** 661660d3a3dc8a4fa2c9afea489050247f64c38c  
**W4 branch:** feat/cc001-r17-w4-a72-managed-ci  
**Earlier A72 static handoff:** c49ef5855eed7eb5aef5534f5cc8334fe1585463; the previous 32/32 STATIC PASS is not managed execution.

## Implemented files — all in A72-exclusive W4 scope

1. .github/workflows/cc001-r17-managed.yml — workflow_dispatch ONLY, exact repository and W4 branch guard; no automatic push, pull_request or schedule triggers; read-only token, Node 22 and .NET 9 SDK, independent test policy step, isolated runner, always-uploaded evidence artifact with 14-day retention. No Unity, tournament CI, live deployment or release.
2. scripts/cc001/w4/a72/policy.cjs — exact SHA pins for baseline and four unintegrated W3 sources; only an exact lowercase 40-character SHA accepted for optional HQ candidate; narrow changed-file allowlist; protected data/reference/Program.cs checks; sixteen positive and negative controls.
3. scripts/cc001/w4/a72/managed-ci.cjs — checks ancestor relationship, source SHA, frozen source tree, changed paths, immutable file blobs, Node 22 and installed .NET 9; pins selected installed 9.x SDK through temporary global.json in disposable checkout; creates a detached disposable Git worktree and runs real Node data verifier, net9.0 managed tests and codec suite; writes command/exits/timestamps/log SHA256/fresh evidence SHA256 and verdict into external results.json. Existing Evidence/unity-tests.json and network-codec-tests.json are cleared ONLY inside temporary worktree to block inherited historical PASS.
4. docs/cc001/swarm/w4/A72/R17_W4_A72_MANAGED_CI_HANDOFF.md — this report.

**Explicitly untouched:** unity/cc001-r16 source, historical R16 ZIP/tree/manifest/Evidence, V148, protocol 149, existing tournament workflows, website's three Core Clash builds, main and deployed code. No merge/rebase/force-push.

## Frozen snapshot selection; never integrate streams implicitly

| Manual runner target | Exact source HEAD | Required managed count / context | Actual W4 .NET result |
| --- | --- | --- | --- |
| baseline | de1fe4b88fce3bd08ef383165dc2cd622af2536b | 269 (R16) | NOT_RUN |
| w3-a20 | 1f87595a9d73de30179e5158a5848eae3b965885 | >=276, +7 presentation cases; MatchLayout/MatchView branch only | NOT_RUN |
| w3-a41 | 8eb0b2517c049c95fc2257d73f0139d7bc17fd2c | >=286, +17 seat-authority cases | NOT_RUN |
| w3-a50 | 4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5 | >=270, deliberately RED Frostguard F02 source tests; always HOLD | NOT_RUN |
| w3-a51 | 92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5 | >=292, +23 snapshot cases | NOT_RUN |
| candidate | independently supplied full SHA, must descend from frozen R16 | >=269, allowed source paths only | NOT_RUN — no candidate SHA |

Each profile uses its own pinned commit; no cherry-pick or merge of parallel W3 branches. Test PASS requires actual process exit 0, newly regenerated managed evidence with zero failing tests and minimum test count, independent fresh codec JSON with exit 0 and exact completion marker reporting 13 tests. For intentionally-red W3 A50, the runner returns HOLD and nonzero even in unexpected-green conditions.

## Actual checks performed in this A72 environment

| Check | Actual result | Evidence qualification |
| --- | --- | --- |
| GitHub readback: workflow + runner + policy | PASS | Correct source/blob SHA from W4 A72 branch |
| V8 syntax parsing of runner and policy | PASS | In-memory syntax validation, NOT Node shell execution |
| Policy module selfTest() | 16/16 PASS, 0 FAIL | Real isolated V8 execution of pure controls, NOT C# |
| Workflow static triggers | PASS | Manual dispatch only, no push/PR, explicit W4 branch/repository guard, artifact upload |
| Local node --version | exit 0, v22.16.0 | Linux shell |
| Local dotnet --version | command not found, exit 127 | .NET 9 unavailable |
| Local git ls-remote of repository | exit 128 | DNS could not resolve github.com; no full checkout in local shell |
| Managed baseline and four separate W3 snapshots | NOT_RUN | No .NET9/full checkout in current shell |
| Codec 13/13 rerun | NOT_RUN | Requires .NET9 |
| Unity Editor, Windows/WebGL/Android builds, browser/physical/ WAN | NOT_RUN | Out of scoped toolchain and no hardware |
| GitHub Actions actual workflow execution | NOT_RUN | Manual workflow only on W4 branch, not yet registered in default branch; no Actions dispatch connector action |

The committed standalone script is syntactically parseable, but **has not been executed end-to-end by A72 against a full checkout**. Do not report managed/codec PASS from this work. Historical R16 269/269 + 13/13 and 3 prior platform build successes remain historical evidence only.

## GitHub workflow registration gate: critical blocker

The repository default branch is main. At this inspection, the new managed workflow was absent on main (GitHub fetch returned 404) and present only on the isolated W4 A72 branch. A GitHub workflow_dispatch trigger ordinarily requires a workflow defined on the default branch before GitHub offers manual execution. The connected GitHub actions available to A72 also do not expose manual dispatch. Therefore no CI run was triggered or verified.

**Do not silently add a push trigger, edit main, modify production workflow or merge to unlock this.** HQ must give separate authorization to register an approved workflow on default branch, or provide a full clone/toolchain to run the script directly. Any future Actions execution must record workflow run URL, selected commit, SHA of runner, exit codes and uploaded artifacts. Current G1 remains HOLD.

## Reproduction on approved host

Prerequisites: full C8LyNn/aplikacja-turnieje Git repository checkout with pinned W4 A72 commit and reachable SHA objects, Node 22, .NET SDK 9. Run from repository root with a fresh output directory OUTSIDE the repository:

    node scripts/cc001/w4/a72/managed-ci.cjs --self-test
    node scripts/cc001/w4/a72/managed-ci.cjs --target=baseline --out=/tmp/cc001-w4-a72-baseline
    node scripts/cc001/w4/a72/managed-ci.cjs --target=w3-a20 --out=/tmp/cc001-w4-a72-a20
    node scripts/cc001/w4/a72/managed-ci.cjs --target=w3-a41 --out=/tmp/cc001-w4-a72-a41
    node scripts/cc001/w4/a72/managed-ci.cjs --target=w3-a50 --out=/tmp/cc001-w4-a72-a50
    node scripts/cc001/w4/a72/managed-ci.cjs --target=w3-a51 --out=/tmp/cc001-w4-a72-a51

For candidate only, after A70/HQ approval: supply --target=candidate --candidate-sha=EXACT40HEX and distinct --out directory. Do not run A50 intentionally-red fixtures as accepted green production code. Do not run original R16 mutating QA driver in frozen source checkout. Each stage stores stdout/stderr, exit, log SHA256, new managed/codec JSON, candidate SHA and scope policy results in output directory. A60 must independently review runtime evidence.

## Mandatory status axes and HANDOFF

**DESIGNED:** YES — opt-in SHA-pinned pipeline, independent R16/W3 profiles, negative controls, scoped diff restrictions, evidence freshness.  
**IMPLEMENTED:** YES — workflow and two executable JS source files within authorized paths.  
**TESTED:** static GitHub readback/syntax + 16/16 V8 policy controls PASS; real .NET/codec NOT_RUN; Unity/native/device NOT_RUN.  
**INTEGRATED:** NO — own isolated branch only, no candidate assembled.  
**RELEASED:** NO.  
**G1 GATE:** HOLD / NOT_RUN pending real .NET9 execution and A60 acceptance.

**Blockers:** .NET9 unavailable; local Git DNS unavailable; manual workflow not registered on main; no authorized candidate SHA; A50 F02 W3 deliberately red pending W4 repair.

**HANDOFF TO:** A00/HQ, A60, A70. First register the workflow only under separate HQ authorization or run directly with .NET9 full clone, execute R16 baseline independently, then each W3 head, collect exit/log hashes and pass/fail counts, finally optionally test real integration candidate. Source hash is not Unity/native/physical QA. No public publication or release authorization follows from this handoff.
