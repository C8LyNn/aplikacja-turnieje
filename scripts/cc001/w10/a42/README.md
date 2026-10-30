# CC-001 — R17-W10 / A42 source admission (no Unity build)

**Owner:** A42 CI/CD · **reviewer/integrator:** A70 · **QA:** A60 · **Windows build:** A72.

## Scoped implementation

`selected-source-admission.cjs` is a read-only, fail-closed Git preflight. It pins frozen RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0` and selects **only A30 draft PR #175 at `e6470dce9ff02fc294c4df15bde82952350b42b2` as a source candidate for A70 review**, not as integrated or QA-passed. This selection is provisional and A70 may reject it. The script does not create a branch, merge, build, move refs, or deploy.

Run on a **clean, separate complete Git clone** with both pinned commits fetched:

```sh
node --test scripts/cc001/w10/a42/selected-source-admission.test.cjs
node scripts/cc001/w10/a42/selected-source-admission.cjs .
```

Returns exit 0 = `SOURCE_SCOPE_READY_FOR_A70_REVIEW` (source-only; NEVER Unity build / two-PC PASS), exit 2 = HOLD, exit 3 = missing Git objects/worktree or other operational failure. The script executes only read-only `git status/merge-base/diff/show`. It rejects all changed-path drift outside the **nine exact modified paths** of PR #175, deletions, additions, dirty local worktree, diff-check failure, wrong ancestry, SHA drift, and missing fixed cadence wiring. Do not run the script on frozen RC1 checkout if adding its own script would make the worktree dirty; use a clean full clone with the source gate available at its own branch or invoke Node on an external copy of the tool from a clean candidate checkout.

## Actual observed collisions (GitHub API compare, October 30, 2026)

PR #175 overlaps source paths with PR #163 (3: network cadence/ACK), #168 (3: aim/turn), #174 (4: visual smoothing), #170 (1: turn), #160 (1: turn), and #173 (1: deck). **DO NOT merge these whole alternate branches together**. Source admission chooses #175 as a single all-in-one candidate for independent A60/A70 evaluation, not as the final multiplayer implementation. PR #169 pure physics visual-smoother helper is non-conflicting by path, but unintegrated with rendering and still requires A60 decision; no claim it cures observed PC2 teleport.

**Factual correction:** pinned RC1 NGO source has Moving snapshot interval `.2f` = **0.2 seconds / 5 Hz**, NOT 2.0 seconds. A30 PR #175 changes it to `.05f` = 20 Hz and stable `.25f`. 20 Hz is a source fact, **not** a proven bandwidth/lag improvement; test actual snapshot payload sizes, dropped packets, PC2 frame pacing, and host/client authoritative parity before acceptance.

## Evidence status

- Remote GitHub compare RC1→A30: merge base exactly RC1, 9 paths, **9/9 exact selected paths**, no extra/missing. Remote network source string contract matched.
- Tests executed: **18/18** deterministic assertions on exact remote GitHub JavaScript files in an isolated V8 runner with mocked Node built-ins. Native Node 22 `node --test` on an actual checked-out repo: **NOT RUN**, no repository checkout/network available in this environment.
- Local `git diff --check`, clean worktree and full ancestry objects: **NOT RUN**; GitHub-only verification deliberately classified `HOLD` for those two local requirements.
- Windows Unity build, complete Player files SHA, 2-PC physical QA, A60 independent verification, A70 integration, RC1 updates, main merge and release: **NOT RUN / NO**.

## Required W10 gates after A70's selection

1. A70 confirms exact candidate and keeps competitors excluded or explicitly hand-merges reviewed nonoverlapping hunks onto a NEW disposable integration ref. A10 approves strength meter change before any attempt to remove it.
2. A42 gate runs on exact complete clean clone; A72 runs `dotnet` managed tests and Unity Windows build at an **identified combined SHA**, checks Windows Player EXE/DLL and full file inventory with SHA-256, no unexpected `CC001_PHOENIX_DIAGNOSTIC` flags. Do not reuse RC1 Windows binary as evidence for new source bytes.
3. A60 independently validates actual two-device LAN logs, accepted P2 intent once, revision/state parity, visual motion, correct local turn, P2 viewpoint, aim arrow, refreshed UI and absence of deployment/regression bugs. Negative/no-evidence = HOLD.
4. A70 integrates only after QA acceptance; never merge to main or release from this scope.

**Protected:** R16, RC1, V148, Protocol149, .meta and frozen sources remain unchanged by A42. No production deployment.
